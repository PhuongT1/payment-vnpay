/**
 * API endpoint to manage channel-to-configuration mappings
 * Stores data in Saleor App Private Metadata for persistence
 * 
 * GET - Get all mappings
 * POST - Create or update mapping (auto-save on change)
 * DELETE - Delete mapping
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";

const SALEOR_API_URL_HEADER = "saleor-api-url";
const METADATA_KEY = "vnpay:channel_mappings";

interface ChannelMapping {
  channelId: string;
  configId: string | null;
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

    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    switch (req.method) {
      case "GET":
        return await handleGet(client, res);
      
      case "POST":
        return await handlePost(client, req, res);
      
      case "DELETE":
        return await handleDelete(client, req, res);
      
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

async function getMappingsFromMetadata(client: any): Promise<Record<string, string>> {
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
    return {};
  }

  try {
    return JSON.parse(metadataItem.value);
  } catch (e) {
    console.error("Failed to parse mappings metadata:", e);
    return {};
  }
}

async function saveMappingsToMetadata(client: any, mappings: Record<string, string>): Promise<void> {
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
        value: JSON.stringify(mappings),
      },
    ],
  }).toPromise();

  if (result.error || result.data?.updatePrivateMetadata?.errors?.length) {
    throw new Error("Failed to save mappings to metadata");
  }
}

async function handleGet(client: any, res: NextApiResponse) {
  const mappings = await getMappingsFromMetadata(client);
  
  const mappingsArray = Object.entries(mappings).map(([channelId, configId]) => ({
    channelId,
    configId,
  }));
  
  return res.status(200).json({
    success: true,
    mappings: mappingsArray,
  });
}

async function handlePost(client: any, req: NextApiRequest, res: NextApiResponse) {
  const { channelId, configId } = req.body;
  
  if (!channelId) {
    return res.status(400).json({ error: "Missing channelId" });
  }

  const mappings = await getMappingsFromMetadata(client);
  
  if (configId) {
    // Set or update mapping
    mappings[channelId] = configId;
  } else {
    // Delete mapping if configId is empty/null
    delete mappings[channelId];
  }
  
  await saveMappingsToMetadata(client, mappings);

  return res.status(200).json({
    success: true,
    message: configId ? "Mapping saved" : "Mapping removed",
  });
}

async function handleDelete(client: any, req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.query;
  
  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: "Missing channelId" });
  }

  const mappings = await getMappingsFromMetadata(client);
  delete mappings[channelId];
  
  await saveMappingsToMetadata(client, mappings);
  
  return res.status(200).json({
    success: true,
    message: "Mapping deleted",
  });
}
