"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { resolveApiBaseUrl } from "@/utils/auth";
import SpecialEventCard from "./SpecialEventCard";
import SpecialEventPopup from "./SpecialEventPopup";

export type SpecialEvent = { id: string; name: string; date: string; place: string; youtubeUrl?: string; description?: string; guests: string[]; contact?: string; coverUrl?: string; active: boolean; displayOrder?: number };
const fallbackEvents: SpecialEvent[] = [
  { id: "radio-day", name: "A Plus Radio", date: "2026-06-25", place: "Badulla", youtubeUrl: "https://www.youtube.com/watch?v=AwJR-7lrHWE", description: "A live family radio event with games, music and safe entertainment for young viewers.", guests: ["A Plus presenters", "Kids singers"], contact: "+94 77 123 4567", active: true },
  { id: "kids-fiesta", name: "Kids Fiesta", date: "2026-06-28", place: "Colombo", youtubeUrl: "https://www.youtube.com/watch?v=XqZsoesa55w", description: "A colourful kids festival with activities, learning corners and family performances.", guests: ["Dance teams", "Story hosts"], contact: "+94 77 234 5678", active: true },
  { id: "talent-show", name: "Talent Show", date: "2026-07-05", place: "Kandy", youtubeUrl: "https://www.youtube.com/watch?v=BELlZKpi1Zs", description: "A showcase for young singers, dancers and creative performers.", guests: ["Junior performers", "Guest judges"], contact: "+94 77 345 6789", active: true },
];
export function displayEventDate(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
function publicUrl(value?: string) { return value?.startsWith("/api/") ? `${resolveApiBaseUrl()}${value}` : value; }

export default function SpecialEventsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<SpecialEvent[]>(fallbackEvents);
  const [activeEvent, setActiveEvent] = useState<SpecialEvent>();
  useEffect(() => { const controller = new AbortController(); fetch(`${resolveApiBaseUrl()}/api/v1/special-events`, { signal: controller.signal }).then(async (response) => { if (!response.ok) throw new Error(); const data = await response.json() as SpecialEvent[]; setEvents(data.map((event) => ({ ...event, coverUrl: publicUrl(event.coverUrl) }))); }).catch(() => undefined); return () => controller.abort(); }, []);
  const visibleEvents = events.filter((event) => event.active);
  function scroll(direction: "left" | "right") { scrollerRef.current?.scrollBy({ left: direction === "left" ? -640 : 640, behavior: "smooth" }); }
  return <section className="w-full bg-white px-5 py-6 md:px-8 md:py-7"><div className="mx-auto max-w-[1720px]"><div data-scroll-reveal="slide-right" className="mb-5 flex items-center justify-between md:mb-6"><h2 className="text-[20px] font-bold leading-none text-[#071B63] md:text-[28px]"><span className="md:hidden">Events</span><span className="hidden md:inline">Special Events</span></h2><span className="text-[12px] font-medium text-[#67809F] tablet:text-[14px]">Watch, learn and join the fun</span></div><div className="relative"><button type="button" aria-label="Previous special events" onClick={() => scroll("left")} className="absolute left-1 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/75 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid">&lt;</button><div ref={scrollerRef} data-focus-strip data-focus-mode="layout" data-focus-kind="media" className="-mx-5 flex snap-x items-end gap-3 overflow-x-auto overflow-y-hidden px-5 scroll-px-5 scroll-smooth pb-5 [scrollbar-width:none] tablet:-mx-8 tablet:gap-5 tablet:px-8 tablet:scroll-px-8 laptop:gap-6 desktop:gap-7 monitor:gap-8 [&::-webkit-scrollbar]:hidden">{visibleEvents.map((event, index) => <div key={event.id} data-focus-item data-scroll-reveal="pop" style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties} className="snap-start"><SpecialEventCard name={event.name} date={displayEventDate(event.date)} place={event.place} youtubeUrl={event.youtubeUrl} coverUrl={event.coverUrl} onClick={() => setActiveEvent(event)} /></div>)}</div><button type="button" aria-label="Next special events" onClick={() => scroll("right")} className="absolute right-1 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/75 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid">&gt;</button></div></div>{activeEvent ? <SpecialEventPopup event={{ ...activeEvent, date: displayEventDate(activeEvent.date), description: activeEvent.description || "", contact: activeEvent.contact || "", youtubeUrl: activeEvent.youtubeUrl || "" }} onClose={() => setActiveEvent(undefined)} /> : null}</section>;
}
