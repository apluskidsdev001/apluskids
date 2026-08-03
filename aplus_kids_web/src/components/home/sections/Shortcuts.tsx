"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { defaultHomeLiveCard, defaultHomeShortcuts, type HomeLiveCard, type HomeShortcut } from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { sitePath } from "@/utils/sitePath";

const shortcutImages: Record<string, string> = {
  Birthdays: "/images/home/birthday pic.png",
  "Kids Champ": "/images/home/kids_champ.png",
};

export default function Shortcuts() {
  const managedShortcuts = useAdminDisplayContent<HomeShortcut[]>("aplus-admin-home-shortcuts", "aplus-published-home-shortcuts", defaultHomeShortcuts);
  const liveCard = useAdminDisplayContent<HomeLiveCard>("aplus-admin-home-live", "aplus-published-home-live", defaultHomeLiveCard);
  const shortcuts = managedShortcuts
    .filter((item) => item.active && (item.label === "Birthdays" || item.label === "Kids Champ"))
    .slice(0, 2);

  return (
    <section className="w-full overflow-x-clip bg-white px-5 pb-10 pt-3 tablet:px-8 tablet:pb-14">
      <div className="mx-auto w-full max-w-[1600px]">
        <div data-scroll-reveal="slide-right" className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold leading-none text-[#071B63] tablet:text-[28px]">Shortcuts</h2>
          <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] tablet:text-[15px]">View All</Link>
        </div>

        <div className="mt-6 grid gap-5 tablet:mt-8 tablet:grid-cols-3 tablet:gap-5 desktop:gap-7 monitor:gap-8">
          {shortcuts.map((shortcut, index) => (
            <Link
              key={shortcut.id}
              href={shortcut.href}
              data-scroll-reveal="pop"
              style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}
              className="group flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#E7EEF7] bg-white p-4 shadow-[0_18px_48px_rgba(7,27,99,0.09)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_58px_rgba(7,27,99,0.14)] tablet:min-h-[330px] tablet:p-5 desktop:min-h-[370px] desktop:rounded-[32px] desktop:p-6 monitor:min-h-[390px]"
            >
              <div className="relative min-h-[185px] flex-1 overflow-hidden rounded-[22px] bg-[linear-gradient(145deg,#F7FBFF,#EDF5FF)] tablet:min-h-[200px] desktop:min-h-[225px]">
                <Image src={sitePath(shortcutImages[shortcut.label] ?? shortcut.icon)} alt={shortcut.label} fill className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03] desktop:p-4" />
              </div>
              <div className="px-1 pb-1 pt-5">
                <h3 className="text-[20px] font-bold text-[#071B63] tablet:text-[22px] desktop:text-[25px]">{shortcut.label}</h3>
                <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-5 text-[#647797] tablet:text-[14px] desktop:text-[15px]">{shortcut.description || (shortcut.label === "Birthdays" ? defaultHomeShortcuts[0].description : defaultHomeShortcuts[1].description)}</p>
              </div>
            </Link>
          ))}

          <Link
            href={liveCard.linkUrl}
            data-scroll-reveal="pop"
            style={{ "--reveal-delay": "160ms" } as CSSProperties}
            className="group flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#E7EEF7] bg-white p-4 shadow-[0_18px_48px_rgba(7,27,99,0.09)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_58px_rgba(7,27,99,0.14)] tablet:min-h-[330px] tablet:p-5 desktop:min-h-[370px] desktop:rounded-[32px] desktop:p-6 monitor:min-h-[390px]"
          >
            <div className="relative min-h-[185px] flex-1 overflow-hidden rounded-[22px] bg-[#DDF3FF] tablet:min-h-[200px] desktop:min-h-[225px]">
              <video autoPlay muted loop playsInline className="h-full w-full object-cover"><source src={sitePath(liveCard.videoUrl)} type="video/mp4" /></video>
              <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(7,27,99,0.48))]" />
              <span className="absolute left-4 top-4 rounded-full bg-[#FF5733] px-3 py-1.5 text-[11px] font-bold text-white">{liveCard.badge}</span>
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-white/88 shadow-lg backdrop-blur"><span className="ml-1 h-0 w-0 border-y-[11px] border-l-[16px] border-y-transparent border-l-[#168DFF]" /></span></span>
              <span className="absolute bottom-4 left-4 text-[12px] font-bold text-white">{liveCard.nowLabel}: {liveCard.programName}</span>
            </div>
            <div className="px-1 pb-1 pt-5">
              <h3 className="text-[20px] font-bold text-[#071B63] tablet:text-[22px] desktop:text-[25px]">{liveCard.title}</h3>
              <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-5 text-[#647797] tablet:text-[14px] desktop:text-[15px]">{liveCard.description || defaultHomeLiveCard.description}</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
