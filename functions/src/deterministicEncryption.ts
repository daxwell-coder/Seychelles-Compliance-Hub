import * as crypto from 'crypto';
import * as logger from 'firebase-functions/logger';

/**
 * Deterministic Encryption Utility
 * 
 * Provides field-level encryption for PII data with deterministic output
 * for searchability while maintaining security through proper key management.
 * 
 * Key Features:
 * - Deterministic encryption (same input = same encrypted output)
 * - Searchable hash generation for encrypted fields
 * - Key rotation support
 * - Secure key derivation from master key
 * - Field-specific encryption keys for isolation
 */

export interface EncryptionConfig {
  masterKey?: string;
  keyVersion?: string;
  algorithm?: string;
  hashAlgorithm?: string;
}

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

// PII field configurations - defines which fields to encrypt and how
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
    searchable: false, // DOB typically not searched directly
    keyDerivationSalt: 'dob-salt-v1'
  },
  clientName: {
    encrypt: false, // Company names typically not encrypted, just searchable
    searchable: true,
    keyDerivationSalt: 'client-name-salt-v1'
  }
};

class DeterministicEncryption {
  private masterKey: string;
  private keyVersion: string;
  private hashAlgorithm: string;
  private fieldKeys: Map<string, Buffer> = new Map();

  constructor(config: EncryptionConfig = {}) {
    // In production, master key should come from Google Secret Manager
    this.masterKey = config.masterKey || process.env.PII_ENCRYPTION_MASTER_KEY || this.generateDefaultKey();
    this.keyVersion = config.keyVersion || process.env.PII_ENCRYPTION_KEY_VERSION || 'v1';
    this.hashAlgorithm = config.hashAlgorithm || 'sha256';
    
    if (!config.masterKey && !process.env.PII_ENCRYPTION_MASTER_KEY) {
      logger.warn('encryption.key.default', { 
        message: 'Using default encryption key - NOT SECURE FOR PRODUCTION' 
      });
    }
  }

