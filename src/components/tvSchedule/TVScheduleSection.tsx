"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
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

const scheduleItems: ScheduleItem[] = [
  {
    id: "morning-radio",
    name: "A plus Radio",
    timePeriod: "10.00AM - 12.00AM",
    description:
      "A bright morning program with songs, messages, shout-outs, and gentle learning moments for families.",
    contact: "+94 77 111 2222",
    trailerUrl: "https://www.youtube.com/watch?v=XqZsoesa55w",
    links: [{ label: "Program Page", href: "/watch" }],
  },
  {
    id: "kids-champ",
    name: "Kids Champ",
    timePeriod: "12.00PM - 02.00PM",
    description:
      "A fun challenge show where children learn, play, answer questions, and celebrate confidence.",
    contact: "+94 77 222 3333",
    trailerUrl: "https://www.youtube.com/watch?v=BELlZKpi1Zs",
    links: [{ label: "Watch Trailer", href: "/watch" }],
  },
  {
    id: "story-hour",
    name: "Story Hour",
    timePeriod: "02.00PM - 03.00PM",
    description:
      "A calm storytelling block with animated tales, moral stories, and reading-friendly episodes.",
    contact: "+94 77 333 4444",
    trailerUrl: "https://www.youtube.com/watch?v=F4tHL8reNCs",
    links: [{ label: "More Stories", href: "/watch" }],
  },
  {
    id: "music-time",
    name: "Music Time",
    timePeriod: "03.00PM - 04.00PM",
    description:
      "A sing-along program with rhythm activities, kid-friendly songs, and movement breaks.",
    contact: "+94 77 444 5555",
    trailerUrl: "https://www.youtube.com/watch?v=XqZsoesa55w",
    links: [{ label: "Song List", href: "/watch" }],
  },
  {
    id: "learning-time",
    name: "Learning Time",
    timePeriod: "04.00PM - 05.00PM",
    description:
      "A playful learning block covering letters, numbers, colors, nature, and everyday curiosity.",
    contact: "+94 77 555 6666",
    trailerUrl: "https://www.youtube.com/watch?v=e_04ZrNroTo",
    links: [{ label: "Learning Hub", href: "/watch" }],
  },
  {
    id: "bedtime",
    name: "Bedtime Stories",
    timePeriod: "07.00PM - 08.00PM",
    description:
      "Soft bedtime stories and relaxing animated moments for a peaceful end to the day.",
    contact: "+94 77 666 7777",
    trailerUrl: "https://www.youtube.com/watch?v=F4tHL8reNCs",
    links: [{ label: "Night Schedule", href: "/watch" }],
  },
];

export default function TVScheduleSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeProgram, setActiveProgram] = useState<ScheduleItem>();

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
          <h2 className="text-[20px] font-bold leading-none text-[#071B63] md:text-[28px]">
            TV Schedule
          </h2>
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
            className="flex snap-x flex-col gap-3 overflow-x-visible scroll-smooth pb-5 [scrollbar-width:none] md:flex-row md:gap-12 md:overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {scheduleItems.map((item, index) => (
              <div
                key={item.id}
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
                className="snap-start"
              >
                <TVScheduleCard
                  name={item.name}
                  timePeriod={item.timePeriod}
                  thumbnail={item.thumbnail}
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
        <TVSchedulePopup
          program={activeProgram}
          onClose={() => setActiveProgram(undefined)}
        />
      ) : null}
    </section>
  );
}
