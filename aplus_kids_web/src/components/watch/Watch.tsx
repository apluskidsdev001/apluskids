"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import AdvertisementBanner from "@/components/Advertisements/AdvertisementBox";
import ScrollRevealObserver from "@/components/animations/ScrollRevealObserver";
import type { AdminCategory, AdminVideo, WeeklySchedule } from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { sitePath } from "@/utils/sitePath";

const filterTabs = ["All", "Programs", "Trailers", "Shorts", "Schedules"] as const;
type FilterTab = (typeof filterTabs)[number];
type CategoryName =
  | "All"
  | "Stories"
  | "Education"
  | "Songs & Rhymes"
  | "Events"
  | "Shorts"
  | "TV Programs";
const youtubeChannelUrl = "https://www.youtube.com/@Apluskidstvofficial/featured";
const youtubeVideosUrl = "https://www.youtube.com/@Apluskidstvofficial/videos";

const defaultWatchCopy = {
  pageTitle: "Watch A Plus Kids TV",
  pageDescription: "Sinhala stories, learning clips, shorts and TV moments for little viewers.",
  programsTitle: "Program Listing",
  trailersTitle: "Trailers / Shorts",
  categoriesTitle: "Categories",
};
const scheduleDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type ScheduleDay = (typeof scheduleDays)[number];

const categories = [
  { name: "All", icon: "/icons/taskbar/play.png" },
  { name: "Stories", icon: "/images/watch/categoris/education (1).png" },
  { name: "Education", icon: "/images/watch/categoris/education (2).png" },
  { name: "Songs & Rhymes", icon: "/images/watch/categoris/education (3).png" },
  { name: "Events", icon: "/images/watch/categoris/education (4).png" },
  { name: "Shorts", icon: "/images/watch/categoris/education (5).png" },
  { name: "TV Programs", icon: "/images/watch/categoris/education (6).png" },
] satisfies { name: CategoryName; icon: string }[];

const programs = [
  {
    id: "Usmsag-rmI4",
    title: "Kids Fashion",
    published: "21 Jul 2026",
    category: "TV Programs",
  },
  {
    id: "5U8KT4cPSe8",
    title: "Story Line",
    published: "21 Jul 2026",
    category: "Stories",
  },
  {
    id: "4LByTo3r0uI",
    title: "ශිෂ්‍යත්වයට අකුණු ප්‍රශ්නයක්",
    published: "20 Jul 2026",
    category: "Education",
  },
  {
    id: "UEV_pNiqCLY",
    title: "ශිෂ්‍යත්වයට ඓතිහාසික ස්ථාන",
    published: "18 Jul 2026",
    category: "Education",
  },
  {
    id: "dMjVDJYUcOA",
    title: "ශිෂ්‍යත්වයට කල් ඉකුත්වීමේ ප්‍රශ්නයක්",
    published: "17 Jul 2026",
    category: "Education",
  },
  {
    id: "Vx_9KeOusIE",
    title: "ශිෂ්‍යත්වයට ලැබෙන සංඥා",
    published: "16 Jul 2026",
    category: "Education",
  },
  {
    id: "vL_RQSZ0zHM",
    title: "Art Plus - චිත්‍ර අඳිමු",
    published: "16 Jul 2026",
    category: "Education",
  },
  {
    id: "AwJR-7lrHWE",
    title: "A Plus Radio",
    published: "14 Jul 2026",
    category: "Songs & Rhymes",
  },
  {
    id: "P1YWi_N3--0",
    title: "Kids Fashion Highlights",
    published: "16 Jul 2026",
    category: "Events",
  },
  {
    id: "BwoIa0v9Yts",
    title: "Kids Champ",
    published: "Official Program",
    category: "TV Programs",
  },
  {
    id: "IKFo0Wxg4lw",
    title: "Kids Champ EP 54",
    published: "Official Program",
    category: "TV Programs",
  },
  {
    id: "3r-zyu7UJss",
    title: "Art Plus - මානව රූප පාට කරමු",
    published: "Official Program",
    category: "Education",
  },
  {
    id: "swOuqe8FFoQ",
    title: "Humpty Dumpty Nursery Rhyme",
    published: "Official Program",
    category: "Songs & Rhymes",
  },
  {
    id: "XKCPXEZ0f4s",
    title: "Row Row Row Your Boat",
    published: "Official Program",
    category: "Songs & Rhymes",
  },
  {
    id: "1Dwrdl9NNxk",
    title: "Ekomath Eka - ගමරාළගේ කතාව",
    published: "Official Program",
    category: "Stories",
  },
  {
    id: "7rsSbI2iyN0",
    title: "Ekomath Eka - අරුම පුදුම බටනලාව",
    published: "Official Program",
    category: "Stories",
  },
  {
    id: "5i4i9MkCiTA",
    title: "Chat with LM",
    published: "Official Program",
    category: "TV Programs",
  },
] satisfies { id: string; title: string; published: string; category: CategoryName }[];

