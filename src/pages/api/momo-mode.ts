import { NextApiRequest, NextApiResponse } from "next";

/**
 * API endpoint to get current MoMo mode
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isMockMode = process.env.MOMO_MOCK_MODE === "true";
  const hasCredentials = !!(
    process.env.MOMO_PARTNER_CODE &&
    process.env.MOMO_ACCESS_KEY &&
    process.env.MOMO_SECRET_KEY
  );
  const endpoint = process.env.MOMO_ENDPOINT || "";
  const isProduction = endpoint.includes("payment.momo.vn") && !endpoint.includes("test");

  let mode: "mock" | "sandbox" | "production";
  
  if (isMockMode) {
    mode = "mock";
  } else if (isProduction) {
    mode = "production";
  } else {
    mode = "sandbox";
  }

  res.status(200).json({
    mode,
    isMockMode,
    hasCredentials,
    endpoint: isMockMode ? "Mock API (local)" : endpoint,
    details: {
      mockMode: isMockMode,
      hasPartnerCode: !!process.env.MOMO_PARTNER_CODE,
      hasAccessKey: !!process.env.MOMO_ACCESS_KEY,
      hasSecretKey: !!process.env.MOMO_SECRET_KEY,
      endpointType: isProduction ? "production" : "sandbox",
    },
  });
}
