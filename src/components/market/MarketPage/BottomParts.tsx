"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sitePath } from "@/utils/sitePath";

const bottomCards = [
  {
    id: 1,
    title: "Free Shipping",
    description: "On orders over $49",
    accent: "from-[#f3fffb] to-[#effaf6]",
    iconColor: "#2bbf64",
    icon: (
      <>
        <rect x="3" y="5" width="11" height="14" rx="2" />
        <path d="M8 9h4" />
        <path d="M8 13h5" />
        <path d="M14 10h3l3 3v6h-6" />
        <circle cx="8" cy="19" r="1.5" />
        <circle cx="18" cy="19" r="1.5" />
      </>
    ),
  },
  {
    id: 2,
    title: "Easy Returns",
    description: "30-day return policy",
    accent: "from-[#fff8ec] to-[#fff4df]",
    iconColor: "#f7a21b",
    icon: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
        <path d="M15.5 10.5h3v3" />
        <path d="M18.5 10.5l-4 4" />
      </>
    ),
  },
  {
    id: 3,
    title: "Secure Payment",
    description: "100% safe checkout",
    accent: "from-[#eff6ff] to-[#edf4ff]",
    iconColor: "#2682ff",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 5-3.4 8.7-7 10-3.6-1.3-7-5-7-10V6l7-3Z" />
        <path d="m9.5 12 1.8 1.8 3.7-3.8" />
      </>
    ),
  },
  {
    id: 4,
    title: "24/7 Support",
    description: "We're here to help",
    accent: "from-[#fff1f9] to-[#fff4fb]",
    iconColor: "#ef5bb5",
    icon: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0" />
        <rect x="3.5" y="11" width="3" height="6" rx="1.5" />
        <rect x="17.5" y="11" width="3" height="6" rx="1.5" />
        <path d="M19 17a3 3 0 0 1-3 3h-2" />
        <rect x="11" y="19" width="3.5" height="2.5" rx="1.25" />
      </>
    ),
  },
];

const bannerMotions = [
  "translate3d(0px, 0px, 0px) scale(1.02)",
  "translate3d(-10px, 4px, 0px) scale(1.04)",
  "translate3d(10px, -3px, 0px) scale(1.035)",
  "translate3d(-6px, -4px, 0px) scale(1.03)",
  "translate3d(8px, 3px, 0px) scale(1.045)",
];

export default function BottomParts() {
  const [motionIndex, setMotionIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMotionIndex((currentIndex) => {
        let nextIndex = currentIndex;

        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * bannerMotions.length);
        }

        return nextIndex;
      });
    }, 3800);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="bg-white px-4 pb-10 sm:px-6 sm:pb-12 md:px-10 md:pb-14 lg:px-16 lg:pb-16">
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[28px] shadow-[0_18px_46px_rgba(33,150,243,0.08)] sm:rounded-[32px]">
          <div className="relative aspect-[804/199] min-h-[180px] w-full sm:min-h-[220px]">
            <div
              className="absolute inset-0 transition-transform duration-[3600ms] ease-in-out"
              style={{ transform: bannerMotions[motionIndex] }}
            >
              <Image
                src={sitePath("/images/market/advertisements/Advertisement1.png")}
                alt="Market advertisement"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1500px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-7 sm:gap-5 lg:mt-8 lg:grid-cols-4">
          {bottomCards.map((card) => (
            <div
              key={card.id}
              className={`flex min-h-[108px] items-center gap-3 rounded-[22px] bg-gradient-to-br ${card.accent} px-4 py-4 shadow-[0_14px_34px_rgba(21,44,94,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] sm:min-h-[120px] sm:gap-4 sm:rounded-[24px] sm:px-5 lg:min-h-[126px] lg:rounded-[28px] lg:px-6`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/88 shadow-[0_10px_24px_rgba(21,44,94,0.08)] sm:h-14 sm:w-14">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  fill="none"
                  stroke={card.iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {card.icon}
                </svg>
              </div>

              <div>
                <h3 className="text-[18px] font-bold leading-none text-[#0f1d46] sm:text-[20px]">
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] font-medium leading-[1.35] text-[#64748b] sm:text-[15px]">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
