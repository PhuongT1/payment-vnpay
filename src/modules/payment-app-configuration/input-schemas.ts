import { z } from "zod";

/**
 * Schema for a single VNPay configuration entry
 * Following Saleor Stripe app pattern
 */
export const VNPayConfigEntrySchema = z.object({
  configurationId: z.string().min(1, "Configuration ID is required"),
  configurationName: z.string().min(1, "Configuration name is required"),
  // VNPay specific fields (mapped from your requirements)
  partnerCode: z.string().min(1, "Partner code is required"), // vnp_TmnCode
  accessKey: z.string().min(1, "Access key is required"), // For API authentication
  secretKey: z.string().min(1, "Secret key is required"), // vnp_HashSecret
  redirectUrl: z.string().url("Must be a valid URL"), // Return URL after payment
  ipnUrl: z.string().url("Must be a valid URL"), // IPN (webhook) URL
  vnpVersion: z.string().min(1).max(8).default("2.1.0"),
  vnpCommand: z.literal("pay").default("pay"),
  vnpBankCode: z.enum(["VNPAYQR", "VNBANK", "INTCARD"]).optional(),
  vnpLocale: z.enum(["vn", "en"]).default("vn"),
  environment: z.enum(["sandbox", "production"]),
  // Optional: Channel assignment
  channelId: z.string().optional(),
});

/**
 * Schema for the complete app configuration
 * Supports multiple configurations for different channels
 */
export const VNPayConfigSchema = z.object({
  configurations: z.array(VNPayConfigEntrySchema),
});

export type VNPayConfig = z.infer<typeof VNPayConfigSchema>;
export type VNPayConfigEntry = z.infer<typeof VNPayConfigEntrySchema>;

/**
 * Schema for creating a new configuration (without ID)
 */
export const VNPayConfigEntryInputSchema = VNPayConfigEntrySchema.omit({
  configurationId: true,
});

export type VNPayConfigEntryInput = z.infer<typeof VNPayConfigEntryInputSchema>;
