import React, { useState } from 'react';
// Assumes you have firebase configured and exported from a file like './firebase'
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import styles from './OnboardingWizard.module.css';

// --- Mock Firebase for demonstration ---
// const mockHttpsCallable = (data: any) => {
//   console.log('Calling mock onboardClientFunction with:', data);
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({ data: { status: 'success', message: 'Client onboarded!', clientId: 'mockClientId123' } });
//     }, 1500);
//   });
// };
const functions = getFunctions();
const onboardClientFunction = httpsCallable(functions, 'onboardClientFunction');
// const onboardClientFunction = mockHttpsCallable;
// --- End Mock ---

// Define a type for the Beneficial Owner data structure for type safety.
type BeneficialOwner = {
  fullName: string;
  residentialAddress: string;
  serviceAddress: string;
  dateOfBirth: string;
  nationality: string;
  nationalIdNumber: string;
  taxIdNumber: string;
  dateBecameBo: string;
};

const initialBoState: BeneficialOwner = {
  fullName: '',
  residentialAddress: '',
  serviceAddress: '',
  dateOfBirth: '',
  nationality: '',
  nationalIdNumber: '',
  taxIdNumber: '',
  dateBecameBo: '',
};

// A reusable FormField component to reduce boilerplate code.
const FormField = ({ name, value, placeholder, type = 'text', maxLength, required = true, onChange, disabled = false }: {
  name: keyof BeneficialOwner;
  value: string;
  placeholder: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) => (
  <div>
    <label>{placeholder}: </label>
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} required={required} disabled={disabled} />
  </div>
);

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([initialBoState]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddBo = () => {
    setBeneficialOwners([...beneficialOwners, { ...initialBoState }]);
  };

  const handleBoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newBos = [...beneficialOwners];
    newBos[index] = { ...newBos[index], [event.target.name]: event.target.value };
    setBeneficialOwners(newBos);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        clientName,
        beneficialOwners,
      };
      // In a real app, you would use the actual firebase function call
      const result: HttpsCallableResult = await onboardClientFunction(payload);
      const resultData = result.data as { message: string };
      setSuccessMessage(resultData.message);
      setStep(3); // Move to success step
    } catch (err: any) {
      // Provide more specific feedback to the user based on the error code.
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (err.code === 'invalid-argument') {
        // Use the detailed message from the function if available.
        errorMessage = err.details?.message || 'The data you provided is invalid. Please review the form and try again.';
      } else if (err.code === 'unauthenticated') {
        errorMessage = 'You must be signed in to perform this action.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'The sanctions screening service is temporarily unavailable. Please try again in a few minutes.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = () => {
    if (!clientName.trim()) {
      return false;
    }
    // Ensure every beneficial owner listed has valid required fields.
    return beneficialOwners.every(
      (bo) => {
        const isDateValid = (dateStr: string) => !isNaN(new Date(dateStr).getTime());
        return (
          bo.fullName.trim().length > 0 &&
          bo.nationality.trim().length === 2 && // Match backend validation
          isDateValid(bo.dateOfBirth) && // Check for valid date
          isDateValid(bo.dateBecameBo) // Check for valid date
        );
      }
    );
  };

  const renderStep1 = () => (
    <div>
      <h2>Step 1: Client Information</h2>
      <label>
        Client Company Name:
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          disabled={isLoading}
        />
      </label>
      <hr />
      <h2>Beneficial Owners</h2>
      {beneficialOwners.map((bo, index) => (
        <div key={index} className={styles.boContainer}>
          <h4>Beneficial Owner {index + 1}</h4>
          <FormField name="fullName" placeholder="Full Name" value={bo.fullName} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="residentialAddress" placeholder="Residential Address" value={bo.residentialAddress} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="serviceAddress" placeholder="Service Address" value={bo.serviceAddress} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="dateOfBirth" placeholder="Date of Birth" type="date" value={bo.dateOfBirth} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="nationality" placeholder="Nationality (e.g., SC)" maxLength={2} value={bo.nationality} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="nationalIdNumber" placeholder="National ID Number" value={bo.nationalIdNumber} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="taxIdNumber" placeholder="Tax ID Number" value={bo.taxIdNumber} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
          <FormField name="dateBecameBo" placeholder="Date Became BO" type="date" value={bo.dateBecameBo} onChange={(e) => handleBoChange(index, e)} disabled={isLoading} />
        </div>
      ))}
      <button type="button" onClick={handleAddBo} disabled={isLoading}>Add Another Beneficial Owner</button>
      <br />
      <button type="button" onClick={() => setStep(2)} disabled={!isStep1Valid() || isLoading}>Next: Review</button>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2>Step 2: Review and Submit</h2>
      <h3>Client: {clientName}</h3>
      <h4>Beneficial Owners:</h4>
      <ul>
        {beneficialOwners.map((bo, index) => (
          <li key={index}>{bo.fullName}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setStep(1)} disabled={isLoading}>Back to Edit</button>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting & Screening...' : 'Submit Onboarding Data'}
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2>Onboarding Complete!</h2>
      <p>{successMessage}</p>
      <button onClick={() => {
        setStep(1);
        setClientName('');
        setBeneficialOwners([initialBoState]);
        setSuccessMessage(null);
      }}>
        Onboard Another Client
      </button>
    </div>
  );

  return (
    <div className={styles.wizardContainer}>
      <h1>Client Onboarding Wizard</h1>
      <form onSubmit={handleSubmit}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {error && <p className={styles.errorText}>Error: {error}</p>}
      </form>
      {step === 3 && renderStep3()}
    </div>
  );
};

export default OnboardingWizard;