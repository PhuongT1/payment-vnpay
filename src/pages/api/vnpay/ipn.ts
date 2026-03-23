/**
 * VNPay IPN (Instant Payment Notification) Handler
 *
 * VNPay calls this URL server-to-server BEFORE redirecting the user back to returnUrl.
 * We MUST respond with {"RspCode":"00","Message":"Confirm Success"} within 15 seconds,
 * otherwise VNPay will retry the IPN up to 3 times and mark the transaction as unconfirmed.
 *
 * This handler:
 *  1. Verifies the VNPay HMAC-SHA512 signature using config stored in Saleor metadata
 *  2. ACKs VNPay with the required JSON format
 *
 * The actual Saleor transaction state (CHARGE_SUCCESS / CHARGE_FAILURE) is reported
 * by the TRANSACTION_PROCESS_SESSION webhook, which the storefront triggers after
 * the popup returns (postMessage → transactionProcess mutation).
 * IPN is purely a VNPay protocol requirement.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayAPI } from "@/lib/vnpay/vnpay-api";
import { VNPayIPNMerchantResponse, VNPayIPNResponseCode } from "@/lib/vnpay/types";

const GET_METADATA_QUERY = `
  query GetAppMetadata($id: ID!) {
    app(id: $id) {
      id
      privateMetadata { key value }
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VNPayIPNMerchantResponse>
) {
  // VNPay IPN uses GET request with vnp_* params in query string
  const ipnParams = req.query as Record<string, string>;

  const logTxnRef = ipnParams.vnp_TxnRef ?? "unknown";
  const logResponseCode = ipnParams.vnp_ResponseCode ?? "unknown";

  console.log(`📥 [VNPay IPN] txnRef=${logTxnRef} responseCode=${logResponseCode} tmnCode=${ipnParams.vnp_TmnCode}`);

  if (!ipnParams.vnp_SecureHash || !ipnParams.vnp_TmnCode || !ipnParams.vnp_TxnRef) {
    console.error("❌ [VNPay IPN] Missing required params");
    return res.status(200).json({
      RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR,
      Message: "Missing required parameters",
    });
  }

  try {
    // Get Saleor auth token to read app private metadata (where configs are stored)
    const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
    if (!saleorApiUrl) {
      console.error("❌ [VNPay IPN] NEXT_PUBLIC_SALEOR_API_URL not set");
      return res.status(200).json({ RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR, Message: "Configuration error" });
    }

    const authData = await saleorApp.apl.get(saleorApiUrl);
    if (!authData) {
      console.error("❌ [VNPay IPN] App not registered in APL");
      return res.status(200).json({ RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR, Message: "App not registered" });
    }

    const client = createClient(authData.saleorApiUrl, {
      headers: { Authorization: `Bearer ${authData.token}` },
    });

    const { data } = await client
      .query(GET_METADATA_QUERY, { id: authData.appId })
      .toPromise();

    const metadata: Array<{ key: string; value: string }> = data?.app?.privateMetadata ?? [];
    const configMeta = metadata.find((m) => m.key === "vnpay:configs");

    if (!configMeta?.value) {
      console.error("❌ [VNPay IPN] No VNPay configs in metadata");
      return res.status(200).json({ RspCode: VNPayIPNResponseCode.ORDER_NOT_FOUND, Message: "Order not found" });
    }

    const allConfigs: Array<{ tmnCode: string; hashSecret?: string; isActive: boolean }> =
      JSON.parse(configMeta.value);

    // Find active configs whose tmnCode matches the IPN request
    const matchingConfigs = allConfigs.filter(
      (c) => c.isActive && c.tmnCode === ipnParams.vnp_TmnCode && c.hashSecret,
    );

    if (matchingConfigs.length === 0) {
      console.error(`❌ [VNPay IPN] No active config for tmnCode=${ipnParams.vnp_TmnCode}`);
      return res.status(200).json({ RspCode: VNPayIPNResponseCode.ORDER_NOT_FOUND, Message: "Order not found" });
    }

    // Verify signature — try each matching config (supports multiple configs per tmnCode)
    let signatureValid = false;
    for (const config of matchingConfigs) {
      const vnpayApi = new VNPayAPI({ tmnCode: config.tmnCode, hashSecret: config.hashSecret! });
      if (vnpayApi.verifyIPNSignature(ipnParams as any)) {
        signatureValid = true;
        break;
      }
    }

    if (!signatureValid) {
      console.error(`❌ [VNPay IPN] Invalid signature for txnRef=${logTxnRef}`);
      return res.status(200).json({
        RspCode: VNPayIPNResponseCode.INVALID_SIGNATURE,
        Message: "Invalid signature",
      });
    }

    // Signature valid — ACK VNPay.
    // Transaction outcome (CHARGE_SUCCESS/CHARGE_FAILURE) is determined by the
    // TRANSACTION_PROCESS_SESSION webhook when storefront calls transactionProcess.
    const isPaymentSuccess =
      ipnParams.vnp_ResponseCode === "00" && ipnParams.vnp_TransactionStatus === "00";

    console.log(
      `${isPaymentSuccess ? "✅" : "⚠️"} [VNPay IPN] txnRef=${logTxnRef} ` +
      `payment=${isPaymentSuccess ? "SUCCESS" : "FAILED"} transactionNo=${ipnParams.vnp_TransactionNo}`,
    );

    return res.status(200).json({
      RspCode: VNPayIPNResponseCode.SUCCESS,
      Message: "Confirm Success",
    });
  } catch (error) {
    console.error("❌ [VNPay IPN] Unexpected error:", error);
    // Always return 200 — non-200 causes VNPay to retry
    return res.status(200).json({
      RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR,
      Message: "Unknow error",
    });
  }
}
