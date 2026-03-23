/**
 * Debug endpoint - shows APL state and registered auth data.
 * Use this ONCE after installing the app to get the token values
 * needed to configure EnvAPL on Vercel.
 *
 * ⚠️ DELETE or protect this endpoint in production!
 */
import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "@/saleor-app";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic protection - require a secret key
  const key = req.query.key as string;
  if (!process.env.DEBUG_SECRET || key !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ error: "Unauthorized. Set DEBUG_SECRET env var and pass ?key=xxx" });
  }

  try {
    const aplType = process.env.APL ?? "file (default)";
    const allEntries = await saleorApp.apl.getAll();

    console.log("🔍 [debug-apl] APL type:", aplType);
    console.log("🔍 [debug-apl] Entries count:", allEntries.length);
    console.log("🔍 [debug-apl] Entries:", JSON.stringify(allEntries.map(e => ({
      saleorApiUrl: e.saleorApiUrl,
      appId: e.appId,
      tokenPreview: e.token?.substring(0, 20) + "...",
    })), null, 2));

    return res.status(200).json({
      aplType,
      entriesCount: allEntries.length,
      entries: allEntries.map(e => ({
        saleorApiUrl: e.saleorApiUrl,
        appId: e.appId,
        tokenPreview: e.token?.substring(0, 20) + "...",
        // Full token — needed for EnvAPL setup
        // Copy this to Vercel: APL_TOKEN, APL_SALEOR_API_URL, APL_APP_ID
        APL_TOKEN: e.token,
        APL_SALEOR_API_URL: e.saleorApiUrl,
        APL_APP_ID: e.appId,
      })),
      instructions: allEntries.length === 0
        ? "APL is EMPTY → app is not installed or token was lost. Reinstall from Saleor Dashboard."
        : "Copy APL_TOKEN, APL_SALEOR_API_URL, APL_APP_ID values to Vercel env vars, then set APL=env",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
