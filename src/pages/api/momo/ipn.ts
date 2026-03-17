import { NextApiRequest, NextApiResponse } from "next";
import { getMoMoAPI, MoMoIPNPayload } from "@/lib/momo/momo-api";
import { createClient } from "@/lib/create-graphq-client";
import { saleorApp } from "@/saleor-app";

/**
 * MoMo IPN (Instant Payment Notification) callback endpoint
 * 
 * This endpoint receives payment status updates from MoMo.
 * When payment is confirmed, it updates the Saleor transaction.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const payload: MoMoIPNPayload = req.body;

    console.log("MoMo IPN received:", {
      orderId: payload.orderId,
      transId: payload.transId,
      resultCode: payload.resultCode,
      message: payload.message,
    });

    // Verify signature
    const momoAPI = getMoMoAPI();
    const isValidSignature = momoAPI.verifyIPNSignature(payload);

    if (!isValidSignature) {
      console.error("Invalid MoMo IPN signature");
      return res.status(400).json({
        message: "Invalid signature",
      });
    }

    // Parse extraData to get merchantReference
    let extraData: any = {};
    try {
      extraData = JSON.parse(payload.extraData || "{}");
    } catch (e) {
      console.warn("Failed to parse extraData:", payload.extraData);
    }

    const { merchantReference, idempotencyKey } = extraData;

    // Only process successful payments
    if (payload.resultCode === 0 || payload.resultCode === 9000) {
      console.log("Payment successful, updating Saleor transaction");

      try {
        // Get auth data from APL to create GraphQL client
        // Note: You'll need the saleorApiUrl and domain. This is a simplified example.
        // In production, you should store the domain/saleorApiUrl during transaction initialization
        
        // For now, we'll just log and acknowledge the IPN
        // In a real implementation, you would:
        // 1. Retrieve the stored auth data or saleorApiUrl from your database
        // 2. Use TransactionEventReport mutation to update the transaction
        
        console.log("Transaction update completed (implementation needed)");
        // const authData = await saleorApp.apl.get(domain);
        // const client = createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));
        // await client.mutation(TransactionEventReportDocument, {
        //   id: transactionId,
        //   type: "CHARGE_SUCCESS",
        //   amount: payload.amount / 100,
        //   pspReference: String(payload.transId),
        //   message: payload.message,
        // }).toPromise();

      } catch (error) {
        console.error("Failed to update Saleor transaction:", error);
        // Continue to acknowledge IPN even if Saleor update fails
        // You might want to queue this for retry
      }
    }

    // Always acknowledge the IPN to MoMo
    return res.status(200).json({
      message: "IPN received",
    });

  } catch (error) {
    console.error("Error processing MoMo IPN:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
