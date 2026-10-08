export type RecentlyViewedProduct = {
  handle: string;
  title: string;
  imageUrl: string;
  amount: string;
  currencyCode: string;
};

const STORAGE_KEY = "recently-viewed-products";
const CHANGE_EVENT = "recently-viewed-change";
const MAX_ITEMS = 10;
const EMPTY: RecentlyViewedProduct[] = [];

let cachedRaw: string | null = null;
let cachedItems: RecentlyViewedProduct[] = EMPTY;

const isRecentlyViewedProduct = (
  value: unknown,
): value is RecentlyViewedProduct => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.handle === "string" &&
    /^[a-z0-9-]+$/i.test(item.handle) &&
    typeof item.title === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.amount === "string" &&
    typeof item.currencyCode === "string"
  );
};

const parse = (raw: string | null): RecentlyViewedProduct[] => {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isRecentlyViewedProduct).slice(0, MAX_ITEMS)
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getRecentlyViewedSnapshot = (): RecentlyViewedProduct[] => {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
};

export const getRecentlyViewedServerSnapshot = (): RecentlyViewedProduct[] =>
  EMPTY;

export const subscribeToRecentlyViewed = (onChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

export const addRecentlyViewed = (product: RecentlyViewedProduct) => {
  const next = [
    product,
    ...getRecentlyViewedSnapshot().filter((p) => p.handle !== product.handle),
  ].slice(0, MAX_ITEMS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, quota); the feature degrades silently.
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};
