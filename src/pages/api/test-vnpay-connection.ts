/**
 * Test Connection API Endpoint
 * Tests VNPay credentials and connectivity
 * Following Saleor app pattern
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";
import { SALEOR_API_URL_HEADER } from "@saleor/app-sdk/const";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { configurationId } = req.body;

    if (!configurationId) {
      return res.status(400).json({
        success: false,
        error: "Configuration ID is required",
      });
    }

    // Get Saleor API URL
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;

    if (!saleorApiUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing Saleor API URL header",
      });
    }

    // Get auth data
    const authData = await saleorApp.apl.get(saleorApiUrl);

    if (!authData) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Create GraphQL client
    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    // Get configuration
    const configManager = new VNPayConfigManager(client, authData.appId);
    const config = await configManager.getConfigurationById(configurationId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found",
      });
    }

    // Test connection
    const providerClient = new VNPayProviderClient(config);
    const testResult = await providerClient.testConnection();

    return res.status(200).json({
      success: testResult.success,
      message: testResult.message,
      configuration: {
        name: config.configurationName,
        environment: config.environment,
        partnerCode: config.partnerCode,
      },
    });
  } catch (error) {
    console.error("Test connection error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
