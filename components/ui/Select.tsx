import React, { forwardRef } from 'react';
import {
  formLabelClassName,
  formSelectClassName,
  formSelectResponsiveClassName,
} from '@/lib/utils/formControls';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  /** text-sm below md, text-md from md up */
  responsiveText?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth, responsiveText, className, ...props }, ref) => {
    const controlClass = responsiveText ? formSelectResponsiveClassName : formSelectClassName;
    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <label className={formLabelClassName}>
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            ${controlClass}
            ${error ? 'border-error-500' : ''}
            ${className || ''}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
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
        {(error || helperText) && (
          <p className={`mt-1.5 text-sm ${error ? 'text-error-500' : 'text-neutral-600'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