const trailers = [
  { id: "AuECsoil4fI", title: "Uncle Toy - Program Preview", type: "Trailer", category: "TV Programs" },
  { id: "RVZCGcopMqs", title: "සන්නිවේදන පාඨමාලාව", type: "Trailer", category: "Events" },
  { id: "ojGQDDwsuJY", title: "දරුවන් සහ ප්‍රායෝගික විෂයන්", type: "Short", category: "Education" },
  { id: "Cv8byvv8s1c", title: "දරුවන් සමඟ හැඟීම් බෙදාගනිමු", type: "Short", category: "Education" },
  { id: "znycONLs_V8", title: "දරුවන්ගේ මුදල් කළමනාකරණය", type: "Short", category: "Education" },
  { id: "H_OVirQDOvE", title: "දරුවන්ගේ ලෝකයේ වීරවරු", type: "Short", category: "Stories" },
  { id: "gQKbGLVY9Wk", title: "Story Line Trailer", type: "Trailer", category: "Stories" },
  { id: "GUE2gm3AFBI", title: "Story Line - Official Trailer", type: "Trailer", category: "Stories" },
  { id: "v9-GdWZaP5c", title: "A Plus Radio Coming Soon", type: "Trailer", category: "Songs & Rhymes" },
  { id: "MXLiDMRQKdQ", title: "Birthday Excitement", type: "Trailer", category: "Events" },
  { id: "ijwVl4EzQFM", title: "Professor O2 - This Week", type: "Trailer", category: "Education" },
  { id: "_LAIfzySxFo", title: "A Plus Kids TV - 24/7", type: "Trailer", category: "TV Programs" },
  { id: "qpRJegxOCo8", title: "Uncle Toy Christmas Song", type: "Trailer", category: "Songs & Rhymes" },
  { id: "PVgC_gi9Dzo", title: "Five Little Ducks", type: "Short", category: "Songs & Rhymes" },
] satisfies { id: string; title: string; type: "Trailer" | "Short"; category: CategoryName }[];

