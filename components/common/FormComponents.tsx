import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  helpText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  icon: Icon,
  error,
  helpText,
  className = '',
  ...props
}) => {
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        {Icon && (
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        {label}
      </label>
      <input
        className={`input-primary ${error ? 'border-red-500' : ''} ${className}`}
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
  icon: Icon,
  error,
  helpText,
  className = '',
  ...props
}) => {
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        {Icon && (
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        {label}
      </label>
      <textarea
        className={`textarea-primary ${error ? 'border-red-500' : ''} ${className}`}
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
  icon: Icon,
  error,
  helpText,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        {Icon && (
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        {label}
      </label>
      <select
        className={`select-primary ${error ? 'border-red-500' : ''} ${className}`}
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
  icon: Icon,
  options,
  value,
  onChange,
  error
}) => {
  return (
    <div className="group">
      <label className="flex items-center label-primary">
        {Icon && (
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        {label}
      </label>
      <div className="grid gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
              value === option.value
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className="flex-1">
              <div className={`font-bold ${value === option.value ? 'text-white' : 'text-gray-800'}`}>
                {option.label}
              </div>
              {option.description && (
                <div className={`text-sm mt-1 ${value === option.value ? 'text-blue-100' : 'text-gray-600'}`}>
                  {option.description}
                </div>
              )}
            </div>
            {value === option.value && (
              <div className="ml-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
              </div>
            )}
          </label>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};