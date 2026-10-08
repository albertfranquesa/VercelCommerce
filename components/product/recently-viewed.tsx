"use client";

import { GridTileImage } from "components/grid/tile";
import {
  addRecentlyViewed,
  getRecentlyViewedServerSnapshot,
  getRecentlyViewedSnapshot,
  subscribeToRecentlyViewed,
  type RecentlyViewedProduct,
} from "lib/recently-viewed";
import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

function useRecentlyViewed() {
  return useSyncExternalStore(
    subscribeToRecentlyViewed,
    getRecentlyViewedSnapshot,
    getRecentlyViewedServerSnapshot,
  );
}

export function RecentlyViewed({
  current,
}: {
  current: RecentlyViewedProduct;
}) {
  const items = useRecentlyViewed();
  const { handle, title, imageUrl, amount, currencyCode } = current;

  useEffect(() => {
    addRecentlyViewed({ handle, title, imageUrl, amount, currencyCode });
  }, [handle, title, imageUrl, amount, currencyCode]);

  const others = useMemo(
    () => items.filter((item) => item.handle !== handle),
    [items, handle],
  );

  if (!others.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Recently Viewed</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {others.map((item) => (
          <li
            key={item.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
              href={`/product/${encodeURIComponent(item.handle)}`}
              prefetch={false}
            >
              <GridTileImage
                alt={item.title}
                label={{
                  title: item.title,
                  amount: item.amount,
                  currencyCode: item.currencyCode,
                }}
                src={item.imageUrl}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
