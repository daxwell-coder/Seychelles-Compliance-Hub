// Seychelles-specific business and regulatory enums
export enum BusinessType {
  IBC = 'IBC',
  CSL = 'CSL',
  FOUNDATION = 'Foundation',
  PARTNERSHIP = 'Partnership',
  TRUST = 'Trust',
  FUND = 'Fund'
}

export enum RegulatoryFramework {
  FSA_SEYCHELLES = 'FSA_Seychelles',
  ICA_2016 = 'ICA_2016',
  AML_CFT = 'AML_CFT',
  GDPR = 'GDPR',
  CRS = 'CRS'
}

export enum DocumentType {
  CERTIFICATE_OF_INCORPORATION = 'Certificate_of_Incorporation',
  MEMORANDUM = 'Memorandum',
  ARTICLES = 'Articles',
  REGISTER_OF_DIRECTORS = 'Register_of_Directors',
  AML_POLICY = 'AML_Policy',
  BENEFICIAL_OWNER_DECLARATION = 'Beneficial_Owner_Declaration',
  PASSPORT_COPY = 'Passport_Copy',
  UTILITY_BILL = 'Utility_Bill',
  BANK_REFERENCE = 'Bank_Reference',
  PROFESSIONAL_REFERENCE = 'Professional_Reference'
}

export enum OnboardingStep {
  COMPANY_DETAILS = 0,
  REGULATORY_PROFILE = 1,
  BENEFICIAL_OWNERS = 2,
  DOCUMENT_UPLOAD = 3,
  REVIEW_SUBMIT = 4
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALID = 'valid',
  INVALID = 'invalid',
  PROCESSING = 'processing'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  OPEN = 'OPEN'
}

export enum QualityTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  GOOD = 'GOOD'
}

export const STEP_TITLES = {
  [OnboardingStep.COMPANY_DETAILS]: 'Company Details',
  [OnboardingStep.REGULATORY_PROFILE]: 'Regulatory Profile',
  [OnboardingStep.BENEFICIAL_OWNERS]: 'Beneficial Owners',
  [OnboardingStep.DOCUMENT_UPLOAD]: 'Document Upload',
  [OnboardingStep.REVIEW_SUBMIT]: 'Review & Submit'
};

export const BENEFICIAL_OWNER_THRESHOLD = 25; // 25% ownership threshold

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];

export const SEYCHELLES_COLORS = {
  oceanBlue: '#0ea5e9',
  paradiseCyan: '#06b6d4',
  sunsetPurple: '#8b5cf6',
  emeraldGreen: '#10b981',
  coralPink: '#f472b6',
  sandBeige: '#fbbf24'
} as const;
