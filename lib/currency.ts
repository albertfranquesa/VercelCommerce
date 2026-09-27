// Show prices in the shopper's local currency.
export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
  );
  const data = await res.json();
  return data.rates[to];
}

export async function convertPrice(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}
