import { APL } from "@saleor/app-sdk/APL";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";
import { FileAPL } from "@saleor/app-sdk/APL/file";
import { UpstashAPL } from "@saleor/app-sdk/APL/upstash";
import { EnvAPL } from "@saleor/app-sdk/APL/env";

export let apl: APL;

const resolvedAplMode =
  process.env.APL ||
  (process.env.UPSTASH_URL && process.env.UPSTASH_TOKEN ? "upstash" : "file");

switch (resolvedAplMode) {
  case "upstash": {
    if (!process.env.UPSTASH_URL || !process.env.UPSTASH_TOKEN) {
      throw new Error("UPSTASH_URL and UPSTASH_TOKEN are required when APL=upstash");
    }
    apl = new UpstashAPL({
      restURL: process.env.UPSTASH_URL,
      restToken: process.env.UPSTASH_TOKEN,
    });
    break;
  }
  case "env": {
    /**
     * EnvAPL — for Vercel without Upstash.
     * Steps:
     *   1. Deploy with APL=env and APL_PRINT_ON_REGISTER=true
     *   2. Reinstall app in Saleor Dashboard → check Vercel logs for auth data
     *   3. Set APL_TOKEN, APL_SALEOR_API_URL, APL_APP_ID in Vercel env vars
     *   4. Redeploy with APL_PRINT_ON_REGISTER=false
     */
    apl = new EnvAPL({
      env: {
        token: process.env.APL_TOKEN ?? "",
        saleorApiUrl: process.env.APL_SALEOR_API_URL ?? "",
        appId: process.env.APL_APP_ID ?? "",
      },
      printAuthDataOnRegister: process.env.APL_PRINT_ON_REGISTER === "true",
    });
    break;
  }
  default: {
    // FileAPL should be used only for local development.
    // In serverless production it can cause intermittent AUTHORIZATION_FAILURE due to non-persistent storage.
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[saleor-app] Using FileAPL in production can break webhook auth. Set APL=upstash with UPSTASH_URL/UPSTASH_TOKEN for stable deployment."
      );
    }
    apl = new FileAPL();
  }
}

export const saleorApp = new SaleorApp({
  apl,
});
