/**
 * Improved Transaction Initialize Session Webhook
 * Uses the new configuration management system
 * Follows Saleor Stripe app architecture
 * 
 * CRITICAL: VNPay return URL must point to STOREFRONT, not payment app!
 */

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";
import {
  TransactionInitializeSessionDocument,
  TransactionInitializeSessionPayloadFragment,
} from "@/generated/graphql";
import { buildVNPayReturnUrl, validateStorefrontUrl } from "@/lib/vnpay/storefront-url-detector";
import { getVNPayReturnUrl, VNPAY_IPN_WEBHOOK_URL } from "@/lib/env-config";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const transactionInitializeSessionWebhook =
  new SaleorSyncWebhook<TransactionInitializeSessionPayloadFragment>({
    name: "VNPay Transaction Initialize Session",
    webhookPath: "api/webhooks/vnpay-transaction-initialize-session",
    event: "TRANSACTION_INITIALIZE_SESSION",
    apl: saleorApp.apl,
    query: TransactionInitializeSessionDocument,
  });

export default transactionInitializeSessionWebhook.createHandler(
  async (req, res, context) => {
    const { payload, authData } = context;
    const { action, sourceObject, merchantReference } = payload;

    console.log("Transaction Initialize Session webhook triggered");

    const logCheckoutId = (payload.sourceObject as any)?.id ?? "unknown";
    const logChannelId = payload.sourceObject?.channel?.id ?? "unknown";
    const logAmount = payload.action?.amount;
    const logCurrency = payload.action?.currency;

    console.log(`📥 [Payment Init] checkoutId=${logCheckoutId} channel=${logChannelId} amount=${logAmount} ${logCurrency}`);

    try {
      // Create GraphQL client
      const client = createClient(authData.saleorApiUrl, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      // Get configuration from metadata (same key as UI uses)
      const METADATA_KEY = "vnpay:configs";
      const MAPPING_KEY = "vnpay:channel_mappings";
      
      // Fetch configs from metadata
      const GET_METADATA = `
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

      const { data: metadataData } = await client
        .query(GET_METADATA, { id: authData.appId })
        .toPromise();

      const metadata = metadataData?.app?.privateMetadata || [];
      const configMetadata = metadata.find((m: any) => m.key === METADATA_KEY);
      const mappingMetadata = metadata.find((m: any) => m.key === MAPPING_KEY);

      console.log("📦 Metadata found:", {
        hasConfigMetadata: !!configMetadata,
        hasMappingMetadata: !!mappingMetadata,
        configValue: configMetadata?.value ? "exists" : "missing",
      });

      if (!configMetadata?.value) {
        console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} — No VNPay configuration found in metadata`);
        return res.status(400).json({
          error: {
            code: "CONFIGURATION_NOT_FOUND",
            message: "No VNPay configuration found. Please configure VNPay in the app settings.",
          },
        });
      }

      // Parse configs
      const allConfigs = JSON.parse(configMetadata.value);
      console.log("📝 All configs loaded:", {
        count: allConfigs.length,
        configs: allConfigs.map((c: any) => ({
          id: c.id,
          name: c.name,
          isActive: c.isActive,
        })),
      });
      
      // Get channel mapping to find correct config
      let configId: string | null = null;
      if (mappingMetadata?.value) {
        const mappings = JSON.parse(mappingMetadata.value);
        configId = mappings[sourceObject.channel.id];
        console.log("🗺️ Channel mapping:", {
          channelId: sourceObject.channel.id,
          mappedConfigId: configId,
        });
      }

      // Find config by mapping or use first active config
      let config = configId 
        ? allConfigs.find((c: any) => c.id === configId && c.isActive)
        : allConfigs.find((c: any) => c.isActive);

      console.log("✅ Selected config:", config ? {
        id: config.id,
        name: config.name,
        isActive: config.isActive,
      } : "NOT FOUND");

      if (!config) {
        // Fallback to environment variables for development
        console.log("⚙️ No config in metadata, checking environment variables...");
        
        const envTmnCode = process.env.VNPAY_TMN_CODE;
        const envHashSecret = process.env.VNPAY_HASH_SECRET;
        const envEnvironment = process.env.VNPAY_ENVIRONMENT || "sandbox";
        
        if (envTmnCode && envHashSecret) {
          console.log("✅ Using config from environment variables");
          config = {
            id: "env_default",
            name: "Environment Config",
            tmnCode: envTmnCode,
            hashSecret: envHashSecret,
            environment: envEnvironment as "sandbox" | "production",
            isActive: true,
          };
        } else {
          console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} — No active VNPay config in metadata or env`);
          return res.status(400).json({
            error: {
              code: "CONFIGURATION_NOT_FOUND",
              message: "No active VNPay configuration found. Please activate a configuration in the app settings.",
            },
          });
        }
      }

      console.log(`Using configuration: ${config.name}`);

      // Build return URL: priority = config.returnUrl > auto-detect from headers
      const checkoutId = sourceObject.__typename === 'Checkout' ? sourceObject.id : undefined;
      let storefrontReturnUrl: string;

      if (config.returnUrl && config.returnUrl.trim() !== '') {
        // Use URL from config (set by user in dashboard UI)
        storefrontReturnUrl = config.returnUrl.trim();
        console.log('🔧 Using returnUrl from config:', storefrontReturnUrl);
      } else {
        // Fallback: auto-detect from request headers
        storefrontReturnUrl = buildVNPayReturnUrl(req, checkoutId);
        console.log('🔍 Auto-detected returnUrl from request:', storefrontReturnUrl);
      }

      // Validate URL to prevent common mistake
      if (!validateStorefrontUrl(storefrontReturnUrl)) {
        console.error('❌ Invalid storefront URL detected!');
        return res.status(500).json({
          error: {
            code: 'INVALID_STOREFRONT_URL',
            message: 'Storefront URL configuration error. Set returnUrl in VNPay config or NEXT_PUBLIC_STOREFRONT_URL in .env',
          },
        });
      }

      // IPN URL: priority = config.ipnUrl > env variable
      const ipnUrl = (config.ipnUrl && config.ipnUrl.trim() !== '') 
        ? config.ipnUrl.trim() 
        : VNPAY_IPN_WEBHOOK_URL;
      console.log('📡 IPN URL:', ipnUrl);

      // Map UI config format to VNPayProviderClient format
      const providerConfig = {
        configurationId: config.id,
        configurationName: config.name,
        partnerCode: config.tmnCode,
        secretKey: config.hashSecret,
        environment: config.environment,
        channelId: sourceObject.channel.id,
        // Return URL from config or auto-detected
        redirectUrl: storefrontReturnUrl,
        // IPN URL from config or env
        ipnUrl: ipnUrl,
      };
      
      console.log('🔧 VNPay configuration:', {
        returnUrl: providerConfig.redirectUrl,
        ipnUrl: providerConfig.ipnUrl,
        environment: config.environment,
        returnUrlSource: (config.returnUrl && config.returnUrl.trim() !== '') ? 'config' : 'auto-detect',
      });

      // Initialize payment provider
      const providerClient = new VNPayProviderClient(providerConfig as any);

      // Get payment details
      const originalAmount = action.amount;
      const originalCurrency = action.currency;
      const orderId = merchantReference || sourceObject.id;
      const ipAddress = req.headers["x-forwarded-for"] as string || "127.0.0.1";

      console.log("💰 Original payment amount:", {
        amount: originalAmount,
        currency: originalCurrency,
        orderId,
      });

      // CRITICAL: VNPay only accepts VND
      // Convert foreign currency to VND using exchange rate
      let amountInVND = originalAmount;

      if (originalCurrency !== "VND") {
        // Get exchange rate from environment or use default
        const exchangeRates: Record<string, number> = {
          USD: parseFloat(process.env.EXCHANGE_RATE_USD_TO_VND || "25000"), // 1 USD = 25,000 VND
          EUR: parseFloat(process.env.EXCHANGE_RATE_EUR_TO_VND || "27000"), // 1 EUR = 27,000 VND
          // Add more currencies as needed
        };

        const rate = exchangeRates[originalCurrency];

        if (!rate) {
          console.error(`❌ Unsupported currency: ${originalCurrency}`);
          return res.status(400).json({
            error: {
              code: "UNSUPPORTED_CURRENCY",
              message: `VNPay only supports VND. Currency ${originalCurrency} is not supported or exchange rate not configured.`,
            },
          });
        }

        amountInVND = Math.round(originalAmount * rate);

        console.log("💱 Currency conversion:", {
          from: `${originalAmount} ${originalCurrency}`,
          to: `${amountInVND} VND`,
          rate,
          calculation: `${originalAmount} × ${rate} = ${amountInVND}`,
        });
      }

      // Validate amount
      if (amountInVND < 5000) {
        console.error("❌ Amount too small for VNPay (minimum: 5,000 VND)");
        return res.status(400).json({
          error: {
            code: "AMOUNT_TOO_SMALL",
            message: "Minimum payment amount is 5,000 VND",
          },
        });
      }

      if (amountInVND > 1000000000) {
        console.error("❌ Amount too large for VNPay (maximum: 1,000,000,000 VND)");
        return res.status(400).json({
          error: {
            code: "AMOUNT_TOO_LARGE",
            message: "Maximum payment amount is 1,000,000,000 VND",
          },
        });
      }

      // Create payment with converted VND amount
      const paymentResult = await providerClient.createPayment({
        orderId,
        amount: amountInVND,
        currency: "VND",
        orderInfo: `Order ${orderId} - ${originalAmount} ${originalCurrency} (${amountInVND} VND)`,
        ipAddress,
      });

      if (!paymentResult.success) {
        console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} amount=${amountInVND}VND — Payment creation failed: ${paymentResult.errorMessage}`);
        return res.status(400).json({
          error: {
            code: "PAYMENT_CREATION_FAILED",
            message: paymentResult.errorMessage || "Failed to create payment",
          },
        });
      }

      console.log(`✅ [Payment Init] checkoutId=${logCheckoutId} — txRef=${paymentResult.transactionRef} original=${logAmount}${logCurrency} vnpay=${amountInVND}VND`);

      // Return success response with payment URL
      // NOTE: Return original amount to Saleor (it tracks in original currency)
      // But VNPay payment URL already has converted VND amount
      return res.status(200).json({
        pspReference: paymentResult.transactionRef,
        data: {
          paymentUrl: paymentResult.paymentUrl,
          configurationId: config.configurationId,
          // Include conversion info for debugging
          currencyConversion: originalCurrency !== "VND" ? {
            originalAmount,
            originalCurrency,
            convertedAmount: amountInVND,
            convertedCurrency: "VND",
          } : undefined,
        },
        result: "AUTHORIZATION_ACTION_REQUIRED",
        amount: action.amount, // Keep original amount for Saleor tracking
        actions: [
          {
            actionType: "REDIRECT",
            url: paymentResult.paymentUrl,
          },
        ],
      });
    } catch (error) {
      console.error("Transaction initialize error:", error);
      
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      });
    }
  }
);
