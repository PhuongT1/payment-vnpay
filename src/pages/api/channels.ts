/**
 * API endpoint to fetch Saleor channels
 * Uses Saleor GraphQL API to get all available channels
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";

const GET_CHANNELS_QUERY = `
  query GetChannels {
    channels {
      id
      name
      slug
      isActive
      currencyCode
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get Saleor API URL from headers
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;
    
    if (!saleorApiUrl) {
      return res.status(400).json({ error: "Missing Saleor API URL" });
    }

    // Get auth data
    const authData = await saleorApp.apl.get(saleorApiUrl);
    
    if (!authData) {
      return res.status(401).json({ error: "App not registered" });
    }

    // Query Saleor GraphQL API
    const response = await fetch(saleorApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization-Bearer": authData.token,
      },
      body: JSON.stringify({
        query: GET_CHANNELS_QUERY,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return res.status(500).json({ error: "Failed to fetch channels", details: result.errors });
    }

    return res.status(200).json({
      success: true,
      channels: result.data.channels,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
