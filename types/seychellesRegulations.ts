// Updated Seychelles Regulatory Framework (2024-2025)
// Reflects latest FSA laws and FIU requirements

export enum SeychellesRegulatoryFramework {
  // Financial Services Authority (FSA) Frameworks
  FSA_SECURITIES_ACT_2007 = 'FSA_Securities_Act_2007',
  FSA_INSURANCE_ACT_2019 = 'FSA_Insurance_Act_2019', 
  FSA_INTERNATIONAL_BUSINESS_ACT_2019 = 'FSA_IBC_Act_2019',
  FSA_INTERNATIONAL_CORPORATE_SERVICE_PROVIDERS_ACT_2003 = 'FSA_ICSP_Act_2003',
  FSA_MUTUAL_FUNDS_AND_HEDGE_FUNDS_ACT_2008 = 'FSA_Funds_Act_2008',
  FSA_COMPANIES_ACT_1972 = 'FSA_Companies_Act_1972',

  // AML/CFT Framework
  ANTI_MONEY_LAUNDERING_ACT_2006_REVISED_2020 = 'AML_Act_2020',
  PROCEEDS_OF_CRIME_CIVIL_CONFISCATION_ACT_2008 = 'POCA_2008',
  FINANCIAL_INTELLIGENCE_UNIT_ACT_2020 = 'FIU_Act_2020',

  // Beneficial Ownership Requirements  
  BENEFICIAL_OWNERSHIP_ACT_2020 = 'BO_Act_2020',
  
  // International Tax Compliance
  COMMON_REPORTING_STANDARD_REGULATIONS_2017 = 'CRS_2017',
  FOREIGN_ACCOUNT_TAX_COMPLIANCE_ACT_REGULATIONS = 'FATCA_Regulations',

  // Data Protection
  DATA_PROTECTION_ACT_2003_REVISED_2019 = 'DPA_2019',

  // Virtual Assets (New 2024)
  VIRTUAL_ASSET_SERVICE_PROVIDERS_ACT_2023 = 'VASP_Act_2023',

  // Economic Development
  SEYCHELLES_INVESTMENT_PROMOTION_ACT_2010 = 'SIPA_2010',
  
  // Banking and Finance
  FINANCIAL_INSTITUTIONS_ACT_2004_REVISED_2019 = 'FIA_2019',
  CENTRAL_BANK_OF_SEYCHELLES_ACT_2004 = 'CBS_Act_2004'
}

export enum ComplianceRequirement {
  // FSA Registration Requirements
  FSA_LICENSE_REGISTRATION = 'FSA_License_Registration',
  FSA_ANNUAL_RETURN = 'FSA_Annual_Return',
  FSA_FINANCIAL_STATEMENTS = 'FSA_Financial_Statements',
  FSA_COMPLIANCE_MONITORING = 'FSA_Compliance_Monitoring',

  // FIU Beneficial Ownership Requirements
  FIU_BO_INITIAL_REGISTRATION = 'FIU_BO_Initial_Registration',
  FIU_BO_ANNUAL_UPDATE = 'FIU_BO_Annual_Update',
  FIU_BO_CHANGE_NOTIFICATION = 'FIU_BO_Change_Notification',

  // AML/CFT Obligations
  AML_CUSTOMER_DUE_DILIGENCE = 'AML_Customer_Due_Diligence',
  AML_ENHANCED_DUE_DILIGENCE = 'AML_Enhanced_Due_Diligence', 
  AML_ONGOING_MONITORING = 'AML_Ongoing_Monitoring',
  AML_SUSPICIOUS_TRANSACTION_REPORTING = 'AML_Suspicious_Transaction_Reporting',
  AML_RECORD_KEEPING = 'AML_Record_Keeping',

  // International Tax Compliance
  CRS_REGISTRATION = 'CRS_Registration',
  CRS_ANNUAL_REPORTING = 'CRS_Annual_Reporting',
  FATCA_REGISTRATION = 'FATCA_Registration', 
  FATCA_ANNUAL_REPORTING = 'FATCA_Annual_Reporting',

  // Corporate Compliance
  CORPORATE_ANNUAL_RETURN = 'Corporate_Annual_Return',
  CORPORATE_REGISTERED_OFFICE = 'Corporate_Registered_Office',
  CORPORATE_RESIDENT_AGENT = 'Corporate_Resident_Agent',

