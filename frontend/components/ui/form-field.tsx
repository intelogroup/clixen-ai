'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  ValidationResult, 
  PasswordStrength, 
  assessPasswordStrength,
  suggestEmailDomain,
  createDebouncer
} from '@/lib/form-validation';

interface FormFieldProps {
  id: string;
  type: 'email' | 'password';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  validation?: ValidationResult;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  showStrength?: boolean; // For password fields
  className?: string;
}

export function FormField({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  validation,
  disabled = false,
  autoComplete,
  required = true,
  showStrength = false,
  className = ''
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Debounced email suggestion check
  const debouncedEmailCheck = createDebouncer((email: string) => {
    if (type === 'email' && email.includes('@')) {
      const suggestion = suggestEmailDomain(email);
      setEmailSuggestion(suggestion);
    }
  }, 300);

  useEffect(() => {
    if (type === 'email') {
      debouncedEmailCheck(value);
    } else if (type === 'password' && showStrength && value) {
      setPasswordStrength(assessPasswordStrength(value));
    }
  }, [value, type, showStrength, debouncedEmailCheck]);

  const handleFocus = () => {
    setFocused(true);
    setEmailSuggestion(null); // Hide suggestion when focused
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  const getValidationIcon = () => {
    if (!validation) return null;
    
    switch (validation.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getFieldBorderClass = () => {
    if (focused) {
      return 'ring-2 ring-indigo-500 border-indigo-500';
    }
    
    if (validation && !validation.isValid) {
      return 'border-red-300 ring-1 ring-red-300';
    }
    
    if (validation?.type === 'success' && value) {
      return 'border-green-300 ring-1 ring-green-300';
    }
    
    if (validation?.type === 'warning') {
      return 'border-yellow-300 ring-1 ring-yellow-300';
    }
    
    return 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  };

  const renderPasswordStrength = () => {
    if (!passwordStrength || !value) return null;

    const strengthColors = {
      'very-weak': 'bg-red-500',
      'weak': 'bg-orange-500',
      'fair': 'bg-yellow-500',
      'good': 'bg-blue-500',
      'strong': 'bg-green-500'
    };

    const strengthWidth = {
      'very-weak': 'w-1/5',
      'weak': 'w-2/5',
      'fair': 'w-3/5',
      'good': 'w-4/5',
      'strong': 'w-full'
    };

    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Password strength:</span>
          <span className={`text-sm font-medium capitalize text-${passwordStrength.color}-600`}>
            {passwordStrength.level.replace('-', ' ')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength.level]} ${strengthWidth[passwordStrength.level]}`}
          />
        </div>
        {passwordStrength.feedback.length > 0 && (
          <ul className="text-xs text-gray-500 space-y-1">
            {passwordStrength.feedback.map((tip, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type={type === 'password' && !showPassword ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          className={`
            block w-full px-3 py-2 pr-10 text-sm placeholder-gray-400 
            rounded-md shadow-sm transition-colors duration-200
            ${getFieldBorderClass()}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
        />
        
        {/* Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          {getValidationIcon()}
        </div>
      </div>
      
      {/* Validation message */}
      {validation && validation.message && (
        <p className={`text-sm mt-1 flex items-center ${
          validation.type === 'error' ? 'text-red-600' :
          validation.type === 'warning' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {validation.message}
        </p>
      )}
      
      {/* Email suggestion */}
      {emailSuggestion && !focused && (
        <div className="mt-1">
          <p className="text-sm text-gray-600">
            Did you mean{' '}
            <button
              type="button"
              onClick={() => {
                onChange(emailSuggestion);
                setEmailSuggestion(null);
              }}
              className="text-indigo-600 hover:text-indigo-500 underline font-medium"
            >
              {emailSuggestion}
            </button>
            ?
          </p>
        </div>
      )}
      
      {/* Password strength indicator */}
      {type === 'password' && showStrength && renderPasswordStrength()}
    </div>
  );
}

export default FormField;