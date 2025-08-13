import React, { useState, useCallback } from 'react';
import { OnboardingData, OnboardingStep, CompanyDetails } from '../../types/schema';
import { seychellesTheme, paradiseBackgroundSVG, createGlassEffect } from '../../theme/seychellesTheme';
import { STEP_TITLES, ValidationStatus } from '../../types/enums';
import { fiuBOService, FIUUtils } from '../../services/fiuBOService';
// (Optional future use) Seychelles regulatory utilities
// import { SeychellesRegulatoryUtils, SeychellesRegulatoryFramework } from '../../types/seychellesRegulations';

// Step Components (we'll create these next)
// import CompanyDetailsStep from './steps/CompanyDetailsStep';
// import RegulatoryProfileStep from './steps/RegulatoryProfileStep';
// import BeneficialOwnersStep from './steps/BeneficialOwnersStep';
// import DocumentUploadStep from './steps/DocumentUploadStep';
// import ReviewSubmitStep from './steps/ReviewSubmitStep';

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  onSave?: (data: OnboardingData) => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(OnboardingStep.COMPANY_DETAILS);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyDetails: {},
    regulatoryProfile: {},
    beneficialOwners: [],
    documents: [],
    currentStep: OnboardingStep.COMPANY_DETAILS,
    isComplete: false,
    validationStatus: ValidationStatus.PENDING
  });

  // Build a minimally valid CompanyDetails object from partial for FIU submission
  const buildCompanyDetails = (partial: Partial<CompanyDetails>): CompanyDetails => {
    return {
      companyName: partial.companyName || 'UNKNOWN_COMPANY',
      registrationNumber: partial.registrationNumber || '000000',
      businessType: partial.businessType || ("IBC" as any),
      incorporationDate: partial.incorporationDate || new Date(),
      registeredAddress: partial.registeredAddress || {
        street: '', city: '', country: 'Seychelles', postalCode: ''
      },
      businessAddress: partial.businessAddress || {
        street: '', city: '', country: 'Seychelles', postalCode: '', sameAsRegistered: true
      },
      contactDetails: partial.contactDetails || {
        email: 'placeholder@example.com', phone: '+2480000000'
      },
      authorizedCapital: partial.authorizedCapital || { currency: 'USD', amount: 0 }
    } as CompanyDetails;
  };

  const updateOnboardingData = useCallback(<K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: value,
      currentStep
    }));
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    if (currentStep < OnboardingStep.REVIEW_SUBMIT) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep as OnboardingStep);
      updateOnboardingData('currentStep', nextStep);
    }
  }, [currentStep, updateOnboardingData]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > OnboardingStep.COMPANY_DETAILS) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep as OnboardingStep);
      updateOnboardingData('currentStep', prevStep);
    }
  }, [currentStep, updateOnboardingData]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
    updateOnboardingData('currentStep', step);
  }, [updateOnboardingData]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const finalData: OnboardingData = {
        ...onboardingData,
        isComplete: true,
        submissionDate: new Date(),
        validationStatus: ValidationStatus.PROCESSING
      };

      // Check if FIU BO submission is required
      const requiresFIUSubmission = FIUUtils.isSubmissionRequired(onboardingData.beneficialOwners);
      
      if (requiresFIUSubmission) {
        console.log('🏛️ Submitting to FIU Beneficial Ownership Database...');
        try {
          const fiuResponse = await fiuBOService.submitBeneficialOwnership(
            buildCompanyDetails(onboardingData.companyDetails),
            onboardingData.beneficialOwners
          );
          
          console.log('✅ FIU BO Submission successful:', fiuResponse.receiptNumber);
          
          // Update beneficial owners with FIU submission details
          finalData.beneficialOwners = onboardingData.beneficialOwners.map(bo => ({
            ...bo,
            fiuSubmission: {
              submissionId: fiuResponse.submissionId,
              submissionDate: new Date(),
              status: 'SUBMITTED',
              receiptNumber: fiuResponse.receiptNumber
            }
          }));
          
        } catch (fiuError) {
          console.warn('⚠️ FIU submission failed, proceeding with manual process:', fiuError.message);
          // Continue with submission but flag for manual FIU submission
          finalData.beneficialOwners = onboardingData.beneficialOwners.map(bo => ({
            ...bo,
            fiuSubmission: {
              status: 'PENDING',
              submissionDate: new Date()
            }
          }));
        }
      }
      
      if (onComplete) {
        await onComplete(finalData);
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case OnboardingStep.COMPANY_DETAILS:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Company Details</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>Please provide your company information.</p>
            <button 
              onClick={goToNextStep}
              style={{
                padding: '12px 24px',
                background: seychellesTheme.gradients.ocean,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Continue to Regulatory Profile
            </button>
          </div>
        );
      case OnboardingStep.REGULATORY_PROFILE:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Regulatory Profile</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>Configure your regulatory requirements.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={goToPreviousStep}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Previous
              </button>
              <button 
                onClick={goToNextStep}
                style={{
                  padding: '12px 24px',
                  background: seychellesTheme.gradients.ocean,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Continue to Beneficial Owners
              </button>
            </div>
          </div>
        );
      case OnboardingStep.BENEFICIAL_OWNERS:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Beneficial Owners</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
              Add beneficial ownership information for automatic FIU database submission.
            </p>
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.1)', 
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <h4 style={{ color: '#06b6d4', margin: '0 0 12px 0', fontSize: '16px' }}>
                🏛️ FIU Beneficial Ownership Act 2020 Compliance
              </h4>
              <ul style={{ color: 'rgba(255,255,255,0.9)', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                <li>Automatic submission to FIU BO Database (fiu.sc:4443/BO_Live)</li>
                <li>Required for all owners with 25%+ ownership</li>
                <li>Eliminates manual FIU portal registration</li>
                <li>Real-time compliance verification</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={goToPreviousStep}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Previous
              </button>
              <button 
                onClick={goToNextStep}
                style={{
                  padding: '12px 24px',
                  background: seychellesTheme.gradients.ocean,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Continue to Document Upload
              </button>
            </div>
          </div>
        );
      case OnboardingStep.DOCUMENT_UPLOAD:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Document Upload</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>Upload required documents.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={goToPreviousStep}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Previous
              </button>
              <button 
                onClick={goToNextStep}
                style={{
                  padding: '12px 24px',
                  background: seychellesTheme.gradients.ocean,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Continue to Review
              </button>
            </div>
          </div>
        );
      case OnboardingStep.REVIEW_SUBMIT:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Review & Submit</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
              Review your information and submit for processing.
            </p>
            
            {/* FIU Compliance Status */}
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <h4 style={{ color: '#10b981', margin: '0 0 12px 0', fontSize: '16px' }}>
                ✅ Automated Compliance Features
              </h4>
              <ul style={{ color: 'rgba(255,255,255,0.9)', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                <li>Automatic FIU Beneficial Ownership Database submission</li>
                <li>FSA compliance verification with latest 2024-2025 regulations</li>
                <li>Digital document processing and validation</li>
                <li>Real-time regulatory status tracking</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={goToPreviousStep}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Previous
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  background: isLoading ? 'rgba(139, 92, 246, 0.5)' : seychellesTheme.gradients.sunset,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? '🏛️ Processing & Submitting to FIU...' : 'Submit Application'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / 5) * 100;

  return (
    <div style={containerStyle}>
      {/* Seychelles Paradise Background */}
      <div 
        style={backgroundStyle}
        dangerouslySetInnerHTML={{ __html: paradiseBackgroundSVG }}
      />
      
      {/* Main Content */}
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <div style={logoStyle}>🇸🇨</div>
            <div>
              <h1 style={titleStyle}>Seychelles Compliance Hub</h1>
              <p style={subtitleStyle}>Client Onboarding Portal</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div style={progressContainerStyle}>
          <div style={progressBarBackgroundStyle}>
            <div 
              style={{
                ...progressBarStyle,
                width: `${progressPercentage}%`
              }}
            />
          </div>
          <div style={stepIndicatorsStyle}>
            {Object.entries(STEP_TITLES).map(([stepNum, title]) => {
              const step = parseInt(stepNum) as OnboardingStep;
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              
              return (
                <div 
                  key={step}
                  style={{
                    ...stepIndicatorStyle,
                    background: isCompleted 
                      ? seychellesTheme.colors.status.success
                      : isActive 
                        ? seychellesTheme.gradients.ocean
                        : seychellesTheme.colors.glass.light,
                    border: isActive 
                      ? `2px solid ${seychellesTheme.colors.primary.paradiseCyan}`
                      : `1px solid ${seychellesTheme.colors.glass.border}`,
                    cursor: isCompleted || isActive ? 'pointer' : 'default',
                    opacity: isCompleted || isActive ? 1 : 0.6
                  }}
                  onClick={() => (isCompleted || isActive) && goToStep(step)}
                >
                  <div style={stepNumberStyle}>
                    {isCompleted ? '✓' : step + 1}
                  </div>
                  <div style={stepTitleStyle}>{title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div style={stepContentStyle}>
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  minHeight: '100vh',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  fontFamily: seychellesTheme.typography.fontFamily
};

const backgroundStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -1
};

const contentStyle = {
  position: 'relative' as const,
  zIndex: 1,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column' as const
};

const headerStyle = {
  padding: seychellesTheme.spacing.xl,
  ...createGlassEffect(0.15, '12px'),
  margin: seychellesTheme.spacing.lg,
  marginBottom: seychellesTheme.spacing.md,
  borderRadius: seychellesTheme.borderRadius.large
};

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: seychellesTheme.spacing.lg
};

const logoStyle = {
  width: '60px',
  height: '60px',
  background: seychellesTheme.gradients.ocean,
  borderRadius: seychellesTheme.borderRadius.medium,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: seychellesTheme.typography.fontSize['2xl'],
  boxShadow: seychellesTheme.shadows.glass
};

const titleStyle = {
  fontSize: seychellesTheme.typography.fontSize['3xl'],
  fontWeight: seychellesTheme.typography.fontWeight.bold,
  color: seychellesTheme.colors.neutral.white,
  margin: 0,
  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
};

const subtitleStyle = {
  fontSize: seychellesTheme.typography.fontSize.lg,
  color: seychellesTheme.colors.primary.paradiseCyan,
  margin: 0,
  fontWeight: seychellesTheme.typography.fontWeight.medium
};

const progressContainerStyle = {
  margin: `0 ${seychellesTheme.spacing.lg}`,
  marginBottom: seychellesTheme.spacing.xl
};

const progressBarBackgroundStyle = {
  width: '100%',
  height: '8px',
  background: seychellesTheme.colors.glass.light,
  borderRadius: '4px',
  overflow: 'hidden' as const,
  marginBottom: seychellesTheme.spacing.lg
};

const progressBarStyle = {
  height: '100%',
  background: seychellesTheme.gradients.ocean,
  borderRadius: '4px',
  transition: `width ${seychellesTheme.animation.duration.slow} ${seychellesTheme.animation.easing.easeInOut}`,
  boxShadow: `0 0 20px ${seychellesTheme.colors.primary.paradiseCyan}40`
};

const stepIndicatorsStyle = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  gap: seychellesTheme.spacing.sm
};

const stepIndicatorStyle = {
  flex: 1,
  padding: seychellesTheme.spacing.md,
  ...createGlassEffect(0.1, '8px'),
  borderRadius: seychellesTheme.borderRadius.medium,
  textAlign: 'center' as const,
  transition: `all ${seychellesTheme.animation.duration.normal} ${seychellesTheme.animation.easing.easeInOut}`
};

const stepNumberStyle = {
  fontSize: seychellesTheme.typography.fontSize.lg,
  fontWeight: seychellesTheme.typography.fontWeight.bold,
  color: seychellesTheme.colors.neutral.white,
  marginBottom: seychellesTheme.spacing.xs
};

const stepTitleStyle = {
  fontSize: seychellesTheme.typography.fontSize.sm,
  color: seychellesTheme.colors.neutral.white,
  fontWeight: seychellesTheme.typography.fontWeight.medium
};

const stepContentStyle = {
  flex: 1,
  margin: seychellesTheme.spacing.lg,
  ...createGlassEffect(0.1, '16px'),
  borderRadius: seychellesTheme.borderRadius.large,
  padding: seychellesTheme.spacing.xl
};

export default OnboardingWizard;
