"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveApiBaseUrl } from "@/utils/auth";
import { sitePath } from "@/utils/sitePath";

export type AdvertisementSlot =
  | "HOME_AFTER_HERO"
  | "HOME_AFTER_SHORTCUTS"
  | "HOME_BEFORE_SCHEDULE"
  | "KIDS_ZONE_AFTER_HERO"
  | "WATCH_BEFORE_CATEGORIES"
  | "MARKET_PROMO_BANNER";
type PublicAdvertisement = {
  id: string;
  contentType: "IMAGE" | "GIF" | "VIDEO" | "CARD" | "EMBED";
  title?: string;
  description?: string;
  buttonLabel?: string;
  altText?: string;
  destinationUrl?: string;
  openNewTab: boolean;
  fitMode: "CONTAIN" | "COVER";
  backgroundColor: string;
  desktopSource?: string;
  mobileSource?: string;
  rotationWeight: number;
};

function publicUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("/api/")) return `${resolveApiBaseUrl()}${value}`;
  return sitePath(value);
}
function embedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be")
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("youtube.com")) {
      const id =
        url.searchParams.get("v") ||
        url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : value;
    }
    return value;
  } catch {
    return "";
  }
}

export default function AdvertisementBanner({
  slot,
  market = false,
}: {
  slot: AdvertisementSlot;
  market?: boolean;
}) {
  const [items, setItems] = useState<PublicAdvertisement[]>([]);
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${resolveApiBaseUrl()}/api/v1/advertisements/slots/${slot}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setItems((await response.json()) as PublicAdvertisement[]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
    return () => controller.abort();
  }, [slot]);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 8000);
    return () => window.clearInterval(timer);
  }, [items.length]);
  const item = useMemo(() => {
    if (!items.length) return null;
    const total = items.reduce(
      (sum, value) => sum + Math.max(1, value.rotationWeight),
      0,
    );
    let selected = tick % total;
    for (const value of items) {
      selected -= Math.max(1, value.rotationWeight);
      if (selected < 0) return value;
    }
    return items[0];
  }, [items, tick]);
  useEffect(() => {
    if (!item) return;
    const controller = new AbortController();
    fetch(
      `${resolveApiBaseUrl()}/api/v1/advertisements/${item.id}/impression`,
      { method: "POST", signal: controller.signal },
    ).catch(() => undefined);
    return () => controller.abort();
  }, [item]);
  if (!loaded)
    return (
      <section
        aria-label="Loading advertisement"
        className={`w-full bg-white ${market ? "px-0 pb-10 sm:pb-12 md:pb-14 lg:pb-16" : "-mt-px px-3 py-4 md:px-6 md:py-8"}`}
      >
        <div
          className={`mx-auto animate-pulse bg-slate-100 ${market ? "aspect-[804/199] min-h-[180px] max-w-[1500px] rounded-[28px] sm:min-h-[220px] sm:rounded-[32px]" : "h-[132px] max-w-7xl rounded-[22px] md:h-[120px] md:rounded-3xl"}`}
        />
      </section>
    );
  if (!item) return null;
  const desktop = publicUrl(item.desktopSource),
    mobile = publicUrl(item.mobileSource),
    fit = item.fitMode === "COVER" ? "object-cover" : "object-contain";
  const click = item.destinationUrl
    ? publicUrl(item.destinationUrl)
    : undefined;
  const media =
    item.contentType === "VIDEO" ? (
      <video
        key={desktop}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`h-full w-full ${fit}`}
      >
        <source src={desktop} />
      </video>
    ) : item.contentType === "EMBED" && desktop ? (
      <iframe
        src={embedUrl(desktop)}
        title={item.altText || item.title || "Advertisement"}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="autoplay; encrypted-media; picture-in-picture"
        className="h-full w-full border-0"
      />
    ) : item.contentType === "CARD" ? (
      <div className="flex h-full w-full flex-col items-center justify-center px-6 py-5 text-center">
        <strong className="text-xl text-[#132447] tablet:text-2xl">
          {item.title}
        </strong>
        {item.description ? (
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#607089] tablet:text-sm">
            {item.description}
          </p>
        ) : null}
        {item.buttonLabel ? (
          <span className="mt-3 rounded-full bg-[#087BF1] px-5 py-2 text-xs font-bold text-white">
            {item.buttonLabel}
          </span>
        ) : null}
      </div>
    ) : (
      <picture className="block h-full w-full">
        {mobile ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
        <img
          src={desktop}
          alt={item.altText || item.title || "Advertisement"}
          className={`h-full w-full ${fit}`}
        />
      </picture>
    );
  const frame = (
    <div
      style={{ backgroundColor: item.backgroundColor }}
      className={`relative mx-auto overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,.12)] ${market ? "aspect-[804/199] min-h-[180px] max-w-[1500px] rounded-[28px] sm:min-h-[220px] sm:rounded-[32px]" : "h-[132px] max-w-7xl rounded-[22px] md:h-[120px] md:rounded-3xl"}`}
    >
      {media}
      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-white">
        Advertisement
      </span>
    </div>
  );
  return (
    <section
      data-scroll-reveal="pop"
      aria-label="Advertisement"
      className={`w-full bg-white ${market ? "px-4 pb-10 sm:px-6 sm:pb-12 md:px-10 md:pb-14 lg:px-16 lg:pb-16" : "-mt-px px-3 py-4 md:px-6 md:py-8"}`}
    >
      {click && item.contentType !== "EMBED" ? (
        <a
          href={click}
          target={item.openNewTab ? "_blank" : undefined}
          rel={item.openNewTab ? "noopener noreferrer sponsored" : "sponsored"}
          className="block"
        >
          {frame}
        </a>
      ) : (
        frame
      )}
    </section>
  );
}
