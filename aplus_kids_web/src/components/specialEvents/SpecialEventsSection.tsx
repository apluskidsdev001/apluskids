"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import SpecialEventCard from "./SpecialEventCard";
import SpecialEventPopup from "./SpecialEventPopup";

type SpecialEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
  thumbnail?: string;
  description: string;
  guests: string[];
  contact: string;
  links: { label: string; href: string }[];
};

const specialEvents: SpecialEvent[] = [
  {
    id: "radio-day",
    name: "A plus Radio",
    date: "25 Jun 2026",
    place: "Badulla",
    description:
      "A live family radio event with games, music, kids interviews, prize moments, and safe entertainment for young viewers.",
    guests: ["A Plus presenters", "Kids singers", "Parent guests"],
    contact: "+94 77 123 4567",
    links: [{ label: "Event Info", href: "/watch" }],
  },
  {
    id: "kids-fiesta",
    name: "Kids Fiesta",
    date: "28 Jun 2026",
    place: "Colombo",
    description:
      "A colorful kids festival with stage activities, learning corners, character meetups, and family-friendly performances.",
    guests: ["Dance teams", "Story hosts", "A Plus mascots"],
    contact: "+94 77 234 5678",
    links: [{ label: "Register", href: "/watch" }],
  },
  {
    id: "talent-show",
    name: "Talent Show",
    date: "05 Jul 2026",
    place: "Kandy",
    description:
      "A showcase for young singers, dancers, speakers, and creative performers from around the island.",
    guests: ["Junior performers", "Guest judges", "Music coaches"],
    contact: "+94 77 345 6789",
    links: [{ label: "Apply Now", href: "/watch" }],
  },
  {
    id: "story-day",
    name: "Story Day",
    date: "12 Jul 2026",
    place: "Galle",
    description:
      "An interactive storytelling event with reading circles, puppet moments, and imagination games.",
    guests: ["Storytellers", "Teachers", "Kids readers"],
    contact: "+94 77 456 7890",
    links: [{ label: "Learn More", href: "/watch" }],
  },
  {
    id: "music-party",
    name: "Music Party",
    date: "19 Jul 2026",
    place: "Matara",
    description:
      "A cheerful music event with sing-alongs, rhythm games, and family performances.",
    guests: ["Kids bands", "A Plus hosts", "Music teachers"],
    contact: "+94 77 567 8901",
    links: [{ label: "Watch Updates", href: "/watch" }],
  },
  {
    id: "art-camp",
    name: "Art Camp",
    date: "26 Jul 2026",
    place: "Jaffna",
    description:
      "A creative workshop for drawing, coloring, crafts, and confidence-building activities.",
    guests: ["Art mentors", "Craft teams", "Young artists"],
    contact: "+94 77 678 9012",
    links: [{ label: "Join Event", href: "/watch" }],
  },
];

export default function SpecialEventsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<SpecialEvent>();

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
            <span className="md:hidden">Events</span>
            <span className="hidden md:inline">Special Events</span>
          </h2>
          <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] md:text-[16px]">
            View All
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous special events"
            onClick={() => scrollByCards("left")}
            className="absolute -left-5 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            &lt;
          </button>
          <div
            ref={scrollerRef}
            className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] md:gap-12 [&::-webkit-scrollbar]:hidden"
          >
            {specialEvents.map((event, index) => (
              <div
                key={event.id}
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
                className="snap-start"
              >
                <SpecialEventCard
                  name={event.name}
                  date={event.date}
                  place={event.place}
                  thumbnail={event.thumbnail}
                  onClick={() => setActiveEvent(event)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next special events"
            onClick={() => scrollByCards("right")}
            className="absolute -right-5 top-[52px] z-10 hidden h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/65 text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)] backdrop-blur-md md:grid"
          >
            &gt;
          </button>
        </div>
      </div>

      {activeEvent ? (
        <SpecialEventPopup
          event={activeEvent}
          onClose={() => setActiveEvent(undefined)}
        />
      ) : null}
    </section>
  );
}
