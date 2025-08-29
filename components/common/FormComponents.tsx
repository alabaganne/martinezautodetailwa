import React from 'react';
import { Check, LucideIcon } from 'lucide-react';

// Helper component for icon rendering
const IconWrapper: React.FC<{ icon?: LucideIcon }> = ({ icon: Icon }) => {
  if (!Icon) return null;
  return (
    <div className="p-2 bg-gradient-to-br from-brand-100 to-brand-200 rounded-lg mr-2">
      <Icon className="w-4 h-4 text-brand-600" />
    </div>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helpText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  icon,
  error,
  helpText,
  className = '',
  value,
  ...props
}) => {
  // Ensure controlled input by providing default empty string
  const controlledValue = value ?? '';
  
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        <IconWrapper icon={icon} />
        {label}
      </label>
      <input
        className={`input-primary ${error ? 'border-red-500' : ''} ${className}`}
        value={controlledValue}
        {...props}
      />
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-2 ml-2">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2 ml-2">{error}</p>
      )}
    </div>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helpText?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  icon,
  error,
  helpText,
  className = '',
  value,
  ...props
}) => {
  // Ensure controlled input by providing default empty string
  const controlledValue = value ?? '';
  
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        <IconWrapper icon={icon} />
        {label}
      </label>
      <textarea
        className={`textarea-primary ${error ? 'border-red-500' : ''} ${className}`}
        value={controlledValue}
        {...props}
      />
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-2 ml-2">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2 ml-2">{error}</p>
      )}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helpText?: string;
  options: SelectOption[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  icon,
  error,
  helpText,
  options,
  className = '',
  value,
  ...props
}) => {
  // Ensure controlled input by providing default empty string
  const controlledValue = value ?? '';
  
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        <IconWrapper icon={icon} />
        {label}
      </label>
      <select
        className={`select-primary ${error ? 'border-red-500' : ''} ${className}`}
        value={controlledValue}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-2 ml-2">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2 ml-2">{error}</p>
      )}
    </div>
  );
};

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface FormRadioGroupProps {
  label: string;
  icon?: LucideIcon;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  error
}) => {
  // Ensure controlled input by providing default empty string
  const controlledValue = value ?? '';
  
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        <IconWrapper icon={icon} />
        {label}
      </label>
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = controlledValue === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                isSelected
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-2'
                  : 'bg-white border-2 border-gray-200 hover:border-brand-300'
              }`}
            >
              <input
                type="radio"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <div className="flex-1">
                <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className={`text-sm mt-1 ${isSelected ? 'text-brand-100' : 'text-gray-600'}`}>
                    {option.description}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="ml-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Check size={15} />
                  </div>
                </div>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};