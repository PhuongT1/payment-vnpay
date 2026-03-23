import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";

const SALEOR_API_URL_HEADER = "saleor-api-url";
const APP_IDENTIFIER = "vnpay.payment.app";

// Use `app` (no ID) — returns the current app using its own token. No MANAGE_APPS permission needed.
const GET_APPS_AND_WEBHOOKS_QUERY = `
  query GetCurrentApp {
    app {
      id
      identifier
      name
      isActive
      webhooks {
        id
        name
        isActive
        syncEvents {
          eventType
        }
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;

    if (!saleorApiUrl) {
      return res.status(400).json({
        error: `Missing ${SALEOR_API_URL_HEADER} header`,
        usage: {
          header: `${SALEOR_API_URL_HEADER}: https://your-saleor-instance/graphql/`,
        },
      });
    }

    const authData = await saleorApp.apl.get(saleorApiUrl);

    if (!authData) {
      return res.status(401).json({
        error: "App not registered in APL for this Saleor URL",
        details: "Reinstall app or verify APL persistence (Upstash in production).",
      });
    }

    const client = createClient(authData.saleorApiUrl, {
      headers: {
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const { data, error } = await client.query(GET_APPS_AND_WEBHOOKS_QUERY, {}).toPromise();

    if (error) {
      return res.status(500).json({
        error: "Failed to query Saleor apps/webhooks",
        details: error.message,
      });
    }

    const vnpayApp = data?.app;

    if (!vnpayApp) {
      return res.status(404).json({
        error: "Could not retrieve current app data. Ensure the app is installed and APL token is valid.",
      });
    }

    const webhookSummaries = (vnpayApp.webhooks || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      isActive: w.isActive,
      syncEvents: (w.syncEvents || []).map((e: any) => e.eventType),
      hasTransactionInitializeSession: (w.syncEvents || []).some(
        (e: any) => e.eventType === "TRANSACTION_INITIALIZE_SESSION"
      ),
    }));

    const hasActiveTransactionInitializeWebhook = webhookSummaries.some(
      (w: any) => w.isActive && w.hasTransactionInitializeSession
    );

    return res.status(200).json({
      success: true,
      app: {
        id: vnpayApp.id,
        identifier: vnpayApp.identifier,
        name: vnpayApp.name,
        isActive: vnpayApp.isActive,
      },
      checks: {
        hasActiveTransactionInitializeWebhook,
      },
      webhooks: webhookSummaries,
      nextActions: hasActiveTransactionInitializeWebhook
        ? []
        : [
            "Reinstall app from /api/manifest to refresh webhook registrations",
            "Confirm APP_API_BASE_URL points to the currently deployed domain",
            "Check webhook delivery logs in Saleor Dashboard",
          ],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