  // VASP Specific (if applicable)
  VASP_LICENSE_APPLICATION = 'VASP_License_Application',
  VASP_COMPLIANCE_PROGRAM = 'VASP_Compliance_Program',
  VASP_ANNUAL_AUDIT = 'VASP_Annual_Audit'
}

export interface RegulatoryObligation {
  requirement: ComplianceRequirement;
  framework: SeychellesRegulatoryFramework;
  frequency: 'ONE_TIME' | 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'ON_CHANGE' | 'ONGOING';
  deadline?: {
    type: 'FIXED_DATE' | 'RELATIVE_TO_EVENT' | 'BUSINESS_DAYS';
    value: string; // e.g., '2024-12-31', '30_DAYS_AFTER_INCORPORATION', '15_BUSINESS_DAYS'
  };
  penalty?: {
    type: 'FINE' | 'LICENSE_SUSPENSION' | 'LICENSE_REVOCATION' | 'CRIMINAL_CHARGES';
    amount?: number;
    currency?: 'SCR' | 'USD' | 'EUR';
  };
  automatable: boolean; // Can our system handle this automatically?
  description: string;
}

// Comprehensive mapping of regulatory obligations
export const REGULATORY_OBLIGATIONS_MATRIX: Record<SeychellesRegulatoryFramework, RegulatoryObligation[]> = {
  [SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020]: [
    {
      requirement: ComplianceRequirement.FIU_BO_INITIAL_REGISTRATION,
      framework: SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020,
      frequency: 'ONE_TIME',
      deadline: {
        type: 'RELATIVE_TO_EVENT',
        value: '30_DAYS_AFTER_INCORPORATION'
      },
      penalty: {
        type: 'FINE',
        amount: 5000,
        currency: 'SCR'
      },
      automatable: true,
      description: 'Initial registration of beneficial ownership information with FIU database'
    },
    {
      requirement: ComplianceRequirement.FIU_BO_ANNUAL_UPDATE,
      framework: SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020,
      frequency: 'ANNUAL',
      deadline: {
        type: 'FIXED_DATE',
        value: '2025-03-31' // Annual deadline
      },
      penalty: {
        type: 'FINE',
        amount: 2500,
        currency: 'SCR'
      },
      automatable: true,
      description: 'Annual update of beneficial ownership information'
    },
    {
      requirement: ComplianceRequirement.FIU_BO_CHANGE_NOTIFICATION,
      framework: SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020,
      frequency: 'ON_CHANGE',
      deadline: {
        type: 'RELATIVE_TO_EVENT',
        value: '15_DAYS_AFTER_CHANGE'
      },
      penalty: {
        type: 'FINE',
        amount: 3000,
        currency: 'SCR'
      },
      automatable: true,
      description: 'Notification of changes in beneficial ownership (>25% threshold)'
    }
  ],
  
  [SeychellesRegulatoryFramework.FSA_INTERNATIONAL_BUSINESS_ACT_2019]: [
    {
      requirement: ComplianceRequirement.FSA_ANNUAL_RETURN,
      framework: SeychellesRegulatoryFramework.FSA_INTERNATIONAL_BUSINESS_ACT_2019,
      frequency: 'ANNUAL',
      deadline: {
        type: 'FIXED_DATE',
        value: '2025-06-30'
      },
      penalty: {
        type: 'FINE',
        amount: 500,
        currency: 'USD'
      },
      automatable: true,
      description: 'Annual return filing with FSA for IBC companies'
    }
  ],

  [SeychellesRegulatoryFramework.ANTI_MONEY_LAUNDERING_ACT_2006_REVISED_2020]: [
    {
      requirement: ComplianceRequirement.AML_CUSTOMER_DUE_DILIGENCE,
      framework: SeychellesRegulatoryFramework.ANTI_MONEY_LAUNDERING_ACT_2006_REVISED_2020,
      frequency: 'ONGOING',
      penalty: {
        type: 'LICENSE_SUSPENSION'
      },
      automatable: true,
      description: 'Customer due diligence procedures for all clients'
    }
  ],

  // Additional frameworks...
  [SeychellesRegulatoryFramework.FSA_SECURITIES_ACT_2007]: [],
  [SeychellesRegulatoryFramework.FSA_INSURANCE_ACT_2019]: [],
  [SeychellesRegulatoryFramework.FSA_INTERNATIONAL_CORPORATE_SERVICE_PROVIDERS_ACT_2003]: [],
  [SeychellesRegulatoryFramework.FSA_MUTUAL_FUNDS_AND_HEDGE_FUNDS_ACT_2008]: [],
  [SeychellesRegulatoryFramework.FSA_COMPANIES_ACT_1972]: [],
  [SeychellesRegulatoryFramework.PROCEEDS_OF_CRIME_CIVIL_CONFISCATION_ACT_2008]: [],
  [SeychellesRegulatoryFramework.FINANCIAL_INTELLIGENCE_UNIT_ACT_2020]: [],
  [SeychellesRegulatoryFramework.COMMON_REPORTING_STANDARD_REGULATIONS_2017]: [],
  [SeychellesRegulatoryFramework.FOREIGN_ACCOUNT_TAX_COMPLIANCE_ACT_REGULATIONS]: [],
  [SeychellesRegulatoryFramework.DATA_PROTECTION_ACT_2003_REVISED_2019]: [],
  [SeychellesRegulatoryFramework.VIRTUAL_ASSET_SERVICE_PROVIDERS_ACT_2023]: [],
  [SeychellesRegulatoryFramework.SEYCHELLES_INVESTMENT_PROMOTION_ACT_2010]: [],
  [SeychellesRegulatoryFramework.FINANCIAL_INSTITUTIONS_ACT_2004_REVISED_2019]: [],
  [SeychellesRegulatoryFramework.CENTRAL_BANK_OF_SEYCHELLES_ACT_2004]: []
};

