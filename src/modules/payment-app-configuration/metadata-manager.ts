/**
 * Metadata Manager for Saleor App
 * Handles reading/writing to Saleor's private metadata
 * Based on official Saleor apps pattern
 */

import { Client } from "urql";

export interface MetadataItem {
  key: string;
  value: string;
}

const PRIVATE_METADATA_KEY = "vnpay-payment-config";

/**
 * GraphQL query to get app metadata
 * Note: In production, use generated types from GraphQL Code Generator
 */
const GET_APP_METADATA = `
  query GetAppMetadata($id: ID!) {
    app(id: $id) {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

/**
 * GraphQL mutation to update app metadata
 */
const UPDATE_PRIVATE_METADATA = `
  mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        ... on App {
          id
          privateMetadata {
            key
            value
          }
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export class MetadataManager {
  constructor(
    private client: Client,
    private appId: string
  ) {}

  /**
   * Get all metadata items for the app
   */
  async getMetadata(): Promise<MetadataItem[]> {
    const { data, error } = await this.client
      .query(GET_APP_METADATA, { id: this.appId })
      .toPromise();

    if (error) {
      console.error("Failed to fetch metadata:", error);
      throw new Error(`Failed to fetch metadata: ${error.message}`);
    }

    return data?.app?.privateMetadata ?? [];
  }

  /**
   * Set metadata items for the app
   */
  async setMetadata(metadata: Array<{ key: string; value: string }>): Promise<void> {
    const { data, error } = await this.client
      .mutation(UPDATE_PRIVATE_METADATA, {
        id: this.appId,
        input: metadata,
      })
      .toPromise();

    if (error) {
      console.error("Failed to update metadata:", error);
      throw new Error(`Failed to update metadata: ${error.message}`);
    }

    if (data?.updatePrivateMetadata?.errors?.length > 0) {
      const errorMessages = data.updatePrivateMetadata.errors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Metadata update errors: ${errorMessages}`);
    }
  }

  /**
   * Get the VNPay configuration from metadata
   */
  async getConfig(): Promise<string | undefined> {
    const metadata = await this.getMetadata();
    const configItem = metadata.find((item) => item.key === PRIVATE_METADATA_KEY);
    return configItem?.value;
  }

  /**
   * Save the VNPay configuration to metadata
   */
  async setConfig(config: string): Promise<void> {
    await this.setMetadata([
      {
        key: PRIVATE_METADATA_KEY,
        value: config,
      },
    ]);
  }

  /**
   * Delete the VNPay configuration from metadata
   */
  async deleteConfig(): Promise<void> {
    await this.setMetadata([
      {
        key: PRIVATE_METADATA_KEY,
        value: "",
      },
    ]);
  }
}
