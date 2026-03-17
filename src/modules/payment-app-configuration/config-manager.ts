/**
 * Configuration Manager for VNPay Payment App
 * Handles CRUD operations for VNPay configurations
 * Based on Saleor Stripe app pattern
 */

import { Client } from "urql";
import { MetadataManager } from "./metadata-manager";
import {
  VNPayConfigSchema,
  VNPayConfig,
  VNPayConfigEntry,
  VNPayConfigEntryInput,
  VNPayConfigEntrySchema,
} from "./input-schemas";

export class VNPayConfigManager {
  private metadataManager: MetadataManager;

  constructor(client: Client, appId: string) {
    this.metadataManager = new MetadataManager(client, appId);
  }

  /**
   * Get all configurations
   */
  async getConfig(): Promise<VNPayConfig> {
    const configString = await this.metadataManager.getConfig();

    if (!configString) {
      return { configurations: [] };
    }

    try {
      const rawConfig = JSON.parse(configString);
      return VNPayConfigSchema.parse(rawConfig);
    } catch (error) {
      console.error("Invalid config in metadata:", error);
      // Return empty config instead of throwing to allow recovery
      return { configurations: [] };
    }
  }

  /**
   * Save all configurations
   */
  async setConfig(config: VNPayConfig): Promise<void> {
    const validated = VNPayConfigSchema.parse(config);
    const configString = JSON.stringify(validated, null, 2);
    await this.metadataManager.setConfig(configString);
  }

  /**
   * Get a single configuration by ID
   */
  async getConfigurationById(
    configId: string
  ): Promise<VNPayConfigEntry | undefined> {
    const config = await this.getConfig();
    return config.configurations.find((c) => c.configurationId === configId);
  }

  /**
   * Get configuration by channel ID
   */
  async getConfigurationByChannelId(
    channelId: string
  ): Promise<VNPayConfigEntry | undefined> {
    const config = await this.getConfig();
    return config.configurations.find((c) => c.channelId === channelId);
  }

  /**
   * Add a new configuration
   */
  async addConfiguration(input: VNPayConfigEntryInput): Promise<VNPayConfigEntry> {
    const config = await this.getConfig();

    const newEntry: VNPayConfigEntry = {
      ...input,
      configurationId: `vnpay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };

    // Validate the new entry
    const validated = VNPayConfigEntrySchema.parse(newEntry);

    config.configurations.push(validated);
    await this.setConfig(config);

    return validated;
  }

  /**
   * Update an existing configuration
   */
  async updateConfiguration(
    configId: string,
    updates: Partial<VNPayConfigEntryInput>
  ): Promise<VNPayConfigEntry> {
    const config = await this.getConfig();
    const index = config.configurations.findIndex(
      (c) => c.configurationId === configId
    );

    if (index === -1) {
      throw new Error(`Configuration ${configId} not found`);
    }

    const updated: VNPayConfigEntry = {
      ...config.configurations[index],
      ...updates,
    };

    // Validate the updated entry
    const validated = VNPayConfigEntrySchema.parse(updated);

    config.configurations[index] = validated;
    await this.setConfig(config);

    return validated;
  }

  /**
   * Delete a configuration
   */
  async deleteConfiguration(configId: string): Promise<void> {
    const config = await this.getConfig();
    const filtered = config.configurations.filter(
      (c) => c.configurationId !== configId
    );

    if (filtered.length === config.configurations.length) {
      throw new Error(`Configuration ${configId} not found`);
    }

    config.configurations = filtered;
    await this.setConfig(config);
  }

  /**
   * Get the first active configuration (fallback)
   */
  async getDefaultConfiguration(): Promise<VNPayConfigEntry | undefined> {
    const config = await this.getConfig();
    return config.configurations[0];
  }
}
