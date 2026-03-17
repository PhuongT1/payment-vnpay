/**
 * API endpoint to manage channel-to-configuration mappings
 * GET - Get all mappings
 * POST - Create or update mapping
 * DELETE - Delete mapping
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";

interface ChannelMapping {
  channelId: string;
  channelName: string;
  configId: string;
  configName: string;
}

// In a production app, this would be stored in a database
const mappingsMap = new Map<string, Map<string, string>>();

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

    const mappingKey = saleorApiUrl;

    switch (req.method) {
      case "GET":
        return handleGet(mappingKey, res);
      
      case "POST":
        return handlePost(mappingKey, req, res);
      
      case "DELETE":
        return handleDelete(mappingKey, req, res);
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in mappings API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function handleGet(mappingKey: string, res: NextApiResponse) {
  const mappings = mappingsMap.get(mappingKey) || new Map();
  
  const mappingsArray = Array.from(mappings.entries()).map(([channelId, configId]) => ({
    channelId,
    configId,
  }));
  
  return res.status(200).json({
    success: true,
    mappings: mappingsArray,
  });
}

function handlePost(mappingKey: string, req: NextApiRequest, res: NextApiResponse) {
  const { channelId, configId } = req.body;
  
  if (!channelId) {
    return res.status(400).json({ error: "Missing channelId" });
  }

  const mappings = mappingsMap.get(mappingKey) || new Map();
  
  if (configId) {
    // Set or update mapping
    mappings.set(channelId, configId);
  } else {
    // Delete mapping if configId is empty/null
    mappings.delete(channelId);
  }
  
  mappingsMap.set(mappingKey, mappings);

  return res.status(200).json({
    success: true,
    message: configId ? "Mapping updated" : "Mapping removed",
  });
}

function handleDelete(mappingKey: string, req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.query;
  
  if (!channelId || typeof channelId !== "string") {
    return res.status(400).json({ error: "Missing channelId" });
  }

  const mappings = mappingsMap.get(mappingKey) || new Map();
  
  if (!mappings.has(channelId)) {
    return res.status(404).json({ error: "Mapping not found" });
  }

  mappings.delete(channelId);
  mappingsMap.set(mappingKey, mappings);

  return res.status(200).json({
    success: true,
    message: "Mapping deleted",
  });
}

// Helper function to get config ID for a channel (for use in payment webhooks)
export function getConfigIdForChannel(saleorApiUrl: string, channelId: string): string | null {
  const mappings = mappingsMap.get(saleorApiUrl) || new Map();
  return mappings.get(channelId) || null;
}

// Helper function to get all mappings (for use in payment webhooks)
export function getAllMappings(saleorApiUrl: string): Map<string, string> {
  return mappingsMap.get(saleorApiUrl) || new Map();
}
