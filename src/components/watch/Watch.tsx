"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import AdvertisementBanner from "@/components/Advertisements/AdvertisementBox";
import { sitePath } from "@/utils/sitePath";

const filterTabs = ["All", "Programs", "Trailers", "Shorts", "Schedules"];
const youtubeChannelUrl = "https://www.youtube.com/@Apluskidstvofficial/featured";
const youtubeVideosUrl = "https://www.youtube.com/@Apluskidstvofficial/videos";
const youtubeShortsUrl = "https://www.youtube.com/@Apluskidstvofficial/shorts";
const scheduleDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const categories = [
  { name: "Stories", icon: "/images/watch/categoris/education (1).png" },
  { name: "Education", icon: "/images/watch/categoris/education (2).png" },
  { name: "Songs & Rhymes", icon: "/images/watch/categoris/education (3).png" },
  { name: "Events", icon: "/images/watch/categoris/education (4).png" },
  { name: "Shorts", icon: "/images/watch/categoris/education (5).png" },
  { name: "TV Programs", icon: "/images/watch/categoris/education (6).png" },
];

const programs = [
  {
    title: "Ayubowewa Kids",
    type: "Programs",
    time: "10.00AM - 11.00AM",
    label: "Good Morning",
  },
  {
    title: "Story Line",
    type: "Programs",
    time: "11.00AM - 12.00PM",
    label: "Stories",
  },
  {
    title: "Learning Corner",
    type: "Programs",
    time: "12.00PM - 01.00PM",
    label: "Education",
  },
  {
    title: "Rhythm of Little Steps",
    type: "Programs",
    time: "02.00PM - 03.00PM",
    label: "Music",
  },
  {
    title: "Little Explorers",
    type: "Programs",
    time: "03.00PM - 04.00PM",
    label: "Discovery",
  },
  {
    title: "Art Club",
    type: "Programs",
    time: "05.00PM - 06.00PM",
    label: "Creative",
  },
  {
    title: "Bedtime Stories",
    type: "Programs",
    time: "07.00PM - 08.00PM",
    label: "Stories",
  },
  {
    title: "Little Scientists",
    type: "Programs",
    time: "08.00PM - 08.30PM",
    label: "Science",
  },
];

const trailers = [
  { title: "Story Line Highlights", type: "Story" },
  { title: "A Plus Kids Shorts", type: "Short" },
  { title: "Educational Moments", type: "Learn" },
  { title: "Birthday Wishes", type: "Event" },
  { title: "Ayubowewa This Week", type: "TV" },
  { title: "Creative Kids", type: "Short" },
  { title: "Learning Letters", type: "Learn" },
  { title: "Fun with Friends", type: "Short" },
];

const scheduleRows = [
  {
    time: "10.00AM",
    title: "A Plus Radio",
    note: "Songs, shout-outs and family messages.",
  },
  {
    time: "12.00PM",
    title: "Kids Champ",
    note: "Quiz rounds, games and confidence moments.",
  },
  {
    time: "02.00PM",
    title: "Story Hour",
    note: "Animated stories with gentle learning.",
  },
  {
    time: "03.00PM",
    title: "Music Time",
    note: "Sing-along songs and movement breaks.",
  },
  {
    time: "04.00PM",
    title: "Learning Time",
    note: "Letters, numbers, colors and nature.",
  },
  {
    time: "05.00PM",
    title: "Art Club",
    note: "Crafts, drawing and creative play.",
  },
  {
    time: "07.00PM",
    title: "Bedtime Stories",
    note: "Soft stories for a calm evening.",
  },
];

function PlayIcon({ size = "large" }: { size?: "small" | "large" }) {
  const buttonSize = size === "large" ? "h-16 w-16" : "h-10 w-10";
  const triangleSize =
    size === "large"
      ? "border-y-[12px] border-l-[18px]"
      : "border-y-[8px] border-l-[12px]";

  return (
    <span
      className={`grid ${buttonSize} place-items-center rounded-full bg-white/92 shadow-[0_14px_34px_rgba(7,27,99,0.2)]`}
      aria-hidden="true"
    >
      <span
        className={`ml-1 h-0 w-0 ${triangleSize} border-y-transparent border-l-[#F04B23]`}
      />
    </span>
  );
}

