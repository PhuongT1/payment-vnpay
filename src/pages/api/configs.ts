/**
 * API endpoint to manage VNPay configurations
 * Stores data in Saleor App Private Metadata for persistence
 * 
 * GET - Get all configurations
 * POST - Create new configuration
 * PUT - Update configuration
 * DELETE - Delete configuration
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";

const SALEOR_API_URL_HEADER = "saleor-api-url";
const METADATA_KEY = "vnpay:configs";

interface VNPayConfig {
  id: string;
  name: string;
  tmnCode: string;
  hashSecret?: string; // Only stored, never returned in GET
  returnUrl?: string;
  ipnUrl?: string;
  vnpVersion?: string;
  vnpBankCode?: string;
  vnpLocale?: string;
  environment: "sandbox" | "production";
  exchangeRates?: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;
    
    if (!saleorApiUrl) {
      return res.status(400).json({ error: "Missing Saleor API URL" });
    }

    const authData = await saleorApp.apl.get(saleorApiUrl);
    
    if (!authData) {
      return res.status(401).json({ error: "App not registered" });
    }

    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    switch (req.method) {
      case "GET":
        return await handleGet(client, req, res);
      
      case "POST":
        return await handlePost(client, req, res);
      
      case "PUT":
        return await handlePut(client, req, res);
      
      case "DELETE":
        return await handleDelete(client, req, res);
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in configs API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getConfigsFromMetadata(client: any): Promise<VNPayConfig[]> {
  const query = `
    query GetAppMetadata {
      app {
        id
        privateMetadata {
          key
          value
        }
      }
    }
  `;

  const result = await client.query(query, {}).toPromise();
  
  if (result.error) {
    throw new Error(`Failed to fetch metadata: ${result.error.message}`);
  }

  const metadataItem = result.data?.app?.privateMetadata?.find(
    (item: any) => item.key === METADATA_KEY
  );

  if (!metadataItem) {
    return [];
  }

  try {
    return JSON.parse(metadataItem.value);
  } catch (e) {
    console.error("Failed to parse configs metadata:", e);
    return [];
  }
}

async function saveConfigsToMetadata(client: any, configs: VNPayConfig[]): Promise<void> {
  const mutation = `
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
        }
      }
    }
  `;

  // Get app ID first
  const appQuery = `
    query GetApp {
      app {
        id
      }
    }
  `;

  const appResult = await client.query(appQuery, {}).toPromise();
  const appId = appResult.data?.app?.id;

  if (!appId) {
    throw new Error("Failed to get app ID");
  }

  const result = await client.mutation(mutation, {
    id: appId,
    input: [
      {
        key: METADATA_KEY,
        value: JSON.stringify(configs),
      },
    ],
  }).toPromise();

  if (result.error || result.data?.updatePrivateMetadata?.errors?.length) {
    throw new Error("Failed to save configs to metadata");
  }
}

async function handleGet(client: any, req: NextApiRequest, res: NextApiResponse) {
  const configs = await getConfigsFromMetadata(client);
  const { id } = req.query;
  
  // If requesting single config by ID (for editing)
  if (id && typeof id === 'string') {
    const config = configs.find(c => c.id === id);
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }
    // Return config WITH hashSecret for editing
    return res.status(200).json({
      success: true,
      config,
    });
  }
  
  // Return all configs WITHOUT hashSecret for security
  const safeConfigs = configs.map(({ hashSecret, ...rest }) => rest);
  
  return res.status(200).json({
    success: true,
    configs: safeConfigs,
  });
}

async function handlePost(client: any, req: NextApiRequest, res: NextApiResponse) {
  const { name, tmnCode, hashSecret, environment, returnUrl, ipnUrl, vnpVersion, vnpBankCode, vnpLocale, exchangeRates } = req.body;
  
  if (!name || !tmnCode || !hashSecret || !environment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const configs = await getConfigsFromMetadata(client);
  
  const newConfig: VNPayConfig = {
    id: `config_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    tmnCode,
    hashSecret,
    returnUrl: returnUrl || undefined,
    ipnUrl: ipnUrl || undefined,
    vnpVersion: vnpVersion || "2.1.0",
    vnpBankCode: vnpBankCode || undefined,
    vnpLocale: vnpLocale || "vn",
    environment,
    exchangeRates: exchangeRates || { USD: 25000, EUR: 27000 },
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  configs.push(newConfig);
  await saveConfigsToMetadata(client, configs);

  // Return without hashSecret
  const { hashSecret: _, ...safeConfig } = newConfig;
  
  return res.status(201).json({
    success: true,
    config: safeConfig,
  });
}

async function handlePut(client: any, req: NextApiRequest, res: NextApiResponse) {
  const { id, name, tmnCode, hashSecret, environment, isActive, returnUrl, ipnUrl, vnpVersion, vnpBankCode, vnpLocale, exchangeRates } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "Missing config ID" });
  }

  const configs = await getConfigsFromMetadata(client);
  const configIndex = configs.findIndex(c => c.id === id);
  
  if (configIndex === -1) {
    return res.status(404).json({ error: "Config not found" });
  }

  const updatedConfig: VNPayConfig = {
    ...configs[configIndex],
    ...(name && { name }),
    ...(tmnCode && { tmnCode }),
    ...(hashSecret && { hashSecret }),
    ...(environment && { environment }),
    ...(returnUrl !== undefined && { returnUrl: returnUrl || undefined }),
    ...(ipnUrl !== undefined && { ipnUrl: ipnUrl || undefined }),
    ...(vnpVersion && { vnpVersion }),
    ...(vnpBankCode !== undefined && { vnpBankCode: vnpBankCode || undefined }),
    ...(vnpLocale && { vnpLocale }),
    ...(exchangeRates !== undefined && { exchangeRates }),
    ...(typeof isActive === 'boolean' && { isActive }),
    updatedAt: new Date().toISOString(),
  };

  configs[configIndex] = updatedConfig;
  await saveConfigsToMetadata(client, configs);

  const { hashSecret: _, ...safeConfig } = updatedConfig;
  
  return res.status(200).json({
    success: true,
    config: safeConfig,
  });
}

async function handleDelete(client: any, req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "Missing config ID" });
  }

  const configs = await getConfigsFromMetadata(client);
  const filteredConfigs = configs.filter(c => c.id !== id);
  
  if (filteredConfigs.length === configs.length) {
    return res.status(404).json({ error: "Config not found" });
  }

  await saveConfigsToMetadata(client, filteredConfigs);
  
  return res.status(200).json({
    success: true,
    message: "Config deleted",
  });
}
