// Mock data for Seychelles Compliance Hub
import { RiskLevel, TaskStatus, QualityTier, ValidationStatus, OnboardingStep } from '../types/enums';

// Data for global state store
export const mockStore = {
  user: {
    name: 'Compliance Officer',
    role: 'admin' as const,
    avatar: 'CO',
    isAuthenticated: true
  },
  notifications: [
    {
      id: 'notif-1',
      type: 'regulatory_change' as const,
      severity: 'critical' as const,
      message: 'New FSA circular requires immediate attention',
      timestamp: '2025-01-15T10:30:00Z',
      read: false
    }
  ]
};

// Data returned by API queries
export const mockQuery = {
  dashboardStats: {
    totalRisks: 47,
    criticalRisks: 3,
    activeTasks: 12,
    overdueTasks: 2
  },
  riskAssessments: [
    {
      id: 'risk-001',
      riskLevel: RiskLevel.CRITICAL,
      confidence: 0.94,
      title: 'New AML Beneficial Ownership Requirements',
      affectedObligations: ['AML.001', 'BO.002', 'RPT.003'],
      createdAt: '2025-01-12T09:30:00Z',
      status: 'ACTIVE' as const,
      description: 'FSA Circular 2025-03: Enhanced beneficial ownership disclosure requirements effective immediately'
    },
    {
      id: 'risk-002',
      riskLevel: RiskLevel.HIGH,
      confidence: 0.87,
      title: 'Updated International Tax Reporting Standards',
      affectedObligations: ['TAX.005', 'RPT.007'],
      createdAt: '2025-01-11T14:15:00Z',
      status: 'UNDER_REVIEW' as const,
      description: 'OECD CRS updates require system modifications for automatic exchange of information'
    },
    {
      id: 'risk-003',
      riskLevel: RiskLevel.MEDIUM,
      confidence: 0.72,
      title: 'Enhanced Customer Due Diligence Procedures',
      affectedObligations: ['CDD.001', 'KYC.004'],
      createdAt: '2025-01-10T11:45:00Z',
      status: 'COMPLETED' as const,
      description: 'Updated guidance on enhanced due diligence for politically exposed persons'
    }
  ],
  criticalTasks: [
    {
      id: 'task-001',
      title: 'URGENT: Update BO disclosure forms and system validation',
      riskLevel: RiskLevel.CRITICAL,
      dueDate: '2025-01-15T17:00:00Z',
      confidence: 0.94,
      status: TaskStatus.OPEN,
      assignee: 'Compliance Officer',
      description: 'Immediate action required to implement new beneficial ownership disclosure requirements',
      estimatedHours: 8
    },
    {
      id: 'task-002',
      title: 'Review and update CRS reporting templates',
      riskLevel: RiskLevel.HIGH,
      dueDate: '2025-01-18T12:00:00Z',
      confidence: 0.87,
      status: TaskStatus.IN_PROGRESS,
      assignee: 'Tax Compliance Specialist',
      description: 'Update automated reporting templates for international tax compliance',
      estimatedHours: 16
    }
  ]
};

// Data passed as props to the root component
export const mockRootProps = {
  currentUser: {
    id: 'user-1',
    name: 'Compliance Officer',
    email: 'compliance@seychelles-hub.com',
    role: 'admin' as const
  },
  systemStatus: {
    isOnline: true,
    lastSync: '2025-01-15T12:00:00Z',
    fiuConnectionStatus: 'connected' as const,
    regulatoryMonitoringActive: true
  }
};

// Additional mock data for STR Co-Pilot
export const mockSTRData = {
  caseId: `STR_CASE_${Date.now()}`,
  scoringResult: {
    overall_score: 4.2,
    quality_tier: QualityTier.GOOD,
    confidence: 0.87,
    requires_review: false,
    rubric_scores: {
      clarity: 4.1,
      completeness: 4.3,
      specificity: 4.0,
      timeline: 4.2,
      redFlags: 4.5,
      compliance: 4.1
    },
    recommendations: [
      'Narrative meets quality standards',
      'Consider adding more specific transaction details',
      'Excellent identification of suspicious indicators'
    ]
  }
};

// Mock onboarding data
export const mockOnboardingData = {
  companyDetails: {
    companyName: 'Paradise Holdings Ltd',
    registrationNumber: '12345678',
    businessType: 'IBC',
    incorporationDate: '2024-12-01T00:00:00Z',
    registeredAddress: {
      street: '123 Victoria Street',
      city: 'Victoria',
      country: 'Seychelles',
      postalCode: 'P.O. Box 1234'
    },
    contactDetails: {
      email: 'info@paradiseholdings.sc',
      phone: '+248-4-123456',
      website: 'www.paradiseholdings.sc'
    },
    authorizedCapital: {
      currency: 'USD',
      amount: 50000
    }
  },
  currentStep: OnboardingStep.COMPANY_DETAILS,
  isComplete: false,
  validationStatus: ValidationStatus.PENDING
};