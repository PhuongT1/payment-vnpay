/**
 * VNPay Configuration Validation Schema
 * =====================================
 * Zod schemas for validating VNPay configuration forms
 * Provides type-safe validation with helpful error messages
 */

import { z } from 'zod';

/**
 * VNPay Configuration Form Schema
 */
export const vnpayConfigSchema = z.object({
  name: z
    .string()
    .min(3, 'Configuration name must be at least 3 characters')
    .max(100, 'Configuration name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Only alphanumeric characters, spaces, hyphens, and underscores allowed'),
  
  tmnCode: z
    .string()
    .length(8, 'Terminal code must be exactly 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Terminal code must contain only uppercase letters and numbers'),
  
  hashSecret: z
    .string()
    .min(32, 'Hash secret must be at least 32 characters')
    .regex(/^[A-Z0-9]+$/, 'Hash secret must contain only uppercase letters and numbers'),
  
  environment: z.enum(['sandbox', 'production'], {
    errorMap: () => ({ message: 'Environment must be either sandbox or production' }),
  }),
});

/**
 * Infer TypeScript type from schema
 */
export type VNPayConfigFormData = z.infer<typeof vnpayConfigSchema>;

/**
 * Channel Mapping Form Schema
 */
export const channelMappingSchema = z.object({
  channelId: z.string().min(1, 'Please select a channel'),
  configId: z.string().min(1, 'Please select a configuration'),
});

export type ChannelMappingFormData = z.infer<typeof channelMappingSchema>;

/**
 * Payment Test Form Schema
 */
export const paymentTestSchema = z.object({
  orderId: z
    .string()
    .min(1, 'Order ID is required')
    .max(50, 'Order ID must not exceed 50 characters'),
  
  amount: z
    .number()
    .min(1000, 'Amount must be at least 1,000 VND')
    .max(1000000000, 'Amount must not exceed 1,000,000,000 VND'),
  
  orderInfo: z
    .string()
    .min(1, 'Order information is required')
    .max(255, 'Order information must not exceed 255 characters'),
  
  bankCode: z
    .string()
    .optional(),
});

export type PaymentTestFormData = z.infer<typeof paymentTestSchema>;

/**
 * Validation helper functions
 */
export const validators = {
  /**
   * Check if string is valid VNPay terminal code
   */
  isValidTmnCode: (value: string): boolean => {
    return /^[A-Z0-9]{8}$/.test(value);
  },

  /**
   * Check if string is valid hash secret
   */
  isValidHashSecret: (value: string): boolean => {
    return value.length >= 32 && /^[A-Z0-9]+$/.test(value);
  },

  /**
   * Format currency for display
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },
};
