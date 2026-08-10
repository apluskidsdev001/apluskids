"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultWeeklySchedule,
  scheduleDayNames,
  type ScheduleDayName,
  type WeeklySchedule,
} from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { getYouTubeThumbnail } from "@/components/trailers/youtube";
import TVScheduleCard from "./TVScheduleCard";
import TVSchedulePopup from "./TVSchedulePopup";

type ScheduleItem = {
  id: string;
  name: string;
  timePeriod: string;
  thumbnail?: string;
  description: string;
  contact: string;
  trailerUrl: string;
  links: { label: string; href: string }[];
};

function getTodayName(date: Date): ScheduleDayName {
  return scheduleDayNames[(date.getDay() + 6) % 7];
}

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.trim().replace(":", ".").split(".");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  return Number.isFinite(parsedHours) && Number.isFinite(parsedMinutes)
    ? parsedHours * 60 + parsedMinutes
    : Number.POSITIVE_INFINITY;
}

export default function TVScheduleSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeProgram, setActiveProgram] = useState<ScheduleItem>();
  const [now, setNow] = useState<Date | null>(null);
  const weeklySchedule = useAdminDisplayContent<WeeklySchedule>(
    "aplus-admin-watch-schedule",
    "aplus-published-watch-schedule",
    defaultWeeklySchedule,
  );

  useEffect(() => {
    const refreshTime = () => setNow(new Date());
    refreshTime();
    const timer = window.setInterval(refreshTime, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { currentProgramId, scheduleItems } = useMemo(() => {
    const referenceTime = now ?? new Date(0);
    const today = now ? getTodayName(referenceTime) : "Monday";
    const entries = [...(weeklySchedule[today] ?? defaultWeeklySchedule[today])].sort(
      (left, right) => timeToMinutes(left.time) - timeToMinutes(right.time),
    );
    const nowMinutes = referenceTime.getHours() * 60 + referenceTime.getMinutes();
    const currentEntry = now
      ? [...entries].reverse().find((entry) => timeToMinutes(entry.time) <= nowMinutes) ?? entries[0]
      : entries[0];
    const orderedEntries = currentEntry
      ? [currentEntry, ...entries.filter((entry) => entry.id !== currentEntry.id)]
      : entries;

    return {
      currentProgramId: currentEntry?.id,
      scheduleItems: orderedEntries.map((entry) => ({
        id: entry.id,
        name: entry.title,
        timePeriod: `${entry.time} · Today`,
        thumbnail: entry.youtubeUrl ? getYouTubeThumbnail(entry.youtubeUrl) : undefined,
        description: `${entry.title} is scheduled today at ${entry.time} on A Plus Kids TV.`,
        contact: "Dialog TV Channel 48",
        trailerUrl: entry.youtubeUrl ?? "",
        links: [{ label: "View Full Schedule", href: "/watch" }],
      })),
    };
  }, [now, weeklySchedule]);

  useEffect(() => {
    if (!now || !currentProgramId) return;
    scrollerRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [currentProgramId, now]);

  function scrollByCards(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -640 : 640,
      behavior: "smooth",
    });
  }

  return (
    <section className="w-full bg-white px-5 py-6 md:px-8 md:py-7">
      <div className="mx-auto max-w-[1720px]">
        <div data-scroll-reveal="slide-right" className="mb-5 flex items-center justify-between md:mb-6">
          <div>
            <h2 className="text-[20px] font-bold leading-none text-[#071B63] md:text-[28px]">
              TV Schedule
            </h2>
            <p className="mt-2 text-[11px] font-medium text-[#647797] md:text-[13px]">
              Today&apos;s current program appears first.
            </p>
          </div>
          <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] md:text-[16px]">
            <span className="md:hidden">View Full Schedule</span>
            <span className="hidden md:inline">View All</span>
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous TV schedule"
            onClick={() => scrollByCards("left")}
            className="absolute -left-5 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            &lt;
          </button>
          <div
            ref={scrollerRef}
            data-focus-strip
            className="flex snap-x flex-col gap-3 overflow-x-visible scroll-smooth pb-5 [scrollbar-width:none] md:flex-row md:gap-12 md:overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {scheduleItems.map((item, index) => (
              <div
                key={item.id}
                data-focus-item
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
                className="snap-start"
              >
                <TVScheduleCard
                  name={item.name}
                  timePeriod={item.timePeriod}
                  thumbnail={item.thumbnail}
                  isCurrent={item.id === currentProgramId}
                  onClick={() => setActiveProgram(item)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next TV schedule"
            onClick={() => scrollByCards("right")}
            className="absolute -right-5 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            &gt;
          </button>
        </div>
      </div>

      {activeProgram ? (
        <TVSchedulePopup program={activeProgram} onClose={() => setActiveProgram(undefined)} />
      ) : null}
    </section>
  );
}
