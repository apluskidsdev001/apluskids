"use client";

import { sitePath } from "@/utils/sitePath";
import Image from "next/image";
import type { ContentItem } from "@/components/admin/adminData";

const heroHighlight = [
  {
    label: "Birthdays",
    icon: "/icons/shortcuts/cake.png",
    alt: "Birthday cake icon",
    target: "#birthdays",
  },
  {
    label: "Kids Champ",
    icon: "/icons/shortcuts/KidsChamp.png",
    alt: "Kids Champ icon",
    target: "#kids-champ-section",
  },
  {
    label: "Events",
    icon: "/icons/shortcuts/gallery.png",
    alt: "Events gallery icon",
    target: "#events",
  },
];

const welcomeText = "Welcome to";

export default function KidsZoneHero({ content }: { content?: ContentItem }) {
  function scrollToSection(target: string) {
    document.querySelector(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#F7FCFF] px-4 pb-10 pt-[132px] sm:px-6 md:px-10 lg:px-16 xl:px-20">
      <div className="pointer-events-none absolute left-0 top-[18%] h-40 w-40 rounded-full bg-[#FFE36E]/60 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[28%] h-56 w-56 rounded-full bg-[#13A8DF]/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[30%] h-44 w-44 rounded-full bg-[#F04B23]/16 blur-3xl" />
      <div className="pointer-events-none absolute left-[27%] top-[20%] h-8 w-8 rotate-12 rounded-[9px] bg-[#F6A6D8]/42" />
      <div className="pointer-events-none absolute left-[43%] bottom-[20%] h-5 w-5 rotate-45 rounded-[6px] bg-[#8D5CFF]/34" />
      <div className="pointer-events-none absolute right-[13%] top-[16%] h-20 w-20 rounded-full bg-white/40 blur-2xl" />

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-36 bg-[linear-gradient(180deg,rgba(247,252,255,0)_0%,rgba(247,252,255,0.72)_45%,#ffffff_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1220px] items-center gap-8 sm:gap-10 md:grid-cols-[1fr_0.92fr] lg:gap-10 xl:gap-12">
        <div className="hero-text-enter max-w-[620px]">
          <div>
            <h1 className="font-bold leading-[1.08] text-black">
              <span className="block text-[40px] sm:text-[48px] md:text-[55px] lg:text-[64px] xl:text-[70px]">
                {(content?.title || welcomeText).split("").map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className="welcome-letter inline-block"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </span>
                ))}
              </span>

              <span className="kids-zone-title mt-3 block font-bold leading-[0.95] text-[58px] text-[#071B63] sm:whitespace-nowrap sm:text-[72px] md:text-[86px] lg:text-[104px] xl:text-[118px]">
                <span className="kids-zone-word text-[#13A8DF]">Kids</span>{" "}
                <span className="kids-zone-word kids-zone-word-delay block text-[#F04B23] sm:inline">
                  Zone
                </span>
              </span>
            </h1>

            <p className="mt-5 max-w-[500px] text-[18px] font-semibold leading-[1.45] text-black sm:text-[20px] md:text-[17px] lg:text-[20px] xl:text-[23px]">
              {content?.description || "A safe and happy place for kids to celebrate, compete, explore and create amazing memories"}
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:gap-4">
              {heroHighlight.map((highlight) => (
                <a
                  key={highlight.label}
                  href={highlight.target}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(highlight.target);
                  }}
                  className="hero-chip relative inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white/95 py-2 pl-2.5 pr-5 text-[15px] font-bold text-[#071B63] no-underline shadow-[0_12px_28px_rgba(7,27,99,0.12)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:no-underline hover:shadow-[0_16px_34px_rgba(7,27,99,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13A8DF]/30 sm:h-[60px] sm:gap-3 sm:pr-6 sm:text-[16px]"
                >
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7FCFF] shadow-[inset_0_0_0_1px_rgba(7,27,99,0.04)] sm:h-11 sm:w-11">
                    <Image
                      src={sitePath(highlight.icon)}
                      alt={highlight.alt}
                      width={32}
                      height={32}
                      className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                    />
                  </span>

                  <span className="hero-chip-label relative z-10">
                    {highlight.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-visual-enter">
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-[600px] sm:max-w-[640px] md:max-w-[560px] lg:max-w-[610px] xl:max-w-[640px]">
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-[8px] bg-[#FFE36E]" />
              <div className="absolute -bottom-4 -right-4 h-28 w-28 rounded-[8px] bg-[#13A8DF]" />

              <div className="relative overflow-hidden rounded-[8px] border-[10px] border-white bg-white shadow-[0_24px_70px_rgba(7,27,99,0.18)]">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="block w-full scale-[1.08] border-0 bg-transparent object-contain outline-none"
                >
                  <source
                    src={sitePath("/videos/kidszone-hero/kidszone_hero.mp4")}
                    type="video/mp4"
                  />
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .kids-zone-title {
          animation: kidsZonePop 720ms cubic-bezier(0.2, 0.9, 0.2, 1.2)
            both;
        }

        .kids-zone-word {
          display: inline-block;
          overflow: hidden;
          position: relative;
        }

        .kids-zone-word::after {
          animation: kidsZoneShine 2.9s ease-in-out 1200ms infinite;
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 255, 255, 0.72) 45%,
            transparent 70%
          );
          content: "";
          inset: 0;
          position: absolute;
          transform: translateX(-120%);
        }

        .kids-zone-word-delay::after {
          animation-delay: 1.15s;
        }

        .welcome-letter {
          animation: welcomeLetterWave 2.8s ease-in-out infinite;
        }

        .hero-text-enter {
          animation: heroTextEnter 900ms cubic-bezier(0.2, 0.82, 0.2, 1)
            both;
          will-change: opacity, transform;
        }

        .hero-visual-enter {
          animation: heroVisualEnter 1000ms cubic-bezier(0.2, 0.82, 0.2, 1)
            120ms both;
          will-change: opacity, transform;
        }

        .hero-chip-label {
          pointer-events: none;
          white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-text-enter,
          .hero-visual-enter,
          .welcome-letter,
          .kids-zone-title,
          .kids-zone-word::after {
            animation: none;
          }
        }

        @keyframes kidsZonePop {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.94);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes kidsZoneShine {
          0% {
            transform: translateX(-120%);
          }

          45%,
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes welcomeLetterWave {
          0%,
          100% {
            transform: translateY(0);
          }

          18% {
            transform: translateY(-6px);
          }

          36% {
            transform: translateY(0);
          }
        }

        @keyframes heroTextEnter {
          from {
            opacity: 0;
            transform: translate3d(-72px, 0, 0);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes heroVisualEnter {
          from {
            opacity: 0;
            transform: translate3d(86px, 0, 0) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
