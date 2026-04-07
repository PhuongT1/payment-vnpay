/**
 * TRANSACTION_PROCESS_SESSION webhook
 *
 * Called after user returns from VNPay payment page.
 * Storefront sends all vnp_* params captured from VNPay return URL.
 * We verify the VNPay signature and return CHARGE_SUCCESS or CHARGE_FAILURE.
 *
 * Flow:
 * 1. User pays on VNPay → VNPay redirects to storefront Return URL with vnp_* params
 * 2. Storefront calls transactionProcess({ id: txId, data: { vnpParams } })
 * 3. Saleor triggers this webhook with payload.data = { vnpParams }
 * 4. We verify signature with the active VNPay config
 * 5. Return CHARGE_SUCCESS → Saleor creates the order
 */

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayAPI } from "@/lib/vnpay/vnpay-api";

export const config = {
  api: {
    bodyParser: false,
  },
};

const TRANSACTION_PROCESS_SUBSCRIPTION = `
  subscription TransactionProcessSession {
    event {
      ... on TransactionProcessSession {
        action {
          amount
          currency
          actionType
        }
        transaction {
          id
          pspReference
        }
        sourceObject {
          __typename
          ... on Checkout {
            id
            channel { id slug }
          }
          ... on Order {
            id
            channel { id slug }
          }
        }
        merchantReference
        data
      }
    }
  }
`;

export const transactionProcessSessionWebhook = new SaleorSyncWebhook<any>({
  name: "VNPay Transaction Process Session",
  webhookPath: "api/webhooks/transaction-process-session",
  event: "TRANSACTION_PROCESS_SESSION",
  apl: saleorApp.apl,
  query: TRANSACTION_PROCESS_SUBSCRIPTION,
});

export default transactionProcessSessionWebhook.createHandler(async (req, res, ctx) => {
  const { payload, authData } = ctx;

  const txId = payload.transaction?.id ?? "unknown";
  const pspRef = payload.transaction?.pspReference ?? "unknown";

  console.log(`📥 [Payment Process] txId=${txId} pspRef=${pspRef}`);

  try {
    // Extract vnp_* params that storefront sent in transactionProcess.data
    const vnpParams = payload.data?.vnpParams as Record<string, string> | undefined;

    // COD or non-VNPay — no vnpParams, keep as pending
    if (!vnpParams) {
      console.log(`✅ [COD Process] txId=${txId} — no vnpParams, keeping CHARGE_REQUEST (pay on delivery)`);
      return res.status(200).json({
        result: "CHARGE_REQUEST",
        amount: payload.action?.amount ?? 0,
        pspReference: pspRef,
      });
    }

    console.log(`🔍 [Payment Process] vnp_ResponseCode=${vnpParams.vnp_ResponseCode} vnp_TransactionStatus=${vnpParams.vnp_TransactionStatus}`);

    // Fetch active VNPay config from metadata (same as initialize session)
    const client = createClient(authData.saleorApiUrl, {
      headers: { Authorization: `Bearer ${authData.token}` },
    });

    const GET_METADATA = `
      query GetAppMetadata($id: ID!) {
        app(id: $id) {
          id
          privateMetadata { key value }
        }
      }
    `;

    const { data: metadataData } = await client
      .query(GET_METADATA, { id: authData.appId })
      .toPromise();

    const metadata = metadataData?.app?.privateMetadata || [];
    const configMetadata = metadata.find((m: any) => m.key === "vnpay:configs");
    const mappingMetadata = metadata.find((m: any) => m.key === "vnpay:channel_mappings");

    let activeConfig: any = null;

    if (configMetadata?.value) {
      const allConfigs = JSON.parse(configMetadata.value);
      const channelId = payload.sourceObject?.channel?.id;
      let configId: string | null = null;

      if (mappingMetadata?.value && channelId) {
        const mappings = JSON.parse(mappingMetadata.value);
        configId = mappings[channelId];
      }

      activeConfig = configId
        ? allConfigs.find((c: any) => c.id === configId && c.isActive)
        : allConfigs.find((c: any) => c.isActive);
    }

    if (!activeConfig) {
      console.error(`❌ [Payment Process] txId=${txId} — No active VNPay config found`);
      return res.status(200).json({
        result: "CHARGE_FAILURE",
        amount: payload.action?.amount ?? 0,
        pspReference: pspRef,
        message: "No active VNPay configuration",
      });
    }

    const paymentUrl =
      activeConfig.environment === "production"
        ? "https://payment.vnpay.vn/paymentv2/vpcpay.html"
        : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    const apiUrl =
      activeConfig.environment === "production"
        ? "https://payment.vnpay.vn/merchant_webapi/api/transaction"
        : "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    // Create VNPay API with active config to verify signature
    const vnpayAPI = new VNPayAPI({
      tmnCode: activeConfig.tmnCode,
      hashSecret: activeConfig.hashSecret,
      paymentUrl,
      apiUrl,
    });

    // Verify VNPay signature to prevent tampering
    const isValidSignature = vnpayAPI.verifyIPNSignature(vnpParams as any);

    if (!isValidSignature) {
      console.error(`❌ [Payment Process] txId=${txId} — Invalid VNPay signature!`);
      return res.status(200).json({
        result: "CHARGE_FAILURE",
        amount: payload.action?.amount ?? 0,
        pspReference: pspRef,
        message: "Invalid payment signature",
      });
    }

    // Check VNPay response code
    const isSuccess =
      vnpParams.vnp_ResponseCode === "00" &&
      (vnpParams.vnp_TransactionStatus === "00" || !vnpParams.vnp_TransactionStatus);

    if (isSuccess) {
      console.log(`✅ [Payment Process] txId=${txId} pspRef=${pspRef} — CHARGE_SUCCESS`);
      return res.status(200).json({
        result: "CHARGE_SUCCESS",
        amount: payload.action?.amount,
        pspReference: vnpParams.vnp_TransactionNo || pspRef,
      });
    } else {
      console.error(`❌ [Payment Process] txId=${txId} — CHARGE_FAILURE responseCode=${vnpParams.vnp_ResponseCode}`);
      return res.status(200).json({
        result: "CHARGE_FAILURE",
        amount: payload.action?.amount ?? 0,
        pspReference: pspRef,
        message: `VNPay error code: ${vnpParams.vnp_ResponseCode}`,
      });
    }
  } catch (error) {
    console.error(`❌ [Payment Process] txId=${txId} — Exception:`, error);
    return res.status(200).json({
      result: "CHARGE_FAILURE",
      amount: payload.action?.amount ?? 0,
      pspReference: pspRef,
      message: error instanceof Error ? error.message : "Internal error",
    });
  }
});
