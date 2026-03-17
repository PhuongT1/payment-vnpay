# Saleor Payment App Architecture Guide

## Overview

This guide explains how to build a payment app for Saleor following the official architecture used in the Saleor Apps repository (e.g., Stripe app).

## Recommended Folder Structure

```
saleor-app-template/
├── src/
│   ├── modules/
│   │   ├── payment-app-configuration/
│   │   │   ├── config-manager.ts          # Configuration storage/retrieval
│   │   │   ├── input-schemas.ts           # Zod schemas for validation
│   │   │   └── metadata-manager.ts        # Saleor metadata operations
│   │   ├── payment-provider/
│   │   │   ├── payment-provider.ts        # Main payment provider class
│   │   │   ├── payment-client.ts          # API client
│   │   │   └── payment-errors.ts          # Error handling
│   │   └── webhooks/
│   │       ├── payment-gateway-initialize-session.ts
│   │       ├── transaction-initialize-session.ts
│   │       ├── transaction-process-session.ts
│   │       ├── transaction-charge-requested.ts
│   │       └── transaction-refund-requested.ts
│   ├── pages/
│   │   ├── api/
│   │   │   ├── manifest.ts
│   │   │   ├── configuration.ts           # API for config CRUD
│   │   │   ├── test-connection.ts         # Test connection endpoint
│   │   │   └── webhooks/
│   │   │       └── [webhooks matching modules/webhooks]
│   │   └── configuration.tsx              # Configuration UI
│   └── lib/
│       ├── invariant.ts                   # Assertion helpers
│       └── const.ts                       # Constants
├── graphql/
│   ├── queries/
│   │   └── GetChannelQuery.graphql
│   └── mutations/
│       └── UpdateMetadata.graphql
└── package.json
```

## Key Components

### 1. Configuration Schema (using Zod)

```typescript
// src/modules/payment-app-configuration/input-schemas.ts
import { z } from "zod";

export const PaymentAppConfigEntrySchema = z.object({
  configurationId: z.string().min(1),
  configurationName: z.string().min(1),
  partnerCode: z.string().min(1),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
  redirectUrl: z.string().url(),
  ipnUrl: z.string().url(),
  environment: z.enum(["sandbox", "production"]),
});

export const PaymentAppConfigSchema = z.object({
  configurations: z.array(PaymentAppConfigEntrySchema),
});

export type PaymentAppConfig = z.infer<typeof PaymentAppConfigSchema>;
export type PaymentAppConfigEntry = z.infer<typeof PaymentAppConfigEntrySchema>;
```

### 2. Metadata Manager (Saleor metadata storage)

```typescript
// src/modules/payment-app-configuration/metadata-manager.ts
import { Client } from "urql";
import { MetadataItem } from "@/generated/graphql";

const PRIVATE_METADATA_KEY = "payment-app-config";

export class MetadataManager {
  constructor(private client: Client, private appId: string) {}

  async getMetadata(): Promise<MetadataItem[]> {
    const { data, error } = await this.client
      .query(GetAppMetadataDocument, { id: this.appId })
      .toPromise();

    if (error) {
      throw error;
    }

    return data?.app?.privateMetadata ?? [];
  }

  async setMetadata(metadata: Array<{ key: string; value: string }>) {
    const { error } = await this.client
      .mutation(UpdatePrivateMetadataDocument, {
        id: this.appId,
        input: metadata,
      })
      .toPromise();

    if (error) {
      throw error;
    }
  }

  async getConfig(): Promise<string | undefined> {
    const metadata = await this.getMetadata();
    return metadata.find((item) => item.key === PRIVATE_METADATA_KEY)?.value;
  }

  async setConfig(config: string) {
    await this.setMetadata([
      {
        key: PRIVATE_METADATA_KEY,
        value: config,
      },
    ]);
  }
}
```

### 3. Configuration Manager