  private generateDefaultKey(): string {
    // This is only for development - production MUST use Secret Manager
    return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32).toString('hex');
  }

  /**
   * Derive field-specific encryption key from master key and field salt
   */
  private getFieldKey(fieldName: string): Buffer {
    if (!this.fieldKeys.has(fieldName)) {
      const config = PII_FIELD_CONFIGS[fieldName];
      if (!config) {
        throw new Error(`No encryption config found for field: ${fieldName}`);
      }

      // Use PBKDF2 to derive field-specific key
      const salt = Buffer.from(config.keyDerivationSalt + this.keyVersion, 'utf8');
      const fieldKey = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');
      this.fieldKeys.set(fieldName, fieldKey);
    }

    return this.fieldKeys.get(fieldName)!;
  }

  /**
   * Encrypt a PII field value deterministically
   */
  encryptField(fieldName: string, value: string): EncryptedField {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.encrypt) {
      throw new Error(`Field ${fieldName} is not configured for encryption`);
    }

    const fieldKey = this.getFieldKey(fieldName);
    
    // Create a deterministic IV from the value and field name
    const deterministicIv = crypto.createHash('sha256')
      .update(value + fieldName + this.keyVersion)
      .digest()
      .slice(0, 16); // AES-256-CTR uses 16-byte IV

    // Use AES-256-CTR for deterministic encryption with proper IV
    const cipher = crypto.createCipheriv('aes-256-ctr', fieldKey, deterministicIv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Generate searchable hash if configured
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

  /**
   * Decrypt a PII field value
   * 
   * Note: For production use, consider implementing proper decryption
   * with stored metadata or a different encryption approach that supports
   * easier decryption while maintaining deterministic properties.
   */
  decryptField(fieldName: string, encryptedField: EncryptedField, originalValue?: string): string {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.encrypt) {
      throw new Error(`Field ${fieldName} is not configured for encryption`);
    }

    // Handle key version mismatch
    if (encryptedField.keyVersion !== this.keyVersion) {
      logger.warn('encryption.key.version.mismatch', {
        fieldName,
        currentVersion: this.keyVersion,
        fieldVersion: encryptedField.keyVersion
      });
    }

    const fieldKey = this.getFieldKey(fieldName);
    
    // For deterministic decryption, we need the original value to recreate the IV
    if (!originalValue) {
      throw new Error('Original value required for deterministic decryption - consider storing IV separately for production');
    }
    
    // Recreate the same deterministic IV used during encryption
    const deterministicIv = crypto.createHash('sha256')
      .update(originalValue + fieldName + encryptedField.keyVersion)
      .digest()
      .slice(0, 16);

    const decipher = crypto.createDecipheriv('aes-256-ctr', fieldKey, deterministicIv);
    
    let decrypted = decipher.update(encryptedField.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate searchable hash for a field value
   */
  generateSearchHash(fieldName: string, value: string): string {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.searchable) {
      return '';
    }

    const fieldKey = this.getFieldKey(fieldName);
    
    // Create searchable hash using HMAC for security
    const hmac = crypto.createHmac(this.hashAlgorithm, fieldKey);
    hmac.update(value.toLowerCase().trim()); // Normalize for consistent searching
    
    return hmac.digest('hex');
  }

  /**
   * Encrypt multiple PII fields in an object
   */
  encryptPiiFields(data: Record<string, any>): Record<string, any> {
    const result = { ...data };
    
    for (const [fieldName, config] of Object.entries(PII_FIELD_CONFIGS)) {
      if (config.encrypt && data[fieldName]) {
        const originalValue = data[fieldName];
        const encrypted = this.encryptField(fieldName, originalValue);
        
        // Replace original field with encrypted version
        result[fieldName] = encrypted.encrypted;
        
        // Add search hash field if searchable
        if (config.searchable && encrypted.searchHash) {
          result[`${fieldName}_searchHash`] = encrypted.searchHash;
        }
        
        // Add metadata fields
        result[`${fieldName}_encrypted`] = true;
        result[`${fieldName}_keyVersion`] = encrypted.keyVersion;
      }
    }
    
    return result;
  }

  /**
   * Create search queries using hash values
   */
  createSearchQuery(fieldName: string, searchValue: string): { field: string; hash: string } | null {
    const config = PII_FIELD_CONFIGS[fieldName];
    if (!config || !config.searchable) {
      logger.warn('encryption.search.not-searchable', { fieldName });
      return null;
    }

    const searchHash = this.generateSearchHash(fieldName, searchValue);
    
    return {
      field: `${fieldName}_searchHash`,
      hash: searchHash
    };
  }

  /**
   * Get list of all PII fields that should be encrypted
   */
  static getPiiFields(): string[] {
    return Object.keys(PII_FIELD_CONFIGS);
  }

  /**
   * Check if a field is configured for encryption
   */
  static isPiiField(fieldName: string): boolean {
    return fieldName in PII_FIELD_CONFIGS;
  }

  /**
   * Check if a field is searchable when encrypted
   */
  static isSearchableField(fieldName: string): boolean {
    const config = PII_FIELD_CONFIGS[fieldName];
    return config?.searchable || false;
  }
}

// Export singleton instance
export const deterministicEncryption = new DeterministicEncryption();

// Export class for testing and custom configurations
export { DeterministicEncryption };

/**
 * Utility functions for common encryption operations
 */

/**
 * Encrypt beneficial owner data
 */
export function encryptBeneficialOwner(beneficialOwner: any): any {
  return deterministicEncryption.encryptPiiFields(beneficialOwner);
}

/**
 * Create search query for finding encrypted beneficial owners
 */
export function createBeneficialOwnerSearchQuery(
  field: 'fullName' | 'nationalIdNumber' | 'taxIdNumber' | 'residentialAddress' | 'serviceAddress',
  value: string
): { field: string; hash: string } | null {
  return deterministicEncryption.createSearchQuery(field, value);
}

/**
 * Encrypt client onboarding data
 */
export function encryptOnboardingData(data: any): any {
  const result = { ...data };
  
  // Encrypt client name if it contains PII
  if (data.clientName) {
    // For company names, we typically don't encrypt, but we can hash for search
    const searchHash = deterministicEncryption.generateSearchHash('clientName', data.clientName);
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
