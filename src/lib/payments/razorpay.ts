/**
 * Razorpay Payment Provider
 * Architecture §33-45: Payment integration
 * Architecture §33: "Webhook is the ONLY source of truth for payment status"
 * Architecture §37: "Verify webhook signature using Razorpay's HMAC-SHA256"
 *
 * This module wraps Razorpay REST API calls.
 * All amounts in paise (multiply INR by 100).
 */

import crypto from "crypto";
import { logger } from "@/lib/logger/logger";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

function getAuthHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

async function razorpayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${RAZORPAY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Razorpay API error", { endpoint, status: response.status, body });
    throw new Error(`Razorpay API error: ${response.status} ${body}`);
  }

  return response.json() as Promise<T>;
}

export interface CreateOrderParams {
  amount: number;            // in INR (will be converted to paise)
  currency?: string;
  receipt: string;           // order_number
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;            // in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

/**
 * Create a Razorpay order.
 * Architecture §33: Create gateway order first, then show payment modal.
 * Amount is in INR — we multiply by 100 to convert to paise internally.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrder> {
  return razorpayFetch<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),   // INR → paise
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;            // in paise
  currency: string;
  status: string;
  method: string;
  captured: boolean;
  description: string;
  email: string;
  contact: string;
  created_at: number;
}

/**
 * Fetch a payment from Razorpay.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpayFetch<RazorpayPayment>(`/payments/${paymentId}`);
}

export interface RefundParams {
  paymentId: string;
  amount: number;            // in INR
  notes?: Record<string, string>;
  speed?: "normal" | "optimum";
}

export interface RazorpayRefund {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Initiate a refund via Razorpay.
 * Architecture §40: Refunds processed via Razorpay, not manual.
 */
export async function createRazorpayRefund(params: RefundParams): Promise<RazorpayRefund> {
  return razorpayFetch<RazorpayRefund>(`/payments/${params.paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(params.amount * 100),   // INR → paise
      speed: params.speed ?? "normal",
      notes: params.notes ?? {},
    }),
  });
}

/**
 * Verify Razorpay webhook signature.
 * Architecture §37: "Verify webhook signature using HMAC-SHA256 before processing."
 *
 * @param body   Raw request body string
 * @param signature  x-razorpay-signature header value
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verify payment signature from client-side callback.
 * Architecture §37: "Never trust browser callbacks alone — use webhook."
 * This function is a secondary check; webhook remains primary source of truth.
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
