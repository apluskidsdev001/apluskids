import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { sitePath } from "@/utils/sitePath";

const shortcuts = [
  {
    label: "Gallery",
    href: "/gallery",
    icon: "/icons/shortcuts/gallery.png",
  },
  {
    label: "Birthdays",
    href: "/birthdays",
    icon: "/icons/shortcuts/cake.png",
  },
  {
    label: "Kids Champ",
    href: "/kids-zone",
    icon: "/icons/shortcuts/KidsChamp.png",
  },
  {
    label: "Market",
    href: "/market",
    icon: "/icons/shortcuts/market.png",
  },
];

export default function Shortcuts() {
  return (
    <section className="w-full overflow-x-clip bg-white px-5 pb-7 pt-2 tablet:px-8 tablet:pb-12">
      <div className="mx-auto grid w-full max-w-[1720px] min-w-0 items-start gap-8 desktop:grid-cols-[minmax(0,1fr)_minmax(480px,536px)] desktop:gap-10 monitor:gap-14">
        <div className="min-w-0">
          <div data-scroll-reveal="slide-right" className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold leading-none tracking-normal text-[#071B63] tablet:text-[28px]">
              Shortcuts
            </h2>
            <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] tablet:hidden">
              View All
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 tablet:mt-8 tablet:grid-cols-4 tablet:gap-4 desktop:gap-5 monitor:gap-8">
            {shortcuts.map((shortcut, index) => (
              <Link
                key={shortcut.label}
                href={shortcut.href}
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties}
                className="group flex h-[112px] min-w-0 flex-col items-center justify-center rounded-[14px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,247,255,0.88))] px-2 shadow-[0_12px_28px_rgba(7,27,99,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(7,27,99,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] tablet:h-[150px] tablet:rounded-[24px] tablet:px-4 desktop:h-[220px] desktop:w-full monitor:h-[250px] monitor:rounded-[30px]"
              >
                <Image
                  src={sitePath(shortcut.icon)}
                  alt=""
                  width={78}
                  height={78}
                  className="h-[42px] w-[42px] object-contain transition-transform duration-300 group-hover:scale-105 tablet:h-[68px] tablet:w-[68px] desktop:h-[82px] desktop:w-[82px] monitor:h-[96px] monitor:w-[96px]"
                />
                <span className="mt-3 text-center text-[12px] font-bold leading-tight text-[#071B63] tablet:mt-4 tablet:text-[16px] desktop:mt-6 desktop:text-[19px] monitor:mt-7 monitor:text-[22px]">
                  {shortcut.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside
          data-scroll-reveal="slide-left"
          style={{ "--reveal-delay": "220ms" } as CSSProperties}
          className="relative hidden h-[320px] min-w-0 overflow-hidden rounded-[36px] bg-[#0C84E8] px-8 py-10 text-white shadow-[0_24px_54px_rgba(12,132,232,0.24)] desktop:mt-[60px] desktop:block monitor:h-[350px] monitor:rounded-[42px] monitor:px-11 monitor:py-12"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-[27px] font-bold leading-none">Watch Live</h3>
            <span className="rounded-full bg-[#ff5a36] px-4 py-1.5 text-[17px] font-bold leading-none">
              Live
            </span>
          </div>

          <div className="mt-12 w-[200px]">
            <p className="text-[17px] font-bold leading-none text-white/90">
              Now Playing
            </p>
            <p className="mt-4 text-[25px] font-bold leading-none">
              Kids Champ
            </p>

            <Link
              href="/watch"
              className="mt-6 inline-flex h-11 items-center gap-3 rounded-full bg-[#ffc20a] px-4 text-[14px] font-medium text-[#081944] shadow-[0_10px_22px_rgba(8,25,68,0.16)]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
                <span className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-[#071B63]" />
              </span>
              Watch Live Now
            </Link>
          </div>

          <Link
            href="/watch"
            aria-label="Watch Kids Champ live"
            className="group absolute right-0 top-[110px] h-[157px] w-[272px] overflow-hidden rounded-l-[22px] bg-[#8dd8ff]"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src={sitePath("/videos/home/hero_video.mp4")} type="video/mp4" />
            </video>
            <span className="absolute inset-0 bg-white/10" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/75 shadow-[0_10px_24px_rgba(7,27,99,0.2)] backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                <span className="ml-1.5 h-0 w-0 border-y-[12px] border-l-[17px] border-y-transparent border-l-[#0C84E8]" />
              </span>
            </span>
          </Link>

          <div className="absolute bottom-11 left-11 flex items-center gap-3 text-[14px] font-medium text-[#081944]">
            <span className="h-4 w-7 rounded-[3px] border border-[#081944] bg-[#0C84E8]" />
            Dialog TV Channel 48
          </div>
        </aside>
      </div>
    </section>
  );
}
