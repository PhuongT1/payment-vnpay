/**
 * Saleor Channels Service
 * =======================
 * Fetches channel data from Saleor GraphQL API
 * Replaces hard-coded channel data
 */

export interface SaleorChannel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  currencyCode: string;
  defaultCountry?: {
    code: string;
    country: string;
  };
}

export class ChannelsService {
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
   * Fetch all channels from Saleor
   */
  async getChannels(): Promise<SaleorChannel[]> {
    const query = `
      query GetChannels {
        channels {
          id
          name
          slug
          isActive
          currencyCode
          defaultCountry {
            code
            country
          }
        }
      }
    `;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(this.saleorApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data.channels || [];
    } catch (error) {
      console.error('Failed to fetch channels from Saleor:', error);
      
      // Fallback to demo channels if Saleor API fails
      return [
        {
          id: 'default-channel',
          name: 'Default Channel',
          slug: 'default-channel',
          isActive: true,
          currencyCode: 'USD',
        },
      ];
    }
  }

  /**
   * Get active channels only
   */
  async getActiveChannels(): Promise<SaleorChannel[]> {
    const channels = await this.getChannels();
    return channels.filter(channel => channel.isActive);
  }

  /**
   * Get channel by ID
   */
  async getChannelById(id: string): Promise<SaleorChannel | null> {
    const channels = await this.getChannels();
    return channels.find(channel => channel.id === id) || null;
  }
}

// Singleton instance
let channelsServiceInstance: ChannelsService | null = null;

export function getChannelsService(): ChannelsService {
  if (!channelsServiceInstance) {
    channelsServiceInstance = new ChannelsService();
  }
  return channelsServiceInstance;
}
