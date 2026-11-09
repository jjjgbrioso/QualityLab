const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const pesos = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/** US dollars, used by the shop and travel modules. */
export function formatCents(cents: number): string {
  return dollars.format(cents / 100);
}

/** Philippine pesos, used by the banking module. Amounts are stored in centavos. */
export function formatPeso(centavos: number): string {
  return pesos.format(centavos / 100);
}

/** Converts text such as "12.50" to 1250. Returns null unless it has at most two decimals. */
export function dollarsToCents(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
