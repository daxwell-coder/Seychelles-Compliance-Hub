import * as crypto from 'crypto';
import * as logger from 'firebase-functions/logger';

/**
 * Simplified Deterministic Encryption for Client Onboarding
 * 
 * This is a streamlined version focused on onboarding use cases
 * to avoid complex cross-package imports in Cloud Functions.
 */

export interface EncryptedField {
  encrypted: string;
  searchHash: string;
  keyVersion: string;
  algorithm: string;
}

export interface PiiFieldConfig {
  encrypt: boolean;
  searchable: boolean;
  keyDerivationSalt: string;
}

// PII field configurations for onboarding
const PII_FIELD_CONFIGS: Record<string, PiiFieldConfig> = {
  fullName: {
    encrypt: true,
    searchable: true,
    keyDerivationSalt: 'fullname-salt-v1'
  },
  residentialAddress: {
    encrypt: true,
    searchable: true,
    keyDerivationSalt: 'res-addr-salt-v1'
  },
  serviceAddress: {
    encrypt: true,
    searchable: true,
    keyDerivationSalt: 'svc-addr-salt-v1'
  },
  nationalIdNumber: {
    encrypt: true,
    searchable: true,
    keyDerivationSalt: 'natl-id-salt-v1'
  },
  taxIdNumber: {
    encrypt: true,
    searchable: true,
    keyDerivationSalt: 'tax-id-salt-v1'
  },
  dateOfBirth: {
    encrypt: true,
    searchable: false,
    keyDerivationSalt: 'dob-salt-v1'
  },
  clientName: {
    encrypt: false,
    searchable: true,
    keyDerivationSalt: 'client-name-salt-v1'
  }
};

class SimpleEncryption {
  private masterKey: string;
  private keyVersion: string;
  private fieldKeys: Map<string, Buffer> = new Map();

  constructor() {
    // In production, master key should come from Google Secret Manager
    this.masterKey = process.env.PII_ENCRYPTION_MASTER_KEY || this.generateDefaultKey();
    this.keyVersion = process.env.PII_ENCRYPTION_KEY_VERSION || 'v1';
    
    if (!process.env.PII_ENCRYPTION_MASTER_KEY) {
      logger.warn('encryption.key.default', { 
        message: 'Using default encryption key - NOT SECURE FOR PRODUCTION' 
      });
    }
  }

  private generateDefaultKey(): string {
    return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32).toString('hex');
  }

  private getFieldKey(fieldName: string): Buffer {
    if (!this.fieldKeys.has(fieldName)) {
      const config = PII_FIELD_CONFIGS[fieldName];
      if (!config) {
        throw new Error(`No encryption config found for field: ${fieldName}`);
      }

      const salt = Buffer.from(config.keyDerivationSalt + this.keyVersion, 'utf8');
      const fieldKey = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');
      this.fieldKeys.set(fieldName, fieldKey);
    }

    return this.fieldKeys.get(fieldName)!;
  }

  encryptField(fieldName: string, value: string): EncryptedField {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.encrypt) {
      throw new Error(`Field ${fieldName} is not configured for encryption`);
    }

    const fieldKey = this.getFieldKey(fieldName);
    
    // Use a fixed IV derived from the value for deterministic encryption
    const iv = crypto.createHash('sha256').update(value + fieldName + this.keyVersion).digest().slice(0, 16);
    const cipher = crypto.createCipheriv('aes-256-ctr', fieldKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    let searchHash = '';
    if (config.searchable) {
      searchHash = this.generateSearchHash(fieldName, value);
    }

    return {
      encrypted,
      searchHash,
      keyVersion: this.keyVersion,
      algorithm: 'aes-256-ctr'
    };
  }

  generateSearchHash(fieldName: string, value: string): string {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.searchable) {
      return '';
    }

    const fieldKey = this.getFieldKey(fieldName);
    const hmac = crypto.createHmac('sha256', fieldKey);
    hmac.update(value.toLowerCase().trim());
    
    return hmac.digest('hex');
  }

  encryptPiiFields(data: Record<string, any>): Record<string, any> {
    const result = { ...data };
    
    for (const [fieldName, config] of Object.entries(PII_FIELD_CONFIGS)) {
      if (config.encrypt && data[fieldName]) {
        const originalValue = data[fieldName];
        const encrypted = this.encryptField(fieldName, originalValue);
        
        result[fieldName] = encrypted.encrypted;
        
        if (config.searchable && encrypted.searchHash) {
          result[`${fieldName}_searchHash`] = encrypted.searchHash;
        }
        
        result[`${fieldName}_encrypted`] = true;
        result[`${fieldName}_keyVersion`] = encrypted.keyVersion;
      }
    }
    
    return result;
  }
}

// Export singleton instance
const simpleEncryption = new SimpleEncryption();

/**
 * Encrypt beneficial owner data
 */
export function encryptBeneficialOwner(beneficialOwner: any): any {
  return simpleEncryption.encryptPiiFields(beneficialOwner);
}

/**
 * Encrypt client onboarding data
 */
export function encryptOnboardingData(data: any): any {
  const result = { ...data };
  
  // Encrypt client name if it contains PII
  if (data.clientName) {
    const searchHash = simpleEncryption.generateSearchHash('clientName', data.clientName);
    if (searchHash) {
      result.clientName_searchHash = searchHash;
    }
  }
  
  // Encrypt beneficial owner data
  if (data.beneficialOwners && Array.isArray(data.beneficialOwners)) {
    result.beneficialOwners = data.beneficialOwners.map((bo: any) => 
      encryptBeneficialOwner(bo)
    );
  }
  
  return result;
}
