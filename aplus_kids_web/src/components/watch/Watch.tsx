"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AdvertisementBanner from "@/components/Advertisements/AdvertisementBox";
import ScrollRevealObserver from "@/components/animations/ScrollRevealObserver";
import {
  defaultWeeklySchedule,
  type AdminCategory,
  type AdminVideo,
  type ScheduleEntry,
  type WeeklySchedule,
} from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { sitePath } from "@/utils/sitePath";

const filterTabs = [
  "All",
  "Programs",
  "Trailers",
  "Shorts",
  "Schedules",
] as const;
type FilterTab = (typeof filterTabs)[number];
type CategoryName =
  | "All"
  | "Stories"
  | "Education"
  | "Songs & Rhymes"
  | "Events"
  | "Shorts"
  | "TV Programs";
const youtubeChannelUrl =
  "https://www.youtube.com/@Apluskidstvofficial/featured";
const youtubeVideosUrl = "https://www.youtube.com/@Apluskidstvofficial/videos";

const defaultWatchCopy = {
  pageTitle: "Watch A Plus Kids TV",
  pageDescription:
    "Sinhala stories, learning clips, shorts and TV moments for little viewers.",
  channelLabel: "Dialog TV Channel 48",
  searchPlaceholder: "Search stories, programs and shorts ...",
  youtubeChannelLabel: "YouTube Channel",
  latestVideosLabel: "Latest Videos",
  programsTitle: "Program Listing",
  trailersTitle: "Trailers / Shorts",
  categoriesTitle: "Categories",
  scheduleTitle: "Weekly TV Schedule",
  scheduleDescription:
    "Explore every day of the week. Today's schedule is highlighted for quick access.",
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
] satisfies {
  id: string;
  title: string;
  published: string;
  category: CategoryName;
}[];

const trailers = [
  {
    id: "AuECsoil4fI",
    title: "Uncle Toy - Program Preview",
    type: "Trailer",
    category: "TV Programs",
  },
  {
    id: "RVZCGcopMqs",
    title: "සන්නිවේදන පාඨමාලාව",
    type: "Trailer",
    category: "Events",
  },
  {
    id: "ojGQDDwsuJY",
    title: "දරුවන් සහ ප්‍රායෝගික විෂයන්",
    type: "Short",
    category: "Education",
  },
  {
    id: "Cv8byvv8s1c",
    title: "දරුවන් සමඟ හැඟීම් බෙදාගනිමු",
    type: "Short",
    category: "Education",
  },
  {
    id: "znycONLs_V8",
    title: "දරුවන්ගේ මුදල් කළමනාකරණය",
    type: "Short",
    category: "Education",
  },
  {
    id: "H_OVirQDOvE",
    title: "දරුවන්ගේ ලෝකයේ වීරවරු",
    type: "Short",
    category: "Stories",
  },
  {
    id: "gQKbGLVY9Wk",
    title: "Story Line Trailer",
    type: "Trailer",
    category: "Stories",
  },
  {
    id: "GUE2gm3AFBI",
    title: "Story Line - Official Trailer",
    type: "Trailer",
    category: "Stories",
  },
  {
    id: "v9-GdWZaP5c",
    title: "A Plus Radio Coming Soon",
    type: "Trailer",
    category: "Songs & Rhymes",
  },
  {
    id: "MXLiDMRQKdQ",
    title: "Birthday Excitement",
    type: "Trailer",
    category: "Events",
  },
  {
    id: "ijwVl4EzQFM",
    title: "Professor O2 - This Week",
    type: "Trailer",
    category: "Education",
  },
  {
    id: "_LAIfzySxFo",
    title: "A Plus Kids TV - 24/7",
    type: "Trailer",
    category: "TV Programs",
  },
  {
    id: "qpRJegxOCo8",
    title: "Uncle Toy Christmas Song",
    type: "Trailer",
    category: "Songs & Rhymes",
  },
  {
    id: "PVgC_gi9Dzo",
    title: "Five Little Ducks",
    type: "Short",
    category: "Songs & Rhymes",
  },
] satisfies {
  id: string;
  title: string;
  type: "Trailer" | "Short";
  category: CategoryName;
}[];

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

const schedulePalette: Record<
  ScheduleDay,
  {
    header: string;
    row: string;
    accent: string;
    soft: string;
    selected: string;
    current: string;
  }