// Utility functions for regulatory compliance
export class SeychellesRegulatoryUtils {
  /**
   * Get applicable regulatory frameworks for a business type
   */
  static getApplicableFrameworks(businessType: string, activities: string[]): SeychellesRegulatoryFramework[] {
    const frameworks: SeychellesRegulatoryFramework[] = [];
    
    // Always applicable
    frameworks.push(SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020);
    frameworks.push(SeychellesRegulatoryFramework.ANTI_MONEY_LAUNDERING_ACT_2006_REVISED_2020);
    
    // Business type specific
    if (businessType === 'IBC') {
      frameworks.push(SeychellesRegulatoryFramework.FSA_INTERNATIONAL_BUSINESS_ACT_2019);
    }
    
    // Activity specific
    if (activities.includes('virtual_assets')) {
      frameworks.push(SeychellesRegulatoryFramework.VIRTUAL_ASSET_SERVICE_PROVIDERS_ACT_2023);
    }
    
    if (activities.includes('financial_services')) {
      frameworks.push(SeychellesRegulatoryFramework.FSA_SECURITIES_ACT_2007);
    }
    
    return frameworks;
  }

  /**
   * Calculate next compliance deadline for a framework
   */
  static getNextDeadline(framework: SeychellesRegulatoryFramework, incorporationDate: Date): Date | null {
    const obligations = REGULATORY_OBLIGATIONS_MATRIX[framework];
    if (!obligations || obligations.length === 0) return null;
    
    const nextDeadlines = obligations
      .filter(o => o.deadline)
      .map(obligation => {
        if (!obligation.deadline) return null;
        
        const deadline = new Date();
        
        if (obligation.deadline.type === 'FIXED_DATE') {
          return new Date(obligation.deadline.value);
        } else if (obligation.deadline.type === 'RELATIVE_TO_EVENT') {
          const days = parseInt(obligation.deadline.value.match(/(\d+)/)?.[1] || '0');
          deadline.setTime(incorporationDate.getTime());
          deadline.setDate(deadline.getDate() + days);
          return deadline;
        }
        
        return null;
      })
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());
    
    return nextDeadlines[0] || null;
  }

  /**
   * Check if framework requires FIU BO submission
   */
  static requiresFIUSubmission(framework: SeychellesRegulatoryFramework): boolean {
    return framework === SeychellesRegulatoryFramework.BENEFICIAL_OWNERSHIP_ACT_2020;
  }
}
