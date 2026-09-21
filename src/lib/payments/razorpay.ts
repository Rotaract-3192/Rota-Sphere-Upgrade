/**
 * Direct UPI Payment Provider (0% Platform Fee)
 * Architecture: Instant UPI Dynamic QR & UTR Bank Settlement
 */

export interface UPIPaymentDetails {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  orderNumber?: string;
}

export function buildUpiQuery(params: UPIPaymentDetails): string {
  const { upiId, payeeName, amount, transactionNote, orderNumber } = params;
  const cleanNote = (transactionNote || "Passes").trim().slice(0, 30);
  const orderRef = (orderNumber || `ROTA${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

  const parts = [
    `pa=${encodeURIComponent(upiId.trim())}`,
    `pn=${encodeURIComponent(payeeName.trim())}`,
    `am=${amount.toFixed(2)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(cleanNote)}`,
    `tr=${encodeURIComponent(orderRef)}`,
  ];
  return parts.join("&");
}

export function generateUPILink(params: UPIPaymentDetails): string {
  return `upi://pay?${buildUpiQuery(params)}`;
}

export function generateAppUpiLinks(params: UPIPaymentDetails) {
  const query = buildUpiQuery(params);
  return {
    universal: `upi://pay?${query}`,
    gpay: `tez://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
  };
}

export function verifyWebhook(): boolean {
  return true;
}

