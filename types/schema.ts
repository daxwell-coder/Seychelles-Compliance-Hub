import { BusinessType, RegulatoryFramework, DocumentType, ValidationStatus, OnboardingStep } from './enums';

// Re-export the OnboardingStep enum for convenience
export { OnboardingStep } from './enums';

// Company Details Interface
export interface CompanyDetails {
  companyName: string;
  registrationNumber: string;
  businessType: BusinessType;
  incorporationDate: Date | null;
  registeredAddress: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  businessAddress: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    sameAsRegistered: boolean;
  };
  contactDetails: {
    email: string;
    phone: string;
    website?: string;
  };
  authorizedCapital: {
    currency: string;
    amount: number;
  };
}

// Regulatory Profile Interface
export interface RegulatoryProfile {
  primaryFramework: RegulatoryFramework;
  additionalFrameworks: RegulatoryFramework[];
  businessActivities: string[];
  jurisdictions: string[];
  expectedAnnualTurnover: {
    currency: string;
    amount: number;
  };
  clientTypes: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
}

// Beneficial Owner Interface - Updated for FIU BO Database compliance
export interface BeneficialOwner {
  id: string;
  personalDetails: {
    title: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: Date | null;
    nationality: string;
    placeOfBirth: string;
    countryOfResidence: string;
  };
  identification: {
    passportNumber: string;
    passportExpiry: Date | null;
    passportCountry: string;
    passportIssueDate?: Date | null;
    nationalId?: string;
  };
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  ownership: {
    percentage: number;
    type: 'DIRECT' | 'INDIRECT' | 'BOTH';
    description: string;
    dateAcquired?: Date | null;
    natureOfControl: string[];
  };
  pepStatus: {
    isPep: boolean; // Politically Exposed Person
    pepType?: 'DOMESTIC' | 'FOREIGN' | 'INTERNATIONAL';
    position?: string;
    country?: string;
  };
  sanctions: {
    listed: boolean;
    details?: string;
  };
  // FIU specific fields
  fiuSubmission?: {
    submissionId?: string;
    submissionDate?: Date;
    status?: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
    receiptNumber?: string;
  };
}

// Document Upload Interface
export interface DocumentUpload {
  id: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  status: ValidationStatus;
  url?: string;
  validationNotes?: string;
}

// Complete Onboarding Data Interface
export interface OnboardingData {
  clientId?: string;
  companyDetails: Partial<CompanyDetails>;
  regulatoryProfile: Partial<RegulatoryProfile>;
  beneficialOwners: BeneficialOwner[];
  documents: DocumentUpload[];
  currentStep: number;
  isComplete: boolean;
  submissionDate?: Date;
  validationStatus: ValidationStatus;
}

// Form Validation Functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateSeychellesRegistrationNumber = (regNumber: string): boolean => {
  // Seychelles registration number format validation
  const seychellesRegex = /^[0-9]{6,8}$/;
  return seychellesRegex.test(regNumber);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{8,}$/;
  return phoneRegex.test(phone);
};

export const validatePercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

export const validatePassportNumber = (passport: string): boolean => {
  const passportRegex = /^[A-Z0-9]{6,12}$/;
  return passportRegex.test(passport.replace(/\s/g, '').toUpperCase());
};

// Form Step Completion Validation
export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateCompanyDetailsStep = (data: Partial<CompanyDetails>): StepValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.companyName?.trim()) errors.push('Company name is required');
  if (!data.registrationNumber?.trim()) errors.push('Registration number is required');
  if (!data.businessType) errors.push('Business type is required');
  if (!data.incorporationDate) errors.push('Incorporation date is required');
  if (!data.contactDetails?.email || !validateEmail(data.contactDetails.email)) {
    errors.push('Valid email address is required');
  }
  if (!data.contactDetails?.phone || !validatePhone(data.contactDetails.phone)) {
    errors.push('Valid phone number is required');
  }

  if (data.registrationNumber && !validateSeychellesRegistrationNumber(data.registrationNumber)) {
    warnings.push('Registration number format may not be valid for Seychelles');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateBeneficialOwnersStep = (owners: BeneficialOwner[]): StepValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (owners.length === 0) {
    errors.push('At least one beneficial owner is required');
  }

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownership.percentage, 0);
  if (totalOwnership > 100) {
    errors.push('Total beneficial ownership cannot exceed 100%');
  }

  if (totalOwnership < 100) {
    warnings.push('Total beneficial ownership is less than 100%');
  }

  owners.forEach((owner, index) => {
    if (!owner.personalDetails.firstName?.trim()) {
      errors.push(`Beneficial owner ${index + 1}: First name is required`);
    }
    if (!owner.personalDetails.lastName?.trim()) {
      errors.push(`Beneficial owner ${index + 1}: Last name is required`);
    }
    if (owner.ownership.percentage < 25) {
      warnings.push(`Beneficial owner ${index + 1}: Ownership below 25% threshold`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
