/**
 * Debug API: VNPay Hash Signature Verification
 */

import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { params, hashSecret } = req.body;

    if (!params || !hashSecret) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: params, hashSecret",
      });
    }

    // Method 1: Simple sort and join (current implementation)
    const sortedKeys = Object.keys(params).sort();
    const hashData1 = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    const hash1 = crypto
      .createHmac("sha512", hashSecret)
      .update(Buffer.from(hashData1, "utf-8"))
      .digest("hex");

    // Method 2: URLSearchParams approach
    const urlParams = new URLSearchParams();
    Object.keys(params)
      .sort()
      .forEach((key) => {
        urlParams.append(key, params[key]);
      });
    const hashData2 = urlParams.toString();
    const hash2 = crypto
      .createHmac("sha512", hashSecret)
      .update(Buffer.from(hashData2, "utf-8"))
      .digest("hex");

    return res.status(200).json({
      success: true,
      data: {
        method1: {
          hashData: hashData1,
          hash: hash1,
        },
        method2: {
          hashData: hashData2,
          hash: hash2,
        },
        params,
        sortedKeys,
      },
    });
  } catch (error) {
    console.error("Debug Hash Error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to debug hash",
    });
  }
}
