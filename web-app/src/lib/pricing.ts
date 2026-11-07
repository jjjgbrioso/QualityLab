export const TAX_RATE_PERCENT = 8;
export const SHIPPING_FLAT_CENTS = 599;
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export function calculateTotals(subtotalCents: number) {
  const taxCents = Math.round((subtotalCents * TAX_RATE_PERCENT) / 100);
  const freeShipping = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const shippingCents = freeShipping ? 0 : SHIPPING_FLAT_CENTS;
  return { subtotalCents, taxCents, shippingCents, totalCents: subtotalCents + taxCents + shippingCents };
}
