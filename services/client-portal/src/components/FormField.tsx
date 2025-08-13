import React from 'react';

interface FormFieldProps {
  name: string;
  value: string;
  placeholder: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const FormField = ({
  name,
  value,
  placeholder,
  type = 'text',
  maxLength,
  required = true,
  onChange,
  disabled = false,
}: FormFieldProps) => (
  <div>
    <label>{placeholder}: </label>
    <input
      name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} required={required} disabled={disabled}
    />
  </div>
);

export default FormField;
