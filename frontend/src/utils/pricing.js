// Single source of truth for the "Today Only 10% OFF" promotional
// pricing on the frontend - mirrors backend/app/utils/pricing.py so the
// pre-purchase preview always agrees with what the server will charge.
export const DISCOUNT_RATE = 0.1;
export const GST_RATE = 0.18;

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDiscountAmount(price) {
  return round2(Number(price) * DISCOUNT_RATE);
}

export function calculateDiscountedPrice(price) {
  return round2(Number(price) - calculateDiscountAmount(price));
}

export function calculateGst(amount) {
  return round2(Number(amount) * GST_RATE);
}

export function calculateGrandTotal(amount) {
  return round2(Number(amount) + calculateGst(amount));
}