```typescript
// src/modules/payment-app-configuration/config-manager.ts
import { Client } from "urql";
import { MetadataManager } from "./metadata-manager";
import { PaymentAppConfigSchema, PaymentAppConfig, PaymentAppConfigEntry } from "./input-schemas";

export class PaymentAppConfigManager {
  private metadataManager: MetadataManager;

  constructor(client: Client, appId: string) {
    this.metadataManager = new MetadataManager(client, appId);
  }

  async getConfig(): Promise<PaymentAppConfig> {
    const configString = await this.metadataManager.getConfig();

    if (!configString) {
      return { configurations: [] };
    }

    try {
      const rawConfig = JSON.parse(configString);
      return PaymentAppConfigSchema.parse(rawConfig);
    } catch (error) {
      console.error("Invalid config in metadata:", error);
      return { configurations: [] };
    }
  }

  async setConfig(config: PaymentAppConfig): Promise<void> {
    const validated = PaymentAppConfigSchema.parse(config);
    const configString = JSON.stringify(validated);
    await this.metadataManager.setConfig(configString);
  }

  async getConfigurationById(
    configId: string
  ): Promise<PaymentAppConfigEntry | undefined> {
    const config = await this.getConfig();
    return config.configurations.find((c) => c.configurationId === configId);
  }

  async addConfiguration(entry: PaymentAppConfigEntry): Promise<void> {
    const config = await this.getConfig();
    config.configurations.push(entry);
    await this.setConfig(config);
  }

  async updateConfiguration(
    configId: string,
    entry: Partial<PaymentAppConfigEntry>
  ): Promise<void> {
    const config = await this.getConfig();
    const index = config.configurations.findIndex(
      (c) => c.configurationId === configId
    );

    if (index === -1) {
      throw new Error("Configuration not found");
    }

    config.configurations[index] = {
      ...config.configurations[index],
      ...entry,
    };

    await this.setConfig(config);
  }

  async deleteConfiguration(configId: string): Promise<void> {
    const config = await this.getConfig();
    config.configurations = config.configurations.filter(
      (c) => c.configurationId !== configId
    );
    await this.setConfig(config);
  }
}
```

### 4. Payment Provider Client

