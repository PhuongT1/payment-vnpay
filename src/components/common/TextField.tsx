/**
 * TextField Component
 * ===================
 * Reusable text input field with React Hook Form integration
 * Material UI inspired styling
 */

import React from 'react';
import { FieldError, UseFormRegister } from 'react-hook-form';

interface TextFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  helperText,
  required = false,
  disabled = false,
  autoComplete,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        htmlFor={name}
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
      
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        {...register(name)}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '14px',
          border: `1px solid ${error ? '#d32f2f' : '#e0e0e0'}`,
          borderRadius: '8px',
          boxSizing: 'border-box',
          transition: 'all 0.2s',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
          color: disabled ? '#9e9e9e' : '#212121',
          outline: 'none',
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#1976d2';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#d32f2f' : '#e0e0e0';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      
      {error && (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: '12px',
            color: '#d32f2f',
          }}
        >
          {error.message}
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
