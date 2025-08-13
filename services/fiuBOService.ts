// FIU Seychelles Beneficial Ownership Database Integration Service
// Handles automatic submission to https://www.fiu.sc:4443/BO_Live/Home

import { BeneficialOwner, CompanyDetails } from '../types/schema';

// FIU BO Database Submission Interface
export interface FIUBOSubmission {
  legalPersonId: string;
  legalPersonName: string;
  registrationNumber: string;
  registrationDate: string;
  registeredAddress: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  residentAgent: {
    name: string;
    licenseNumber: string;
    contactDetails: {
      email: string;
      phone: string;
    };
  };
  beneficialOwners: FIUBeneficialOwner[];
  submissionDate: string;
  declarationDate: string;
  certificationStatement: string;
}

export interface FIUBeneficialOwner {
  id: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    nationality: string[];
    countryOfResidence: string;
  };
  identificationDocument: {
    type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE';
    number: string;
    issuingCountry: string;
    issueDate: string;
    expiryDate: string;
  };
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  ownershipDetails: {
    ownershipPercentage: number;
    typeOfOwnership: 'DIRECT' | 'INDIRECT' | 'BOTH';
    natureOfControl: string[];
    dateOwnershipAcquired: string;
  };
  pepStatus: {
    isPEP: boolean;
    pepType?: 'DOMESTIC' | 'FOREIGN' | 'INTERNATIONAL';
    position?: string;
    country?: string;
  };
  sanctionsCheck: {
    isOnSanctionsList: boolean;
    sanctionDetails?: string;
  };
}

// FIU API Response Interface
export interface FIUSubmissionResponse {
  success: boolean;
  submissionId: string;
  receiptNumber: string;
  submissionDate: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  message: string;
  errors?: FIUValidationError[];
}

export interface FIUValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

// FIU Service Class
export class FIUBeneficialOwnershipService {
  private readonly fiuApiBaseUrl = 'https://www.fiu.sc:4443/BO_Live/api';
  private readonly apiKey: string;
  private readonly residentAgentCredentials: {
    licenseNumber: string;
    username: string;
    password: string;
  };

  constructor(apiKey: string, residentAgentCredentials: any) {
    this.apiKey = apiKey;
    this.residentAgentCredentials = residentAgentCredentials;
  }