```typescript
// src/modules/payment-provider/payment-client.ts
import crypto from "crypto";
import { PaymentAppConfigEntry } from "../payment-app-configuration/input-schemas";

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  notifyUrl: string;
  orderInfo: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  errorMessage?: string;
}

export class PaymentProviderClient {
  private config: PaymentAppConfigEntry;

  constructor(config: PaymentAppConfigEntry) {
    this.config = config;
  }

  private getApiUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://sandbox.payment-provider.com/api"
      : "https://payment-provider.com/api";
  }

  private generateSignature(data: Record<string, any>): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    
    // Create signature string
    const signatureString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join("&");
    
    // Generate HMAC signature
    return crypto
      .createHmac("sha256", this.config.secretKey)
      .update(signatureString)
      .digest("hex");
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const requestData = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      returnUrl: params.returnUrl,
      notifyUrl: params.notifyUrl,
      orderInfo: params.orderInfo,
      requestId: `${Date.now()}`,
      requestType: "captureWallet",
    };

    const signature = this.generateSignature(requestData);

    try {
      const response = await fetch(`${this.getApiUrl()}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestData,
          signature,
        }),
      });

      const result = await response.json();

      if (result.resultCode === 0) {
        return {
          success: true,
          paymentUrl: result.payUrl,
          transactionId: result.transId,
        };
      }

      return {
        success: false,
        errorMessage: result.message,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test API with a dummy request
      const testData = {
        partnerCode: this.config.partnerCode,
        accessKey: this.config.accessKey,
        requestId: `test_${Date.now()}`,
      };

      const signature = this.generateSignature(testData);

      const response = await fetch(`${this.getApiUrl()}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...testData,
          signature,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: "Connection successful",
        };
      }

      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
```

### 5. Configuration API Endpoint

```typescript
// src/pages/api/configuration.ts
import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { PaymentAppConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { PaymentAppConfigEntrySchema } from "@/modules/payment-app-configuration/input-schemas";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    // Get auth context
    const authData = await saleorApp.apl.get(req.headers["saleor-api-url"] as string);
    
    if (!authData) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const configManager = new PaymentAppConfigManager(client, authData.appId);

    switch (method) {
      case "GET":
        const config = await configManager.getConfig();
        return res.status(200).json(config);

      case "POST":
        const newEntry = PaymentAppConfigEntrySchema.parse(req.body);
        await configManager.addConfiguration(newEntry);
        return res.status(201).json({ success: true });

      case "PUT":
        const { configurationId, ...updates } = req.body;
        await configManager.updateConfiguration(configurationId, updates);
        return res.status(200).json({ success: true });

      case "DELETE":
        const { id } = req.query;
        await configManager.deleteConfiguration(id as string);
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Configuration API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
```

### 6. Test Connection API

```typescript
// src/pages/api/test-connection.ts
import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { PaymentAppConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { PaymentProviderClient } from "@/modules/payment-provider/payment-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { configurationId } = req.body;

    if (!configurationId) {
      return res.status(400).json({ error: "Missing configurationId" });
    }

    // Get auth context
    const authData = await saleorApp.apl.get(req.headers["saleor-api-url"] as string);
    
    if (!authData) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const configManager = new PaymentAppConfigManager(client, authData.appId);
    const config = await configManager.getConfigurationById(configurationId);

    if (!config) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    // Test connection
    const paymentClient = new PaymentProviderClient(config);
    const result = await paymentClient.testConnection();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
```

### 7. Webhook Handler Example

```typescript
// src/pages/api/webhooks/transaction-initialize-session.ts
import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { TransactionInitializeSessionEventFragment } from "@/generated/graphql";
import { createClient } from "@/lib/create-graphql-client";
import { PaymentAppConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { PaymentProviderClient } from "@/modules/payment-provider/payment-client";

export const transactionInitializeSessionWebhook = new SaleorAsyncWebhook<TransactionInitializeSessionEventFragment>({
  name: "Transaction Initialize Session",
  webhookPath: "api/webhooks/transaction-initialize-session",
  event: "TRANSACTION_INITIALIZE_SESSION",
  apl: saleorApp.apl,
  query: `
    fragment TransactionInitializeSessionEventFragment on TransactionInitializeSession {
      action {
        amount
        currency
        actionType
      }
      sourceObject {
        __typename
        ... on Checkout {
          id
          totalPrice {
            gross {
              amount
              currency
            }
          }
        }
        ... on Order {
          id
          total {
            gross {
              amount
              currency
            }
          }
        }
      }
      data
      merchantReference
    }
  `,
});

export default transactionInitializeSessionWebhook.createHandler(async (req, res, context) => {
  const { payload, authData } = context;
  const { action, sourceObject, merchantReference } = payload;

  try {
    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    // Get configuration (you might want to get this from channel metadata)
    const configManager = new PaymentAppConfigManager(client, authData.appId);
    const config = await configManager.getConfig();

    if (config.configurations.length === 0) {
      return res.status(400).json({
        error: "No payment configuration found",
      });
    }

    // Use first configuration (or implement channel-based selection)
    const paymentConfig = config.configurations[0];
    const paymentClient = new PaymentProviderClient(paymentConfig);

    // Create payment
    const amount = action.amount;
    const currency = action.currency;
    const orderId = merchantReference || sourceObject.id;

    const paymentResult = await paymentClient.createPayment({
      orderId,
      amount,
      currency,
      returnUrl: paymentConfig.redirectUrl,
      notifyUrl: paymentConfig.ipnUrl,
      orderInfo: `Order ${orderId}`,
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        error: paymentResult.errorMessage,
      });
    }

    // Return payment URL to Saleor
    return res.status(200).json({
      pspReference: paymentResult.transactionId,
      data: {
        paymentUrl: paymentResult.paymentUrl,
      },
      result: "AUTHORIZATION_ACTION_REQUIRED",
      amount: action.amount,
      actions: [
        {
          type: "REDIRECT",
          url: paymentResult.paymentUrl,
        },
      ],
    });
  } catch (error) {
    console.error("Transaction initialize error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});
```

### 8. Configuration UI Component

```typescript
// src/pages/configuration.tsx
import { useState, useEffect } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Input, Select, Text } from "@saleor/macaw-ui";

interface ConfigEntry {
  configurationId: string;
  configurationName: string;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
  environment: "sandbox" | "production";
}

export default function ConfigurationPage() {
  const { appBridgeState } = useAppBridge();
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<ConfigEntry>>({
    environment: "sandbox",
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch("/api/configuration", {
        headers: {
          "saleor-api-url": appBridgeState?.domain || "",
        },
      });
      const data = await response.json();
      setConfigs(data.configurations || []);
    } catch (error) {
      console.error("Failed to load configs:", error);
    }
  };

  const handleSave = async () => {
    try {
      const configToSave = {
        ...newConfig,
        configurationId: newConfig.configurationId || `config_${Date.now()}`,
      };

      await fetch("/api/configuration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "saleor-api-url": appBridgeState?.domain || "",
        },
        body: JSON.stringify(configToSave),
      });

      await loadConfigs();
      setShowForm(false);
      setNewConfig({ environment: "sandbox" });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleTestConnection = async (configId: string) => {
    setTestingConfig(configId);
    
    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "saleor-api-url": appBridgeState?.domain || "",
        },
        body: JSON.stringify({ configurationId: configId }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert("✅ Connection successful!");
      } else {
        alert(`❌ Connection failed: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Test failed: ${error}`);
    } finally {
      setTestingConfig(null);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      await fetch(`/api/configuration?id=${configId}`, {
        method: "DELETE",
        headers: {
          "saleor-api-url": appBridgeState?.domain || "",
        },
      });

      await loadConfigs();
    } catch (error) {
      console.error("Failed to delete config:", error);
    }
  };

  return (
    <Box padding={8}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Text variant="heading">Payment Configuration</Text>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Configuration"}
        </Button>
      </Box>

      {showForm && (
        <Box
          padding={4}
          marginBottom={4}
          __backgroundColor="surfaceNeutralSubdued"
          borderRadius={4}
        >
          <Text variant="bodyStrong" marginBottom={2}>New Configuration</Text>
          
          <Input
            label="Configuration Name"
            value={newConfig.configurationName || ""}
            onChange={(e) => setNewConfig({ ...newConfig, configurationName: e.target.value })}
            marginBottom={2}
          />

          <Input
            label="Partner Code"
            value={newConfig.partnerCode || ""}
            onChange={(e) => setNewConfig({ ...newConfig, partnerCode: e.target.value })}
            marginBottom={2}
          />

          <Input
            label="Access Key"
            value={newConfig.accessKey || ""}
            onChange={(e) => setNewConfig({ ...newConfig, accessKey: e.target.value })}
            marginBottom={2}
          />

          <Input
            label="Secret Key"
            type="password"
            value={newConfig.secretKey || ""}
            onChange={(e) => setNewConfig({ ...newConfig, secretKey: e.target.value })}
            marginBottom={2}
          />

          <Input
            label="Redirect URL"
            value={newConfig.redirectUrl || ""}
            onChange={(e) => setNewConfig({ ...newConfig, redirectUrl: e.target.value })}
            marginBottom={2}
          />

          <Input
            label="IPN URL"
            value={newConfig.ipnUrl || ""}
            onChange={(e) => setNewConfig({ ...newConfig, ipnUrl: e.target.value })}
            marginBottom={2}
          />

          <Select
            label="Environment"
            value={newConfig.environment}
            onChange={(e) => setNewConfig({ ...newConfig, environment: e.target.value as any })}
            marginBottom={4}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </Select>

          <Button onClick={handleSave}>Save Configuration</Button>
        </Box>
      )}

      {configs.length === 0 ? (
        <Box padding={4} __backgroundColor="surfaceNeutralSubdued" borderRadius={4}>
          <Text>No configurations found. Click "Add Configuration" to create one.</Text>
        </Box>
      ) : (
        <Box>
          {configs.map((config) => (
            <Box
              key={config.configurationId}
              padding={4}
              marginBottom={2}
              __backgroundColor="surfaceNeutralSubdued"
              borderRadius={4}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Text variant="bodyStrong">{config.configurationName}</Text>
                  <Text variant="caption">
                    Partner Code: {config.partnerCode} | Environment: {config.environment}
                  </Text>
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="secondary"
                    onClick={() => handleTestConnection(config.configurationId)}
                    disabled={testingConfig === config.configurationId}
                  >
                    {testingConfig === config.configurationId ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    variant="tertiary"
                    onClick={() => handleDelete(config.configurationId)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
```

## GraphQL Documents

### Query: Get App Metadata

```graphql
# graphql/queries/GetAppMetadata.graphql
query GetAppMetadata($id: ID!) {
  app(id: $id) {
    id
    privateMetadata {
      key
      value
    }
  }
}
```

### Mutation: Update Private Metadata

```graphql
# graphql/mutations/UpdatePrivateMetadata.graphql
mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
  updatePrivateMetadata(id: $id, input: $input) {
    item {
      privateMetadata {
        key
        value
      }
    }
    errors {
      field
      message
    }
  }
}
```

## Package Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@saleor/app-sdk": "^0.50.0",
    "@saleor/macaw-ui": "^1.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "urql": "^4.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "@graphql-codegen/typescript-operations": "^4.0.0",
    "@graphql-codegen/typescript-urql": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Key Differences from VNPay Implementation

1. **Metadata Storage**: Uses Saleor's metadata API instead of localStorage
2. **Validation**: Uses Zod schemas for type-safe validation
3. **Architecture**: Follows module-based structure with clear separation of concerns
4. **GraphQL**: Uses urql client for Saleor API interactions
5. **Test Connection**: Built-in endpoint for testing provider connectivity
6. **Type Safety**: Full TypeScript support with generated types

## Next Steps

1. Generate GraphQL types: `pnpm run generate`
2. Update manifest to include configuration page extension
3. Implement remaining webhook handlers
4. Add channel-based configuration selection
5. Add error handling and logging
6. Deploy and test with Saleor instance
