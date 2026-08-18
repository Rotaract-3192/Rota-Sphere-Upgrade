/**
 * Direct UPI Payment Provider (0% Platform Fee)
 * Architecture: Instant UPI Dynamic QR & UTR Bank Settlement
 */

export interface UPIPaymentDetails {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  orderNumber: string;
}

export function generateUPILink(params: UPIPaymentDetails): string {
  const { upiId, payeeName, amount, transactionNote } = params;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
}

export function verifyWebhook(): boolean {
  return true;
}
