// Show prices in the shopper's local currency.
const RATES_ENDPOINT = "https://api.frankfurter.app/latest";
const REQUEST_TIMEOUT_MS = 10_000;
const RATES_REVALIDATE_SECONDS = 60 * 60;
const CURRENCY_CODE = /^[A-Z]{3}$/;

export class CurrencyConversionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CurrencyConversionError";
  }
}

type RatesResponse = { rates: Record<string, number> };

const isRatesResponse = (value: unknown): value is RatesResponse => {
  if (typeof value !== "object" || value === null) return false;
  const { rates } = value as { rates?: unknown };
  return typeof rates === "object" && rates !== null;
};

const assertCurrencyCode = (code: string) => {
  if (!CURRENCY_CODE.test(code)) {
    throw new CurrencyConversionError(`Invalid currency code: ${code}`);
  }
};

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  assertCurrencyCode(from);
  assertCurrencyCode(to);
  if (from === to) return 1;

  const url = `${RATES_ENDPOINT}?${new URLSearchParams({ from, to })}`;

  let data: unknown;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: RATES_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new CurrencyConversionError(
        `Exchange rate request failed with status ${res.status}`,
      );
    }
    data = await res.json();
  } catch (error) {
    if (error instanceof CurrencyConversionError) throw error;
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? "timed out"
        : "failed";
    throw new CurrencyConversionError(`Exchange rate request ${reason}`, {
      cause: error,
    });
  }

  const rate = isRatesResponse(data) ? data.rates[to] : undefined;
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new CurrencyConversionError(`No exchange rate for ${from}->${to}`);
  }
  return rate;
}

// Returns null when the rate is unavailable so callers can fall back to the original price.
export async function convertPrice(
  amount: number,
  from: string,
  to: string,
): Promise<number | null> {
  try {
    const rate = await getExchangeRate(from, to);
    return Math.round(amount * rate * 100) / 100;
  } catch (error) {
    console.error("Currency conversion unavailable", error);
    return null;
  }
}