  /**
   * Submit beneficial ownership information to FIU database
   * As required by Beneficial Ownership Act 2020
   */
  async submitBeneficialOwnership(
    companyDetails: CompanyDetails,
    beneficialOwners: BeneficialOwner[]
  ): Promise<FIUSubmissionResponse> {
    try {
      // Transform our data to FIU format
      const fiuSubmission = this.transformToFIUFormat(companyDetails, beneficialOwners);
      
      // Validate submission before sending
      const validationResult = await this.validateSubmission(fiuSubmission);
      if (!validationResult.isValid) {
        throw new Error(`FIU Validation Failed: ${validationResult.errors.join(', ')}`);
      }

      // Authenticate with FIU system
      const authToken = await this.authenticateWithFIU();

      // Submit to FIU
      const response = await fetch(`${this.fiuApiBaseUrl}/beneficial-ownership/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': this.apiKey,
          'X-Resident-Agent': this.residentAgentCredentials.licenseNumber
        },
        body: JSON.stringify(fiuSubmission)
      });

      if (!response.ok) {
        throw new Error(`FIU API Error: ${response.status} ${response.statusText}`);
      }

      const result: FIUSubmissionResponse = await response.json();
      
      // Log successful submission
      console.log('FIU BO Submission successful:', {
        submissionId: result.submissionId,
        receiptNumber: result.receiptNumber,
        company: companyDetails.companyName
      });

      return result;

    } catch (error) {
      console.error('FIU BO Submission failed:', error);
      throw new Error(`Failed to submit to FIU BO Database: ${error.message}`);
    }
  }

  /**
   * Check submission status with FIU
   */
  async checkSubmissionStatus(submissionId: string): Promise<FIUSubmissionResponse> {
    try {
      const authToken = await this.authenticateWithFIU();
      
      const response = await fetch(`${this.fiuApiBaseUrl}/beneficial-ownership/status/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`FIU Status Check Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('FIU Status check failed:', error);
      throw error;
    }
  }

  /**
   * Update existing beneficial ownership record
   * Required when ownership changes occur
   */
  async updateBeneficialOwnership(
    submissionId: string,
    updatedData: Partial<FIUBOSubmission>
  ): Promise<FIUSubmissionResponse> {
    try {
      const authToken = await this.authenticateWithFIU();

      const response = await fetch(`${this.fiuApiBaseUrl}/beneficial-ownership/update/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error(`FIU Update Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('FIU BO Update failed:', error);
      throw error;
    }
  }

  /**
   * Transform our internal data format to FIU required format
   */
  private transformToFIUFormat(
    companyDetails: CompanyDetails, 
    beneficialOwners: BeneficialOwner[]
  ): FIUBOSubmission {
    return {
      legalPersonId: companyDetails.registrationNumber,
      legalPersonName: companyDetails.companyName,
      registrationNumber: companyDetails.registrationNumber,
      registrationDate: companyDetails.incorporationDate?.toISOString() || '',
      registeredAddress: companyDetails.registeredAddress,
      residentAgent: {
        name: process.env.RESIDENT_AGENT_NAME || '',
        licenseNumber: this.residentAgentCredentials.licenseNumber,
        contactDetails: {
          email: process.env.RESIDENT_AGENT_EMAIL || '',
          phone: process.env.RESIDENT_AGENT_PHONE || ''
        }
      },
      beneficialOwners: beneficialOwners.map(bo => ({
        id: bo.id || `bo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        personalDetails: {
          firstName: bo.personalDetails.firstName,
          lastName: bo.personalDetails.lastName,
          middleName: bo.personalDetails.middleName,
          dateOfBirth: bo.personalDetails.dateOfBirth?.toISOString() || '',
          nationality: [bo.personalDetails.nationality],
          countryOfResidence: bo.personalDetails.countryOfResidence || bo.personalDetails.nationality
        },
        identificationDocument: {
          type: 'PASSPORT',
          number: bo.identification.passportNumber,
          issuingCountry: bo.identification.passportCountry || bo.personalDetails.nationality,
          issueDate: bo.identification.passportIssueDate?.toISOString() || '',
          expiryDate: bo.identification.passportExpiry?.toISOString() || ''
        },
        address: {
          street: bo.address.street,
          city: bo.address.city,
          state: bo.address.state,
          country: bo.address.country,
          postalCode: bo.address.postalCode
        },
        ownershipDetails: {
          ownershipPercentage: bo.ownership.percentage,
          typeOfOwnership: bo.ownership.type,
          natureOfControl: bo.ownership.natureOfControl || ['OWNERSHIP'],
          dateOwnershipAcquired: bo.ownership.dateAcquired?.toISOString() || new Date().toISOString()
        },
        pepStatus: {
          isPEP: bo.pepStatus.isPep || false,
          pepType: bo.pepStatus.pepType,
          position: bo.pepStatus.position,
          country: bo.pepStatus.country
        },
        sanctionsCheck: {
          isOnSanctionsList: bo.sanctions.listed || false,
          sanctionDetails: bo.sanctions.details
        }
      })),
      submissionDate: new Date().toISOString(),
      declarationDate: new Date().toISOString(),
      certificationStatement: 'I hereby certify that the information provided is true, accurate and complete to the best of my knowledge and belief.'
    };
  }

  /**
   * Authenticate with FIU system
   */
  private async authenticateWithFIU(): Promise<string> {
    try {
      const response = await fetch(`${this.fiuApiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.residentAgentCredentials.username,
          password: this.residentAgentCredentials.password,
          licenseNumber: this.residentAgentCredentials.licenseNumber
        })
      });

      if (!response.ok) {
        throw new Error('FIU Authentication failed');
      }

      const authResult = await response.json();
      return authResult.accessToken;
    } catch (error) {
      console.error('FIU Authentication error:', error);
      throw new Error('Unable to authenticate with FIU system');
    }
  }

  /**
   * Validate submission data against FIU requirements
   */
  private async validateSubmission(submission: FIUBOSubmission): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate company details
    if (!submission.legalPersonName) errors.push('Company name is required');
    if (!submission.registrationNumber) errors.push('Registration number is required');
    if (!submission.registeredAddress.street) errors.push('Registered address is required');

    // Validate beneficial owners
    if (submission.beneficialOwners.length === 0) {
      errors.push('At least one beneficial owner is required');
    }

    submission.beneficialOwners.forEach((bo, index) => {
      if (!bo.personalDetails.firstName) errors.push(`Beneficial owner ${index + 1}: First name required`);
      if (!bo.personalDetails.lastName) errors.push(`Beneficial owner ${index + 1}: Last name required`);
      if (!bo.personalDetails.dateOfBirth) errors.push(`Beneficial owner ${index + 1}: Date of birth required`);
      if (!bo.identificationDocument.number) errors.push(`Beneficial owner ${index + 1}: Identification document required`);
      if (bo.ownershipDetails.ownershipPercentage < 25) {
        warnings.push(`Beneficial owner ${index + 1}: Ownership below 25% threshold`);
      }
    });

    // Validate resident agent details
    if (!submission.residentAgent.licenseNumber) errors.push('Resident agent license number required');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const fiuBOService = new FIUBeneficialOwnershipService(
  process.env.FIU_API_KEY || '',
  {
    licenseNumber: process.env.RESIDENT_AGENT_LICENSE || '',
    username: process.env.FIU_USERNAME || '',
    password: process.env.FIU_PASSWORD || ''
  }
);

// Utility functions for FIU compliance
export const FIUUtils = {
  /**
   * Check if beneficial ownership submission is required
   */
  isSubmissionRequired(beneficialOwners: BeneficialOwner[]): boolean {
    return beneficialOwners.some(bo => bo.ownership.percentage >= 25);
  },

  /**
   * Calculate next submission deadline based on BO Act 2020
   */
  getNextSubmissionDeadline(lastSubmission?: Date): Date {
    const deadline = new Date();
    if (lastSubmission) {
      deadline.setTime(lastSubmission.getTime());
      deadline.setFullYear(deadline.getFullYear() + 1); // Annual updates
    } else {
      deadline.setMonth(deadline.getMonth() + 1); // Initial submission within 30 days
    }
    return deadline;
  },

  /**
   * Validate if changes require new FIU submission
   */
  requiresNewSubmission(
    currentBOs: BeneficialOwner[], 
    newBOs: BeneficialOwner[]
  ): boolean {
    // Any change in beneficial owners above 25% requires new submission
    const currentAbove25 = currentBOs.filter(bo => bo.ownership.percentage >= 25);
    const newAbove25 = newBOs.filter(bo => bo.ownership.percentage >= 25);
    
    return JSON.stringify(currentAbove25) !== JSON.stringify(newAbove25);
  }
};
