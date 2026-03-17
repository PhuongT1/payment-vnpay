/**
 * Configuration API Endpoint
 * Follows Saleor app pattern for configuration management
 * 
 * GET - Get all configurations
 * POST - Create new configuration
 * PUT - Update existing configuration
 * DELETE - Delete configuration
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { VNPayConfigEntryInputSchema } from "@/modules/payment-app-configuration/input-schemas";

const SALEOR_API_URL_HEADER = "saleor-api-url";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    // Get Saleor API URL from header
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;

    if (!saleorApiUrl) {
      return res.status(400).json({ 
        success: false,
        error: "Missing Saleor API URL header" 
      });
    }

    // Get auth data
    const authData = await saleorApp.apl.get(saleorApiUrl);

    if (!authData) {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized - App not registered" 
      });
    }

    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    // Initialize config manager
    const configManager = new VNPayConfigManager(client, authData.appId);

    switch (method) {
      case "GET": {
        const config = await configManager.getConfig();
        return res.status(200).json({
          success: true,
          configurations: config.configurations,
        });
      }

      case "POST": {
        // Validate input
        const validated = VNPayConfigEntryInputSchema.parse(req.body);
        
        // Add configuration
        const newConfig = await configManager.addConfiguration(validated);
        
        return res.status(201).json({
          success: true,
          configuration: newConfig,
        });
      }

      case "PUT": {
        const { configurationId, ...updates } = req.body;

        if (!configurationId) {
          return res.status(400).json({
            success: false,
            error: "Configuration ID is required",
          });
        }

        // Validate updates
        const validated = VNPayConfigEntryInputSchema.partial().parse(updates);

        // Update configuration
        const updated = await configManager.updateConfiguration(
          configurationId,
          validated
        );

        return res.status(200).json({
          success: true,
          configuration: updated,
        });
      }

      case "DELETE": {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res.status(400).json({
            success: false,
            error: "Configuration ID is required",
          });
        }

        await configManager.deleteConfiguration(id);

        return res.status(200).json({
          success: true,
          message: "Configuration deleted successfully",
        });
      }

      default:
        return res.status(405).json({
          success: false,
          error: "Method not allowed",
        });
    }
  } catch (error) {
    console.error("Configuration API error:", error);

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
