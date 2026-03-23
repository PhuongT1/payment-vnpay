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
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_config_${Date.now()}`,
          message: "No VNPay configuration found. Please configure VNPay in the app settings.",
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
        console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} — No active VNPay config in metadata`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_active_config_${Date.now()}`,
          message: "No active VNPay configuration found for this channel. Please assign and activate a configuration in app settings.",
        });
      }

      console.log(`Using configuration: ${config.name}`);

      // Return URL must always come from user configuration
      const storefrontReturnUrl = (config.returnUrl || "").trim();

      if (!storefrontReturnUrl) {
        console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} — Missing returnUrl in selected configuration`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_return_url_${Date.now()}`,
          message: "Selected VNPay configuration is missing returnUrl. Please update the configuration.",
        });
      }

      // IPN URL must always come from user configuration
      const ipnUrl = (config.ipnUrl || "").trim();

      if (!ipnUrl) {
        console.error(`❌ [Payment Init] checkoutId=${logCheckoutId} — Missing ipnUrl in selected configuration`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_ipn_url_${Date.now()}`,
          message: "Selected VNPay configuration is missing ipnUrl. Please update the configuration.",
        });
      }

      console.log('📡 IPN URL:', ipnUrl);

      // Map UI config format to VNPayProviderClient format
      const providerConfig = {
        configurationId: config.id,
        configurationName: config.name,
        partnerCode: config.tmnCode,
        secretKey: config.hashSecret,
        environment: config.environment,
        channelId: sourceObject.channel.id,
        // Return URL from selected user configuration
        redirectUrl: storefrontReturnUrl,
        // IPN URL from selected user configuration
        ipnUrl: ipnUrl,
      };
      
      console.log('🔧 VNPay configuration:', {
        returnUrl: providerConfig.redirectUrl,
        ipnUrl: providerConfig.ipnUrl,
        environment: config.environment,
        returnUrlSource: 'config',
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
          return res.status(200).json({
            result: "CHARGE_FAILURE",
            amount: action.amount,
            pspReference: `err_unsupported_currency_${Date.now()}`,
            message: `VNPay only supports VND. Currency ${originalCurrency} is not supported.`,
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
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_amount_too_small_${Date.now()}`,
          message: "Minimum payment amount is 5,000 VND.",
        });
      }

      if (amountInVND > 1000000000) {
        console.error("❌ Amount too large for VNPay (maximum: 1,000,000,000 VND)");
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_amount_too_large_${Date.now()}`,
          message: "Maximum payment amount is 1,000,000,000 VND.",
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
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_payment_failed_${Date.now()}`,
          message: paymentResult.errorMessage || "Failed to create VNPay payment.",
        });
      }

      console.log(`✅ [Payment Init] checkoutId=${logCheckoutId} — txRef=${paymentResult.transactionRef} original=${logAmount}${logCurrency} vnpay=${amountInVND}VND`);

      // Return CHARGE_ACTION_REQUIRED so Saleor knows user must complete payment
      // The storefront will open paymentUrl, user pays, then calls transactionProcess
      return res.status(200).json({
        pspReference: paymentResult.transactionRef,
        data: {
          paymentUrl: paymentResult.paymentUrl,
          // Include conversion info for debugging
          currencyConversion: originalCurrency !== "VND" ? {
            originalAmount,
            originalCurrency,
            convertedAmount: amountInVND,
            convertedCurrency: "VND",
          } : undefined,
        },
        result: "CHARGE_ACTION_REQUIRED",
        amount: action.amount, // Original amount for Saleor tracking
      });
    } catch (error) {
      console.error("Transaction initialize error:", error);
      return res.status(200).json({
        result: "CHARGE_FAILURE",
        amount: (context.payload as any)?.action?.amount ?? 0,
        pspReference: `err_exception_${Date.now()}`,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);
