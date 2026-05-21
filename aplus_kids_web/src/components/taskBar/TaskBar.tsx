"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const tabs = [
  {
    label: "Home",
    href: "/",
    icon: "/icons/taskbar/home.webp",
    slotSize: "w-[144px]",
  },
  {
    label: "Watch",
    href: "/watch",
    icon: "/icons/taskbar/watch.png",
    slotSize: "w-[144px]",
  },
  {
    label: "Kids Zone",
    href: "/kids-zone",
    icon: "/icons/taskbar/kidsZone.png",
    slotSize: "w-[168px]",
  },
  {
    label: "Market",
    href: "/market",
    icon: "/icons/taskbar/market.png",
    slotSize: "w-[144px]",
  },
  {
    label: "Info",
    href: "/info",
    icon: "/icons/taskbar/info.png",
    slotSize: "w-[124px]",
  },
];

const mobileTabs = [
  {
    label: "Home",
    href: "/",
    icon: "/icons/taskbar/home.webp",
  },
  {
    label: "Watch",
    href: "/watch",
    icon: "/icons/taskbar/watch.png",
  },
  {
    label: "Kids Zone",
    href: "/kids-zone",
    icon: "/icons/taskbar/kidsZone.png",
  },
  {
    label: "Market",
    href: "/market",
    icon: "/icons/taskbar/market.png",
  },
  {
    label: "More",
    href: "/info",
    icon: "/icons/taskbar/info.png",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function TaskIcon({
  src,
  alt,
  className = "h-8 w-8",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className={`${className} object-contain`}
    />
  );
}

function Logo() {
  return (
    <Image
      src="/icons/taskbar/logo.png"
      alt="A Plus Kids"
      width={148}
      height={74}
      priority
      className="h-[128px] w-[296px] object-contain"
    />
  );
}

export default function TaskBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (currentScrollY < 24) {
        setHidden(false);
      } else {
        setHidden(scrollingDown);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <header
      className={`fixed left-0 right-0 top-0 z-50 hidden bg-transparent px-4 py-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:block md:px-8 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="relative mx-auto max-w-[1840px]">
        <div className="pointer-events-none absolute -inset-x-3 -bottom-6 top-5 rounded-[38px] bg-[linear-gradient(180deg,rgba(163,220,255,0.34),rgba(87,190,255,0.16)_58%,rgba(87,190,255,0))] blur-2xl" />
        <nav className="relative flex h-[92px] items-center gap-4 overflow-hidden rounded-[30px] border border-white/65 bg-white/38 px-7 shadow-[0_20px_54px_rgba(33,150,243,0.2),0_6px_20px_rgba(7,27,99,0.1),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-18px_34px_rgba(117,197,255,0.14)] backdrop-blur-2xl backdrop-saturate-150 md:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.34)_34%,rgba(110,205,255,0.18)_68%,rgba(255,255,255,0.42)_100%)]" />
          <div className="pointer-events-none absolute inset-x-6 top-2 h-9 rounded-full bg-white/55 blur-xl" />
          <div className="pointer-events-none absolute -left-12 top-1/2 h-28 w-56 -translate-y-1/2 rounded-full bg-[#7fd6ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-1/2 h-24 w-64 -translate-y-1/2 rounded-full bg-white/35 blur-3xl" />
        <Link
          href="/"
          aria-label="A Plus Kids home"
          className="relative z-10 mr-12 flex shrink-0 items-center lg:mr-24"
        >
          <Logo />
        </Link>

        <div className="relative z-10 flex flex-1 items-center justify-center gap-4">
          {tabs.map((tab) => {
            const active = isActivePath(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`group relative flex h-14 ${tab.slotSize} shrink-0 items-center justify-center gap-3 overflow-hidden rounded-[28px] border text-[15px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_20px_rgba(33,150,243,0.08)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ${
                  active
                    ? "border-white/40 bg-white/20 text-white"
                    : "border-white/55 bg-white/36 text-[#081944] hover:border-white/80 hover:bg-white/52 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(33,150,243,0.14)]"
                }`}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18)_52%,rgba(122,208,255,0.16))]" />
                <span className="pointer-events-none absolute inset-x-4 top-1 h-5 rounded-full bg-white/45 blur-md" />
                {active ? (
                  <span className="absolute inset-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(15,124,255,0.92),rgba(53,189,255,0.86))] liquid-tab" />
                ) : null}
                <span className="relative z-10">
                  <TaskIcon src={tab.icon} alt="" />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="relative z-10 ml-8 flex shrink-0 items-center gap-4 lg:ml-16">
          <Link
            href="/search"
            aria-label="Search"
            className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(33,150,243,0.1)] backdrop-blur-xl backdrop-saturate-150 transition-all ${
              isActivePath(pathname, "/search")
                ? "border-white/45 bg-[#0877ef]/82"
                : "border-white/55 bg-white/36 hover:border-white/80 hover:bg-white/54"
            }`}
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(255,255,255,0.16)_58%,rgba(122,208,255,0.18))]" />
            <TaskIcon
              src="/icons/taskbar/search.png"
              alt=""
              className="relative z-10 h-7 w-7 opacity-50 hover:opacity-100"
            />
          </Link>

          <Link
            href="/watch"
            className="relative flex h-14 shrink-0 items-center gap-3 overflow-hidden rounded-[28px] border border-white/50 bg-[#ffc736]/88 px-7 text-[15px] font-medium text-[#081944] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_22px_rgba(255,190,24,0.18)] backdrop-blur-xl backdrop-saturate-150 transition-all hover:bg-[#ffbd18]/92"
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42),rgba(255,255,255,0.12)_48%,rgba(255,255,255,0.3))]" />
            <span className="relative z-10 grid h-10 w-10 place-items-center rounded-2xl bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md">
              <TaskIcon
                src="/icons/taskbar/live.png"
                alt=""
                className="h-8 w-8"
              />
            </span>
            <span className="relative z-10">Live</span>
          </Link>

          <Link
            href="/profile"
            aria-label="Profile"
            className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/55 bg-white/36 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(33,150,243,0.1)] backdrop-blur-xl backdrop-saturate-150 transition-transform hover:scale-105 hover:border-white/80 hover:bg-white/54"
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(255,255,255,0.16)_58%,rgba(122,208,255,0.18))]" />
            <TaskIcon
              src="/icons/taskbar/profile.png"
              alt=""
              className="relative z-10 h-9 w-9"
            />
          </Link>
        </div>
        </nav>
      </div>
    </header>

    <header className="fixed left-0 right-0 top-0 z-50 bg-white/78 px-5 py-4 backdrop-blur-xl md:hidden">
      <Link href="/" aria-label="A Plus Kids home" className="inline-flex">
        <Image
          src="/icons/taskbar/logo.png"
          alt="A Plus Kids"
          width={92}
          height={46}
          priority
          className="h-[46px] w-[92px] object-contain"
        />
      </Link>
    </header>

    <nav className="fixed inset-x-3 bottom-3 z-50 grid h-[74px] grid-cols-5 rounded-[24px] border border-white/80 bg-white/86 px-2 shadow-[0_12px_34px_rgba(7,27,99,0.16)] backdrop-blur-xl md:hidden">
      {mobileTabs.map((tab) => {
        const active = isActivePath(pathname, tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] text-[11px] font-medium ${
              active ? "bg-[#0877ef] text-white" : "text-[#081944]"
            }`}
          >
            <TaskIcon
              src={tab.icon}
              alt=""
              className={`h-6 w-6 ${active ? "" : "opacity-80"}`}
            />
            <span className="max-w-full truncate">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