function KeyedHeroVideo({ src }: { src: string }) {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 h-full w-full object-contain"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default function Watch() {
  const [activeTab, setActiveTab] = useState("All");
  const [activeDay, setActiveDay] = useState("Monday");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllTrailers, setShowAllTrailers] = useState(false);
  const [schedulePopupOpen, setSchedulePopupOpen] = useState(false);

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesTab =
        activeTab === "All" ||
        activeTab === "Programs" ||
        program.type === activeTab;
      const matchesSearch =
        !normalizedSearch ||
        program.title.toLowerCase().includes(normalizedSearch) ||
        program.label.toLowerCase().includes(normalizedSearch);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const visiblePrograms = showAllPrograms
    ? filteredPrograms
    : filteredPrograms.slice(0, 5);
  const visibleTrailers = showAllTrailers ? trailers : trailers.slice(0, 5);
  const visibleScheduleRows = scheduleRows.slice(0, 5);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7FAFF] pt-[86px] text-[#071B63] laptop:pt-[132px]">
      <section className="px-5 pb-10 pt-8 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto grid max-w-[1720px] min-w-0 items-center gap-8 laptop:grid-cols-[0.92fr_1.08fr] laptop:gap-12">
          <div className="watch-mobile-width min-w-0 max-w-[720px]">
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-black text-[#F04B23] shadow-[0_10px_24px_rgba(7,27,99,0.1)] tablet:text-[14px]">
              Dialog TV Channel 48
            </div>
            <h1 className="watch-mobile-width mt-5 whitespace-normal text-[34px] font-black leading-[1.02] tracking-normal text-black tablet:text-[54px] laptop:text-[64px] desktop:text-[74px]">
              Watch A Plus Kids TV
            </h1>
            <p className="watch-mobile-width mt-5 whitespace-normal text-[16px] font-medium leading-[1.35] text-[#30384f] tablet:max-w-[520px] tablet:text-[22px] laptop:mt-7 laptop:text-[25px]">
              <span className="block tablet:inline">
                Sinhala stories, learning clips, shorts
              </span>{" "}
              <span className="block tablet:inline">
                and TV moments for little viewers.
              </span>
            </p>

            <form
              className="watch-mobile-width mt-8 flex h-[58px] items-center rounded-full bg-[#E7E7E7] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] tablet:h-[66px] laptop:max-w-[610px]"
              onSubmit={(event) => event.preventDefault()}
            >
              <span className="ml-3 mr-2 grid h-10 w-10 place-items-center rounded-full tablet:ml-4">
                <Image
                  src={sitePath("/icons/taskbar/search.png")}
                  alt=""
                  width={32}
                  height={32}
                  className="h-7 w-7 object-contain opacity-55"
                />
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search programs, trailers and shorts"
                placeholder="Search stories, programs and shorts ..."
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#071B63] outline-none placeholder:text-[#727272] tablet:text-[15px]"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F04B23] shadow-[0_8px_20px_rgba(240,75,35,0.28)] transition-transform hover:scale-105 tablet:h-12 tablet:w-12"
              >
                <Image
                  src={sitePath("/icons/taskbar/search.png")}
                  alt=""
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain brightness-0 invert"
                />
              </button>
            </form>

            <div className="watch-mobile-width mt-7 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`h-10 shrink-0 rounded-full px-6 text-[14px] font-bold transition-colors tablet:h-11 tablet:px-7 tablet:text-[15px] ${
                    activeTab === tab
                      ? "bg-[#F04B23] text-white shadow-[0_10px_22px_rgba(240,75,35,0.24)]"
                      : "bg-[#D9D9D9] text-black hover:bg-[#cfcfcf]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="watch-mobile-width mt-6 grid grid-cols-2 gap-3 tablet:flex tablet:flex-wrap">
              <Link
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#F04B23] px-5 text-center text-[13px] font-black text-white shadow-[0_12px_28px_rgba(240,75,35,0.26)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
              >
                YouTube Channel
              </Link>
              <Link
                href={youtubeVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-center text-[13px] font-black text-[#0877EF] shadow-[0_12px_28px_rgba(7,27,99,0.1)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
              >
                Latest Videos
              </Link>
            </div>
          </div>

          <div className="watch-mobile-width relative min-h-[270px] min-w-0 overflow-hidden rounded-[32px] border border-[#D8ECFF] bg-[#EAF8FF] shadow-[0_28px_70px_rgba(7,27,99,0.18)] tablet:min-h-[390px] laptop:min-h-[470px] desktop:min-h-[500px]">
            <KeyedHeroVideo src={sitePath("/videos/watch/watchhero.mp4")} />
            <div className="absolute bottom-5 left-5 rounded-[24px] border border-white/85 bg-white px-5 py-4 shadow-[0_18px_38px_rgba(7,27,99,0.26)] tablet:bottom-8 tablet:left-8 tablet:px-6">
              <p className="text-[13px] font-bold text-[#F04B23] tablet:text-[15px]">
                Sri Lanka&apos;s 24/7 Kids Channel
              </p>
              <p className="mt-1 text-[22px] font-black leading-none text-[#071B63] tablet:text-[30px]">
                A Plus Kids TV
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto grid max-w-[1640px] gap-7 rounded-[34px] border border-[#DCEEFF] bg-white p-5 shadow-[0_28px_70px_rgba(7,27,99,0.16)] tablet:rounded-[46px] tablet:p-8 laptop:grid-cols-[0.92fr_1fr] laptop:items-center laptop:p-10 desktop:p-12">
          <Link
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block min-h-[220px] overflow-hidden rounded-[22px] bg-[#9CE6FF] tablet:min-h-[300px] laptop:min-h-[320px]"
            aria-label="Open A Plus Kids TV on YouTube"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={sitePath("/videos/home/hero_video.mp4")} type="video/mp4" />
            </video>
            <span className="absolute inset-0 bg-black/5" />
            <span className="absolute inset-0 grid place-items-center transition-transform duration-300 group-hover:scale-105">
              <PlayIcon />
            </span>
          </Link>

          <div className="max-w-[640px] rounded-[28px] bg-[#F7FBFF] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] laptop:pl-7">
            <p className="text-[18px] font-black text-[#F04B23] tablet:text-[22px]">
              YouTube Featured
            </p>
            <h2 className="mt-2 text-[32px] font-black leading-[1.05] text-black tablet:text-[44px] desktop:text-[52px]">
              A Plus Kids TV Official
            </h2>
            <span className="mt-5 inline-flex rounded-full bg-[#0877EF] px-5 py-2 text-[14px] font-bold text-white tablet:text-[16px]">
              Stories | Education | Shorts
            </span>
            <p className="mt-6 max-w-[440px] text-[17px] font-medium leading-[1.35] text-[#22283a] tablet:text-[20px]">
              Open the official channel for Sinhala kids stories, learning
              videos, event clips and short-form fun from A Plus Kids TV.
            </p>
            <Link
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#F04B23] px-10 text-[16px] font-black text-black shadow-[0_12px_28px_rgba(240,75,35,0.25)] transition-transform hover:-translate-y-0.5 tablet:h-14 tablet:px-12"
            >
              Open Channel
            </Link>
          </div>
        </div>
      </section>

      <AdvertisementBanner />

      <section className="px-5 py-7 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-black text-[#071B63] tablet:text-[34px]">
              Categories
            </h2>
            <Link href="/watch" className="text-[17px] font-bold text-[#0877EF] tablet:text-[21px]">
              View All
            </Link>
          </div>

          <div className="mt-7 flex gap-5 overflow-x-auto px-1 pb-5 [scrollbar-width:none] tablet:gap-7 laptop:grid laptop:grid-cols-6 laptop:overflow-visible laptop:px-0 [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                className="group flex h-[138px] w-[138px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-white px-3 text-center shadow-[0_10px_22px_rgba(7,27,99,0.16)] transition-transform hover:-translate-y-1 tablet:h-[168px] tablet:w-[168px] laptop:w-auto"
              >
                <Image
                  src={sitePath(category.icon)}
                  alt=""
                  width={86}
                  height={86}
                  className="h-16 w-16 object-contain transition-transform group-hover:scale-105 tablet:h-20 tablet:w-20"
                />
                <span className="mt-3 text-[14px] font-bold leading-tight text-black tablet:text-[16px]">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-4 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-black text-[#071B63] tablet:text-[34px]">
              Program Listing
            </h2>
            <button
              type="button"
              onClick={() => setShowAllPrograms((visible) => !visible)}
              className="rounded-full bg-white px-5 py-2 text-[16px] font-black text-[#0877EF] shadow-[0_10px_24px_rgba(7,27,99,0.1)] transition-transform hover:-translate-y-0.5 tablet:text-[19px]"
            >
              {showAllPrograms ? "Show Less" : "View All"}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 tablet:grid-cols-2 laptop:grid-cols-5 laptop:gap-7">
            {visiblePrograms.map((program, index) => (
              <article
                key={program.title}
                className="group overflow-hidden rounded-[24px] border border-[#DCEEFF] bg-white p-3 shadow-[0_16px_36px_rgba(7,27,99,0.13)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative h-[132px] overflow-hidden rounded-[18px] bg-[#D9D9D9] tablet:h-[150px]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#EAF8FF,#D6ECFF)]" />
                  <div className="absolute inset-4 rounded-[16px] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]" />
                  <div className="absolute bottom-4 right-4 h-16 w-24 rounded-[18px] bg-[#87D7FF] shadow-[0_12px_24px_rgba(7,27,99,0.12)] tablet:h-20 tablet:w-28" />
                  <div className="absolute left-6 top-9 h-14 w-14 rounded-full bg-[#FFE36E] shadow-[0_12px_24px_rgba(255,195,24,0.22)]" />
                  <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#071B63] shadow-[0_8px_18px_rgba(7,27,99,0.12)]">
                    {program.label}
                  </span>
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayIcon size="small" />
                  </span>
                </div>
                <div className="px-2 pb-2 pt-4">
                  <h3 className="text-[16px] font-black leading-tight text-[#071B63]">
                    {program.title}
                  </h3>
                  <p className="mt-2 text-[12px] font-bold leading-relaxed text-[#526382]">
                    {index === 4 ? "25 Jun 2026" : program.time}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-4 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-black text-[#071B63] tablet:text-[34px]">
              Trailers / Shorts
            </h2>
            <button
              type="button"
              onClick={() => setShowAllTrailers((visible) => !visible)}
              className="rounded-full bg-white px-5 py-2 text-[16px] font-black text-[#0877EF] shadow-[0_10px_24px_rgba(7,27,99,0.1)] transition-transform hover:-translate-y-0.5 tablet:text-[19px]"
            >
              {showAllTrailers ? "Show Less" : "View All"}
            </button>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 tablet:grid-cols-3 laptop:grid-cols-5 laptop:gap-7">
            {visibleTrailers.map((trailer) => (
              <Link
                key={trailer.title}
                href={trailer.type === "Short" ? youtubeShortsUrl : youtubeVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[1.2/1] overflow-hidden rounded-[22px] border border-[#DCEEFF] bg-white shadow-[0_14px_32px_rgba(7,27,99,0.13)]"
                aria-label={trailer.title}
              >
                <span className="absolute inset-0 bg-[linear-gradient(135deg,#EAF8FF,#FFFFFF)]" />
                <span className="absolute inset-4 rounded-[18px] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]" />
                <span className="absolute right-4 top-5 h-12 w-16 rounded-[16px] bg-[#87D7FF] shadow-[0_10px_22px_rgba(7,27,99,0.12)]" />
                <span className="absolute bottom-5 left-5 h-10 w-10 rounded-full bg-[#FFE36E]" />
                <span className="absolute inset-0 grid place-items-center transition-transform duration-300 group-hover:scale-105">
                  <PlayIcon size="small" />
                </span>
                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#F04B23] shadow-[0_8px_18px_rgba(7,27,99,0.12)]">
                  {trailer.type}
                </span>
                <span className="absolute bottom-3 left-3 right-3 line-clamp-1 rounded-full bg-white/90 px-3 py-2 text-[13px] font-bold text-[#071B63]">
                  {trailer.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-8 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto grid max-w-[1640px] gap-8 rounded-[32px] border border-[#DCEEFF] bg-white p-5 shadow-[0_24px_60px_rgba(7,27,99,0.16)] tablet:rounded-[42px] tablet:p-8 laptop:grid-cols-[1fr_330px] laptop:items-center desktop:p-10">
          <div>
            <div className="flex flex-col gap-5 tablet:flex-row tablet:items-center tablet:justify-between">
              <h2 className="text-[28px] font-black text-[#071B63] tablet:text-[34px]">
                TV Schedule
              </h2>
              <button
                type="button"
                onClick={() => setSchedulePopupOpen(true)}
                className="w-fit rounded-full bg-[#0877EF] px-6 py-2.5 text-[14px] font-black text-white shadow-[0_12px_28px_rgba(8,119,239,0.24)] transition-transform hover:-translate-y-0.5"
              >
                More Schedule
              </button>
            </div>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {scheduleDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`h-9 shrink-0 rounded-full px-4 text-[12px] font-black transition-colors ${
                    activeDay === day
                      ? "bg-[#F04B23] text-white shadow-[0_10px_22px_rgba(240,75,35,0.22)]"
                      : "bg-[#EEF4FA] text-[#071B63] hover:bg-[#DDEBFA]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="mt-7 grid gap-4 tablet:grid-cols-2 desktop:grid-cols-5">
              {visibleScheduleRows.map((row) => (
                <div
                  key={`${activeDay}-${row.time}-${row.title}`}
                  className="min-h-[118px] rounded-[22px] border border-[#DCEEFF] bg-[#F7FBFF] px-4 py-4 shadow-[0_12px_28px_rgba(7,27,99,0.1)]"
                >
                  <p className="text-[12px] font-black leading-none text-[#F04B23]">
                    {row.time}
                  </p>
                  <h3 className="mt-2 text-[16px] font-black leading-tight text-[#071B63]">
                    {row.title}
                  </h3>
                  <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#4C5D80]">
                    {row.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="watch-breathe relative hidden h-[285px] overflow-hidden rounded-[30px] border border-[#DCEEFF] bg-[#EAF8FF] shadow-[0_18px_42px_rgba(7,27,99,0.14)] laptop:block">
            <Image
              src={sitePath("/images/watch/categoris/wt.png")}
              alt="A Plus Kids schedule"
              fill
              sizes="330px"
              className="object-contain p-6"
            />
          </div>
        </div>
      </section>

      {schedulePopupOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071B63]/20 px-4 py-10 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-[920px] overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_28px_80px_rgba(7,27,99,0.28)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#DCEEFF] bg-[#F7FBFF] px-5 py-4 tablet:px-7">
              <div>
                <p className="text-[13px] font-black text-[#F04B23]">
                  {activeDay}
                </p>
                <h2 className="text-[24px] font-black leading-tight text-[#071B63] tablet:text-[32px]">
                  Full Day TV Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSchedulePopupOpen(false)}
                className="rounded-full bg-[#071B63] px-5 py-2 text-[13px] font-black text-white shadow-[0_10px_24px_rgba(7,27,99,0.22)]"
              >
                Back
              </button>
            </div>

            <div className="grid max-h-[62vh] gap-4 overflow-y-auto p-5 tablet:grid-cols-2 tablet:p-7">
              {scheduleRows.map((row) => (
                <article
                  key={`popup-${activeDay}-${row.time}-${row.title}`}
                  className="rounded-[22px] border border-[#DCEEFF] bg-[#F7FBFF] p-4 shadow-[0_10px_26px_rgba(7,27,99,0.1)]"
                >
                  <p className="text-[13px] font-black text-[#F04B23]">
                    {row.time}
                  </p>
                  <h3 className="mt-2 text-[20px] font-black leading-tight text-[#071B63]">
                    {row.title}
                  </h3>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#4C5D80]">
                    {row.note}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
