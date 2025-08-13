"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptBeneficialOwner = encryptBeneficialOwner;
exports.encryptOnboardingData = encryptOnboardingData;
const crypto = __importStar(require("crypto"));
const logger = __importStar(require("firebase-functions/logger"));
// PII field configurations for onboarding
const PII_FIELD_CONFIGS = {
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
    constructor() {
        this.fieldKeys = new Map();
        // In production, master key should come from Google Secret Manager
        this.masterKey = process.env.PII_ENCRYPTION_MASTER_KEY || this.generateDefaultKey();
        this.keyVersion = process.env.PII_ENCRYPTION_KEY_VERSION || 'v1';
        if (!process.env.PII_ENCRYPTION_MASTER_KEY) {
            logger.warn('encryption.key.default', {
                message: 'Using default encryption key - NOT SECURE FOR PRODUCTION'
            });
        }
    }
    generateDefaultKey() {
        return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32).toString('hex');
    }
    getFieldKey(fieldName) {
        if (!this.fieldKeys.has(fieldName)) {
            const config = PII_FIELD_CONFIGS[fieldName];
            if (!config) {
                throw new Error(`No encryption config found for field: ${fieldName}`);
            }
            const salt = Buffer.from(config.keyDerivationSalt + this.keyVersion, 'utf8');
            const fieldKey = crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha512');
            this.fieldKeys.set(fieldName, fieldKey);
        }
        return this.fieldKeys.get(fieldName);
    }
    encryptField(fieldName, value) {
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
    generateSearchHash(fieldName, value) {
        const config = PII_FIELD_CONFIGS[fieldName];
        if (!config || !config.searchable) {
            return '';
        }
        const fieldKey = this.getFieldKey(fieldName);
        const hmac = crypto.createHmac('sha256', fieldKey);
        hmac.update(value.toLowerCase().trim());
        return hmac.digest('hex');
    }
    encryptPiiFields(data) {
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
function encryptBeneficialOwner(beneficialOwner) {
    return simpleEncryption.encryptPiiFields(beneficialOwner);
}
/**
 * Encrypt client onboarding data
 */
function encryptOnboardingData(data) {
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
        result.beneficialOwners = data.beneficialOwners.map((bo) => encryptBeneficialOwner(bo));
    }
    return result;
}
//# sourceMappingURL=encryptionUtils.js.map