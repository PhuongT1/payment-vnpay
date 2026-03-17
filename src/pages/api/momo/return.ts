import { NextApiRequest, NextApiResponse } from "next";

/**
 * MoMo return URL endpoint
 * 
 * This endpoint handles the redirect after user completes/cancels payment on MoMo.
 * It redirects the user back to the storefront with appropriate status.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    resultCode,
    message,
    orderId,
    requestId,
    transId,
    merchantReference,
  } = req.query;

  console.log("MoMo return URL visited:", {
    resultCode,
    orderId,
    merchantReference,
  });

  // Construct return URL to storefront
  // You should configure this based on your storefront's checkout success/failure pages
  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";

  if (resultCode === "0" || resultCode === "9000") {
    // Payment successful - redirect to success page
    const successUrl = `${storefrontUrl}/checkout/success?merchantReference=${merchantReference}&orderId=${orderId}&transId=${transId}`;
    return res.redirect(successUrl);
  } else {
    // Payment failed or cancelled - redirect back to checkout
    const failureUrl = `${storefrontUrl}/checkout?error=payment_failed&message=${encodeURIComponent(message as string || "Payment failed")}`;
    return res.redirect(failureUrl);
  }
}
