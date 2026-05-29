import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

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
    <section className="w-full bg-white px-5 pb-7 pt-2 md:px-8 md:pb-12">
      <div className="mx-auto grid max-w-[1720px] items-start gap-10 lg:grid-cols-[max-content_536px] lg:justify-center lg:gap-24">
        <div>
          <div data-scroll-reveal="slide-right" className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold leading-none tracking-normal text-[#071B63] md:text-[28px]">
              Shortcuts
            </h2>
            <Link href="/watch" className="text-[13px] font-bold text-[#0077ff] md:hidden">
              View All
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-4 md:mt-8 lg:ml-14 lg:flex lg:gap-10">
            {shortcuts.map((shortcut, index) => (
              <Link
                key={shortcut.label}
                href={shortcut.href}
                data-scroll-reveal="pop"
                style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties}
                className="group flex h-[112px] min-w-0 flex-col items-center justify-center rounded-[14px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,247,255,0.88))] px-2 shadow-[0_12px_28px_rgba(7,27,99,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(7,27,99,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] md:h-[150px] md:rounded-[24px] md:px-4 lg:h-[250px] lg:w-[200px] lg:rounded-[30px]"
              >
                <Image
                  src={shortcut.icon}
                  alt=""
                  width={78}
                  height={78}
                  className="h-[42px] w-[42px] object-contain transition-transform duration-300 group-hover:scale-105 md:h-[68px] md:w-[68px] lg:h-[96px] lg:w-[96px]"
                />
                <span className="mt-3 text-center text-[12px] font-bold leading-tight text-[#071B63] md:mt-4 md:text-[16px] lg:mt-7 lg:text-[22px]">
                  {shortcut.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside
          data-scroll-reveal="slide-left"
          style={{ "--reveal-delay": "220ms" } as CSSProperties}
          className="relative hidden h-[350px] overflow-hidden rounded-[42px] bg-[#0C84E8] px-11 py-12 text-white shadow-[0_24px_54px_rgba(12,132,232,0.24)] lg:mt-[60px] lg:block"
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
              <source src="/videos/home/hero_video.mp4" type="video/mp4" />
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
