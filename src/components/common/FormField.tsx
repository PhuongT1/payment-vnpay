/**
 * FormField Wrapper Component
 * ============================
 * Generic wrapper for form fields with consistent styling
 * Useful for custom field types
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required = false,
  children,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: error ? '#d32f2f' : '#424242',
        }}
      >
        {label}
        {required && <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>}
      </label>
      
      <div>{children}</div>
      
      {error && (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '12px',
            color: '#d32f2f',
          }}
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '12px',
            color: '#757575',
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};
