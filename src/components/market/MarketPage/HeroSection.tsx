"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  "/images/market/hero/hero1.png",
  "/images/market/hero/hero2.png",
  "/images/market/hero/hero3.png",
  "/images/market/hero/hero4.png",
];

type HeroSectionProps = {
  slideIntervalMs?: number;
};

export default function HeroSection({
  slideIntervalMs = 10000,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length < 2 || slideIntervalMs <= 0) return;

    const slideTimer = window.setInterval(() => {
      setCurrentSlide((previousSlide) => (previousSlide + 1) % slides.length);
    }, slideIntervalMs);

    return () => window.clearInterval(slideTimer);
  }, [slideIntervalMs]);

  return (
    <section className="bg-white pt-[74px] pb-4 sm:pt-[78px] sm:pb-6 lg:pt-[82px]">
      <div className="mx-auto w-[min(96vw,1840px)]">
        <div className="relative isolate min-h-[430px] overflow-hidden bg-[#dff2ff] sm:min-h-[500px] lg:aspect-[1793/805] lg:min-h-[288px] 2xl:min-h-[760px]">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#b9e3ff_0%,#d9efff_32%,#eff8ff_72%,#ffffff_100%)]" />

            {slides.map((slide, index) => (
              <Image
                key={slide}
                src={slide}
                alt=""
                fill
                priority={index === 0}
                sizes="(min-width: 1536px) 1840px, 96vw"
                className={`origin-bottom-right object-cover transition-opacity duration-700 scale-[0.97] object-[88%_92%] sm:scale-[0.96] sm:object-[92%_90%] md:object-[96%_88%] lg:scale-[0.95] lg:object-[100%_89%] xl:scale-[0.945] xl:object-[100%_87%] 2xl:scale-[0.92] 2xl:object-[100%_84%] ${
                  currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            <div className="absolute inset-0 bg-white/16" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.95)_28%,rgba(255,255,255,0.6)_54%,rgba(255,255,255,0.14)_76%,rgba(255,255,255,0)_88%)]" />
            <div className="absolute inset-y-0 left-0 w-[72%] bg-[radial-gradient(circle_at_16%_40%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.84)_36%,rgba(255,255,255,0)_76%)] sm:w-[64%] lg:w-[56%] 2xl:w-[52%]" />
            <div className="absolute inset-x-0 top-0 h-[38%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0)_72%)]" />
          </div>

          <svg
            aria-hidden="true"
            className="absolute left-0 top-0 z-10 h-[16%] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 220"
          >
            <path
              fill="#ffffff"
              d="M0 58C170 22 357 13 530 38c178 26 332 71 527 54 145-13 225-56 383-79V0H0v58Z"
            />
          </svg>

          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 z-10 h-[13%] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 240"
          >
            <path
              fill="#ffffff"
              d="M0 152c152 24 320 15 478-18 171-35 339-40 512-8 162 30 295 32 450-1V240H0V152Z"
            />
          </svg>

          <div className="relative z-20 flex min-h-[430px] items-start px-5 pt-12 pb-16 sm:min-h-[500px] sm:px-8 sm:pt-14 sm:pb-20 md:px-10 md:pt-16 lg:h-full lg:items-center lg:px-12 lg:pt-10 lg:pb-14 xl:px-16 2xl:px-24">
            <div className="w-full max-w-[260px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[650px] 2xl:max-w-[760px]">
              <h1 className="text-[44px] font-bold leading-[0.95] tracking-[-0.05em] text-black sm:text-[54px] md:text-[66px] lg:text-[78px] xl:text-[84px] 2xl:text-[96px]">
                Fun Toys &
                <br />
                <span className="text-[#69a4ff]">Kids Essentials</span>
              </h1>

              <p className="mt-3 max-w-[260px] text-[18px] font-medium leading-[1.3] text-[#4a5b77] sm:mt-4 sm:max-w-[320px] sm:text-[22px] md:max-w-[420px] md:text-[28px] lg:mt-5 lg:max-w-[500px] lg:text-[34px] xl:text-[38px] 2xl:max-w-[620px] 2xl:text-[44px]">
                Discover exciting products
                <br className="hidden sm:block" />
                for little stars
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-4 lg:mt-8 lg:gap-5 2xl:mt-10 2xl:gap-6">
                <Link
                  href="#market-categories"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#5f87ff_0%,#4a73ee_100%)] px-6 text-center text-[18px] font-medium leading-none tracking-[-0.02em] text-white shadow-[0_18px_34px_rgba(79,124,243,0.26)] transition-transform duration-300 hover:scale-[1.02] sm:h-14 sm:w-auto sm:min-w-[190px] sm:px-7 sm:text-[20px] md:h-16 md:min-w-[220px] md:text-[22px] lg:h-[72px] lg:min-w-[250px] lg:px-10 lg:text-[26px] xl:h-[92px] xl:min-w-[310px] xl:text-[31px] 2xl:h-[104px] 2xl:min-w-[340px] 2xl:text-[34px]"
                >
                  Shop Now
                </Link>

                <Link
                  href="#market-categories"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#deE7fb] bg-white px-6 text-center text-[18px] font-medium leading-none tracking-[-0.02em] text-[#4f78f3] shadow-[0_16px_30px_rgba(24,56,115,0.08)] transition-transform duration-300 hover:scale-[1.02] sm:h-14 sm:w-auto sm:min-w-[250px] sm:px-8 sm:text-[20px] md:h-16 md:min-w-[280px] md:text-[22px] lg:h-[72px] lg:min-w-[330px] lg:px-12 lg:text-[26px] xl:h-[92px] xl:min-w-[400px] xl:text-[31px] 2xl:h-[104px] 2xl:min-w-[430px] 2xl:text-[34px]"
                >
                  Explore categories
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center justify-center gap-2 sm:bottom-5 sm:gap-3 lg:bottom-6">
            {slides.map((slide, index) => {
              const isActive = currentSlide === index;

              return (
                <button
                  key={slide}
                  type="button"
                  aria-label={`Show market slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-full transition-all ${
                    isActive
                      ? "h-2.5 w-8 bg-[#6b7cf2] sm:h-3 sm:w-10"
                      : "h-2.5 w-2.5 bg-[#d8dde4] hover:bg-[#b8ccec] sm:h-3 sm:w-3"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