> = {
  Monday: {
    header: "bg-[#EF4444]",
    row: "bg-[#FFF1F2]",
    accent: "text-[#BE123C]",
    soft: "bg-[#FFE4E6] text-[#BE123C]",
    selected:
      "ring-2 ring-inset ring-[#EF4444] shadow-[0_12px_30px_rgba(239,68,68,0.16)]",
    current: "bg-[#FFE4E6] shadow-[0_10px_26px_rgba(239,68,68,0.12)]",
  },
  Tuesday: {
    header: "bg-[#F97316]",
    row: "bg-[#FFF7ED]",
    accent: "text-[#C2410C]",
    soft: "bg-[#FFEDD5] text-[#C2410C]",
    selected:
      "ring-2 ring-inset ring-[#F97316] shadow-[0_12px_30px_rgba(249,115,22,0.16)]",
    current: "bg-[#FFEDD5] shadow-[0_10px_26px_rgba(249,115,22,0.12)]",
  },
  Wednesday: {
    header: "bg-[#EAB308]",
    row: "bg-[#FEFCE8]",
    accent: "text-[#854D0E]",
    soft: "bg-[#FEF9C3] text-[#854D0E]",
    selected:
      "ring-2 ring-inset ring-[#EAB308] shadow-[0_12px_30px_rgba(234,179,8,0.16)]",
    current: "bg-[#FEF9C3] shadow-[0_10px_26px_rgba(234,179,8,0.12)]",
  },
  Thursday: {
    header: "bg-[#22C55E]",
    row: "bg-[#F0FDF4]",
    accent: "text-[#15803D]",
    soft: "bg-[#DCFCE7] text-[#15803D]",
    selected:
      "ring-2 ring-inset ring-[#22C55E] shadow-[0_12px_30px_rgba(34,197,94,0.16)]",
    current: "bg-[#DCFCE7] shadow-[0_10px_26px_rgba(34,197,94,0.12)]",
  },
  Friday: {
    header: "bg-[#3B82F6]",
    row: "bg-[#EFF6FF]",
    accent: "text-[#1D4ED8]",
    soft: "bg-[#DBEAFE] text-[#1D4ED8]",
    selected:
      "ring-2 ring-inset ring-[#3B82F6] shadow-[0_12px_30px_rgba(59,130,246,0.16)]",
    current: "bg-[#DBEAFE] shadow-[0_10px_26px_rgba(59,130,246,0.12)]",
  },
  Saturday: {
    header: "bg-[#6366F1]",
    row: "bg-[#EEF2FF]",
    accent: "text-[#4338CA]",
    soft: "bg-[#E0E7FF] text-[#4338CA]",
    selected:
      "ring-2 ring-inset ring-[#6366F1] shadow-[0_12px_30px_rgba(99,102,241,0.16)]",
    current: "bg-[#E0E7FF] shadow-[0_10px_26px_rgba(99,102,241,0.12)]",
  },
  Sunday: {
    header: "bg-[#A855F7]",
    row: "bg-[#FAF5FF]",
    accent: "text-[#7E22CE]",
    soft: "bg-[#F3E8FF] text-[#7E22CE]",
    selected:
      "ring-2 ring-inset ring-[#A855F7] shadow-[0_12px_30px_rgba(168,85,247,0.16)]",
    current: "bg-[#F3E8FF] shadow-[0_10px_26px_rgba(168,85,247,0.12)]",
  },
};

function scheduleTimeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.trim().replace(":", ".").split(".");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  return Number.isFinite(parsedHours) && Number.isFinite(parsedMinutes)
    ? parsedHours * 60 + parsedMinutes
    : Number.POSITIVE_INFINITY;
}

