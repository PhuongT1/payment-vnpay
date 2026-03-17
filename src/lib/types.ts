/**
 * Shared TypeScript Types
 * Central location for types used across the application
 */

/**
 * VNPay Configuration
 * Represents a VNPay payment gateway configuration for a sales channel
 */
export interface VNPayConfig {
  id: string;
  name: string;
  tmnCode: string;
  hashSecret?: string;
  environment: "sandbox" | "production";
  isActive: boolean;
  createdAt: string;
  channelIds?: string[];
}

/**
 * Saleor Sales Channel
 */
export interface SaleorChannel {
  id: string;
  name: string;
  slug: string;
  currencyCode: string;
  isActive: boolean;
}

/**
 * Channel Mapping for VNPay Config
 */
export interface ChannelMapping {
  channelId: string;
  channelName: string;
  configId: string;
}