function youtubeUrl(videoId: string, short = false) {
  return short
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function getVideoIdFromUrl(url: string) {
  return url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? "";
}

const scheduleRows = [
  { time: "06.00", title: "Rhyme Doo" },
  { time: "07.00", title: "A Plus Kids House" },
  { time: "07.30", title: "Plus Toon" },
  { time: "08.00", title: "A Plus Radio" },
  { time: "08.30", title: "Ekomath Eka Kaleka" },
  { time: "09.00", title: "Chat with LM" },
  { time: "10.00", title: "Kids Champ" },
  { time: "10.30", title: "DP - Art" },
  { time: "11.00", title: "Uncle Toy" },
  { time: "11.30", title: "O2" },
  { time: "12.00", title: "Rhyme Doo" },
  { time: "13.00", title: "A Plus Kids House" },
  { time: "13.30", title: "Plus Toon" },
  { time: "14.00", title: "Chat with LM" },
  { time: "15.00", title: "Kids Champ" },
  { time: "15.30", title: "Ekomath Eka Kaleka" },
  { time: "16.00", title: "Uncle Toy" },
  { time: "16.30", title: "O2" },
  { time: "17.00", title: "A Plus Radio" },
  { time: "17.30", title: "Rhyme Doo" },
  { time: "18.30", title: "A Plus Kids House" },
  { time: "19.00", title: "Kids Champ" },
  { time: "19.30", title: "O2" },
  { time: "20.00", title: "Chat with LM" },
  { time: "21.00", title: "A Plus Radio" },
  { time: "22.30", title: "DP - Art" },
  { time: "23.00", title: "Uncle Toy" },
];

const weeklySchedule = Object.fromEntries(
  scheduleDays.map((day) => [day, scheduleRows]),
) as Record<ScheduleDay, typeof scheduleRows>;

const schedulePalette: Record<ScheduleDay, { header: string; row: string; accent: string }> = {
  Monday: { header: "bg-[#1688C5]", row: "bg-[#EAF7FD]", accent: "text-[#0877B4]" },
  Tuesday: { header: "bg-[#1688C5]", row: "bg-[#EAF7FD]", accent: "text-[#0877B4]" },
  Wednesday: { header: "bg-[#F05A1F]", row: "bg-[#FFF2EA]", accent: "text-[#D94812]" },
  Thursday: { header: "bg-[#F05A1F]", row: "bg-[#FFF2EA]", accent: "text-[#D94812]" },
  Friday: { header: "bg-[#F3B61B]", row: "bg-[#FFF9E5]", accent: "text-[#9A6800]" },
  Saturday: { header: "bg-[#F3B61B]", row: "bg-[#FFF9E5]", accent: "text-[#9A6800]" },
  Sunday: { header: "bg-[#1688C5]", row: "bg-[#EAF7FD]", accent: "text-[#0877B4]" },
};

function getTodayName(): ScheduleDay {
  const dayIndex = new Date().getDay();
  return scheduleDays[(dayIndex + 6) % 7];
}

function getWeekDates() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(today.getDate() - mondayOffset);

  return Object.fromEntries(
    scheduleDays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return [
        day,
        date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      ];
    }),
  ) as Record<ScheduleDay, string>;
}

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
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [activeCategory, setActiveCategory] = useState<CategoryName>("All");
  const [activeDay, setActiveDay] = useState<ScheduleDay>(getTodayName);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllTrailers, setShowAllTrailers] = useState(false);
  const managedCategories = useAdminDisplayContent<AdminCategory[]>("aplus-admin-watch-categories", "aplus-published-watch-categories", []);
  const managedVideos = useAdminDisplayContent<AdminVideo[]>("aplus-admin-watch-videos", "aplus-published-watch-videos", []);
  const watchCopy = useAdminDisplayContent("aplus-admin-watch-copy", "aplus-published-watch-copy", defaultWatchCopy);
  const managedSchedule = useAdminDisplayContent<WeeklySchedule | null>("aplus-admin-watch-schedule", "aplus-published-watch-schedule", null);
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayName = getTodayName();
  const activeSchedule = managedSchedule?.[activeDay] ?? weeklySchedule[activeDay];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const effectiveCategories = managedCategories.length
    ? [{ name: "All" as CategoryName, icon: "/icons/taskbar/play.png" }, ...managedCategories.filter((category) => category.active && category.name !== "All").map((category) => ({ name: category.name as CategoryName, icon: category.icon }))]
    : categories;
  const effectivePrograms = managedVideos.length
    ? managedVideos.filter((video) => video.active && video.type === "Program").map((video) => ({ id: getVideoIdFromUrl(video.youtubeUrl), title: video.title, published: "Published by admin", category: video.category as CategoryName })).filter((video) => video.id)
    : programs;
  const effectiveTrailers = managedVideos.length
    ? managedVideos.filter((video) => video.active && video.type !== "Program").map((video) => ({ id: getVideoIdFromUrl(video.youtubeUrl), title: video.title, type: video.type, category: video.category as CategoryName })).filter((video) => video.id)
    : trailers;

  const filteredPrograms = useMemo(() => {
    return effectivePrograms.filter((program) => {
      const matchesTab = activeTab === "All" || activeTab === "Programs";
      const matchesCategory =
        activeCategory === "All" || program.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        program.title.toLowerCase().includes(normalizedSearch) ||
        program.category.toLowerCase().includes(normalizedSearch);

      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [activeCategory, activeTab, effectivePrograms, normalizedSearch]);

  const filteredTrailers = useMemo(() => {
    return effectiveTrailers.filter((trailer) => {
      const matchesTab =
        activeTab === "All" ||
        activeTab === "Trailers" ||
        (activeTab === "Shorts" && trailer.type === "Short");
      const excludesShortsFromTrailers =
        activeTab !== "Trailers" || trailer.type === "Trailer";
      const matchesCategory =
        activeCategory === "All" ||
        trailer.category === activeCategory ||
        (activeCategory === "Shorts" && trailer.type === "Short");
      const matchesSearch =
        !normalizedSearch ||
        trailer.title.toLowerCase().includes(normalizedSearch) ||
        trailer.category.toLowerCase().includes(normalizedSearch);

      return matchesTab && excludesShortsFromTrailers && matchesCategory && matchesSearch;
    });
  }, [activeCategory, activeTab, effectiveTrailers, normalizedSearch]);

  const visiblePrograms = showAllPrograms
    ? filteredPrograms
    : filteredPrograms.slice(0, 4);
  const visibleTrailers = showAllTrailers
    ? filteredTrailers
    : filteredTrailers.slice(0, 4);
  const showPrograms = activeTab === "All" || activeTab === "Programs";
  const showTrailers =
    activeTab === "All" || activeTab === "Trailers" || activeTab === "Shorts";
  const showCategories = activeTab !== "Schedules";
  const showSchedule = activeTab === "All" || activeTab === "Schedules";

  function selectCategory(category: CategoryName) {
    setActiveCategory(category);
    setShowAllPrograms(false);
    setShowAllTrailers(false);
    window.requestAnimationFrame(() => {
      document.getElementById("watch-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7FAFF] pt-[86px] text-[#071B63] laptop:pt-[132px]">
      <ScrollRevealObserver />
      <section className="px-5 pb-10 pt-8 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto grid max-w-[1720px] min-w-0 items-center gap-8 laptop:grid-cols-[0.92fr_1.08fr] laptop:gap-12">
          <div className="watch-mobile-width min-w-0 max-w-[720px]">
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#F04B23] shadow-[0_10px_24px_rgba(7,27,99,0.1)] tablet:text-[14px]">
              Dialog TV Channel 48
            </div>
            <h1 className="watch-mobile-width mt-5 whitespace-normal text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-[#102A56] tablet:text-[52px] laptop:text-[62px] desktop:text-[70px]">
              {watchCopy.pageTitle}
            </h1>
            <p className="watch-mobile-width mt-5 whitespace-normal text-[16px] font-medium leading-[1.35] text-[#30384f] tablet:max-w-[520px] tablet:text-[22px] laptop:mt-7 laptop:text-[25px]">
              {watchCopy.pageDescription}
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
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "All") setActiveCategory("All");
                    setShowAllPrograms(false);
                    setShowAllTrailers(false);
                  }}
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
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#F04B23] px-5 text-center text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(240,75,35,0.26)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
              >
                YouTube Channel
              </Link>
              <Link
                href={youtubeVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-center text-[13px] font-semibold text-[#0877EF] shadow-[0_12px_28px_rgba(7,27,99,0.1)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
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
              <p className="mt-1 text-[22px] font-semibold leading-none text-[#071B63] tablet:text-[30px]">
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
            <p className="text-[18px] font-medium text-[#F04B23] tablet:text-[22px]">
              YouTube Featured
            </p>
            <h2 className="mt-2 text-[32px] font-bold leading-[1.12] text-[#102A56] tablet:text-[44px] desktop:text-[50px]">
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
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#F04B23] px-10 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(240,75,35,0.25)] transition-transform hover:-translate-y-0.5 tablet:h-14 tablet:px-12"
            >
              Open Channel
            </Link>
          </div>
        </div>
      </section>

      <AdvertisementBanner />

      {showCategories ? (
      <section className="px-5 py-7 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-end tablet:justify-between">
            <h2 className="text-[28px] font-bold text-[#102A56] tablet:text-[34px]">
              {watchCopy.categoriesTitle}
            </h2>
            <p className="text-[14px] font-normal text-[#526382] tablet:text-[16px]">
              Showing: <span className="font-semibold text-[#0877EF]">{activeCategory}</span>
            </p>
          </div>

          <div className="mt-6 flex gap-3 overflow-x-auto px-1 pb-5 [scrollbar-width:none] tablet:gap-4 laptop:grid laptop:grid-cols-7 laptop:overflow-visible laptop:px-0 [&::-webkit-scrollbar]:hidden">
            {effectiveCategories.map((category) => (
              <button
                key={category.name}
                type="button"
                aria-pressed={activeCategory === category.name}
                onClick={() => selectCategory(category.name)}
                className={`group relative flex h-[112px] w-[126px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 text-center transition-all duration-300 hover:-translate-y-1 tablet:h-[126px] tablet:w-[150px] laptop:w-auto ${
                  activeCategory === category.name
                    ? "border-[#F04B23] bg-[linear-gradient(145deg,#FFF8F4,#FFF0E8)] shadow-[0_14px_32px_rgba(240,75,35,0.18)]"
                    : "border-[#E2ECF6] bg-white shadow-[0_10px_24px_rgba(26,61,103,0.08)] hover:border-[#B8D8F2] hover:shadow-[0_16px_32px_rgba(26,61,103,0.13)]"
                }`}
              >
                {activeCategory === category.name ? (
                  <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-[#F04B23] text-[11px] font-semibold text-white">✓</span>
                ) : null}
                {category.icon.startsWith("/") ? (
                  <Image
                    src={sitePath(category.icon)}
                    alt=""
                    width={86}
                    height={86}
                    className={`h-12 w-12 object-contain transition-transform group-hover:scale-105 tablet:h-14 tablet:w-14 ${
                      category.name === "All" ? "rounded-full bg-[#0877EF] p-3 brightness-0 invert" : ""
                    }`}
                  />
                ) : (
                  <span aria-hidden="true" className="grid h-12 w-12 place-items-center text-[32px] tablet:h-14 tablet:w-14 tablet:text-[38px]">{category.icon}</span>
                )}
                <span className="mt-2.5 text-[13px] font-semibold leading-tight text-[#102A56] tablet:text-[14px]">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      <div id="watch-results" className="scroll-mt-[150px]" />

      {showPrograms ? (
      <section className="px-5 py-4 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-bold text-[#102A56] tablet:text-[34px]">
              {watchCopy.programsTitle}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllPrograms((visible) => !visible)}
              className="rounded-full border border-[#CFE4F7] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0877EF] shadow-[0_8px_20px_rgba(7,27,99,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#87C5F5] tablet:text-[16px]"
            >
              {showAllPrograms ? "Show Less" : "View All"}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 tablet:grid-cols-2 laptop:grid-cols-3 laptop:gap-6 desktop:grid-cols-4 monitor:gap-7">
            {visiblePrograms.map((program) => (
              <Link
                key={program.title}
                href={youtubeUrl(program.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${program.title} on YouTube`}
                className="group overflow-hidden rounded-[22px] border border-[#DCE7F2] bg-white p-2.5 shadow-[0_10px_28px_rgba(24,54,94,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B7D8F4] hover:shadow-[0_18px_38px_rgba(24,54,94,0.14)]"
              >
                <div className="relative aspect-video overflow-hidden rounded-[17px] bg-[#DCEEFF]">
                  <Image
                    src={youtubeThumbnail(program.id)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#071B63]/45 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-[#075FAE] shadow-sm">
                    {program.category}
                  </span>
                  <span className="absolute inset-0 grid place-items-center opacity-90 transition-all group-hover:scale-105 group-hover:opacity-100">
                    <PlayIcon size="small" />
                  </span>
                </div>
                <div className="px-2 pb-2 pt-3.5">
                  <h3 className="line-clamp-2 min-h-[42px] text-[16px] font-semibold leading-[1.35] text-[#102A56]">
                    {program.title}
                  </h3>
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px] font-normal text-[#687894]">
                    <span>{program.published}</span>
                    <span className="font-medium text-[#0877EF]">Watch on YouTube →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {visiblePrograms.length === 0 ? (
            <p className="mt-7 rounded-[22px] bg-white p-7 text-center text-[16px] font-bold text-[#526382] shadow-[0_12px_28px_rgba(7,27,99,0.08)]">
              No programs found in {activeCategory}.
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {showTrailers ? (
      <section className="px-5 py-4 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-bold text-[#102A56] tablet:text-[34px]">
              {watchCopy.trailersTitle}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllTrailers((visible) => !visible)}
              className="rounded-full border border-[#CFE4F7] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#0877EF] shadow-[0_8px_20px_rgba(7,27,99,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#87C5F5] tablet:text-[16px]"
            >
              {showAllTrailers ? "Show Less" : "View All"}
            </button>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-5 tablet:grid-cols-2 laptop:grid-cols-3 laptop:gap-6 desktop:grid-cols-4 monitor:gap-7">
            {visibleTrailers.map((trailer) => (
              <Link
                key={trailer.title}
                href={youtubeUrl(trailer.id, trailer.type === "Short")}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-[22px] border border-[#DCE7F2] bg-white p-2.5 shadow-[0_10px_28px_rgba(24,54,94,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B7D8F4] hover:shadow-[0_18px_38px_rgba(24,54,94,0.14)]"
                aria-label={`Watch ${trailer.title} on YouTube`}
              >
                <span className="relative block aspect-video overflow-hidden rounded-[17px] bg-[#DCEEFF]">
                  <Image
                    src={youtubeThumbnail(trailer.id)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#071B63]/55 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-[#F04B23] shadow-sm">
                    {trailer.type} · {trailer.category}
                  </span>
                  <span className="absolute inset-0 grid place-items-center opacity-90 transition-transform group-hover:scale-105">
                    <PlayIcon size="small" />
                  </span>
                </span>
                <span className="line-clamp-2 min-h-[48px] px-2 pb-2 pt-3 text-[15px] font-semibold leading-[1.4] text-[#102A56]">
                  {trailer.title}
                </span>
              </Link>
            ))}
          </div>
          {visibleTrailers.length === 0 ? (
            <p className="mt-7 rounded-[22px] bg-white p-7 text-center text-[16px] font-bold text-[#526382] shadow-[0_12px_28px_rgba(7,27,99,0.08)]">
              No {activeTab === "Shorts" ? "shorts" : "trailers"} found in {activeCategory}.
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {showSchedule ? (
      <section className="px-5 pb-16 pt-8 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16">
        <div className="mx-auto max-w-[1640px]">
          <div className="rounded-[30px] bg-[linear-gradient(135deg,#102A56,#0877EF)] px-5 py-7 text-white shadow-[0_22px_55px_rgba(16,42,86,0.2)] tablet:px-8 desktop:px-10">
            <p className="text-[13px] font-medium text-white/75">Dialog TV · Channel 48</p>
            <h2 className="mt-1 text-[30px] font-bold tablet:text-[38px]">Weekly TV Schedule</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-normal leading-7 text-white/80 tablet:text-[17px]">
              Explore every day of the week. Today&apos;s schedule is highlighted for quick access.
            </p>
          </div>

          <div className="mt-7 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-end gap-1.5 border-b-2 border-[#D9E8F5] px-1 tablet:gap-2">
              {scheduleDays.map((day) => {
                const isActive = activeDay === day;
                const isToday = todayName === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(day)}
                    aria-pressed={isActive}
                    className={`relative min-w-[104px] rounded-t-[16px] border border-b-0 px-4 py-3 text-left transition-all tablet:min-w-[128px] tablet:px-5 ${
                      isActive
                        ? "-mb-0.5 bg-[#0877EF] text-white shadow-[0_-8px_22px_rgba(8,119,239,0.16)]"
                        : "bg-[#EEF5FB] text-[#344D70] hover:bg-[#DDECF8]"
                    }`}
                  >
                    <span className="block text-[13px] font-semibold tablet:text-[14px]">{day}</span>
                    <span className={`mt-0.5 block text-[10px] font-normal ${isActive ? "text-white/75" : "text-[#71809A]"}`}>
                      {weekDates[day]}{isToday ? " · Today" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <article className="mt-5 overflow-hidden rounded-[26px] border border-[#DCE7F2] bg-white shadow-[0_14px_36px_rgba(24,54,94,0.1)]">
            <header className={`${schedulePalette[activeDay].header} flex items-center justify-between gap-4 px-5 py-4 text-white tablet:px-7`}>
              <div>
                <h3 className="text-[23px] font-semibold tablet:text-[27px]">{activeDay}</h3>
                <p className="mt-0.5 text-[12px] font-normal text-white/80">{weekDates[activeDay]} · Full day schedule</p>
              </div>
              {todayName === activeDay ? (
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#F04B23]">Today</span>
              ) : null}
            </header>

            <div className={`${schedulePalette[activeDay].row} px-4 py-3 tablet:px-7 tablet:py-4`}>
              {activeSchedule.map((row, index) => (
                <div
                  key={`${activeDay}-${row.time}-${row.title}`}
                  className={`grid min-h-[52px] grid-cols-[76px_1fr] items-center gap-3 py-2.5 tablet:grid-cols-[112px_1fr] ${
                    index < activeSchedule.length - 1 ? "border-b border-white" : ""
                  }`}
                >
                  <time className={`text-[13px] font-semibold tablet:text-[14px] ${schedulePalette[activeDay].accent}`}>
                    {row.time}
                  </time>
                  <p className="text-[14px] font-medium leading-relaxed text-[#243B60] tablet:text-[16px]">
                    {row.title}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
      ) : null}
    </main>
  );
}
