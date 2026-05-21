"use client";

import { useState } from "react";

const heroHighlight = ["Birthdays", "Kids Champ", "Events"];
const welcomeText = "Welcome to";

export default function KidsZoneHero() {
  const [isHeroBoxSpinning, setIsHeroBoxSpinning] = useState(false);

  function handleHeroBoxClick() {
    setIsHeroBoxSpinning(false);
    window.setTimeout(() => setIsHeroBoxSpinning(true), 0);
  }

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#F7FCFF] px-4 pb-10 pt-[132px] sm:px-6 md:px-10 lg:px-16 xl:px-20">
      <div className="pointer-events-none absolute left-0 top-[18%] h-40 w-40 rounded-full bg-[#FFE36E]/60 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[28%] h-56 w-56 rounded-full bg-[#13A8DF]/18 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[30%] h-44 w-44 rounded-full bg-[#F04B23]/16 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] items-center gap-8 sm:gap-10 md:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <div>
          <h1 className="font-bold leading-[1.08] text-black">
            <span className="block text-[40px] sm:text-[48px] md:text-[55px] lg:text-[64px] xl:text-[70px]">
              {welcomeText.split("").map((letter, index) => (
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

          <p className="mt-5 max-w-[480px] text-[18px] font-medium leading-[1.45] text-black sm:text-[20px] md:text-[17px] lg:text-[20px] xl:text-[23px]">
            A safe and happy place for kids to celebrate, compete, 
            explore and create amazing memories
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {heroHighlight.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full bg-white px-5 py-3 text-[15px] font-bold text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.08)]"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <button
            type="button"
            aria-label="Play Kids Zone animation effect"
            onClick={handleHeroBoxClick}
            onAnimationEnd={() => setIsHeroBoxSpinning(false)}
            className={`relative w-full max-w-[680px] cursor-pointer border-0 bg-transparent p-0 text-left outline-none transition-transform duration-300 hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-[#13A8DF]/30 ${
              isHeroBoxSpinning ? "hero-box-spin-forward" : ""
            }`}
          >
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
                  src="/videos/kidszone-hero/kidszone_hero.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-36 bg-[linear-gradient(180deg,rgba(247,252,255,0)_0%,rgba(247,252,255,0.72)_45%,#ffffff_100%)]" />

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
          animation: welcomeLetterWave 1.8s ease-in-out infinite;
        }

        .hero-box-spin-forward {
          animation: heroBoxSpinForward 900ms cubic-bezier(0.2, 0.85, 0.2, 1)
            both;
          transform-origin: center;
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
            transform: translateY(-10px);
          }

          36% {
            transform: translateY(0);
          }
        }

        @keyframes heroBoxSpinForward {
          0% {
            transform: perspective(900px) translateZ(0) rotate(0deg) scale(1);
          }

          48% {
            transform: perspective(900px) translateZ(80px) rotate(720deg)
              scale(1.08);
          }

          72% {
            transform: perspective(900px) translateZ(32px) rotate(760deg)
              scale(1.04);
          }

          100% {
            transform: perspective(900px) translateZ(0) rotate(720deg)
              scale(1);
          }
        }
      `}</style>
    </section>
  );
}
