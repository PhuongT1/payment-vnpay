/**
 * API endpoint to manage VNPay configurations
 * GET - Get all configurations
 * POST - Create new configuration
 * PUT - Update configuration
 * DELETE - Delete configuration
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";

interface VNPayConfig {
  id: string;
  name: string;
  tmnCode: string;
  hashSecret: string;
  environment: "sandbox" | "production";
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// In a production app, this would be stored in a database
// For now, we'll use APL metadata or a simple in-memory store
const configsMap = new Map<string, VNPayConfig[]>();

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

    const configKey = saleorApiUrl;

    switch (req.method) {
      case "GET":
        return handleGet(configKey, res);
      
      case "POST":
        return handlePost(configKey, req, res);
      
      case "PUT":
        return handlePut(configKey, req, res);
      
      case "DELETE":
        return handleDelete(configKey, req, res);
      
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

function handleGet(configKey: string, res: NextApiResponse) {
  const configs = configsMap.get(configKey) || [];
  
  // Return configs without hashSecret for security
  const safeConfigs = configs.map(({ hashSecret, ...rest }) => rest);
  
  return res.status(200).json({
    success: true,
    configs: safeConfigs,
  });
}

function handlePost(configKey: string, req: NextApiRequest, res: NextApiResponse) {
  const { name, tmnCode, hashSecret, environment } = req.body;
  
  if (!name || !tmnCode || !hashSecret || !environment) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const configs = configsMap.get(configKey) || [];
  
  const newConfig: VNPayConfig = {
    id: `config_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    tmnCode,
    hashSecret,
    environment,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  configs.push(newConfig);
  configsMap.set(configKey, configs);

  // Return config without hashSecret
  const { hashSecret: _, ...safeConfig } = newConfig;

  return res.status(201).json({
    success: true,
    config: safeConfig,
  });
}

function handlePut(configKey: string, req: NextApiRequest, res: NextApiResponse) {
  const { id, name, tmnCode, hashSecret, environment, isActive } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "Missing config ID" });
  }

  const configs = configsMap.get(configKey) || [];
  const index = configs.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Configuration not found" });
  }

  const existingConfig = configs[index];
  const updatedConfig: VNPayConfig = {
    ...existingConfig,
    name: name ?? existingConfig.name,
    tmnCode: tmnCode ?? existingConfig.tmnCode,
    hashSecret: hashSecret ?? existingConfig.hashSecret,
    environment: environment ?? existingConfig.environment,
    isActive: isActive ?? existingConfig.isActive,
    updatedAt: new Date().toISOString(),
  };

  configs[index] = updatedConfig;
  configsMap.set(configKey, configs);

  // Return config without hashSecret
  const { hashSecret: _, ...safeConfig } = updatedConfig;

  return res.status(200).json({
    success: true,
    config: safeConfig,
  });
}

function handleDelete(configKey: string, req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing config ID" });
  }

  const configs = configsMap.get(configKey) || [];
  const filtered = configs.filter((c) => c.id !== id);
  
  if (filtered.length === configs.length) {
    return res.status(404).json({ error: "Configuration not found" });
  }

  configsMap.set(configKey, filtered);

  return res.status(200).json({
    success: true,
    message: "Configuration deleted",
  });
}

// Helper function to get configuration by ID (for use in payment webhooks)
export function getVNPayConfigById(saleorApiUrl: string, configId: string): VNPayConfig | null {
  const configs = configsMap.get(saleorApiUrl) || [];
  return configs.find((c) => c.id === configId) || null;
}

// Helper function to get configuration for channel (for use in payment webhooks)
export function getVNPayConfigForChannel(
  saleorApiUrl: string, 
  channelId: string,
  channelMappings: Map<string, string>
): VNPayConfig | null {
  const configId = channelMappings.get(channelId);
  if (!configId) return null;
  return getVNPayConfigById(saleorApiUrl, configId);
}
