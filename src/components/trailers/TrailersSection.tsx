"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import TrailerCard from "./TrailerCard";
import TrailerPopup from "./TrailerPopup";

const trailers = [
  {
    id: "baby-shark",
    title: "Kids Champ",
    youtubeUrl: "https://www.youtube.com/watch?v=XqZsoesa55w",
  },
  {
    id: "bluey-sample",
    title: "Fun Time",
    youtubeUrl: "https://www.youtube.com/watch?v=BELlZKpi1Zs",
  },
  {
    id: "peppa-sample",
    title: "Story Time",
    youtubeUrl: "https://www.youtube.com/watch?v=F4tHL8reNCs",
  },
  {
    id: "learning-sample",
    title: "Learning Hour",
    youtubeUrl: "https://www.youtube.com/watch?v=e_04ZrNroTo",
  },
  {
    id: "music-sample",
    title: "Sing Along",
    youtubeUrl: "https://www.youtube.com/watch?v=XqZsoesa55w",
  },
  {
    id: "adventure-sample",
    title: "Adventure Club",
    youtubeUrl: "https://www.youtube.com/watch?v=BELlZKpi1Zs",
  },
];

export default function TrailersSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeTrailer, setActiveTrailer] = useState<(typeof trailers)[number]>();

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
            <span className="md:hidden">Top Picks For You</span>
            <span className="hidden md:inline">Trailers</span>
          </h2>
          <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] md:text-[16px]">
            View All
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous trailers"
            onClick={() => scrollByCards("left")}
            className="absolute -left-5 top-[48px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            ‹
          </button>
          <div
            ref={scrollerRef}
            className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] md:gap-12 [&::-webkit-scrollbar]:hidden"
          >
            {trailers.map((trailer, index) => (
              <div
                key={trailer.id}
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
                className="snap-start"
              >
                <TrailerCard
                  title={trailer.title}
                  youtubeUrl={trailer.youtubeUrl}
                  onClick={() => setActiveTrailer(trailer)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next trailers"
            onClick={() => scrollByCards("right")}
            className="absolute -right-5 top-[48px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            ›
          </button>
        </div>
      </div>

      {activeTrailer ? (
        <TrailerPopup
          title={activeTrailer.title}
          youtubeUrl={activeTrailer.youtubeUrl}
          onClose={() => setActiveTrailer(undefined)}
        />
      ) : null}
    </section>
  );
}