function findCurrentScheduleEntry(
  entries: ScheduleEntry[],
  nowMinutes: number,
) {
  const ordered = [...entries].sort(
    (a, b) => scheduleTimeToMinutes(a.time) - scheduleTimeToMinutes(b.time),
  );
  return (
    [...ordered]
      .reverse()
      .find((entry) => scheduleTimeToMinutes(entry.time) <= nowMinutes) ??
    ordered[0]
  );
}

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
      preload="auto"
      disablePictureInPicture
      className="block h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export default function Watch() {
  const scheduleListRef = useRef<HTMLDivElement>(null);
  const dayTabsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [activeCategory, setActiveCategory] = useState<CategoryName>("All");
  const [activeDay, setActiveDay] = useState<ScheduleDay>(getTodayName);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllTrailers, setShowAllTrailers] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [nowMinutes, setNowMinutes] = useState(
    () => new Date().getHours() * 60 + new Date().getMinutes(),
  );
  const managedCategories = useAdminDisplayContent<AdminCategory[]>(
    "aplus-admin-watch-categories",
    "aplus-published-watch-categories",
    [],
  );
  const managedVideos = useAdminDisplayContent<AdminVideo[]>(
    "aplus-admin-watch-videos",
    "aplus-published-watch-videos",
    [],
  );
  const storedWatchCopy = useAdminDisplayContent(
    "aplus-admin-watch-copy",
    "aplus-published-watch-copy",
    defaultWatchCopy,
  );
  const watchCopy = { ...defaultWatchCopy, ...storedWatchCopy };
  const managedSchedule = useAdminDisplayContent<WeeklySchedule | null>(
    "aplus-admin-watch-schedule",
    "aplus-published-watch-schedule",
    null,
  );
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayName = getTodayName();
  const activeSchedule =
    managedSchedule?.[activeDay] ?? defaultWeeklySchedule[activeDay];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const effectiveCategories = managedCategories.length
    ? [
        { name: "All" as CategoryName, icon: "/icons/taskbar/play.png" },
        ...managedCategories
          .filter((category) => category.active && category.name !== "All")
          .map((category) => ({
            name: category.name as CategoryName,
            icon: category.icon,
          })),
      ]
    : categories;
  const effectivePrograms = managedVideos.length
    ? managedVideos
        .filter((video) => video.active && video.type === "Program")
        .map((video) => ({
          id: getVideoIdFromUrl(video.youtubeUrl),
          title: video.title,
          published: "Published by admin",
          category: video.category as CategoryName,
        }))
        .filter((video) => video.id)
    : programs;
  const effectiveTrailers = managedVideos.length
    ? managedVideos
        .filter((video) => video.active && video.type !== "Program")
        .map((video) => ({
          id: getVideoIdFromUrl(video.youtubeUrl),
          title: video.title,
          type: video.type,
          category: video.category as CategoryName,
        }))
        .filter((video) => video.id)
    : trailers;
  const currentScheduleEntry = findCurrentScheduleEntry(
    managedSchedule?.[todayName] ?? defaultWeeklySchedule[todayName],
    nowMinutes,
  );
  const selectedScheduleEntry =
    activeSchedule.find((entry) => entry.id === selectedScheduleId) ??
    (activeDay === todayName ? currentScheduleEntry : activeSchedule[0]);
  const autoFocusScheduleId =
    activeDay === todayName ? currentScheduleEntry?.id : activeSchedule[0]?.id;
  const selectedScheduleVideoId = selectedScheduleEntry
    ? getVideoIdFromUrl(selectedScheduleEntry.youtubeUrl ?? "") ||
      effectivePrograms.find(
        (program) =>
          program.title.toLowerCase() ===
          selectedScheduleEntry.title.toLowerCase(),
      )?.id ||
      programs.find(
        (program) =>
          program.title.toLowerCase() ===
          selectedScheduleEntry.title.toLowerCase(),
      )?.id ||
      ""
    : "";

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const list = scheduleListRef.current;
      const target = autoFocusScheduleId
        ? list?.querySelector<HTMLElement>(
            `[data-schedule-id="${autoFocusScheduleId}"]`,
          )
        : null;
      if (list && target) {
        const firstRow = list.querySelector<HTMLElement>("[data-schedule-id]");
        const top = target.offsetTop - (firstRow?.offsetTop ?? 0);
        list.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      }

      const tabs = dayTabsRef.current;
      const activeTabElement = tabs?.querySelector<HTMLElement>(
        `[data-schedule-day="${activeDay}"]`,
      );
      if (tabs && activeTabElement) {
        const left =
          activeTabElement.offsetLeft -
          tabs.clientWidth / 2 +
          activeTabElement.clientWidth / 2;
        tabs.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeDay, autoFocusScheduleId]);

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

      return (
        matchesTab &&
        excludesShortsFromTrailers &&
        matchesCategory &&
        matchesSearch
      );
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
        <div className="mx-auto grid max-w-[1720px] min-w-0 items-center gap-8 laptop:grid-cols-2 laptop:gap-12">
          <div className="watch-mobile-width min-w-0 max-w-[720px]">
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#F04B23] shadow-[0_10px_24px_rgba(7,27,99,0.1)] tablet:text-[14px]">
              {watchCopy.channelLabel}
            </div>
            <h1 className="watch-mobile-width mt-5 whitespace-normal text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-[#102A56] tablet:text-[52px] laptop:text-[58px] desktop:text-[62px] monitor:whitespace-nowrap monitor:text-[68px]">
              {watchCopy.pageTitle}
            </h1>
            <p className="watch-mobile-width mt-5 whitespace-normal text-[16px] font-medium leading-[1.35] text-[#30384f] tablet:max-w-[520px] tablet:text-[22px] laptop:mt-7 laptop:text-[25px]">
              {watchCopy.pageDescription}
            </p>

            <form
              className="watch-mobile-width mt-5 flex h-[58px] items-center rounded-full bg-[#E7E7E7] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] tablet:mt-6 tablet:h-[66px] laptop:mt-5 laptop:max-w-[610px]"
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
                placeholder={watchCopy.searchPlaceholder}
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

            <div className="watch-mobile-width mt-5 tablet:mt-6">
              <div
                data-focus-strip
                className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    data-focus-item
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
            </div>

            <div className="watch-mobile-width mt-6 grid grid-cols-2 gap-3 tablet:flex tablet:flex-wrap">
              <Link
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#F04B23] px-5 text-center text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(240,75,35,0.26)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
              >
                {watchCopy.youtubeChannelLabel}
              </Link>
              <Link
                href={youtubeVideosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-center text-[13px] font-semibold text-[#0877EF] shadow-[0_12px_28px_rgba(7,27,99,0.1)] transition-transform hover:-translate-y-0.5 tablet:px-7 tablet:text-[15px]"
              >
                {watchCopy.latestVideosLabel}
              </Link>
            </div>
          </div>

          <div className="watch-mobile-width relative aspect-video min-w-0 overflow-hidden rounded-[10px] tablet:rounded-[12px]">
            <KeyedHeroVideo src={sitePath("/videos/watch/watchhero.mp4")} />
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
              <source
                src={sitePath("/videos/home/hero_video.mp4")}
                type="video/mp4"
              />
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
                Showing:{" "}
                <span className="font-semibold text-[#0877EF]">
                  {activeCategory}
                </span>
              </p>
            </div>

            <div
              data-focus-strip
              className="mt-6 flex gap-3 overflow-x-auto px-1 pb-5 [scrollbar-width:none] tablet:gap-4 laptop:grid laptop:grid-cols-7 laptop:overflow-visible laptop:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {effectiveCategories.map((category) => (
                <button
                  key={category.name}
                  data-focus-item
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
                    <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-[#F04B23] text-[11px] font-semibold text-white">
                      ✓
                    </span>
                  ) : null}
                  {category.icon.startsWith("/") ? (
                    <Image
                      src={sitePath(category.icon)}
                      alt=""
                      width={86}
                      height={86}
                      className={`h-12 w-12 object-contain transition-transform group-hover:scale-105 tablet:h-14 tablet:w-14 ${
                        category.name === "All"
                          ? "rounded-full bg-[#0877EF] p-3 brightness-0 invert"
                          : ""
                      }`}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 place-items-center text-[32px] tablet:h-14 tablet:w-14 tablet:text-[38px]"
                    >
                      {category.icon}
                    </span>
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
        <section
          id="watch-trailers"
          className="scroll-mt-32 px-5 py-4 tablet:px-7 laptop:px-10 desktop:px-14 monitor:px-16"
        >
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
                      <span className="font-medium text-[#0877EF]">
                        Watch on YouTube →
                      </span>
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
                No {activeTab === "Shorts" ? "shorts" : "trailers"} found in{" "}
                {activeCategory}.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {showSchedule ? (
        <section className="scroll-mt-[92px] px-5 py-4 tablet:px-7 laptop:scroll-mt-[132px] laptop:px-10 desktop:px-14 monitor:px-16">
          <div className="mx-auto flex h-[calc(100svh-112px)] min-h-[650px] max-h-[900px] max-w-[1640px] flex-col laptop:h-[calc(100svh-148px)] laptop:min-h-[620px]">
            <div
              className={`relative shrink-0 overflow-hidden rounded-[24px] px-6 py-4 transition-all duration-500 tablet:px-8 tablet:py-5 ${schedulePalette[activeDay].row} ${schedulePalette[activeDay].selected}`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-2 ${schedulePalette[activeDay].header}`}
              />
              <p
                className={`text-[12px] font-bold uppercase tracking-[0.16em] ${schedulePalette[activeDay].accent}`}
              >
                Dialog TV · Channel 48
              </p>
              <h2 className="mt-1 text-[25px] font-bold text-[#102A56] tablet:text-[31px]">
                {watchCopy.scheduleTitle}
              </h2>
              <p className="mt-1 hidden max-w-2xl text-[12px] font-medium text-[#647797] tablet:block tablet:text-[13px]">
                {watchCopy.scheduleDescription}
              </p>
            </div>

            <div
              ref={dayTabsRef}
              data-focus-strip
              className="z-10 mt-4 shrink-0 overflow-x-auto pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex min-w-max items-center gap-2 px-1 tablet:gap-3">
                {scheduleDays.map((day) => {
                  const isActive = activeDay === day;
                  const isToday = todayName === day;

                  return (
                    <button
                      key={day}
                      data-focus-item
                      data-schedule-day={day}
                      type="button"
                      onClick={() => {
                        setActiveDay(day);
                        setSelectedScheduleId(null);
                      }}
                      aria-pressed={isActive}
                      className={`relative min-w-[112px] rounded-[20px] px-4 py-3 text-left transition-all duration-300 tablet:min-w-[132px] tablet:px-5 ${
                        isActive
                          ? `${schedulePalette[day].soft} ${schedulePalette[day].selected} -translate-y-1`
                          : `${schedulePalette[day].soft} opacity-85 hover:-translate-y-0.5 hover:opacity-100`
                      }`}
                    >
                      <span className="block text-[13px] font-semibold tablet:text-[14px]">
                        {day}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] font-normal ${isActive ? "opacity-70" : "text-[#71809A]"}`}
                      >
                        {weekDates[day]}
                        {isToday ? " · Today" : ""}
                      </span>
                      {isActive ? (
                        <span
                          className={`absolute inset-x-5 bottom-0 h-1 rounded-full ${schedulePalette[day].header}`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <article className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_85%_8%,rgba(255,255,255,0.98),transparent_34%),linear-gradient(135deg,#F1F7FF_0%,#FFFFFF_48%,#F7F2FF_100%)] shadow-[0_24px_70px_rgba(24,54,94,0.1)]">
              <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 tablet:px-7">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-11 w-2 rounded-full ${schedulePalette[activeDay].header}`}
                  />
                  <div>
                    <h3 className="text-[20px] font-bold text-[#102A56] tablet:text-[23px]">
                      {activeDay}
                    </h3>
                    <p className="mt-0.5 text-[12px] font-medium text-[#71819A]">
                      {weekDates[activeDay]} · Full day schedule
                    </p>
                  </div>
                </div>
                {todayName === activeDay ? (
                  <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#F04B23] shadow-[0_8px_22px_rgba(7,27,99,0.09)]">
                    Today
                  </span>
                ) : null}
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 tablet:gap-4 tablet:px-4 tablet:pb-4 laptop:grid laptop:grid-cols-[minmax(340px,0.86fr)_minmax(0,1.14fr)] laptop:gap-5 desktop:px-5 desktop:pb-5">
                <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white/72 shadow-[0_16px_38px_rgba(24,54,94,0.07)] backdrop-blur-xl laptop:order-1">
                  <div className="shrink-0 px-5 pb-2 pt-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#71819A]">
                      Daily timetable
                    </p>
                    <p className="text-[11px] text-[#536985] tablet:text-[12px]">
                      Scroll inside this list to explore the full day.
                    </p>
                  </div>
                  <div
                    ref={scheduleListRef}
                    data-focus-list
                    className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-1 before:absolute before:bottom-4 before:left-[31px] before:top-2 before:w-px before:bg-[linear-gradient(180deg,transparent,#C9D9EA_12%,#C9D9EA_88%,transparent)] [scrollbar-color:#B8CAE0_transparent] [scrollbar-width:thin] tablet:px-4"
                  >
                    {activeSchedule.map((row) => {
                      const isCurrent =
                        activeDay === todayName &&
                        row.id === currentScheduleEntry?.id;
                      const isSelected = row.id === selectedScheduleEntry?.id;
                      return (
                        <button
                          key={row.id}
                          data-schedule-id={row.id}
                          data-focus-row
                          type="button"
                          onClick={() => setSelectedScheduleId(row.id)}
                          aria-pressed={isSelected}
                          className={`relative z-[1] mb-2 grid min-h-[66px] w-full grid-cols-[16px_72px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[20px] px-3 py-2.5 text-left transition-all duration-300 tablet:grid-cols-[16px_88px_minmax(0,1fr)_auto] tablet:px-4 ${
                            isCurrent && isSelected
                              ? `${schedulePalette[activeDay].current} ${schedulePalette[activeDay].selected} -translate-y-0.5`
                              : isCurrent
                                ? schedulePalette[activeDay].current
                                : isSelected
                                  ? `bg-white ${schedulePalette[activeDay].selected} -translate-y-0.5`
                                  : "bg-white/45 hover:-translate-y-0.5 hover:bg-white/82 hover:shadow-[0_10px_24px_rgba(24,54,94,0.08)]"
                          }`}
                        >
                          <span
                            className={`relative grid h-4 w-4 place-items-center rounded-full ${schedulePalette[activeDay].header} shadow-[0_0_0_5px_rgba(255,255,255,0.9)]`}
                          >
                            {isCurrent ? (
                              <span className="absolute h-4 w-4 animate-ping rounded-full bg-current opacity-30" />
                            ) : null}
                          </span>
                          <time
                            className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-[12px] font-bold tablet:text-[13px] ${schedulePalette[activeDay].soft}`}
                          >
                            {row.time}
                          </time>
                          <span className="min-w-0 text-[14px] font-semibold leading-snug text-[#243B60] tablet:text-[15px]">
                            {row.title}
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            {isCurrent ? (
                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${schedulePalette[activeDay].soft}`}
                              >
                                Now
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase text-white ${schedulePalette[activeDay].header}`}
                              >
                                Selected
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`order-1 flex h-[340px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[24px] bg-white tablet:h-[390px] laptop:order-2 laptop:h-full laptop:min-h-0 laptop:rounded-[28px] ${schedulePalette[activeDay].selected}`}
                >
                  <div className="min-h-0 flex-1 bg-[#071B63]">
                    <div className="h-full w-full overflow-hidden bg-[#071B63]">
                      {selectedScheduleVideoId ? (
                        <iframe
                          key={selectedScheduleVideoId}
                          title={`${selectedScheduleEntry?.title ?? "Schedule program"} video`}
                          src={`https://www.youtube.com/embed/${selectedScheduleVideoId}?rel=0`}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_35%,#21488D,#071B63_72%)] px-8 text-center text-[13px] font-medium text-white/75">
                          <span>
                            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/12 text-[22px]">
                              ▶
                            </span>
                            Add this program&apos;s YouTube URL from Watch Admin
                            to show its video here.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 bg-white px-5 py-4 tablet:px-6 desktop:px-7">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeDay === todayName &&
                      selectedScheduleEntry?.id === currentScheduleEntry?.id ? (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${schedulePalette[activeDay].soft}`}
                        >
                          Now Playing
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#E8F3FF] px-3 py-1 text-[11px] font-bold text-[#0877EF]">
                          Selected Program
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${schedulePalette[activeDay].soft}`}
                      >
                        {activeDay}
                      </span>
                    </div>
                    <h4 className="mt-2 line-clamp-1 text-[19px] font-bold text-[#102A56] tablet:text-[22px] desktop:text-[24px]">
                      {selectedScheduleEntry?.title ?? "Select a program"}
                    </h4>
                    <p className="text-[12px] font-medium text-[#67809F] tablet:text-[13px]">
                      {selectedScheduleEntry?.time ?? "--.--"} ·{" "}
                      {weekDates[activeDay]}
                    </p>
                    {activeDay === todayName &&
                    currentScheduleEntry &&
                    selectedScheduleEntry?.id !== currentScheduleEntry.id ? (
                      <p
                        className={`mt-2 line-clamp-1 rounded-[12px] px-3 py-2 text-[11px] font-medium ${schedulePalette[activeDay].soft}`}
                      >
                        Currently live: {currentScheduleEntry.time} ·{" "}
                        {currentScheduleEntry.title}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
