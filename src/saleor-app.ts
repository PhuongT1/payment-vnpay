import { APL } from "@saleor/app-sdk/APL";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";
import { FileAPL } from "@saleor/app-sdk/APL/file";
import { UpstashAPL } from "@saleor/app-sdk/APL/upstash";

/**
 * By default auth data are stored in the `.auth-data.json` (FileAPL).
 * For multi-tenant applications and deployments please use UpstashAPL.
 *
 * To read more about storing auth data, read the
 * [APL documentation](https://github.com/saleor/saleor-app-sdk/blob/main/docs/apl.md)
 */
export let apl: APL;

switch (process.env.APL) {
  case "upstash": {
    // Upstash Redis - for production deployments (Vercel, Railway, etc.)
    // Required env vars: UPSTASH_URL, UPSTASH_TOKEN
    if (!process.env.UPSTASH_URL || !process.env.UPSTASH_TOKEN) {
      throw new Error("UPSTASH_URL and UPSTASH_TOKEN are required when APL=upstash");
    }
    apl = new UpstashAPL({
      restURL: process.env.UPSTASH_URL,
      restToken: process.env.UPSTASH_TOKEN,
    });
    break;
  }
  default: {
    // FileAPL - for local development only (won't work on Vercel/Railway)
    apl = new FileAPL();
  }
}

export const saleorApp = new SaleorApp({
  apl,
});
