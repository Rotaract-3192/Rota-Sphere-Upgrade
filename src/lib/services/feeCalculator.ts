/**
 * Fee & Pricing Calculation Engine
 */

export interface FeeCalculationInput {
  subtotal: number;
  customPlatformFeePercent?: number | null;
  couponDiscountAmount?: number;
  fixedConvenienceFee?: number;
  gstPercent?: number;
}

export interface FeeCalculationResult {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  platformFee: number;
  convenienceFee: number;
  tax: number;
  totalPayable: number;
  netOrganizerPayout: number;
}

export function calculateOrderFees(input: FeeCalculationInput): FeeCalculationResult {
  const subtotal = Math.max(0, input.subtotal);
  const discount = Math.min(subtotal, Math.max(0, input.couponDiscountAmount ?? 0));
  const discountedSubtotal = subtotal - discount;

  // Platform fee percentage (default 0% commission for the platform)
  const platformFeeRate = (input.customPlatformFeePercent ?? 0) / 100;
  const platformFee = Math.round(discountedSubtotal * platformFeeRate * 100) / 100;

  // Convenience fee (fixed per order, ₹10 default for paid tickets, ₹0 for free)
  const convenienceFee = discountedSubtotal > 0 ? (input.fixedConvenienceFee ?? 10) : 0;

  // 18% GST on platform service fees (platform fee + convenience fee)
  const gstRate = (input.gstPercent ?? 18) / 100;
  const taxableServices = platformFee + convenienceFee;
  const tax = Math.round(taxableServices * gstRate * 100) / 100;

  const totalPayable = discountedSubtotal > 0 ? discountedSubtotal + convenienceFee + tax : 0;

  // Net payout to organizer = discounted ticket sales - platform fee
  const netOrganizerPayout = Math.max(0, discountedSubtotal - platformFee);

  return {
    subtotal,
    discount,
    discountedSubtotal,
    platformFee,
    convenienceFee,
    tax,
    totalPayable: Math.round(totalPayable * 100) / 100,
    netOrganizerPayout: Math.round(netOrganizerPayout * 100) / 100,
  };
}
