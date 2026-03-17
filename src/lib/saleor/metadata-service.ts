/**
 * Saleor Metadata Service
 * =======================
 * Manages VNPay configurations persistence using Saleor's Metadata API
 * Replaces localStorage for production-ready data storage
 */

import { VNPayConfig } from '../types';

const METADATA_KEYS = {
  VNPAY_CONFIGS: 'vnpay:configs',
  VNPAY_CHANNEL_MAPPINGS: 'vnpay:channel_mappings',
} as const;

export class MetadataService {
  private saleorApiUrl: string;
  private authToken: string | null = null;

  constructor(saleorApiUrl?: string) {
    this.saleorApiUrl = saleorApiUrl || process.env.NEXT_PUBLIC_SALEOR_API_URL || '';
  }

  /**
   * Set auth token for authenticated requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Execute GraphQL query
   */
  private async executeQuery<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(this.saleorApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Get app metadata
   */
  async getAppMetadata(): Promise<Record<string, string>> {
    const query = `
      query GetAppMetadata {
        app {
          id
          metadata {
            key
            value
          }
        }
      }
    `;

    const data = await this.executeQuery<{ app: { metadata: Array<{ key: string; value: string }> } }>(query);
    
    const metadata: Record<string, string> = {};
    data.app.metadata.forEach(item => {
      metadata[item.key] = item.value;
    });

    return metadata;
  }

  /**
   * Set app metadata
   */
  async setAppMetadata(key: string, value: string): Promise<void> {
    const mutation = `
      mutation UpdateAppMetadata($id: ID!, $input: [MetadataInput!]!) {
        updateMetadata(id: $id, input: $input) {
          item {
            ... on App {
              id
              metadata {
                key
                value
              }
            }
          }
        }
      }
    `;

    // First get app ID
    const appQuery = `query { app { id } }`;
    const appData = await this.executeQuery<{ app: { id: string } }>(appQuery);

    await this.executeQuery(mutation, {
      id: appData.app.id,
      input: [{ key, value }],
    });
  }

  /**
   * Save VNPay configurations
   */
  async saveVNPayConfigs(configs: VNPayConfig[]): Promise<void> {
    const value = JSON.stringify(configs);
    await this.setAppMetadata(METADATA_KEYS.VNPAY_CONFIGS, value);
  }

  /**
   * Get VNPay configurations
   */
  async getVNPayConfigs(): Promise<VNPayConfig[]> {
    try {
      const metadata = await this.getAppMetadata();
      const value = metadata[METADATA_KEYS.VNPAY_CONFIGS];
      
      if (!value) {
        return [];
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to get VNPay configs from metadata:', error);
      return [];
    }
  }

  /**
   * Save channel mappings
   */
  async saveChannelMappings(mappings: Record<string, string>): Promise<void> {
    const value = JSON.stringify(mappings);
    await this.setAppMetadata(METADATA_KEYS.VNPAY_CHANNEL_MAPPINGS, value);
  }

  /**
   * Get channel mappings
   */
  async getChannelMappings(): Promise<Record<string, string>> {
    try {
      const metadata = await this.getAppMetadata();
      const value = metadata[METADATA_KEYS.VNPAY_CHANNEL_MAPPINGS];
      
      if (!value) {
        return {};
      }

      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to get channel mappings from metadata:', error);
      return {};
    }
  }

  /**
   * Migrate from localStorage to Metadata API
   * Call this once to migrate existing data
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Server-side, skip
    }

    // Migrate configs
    const savedConfigs = localStorage.getItem('vnpay_configs');
    if (savedConfigs) {
      try {
        const configs = JSON.parse(savedConfigs);
        await this.saveVNPayConfigs(configs);
        console.log('✅ Migrated VNPay configs to Saleor Metadata');
      } catch (error) {
        console.error('Failed to migrate configs:', error);
      }
    }

    // Migrate channel mappings
    const savedMappings = localStorage.getItem('vnpay_channel_mappings');
    if (savedMappings) {
      try {
        const mappings = JSON.parse(savedMappings);
        const mappingsMap: Record<string, string> = {};
        
        mappings.forEach((channel: any) => {
          if (channel.configId) {
            mappingsMap[channel.id] = channel.configId;
          }
        });

        await this.saveChannelMappings(mappingsMap);
        console.log('✅ Migrated channel mappings to Saleor Metadata');
      } catch (error) {
        console.error('Failed to migrate channel mappings:', error);
      }
    }
  }
}

// Singleton instance
let metadataServiceInstance: MetadataService | null = null;

export function getMetadataService(): MetadataService {
  if (!metadataServiceInstance) {
    metadataServiceInstance = new MetadataService();
  }
  return metadataServiceInstance;
}
