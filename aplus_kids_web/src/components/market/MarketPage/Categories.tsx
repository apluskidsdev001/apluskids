"use client";

import { useEffect, useRef, useState } from "react";

const categoryCards = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
}));

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const isLeft = direction === "left";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 sm:h-7 sm:w-7 md:h-10 md:w-10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={isLeft ? "M20 12H4M10 6l-6 6 6 6" : "M4 12h16M14 6l6 6-6 6"} />
    </svg>
  );
}

export default function Categories() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  function scrollCards(direction: "left" | "right") {
    const offset = direction === "left" ? -260 : 260;

    sliderRef.current?.scrollBy({
      left: offset,
      behavior: "smooth",
    });
  }

  return (
    <section
      ref={sectionRef}
      id="market-categories"
      className="bg-white px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px] border-[3px] border-[#2795ff] bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-7 md:py-5">
        <h2
          className={`text-[30px] font-bold leading-none tracking-[-0.04em] text-black transition-all duration-700 ease-out sm:text-[38px] md:text-[46px] lg:text-[54px] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
          }`}
        >
          Shop By Categories
        </h2>

        <div
          className={`relative mt-5 transition-all duration-700 ease-out sm:mt-6 md:mt-8 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollCards("left")}
            className="absolute left-1 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#b9b9b9] bg-white text-[#10b6eb] shadow-[0_10px_18px_rgba(0,0,0,0.06)] transition-transform hover:scale-[1.03] sm:left-2 sm:h-16 sm:w-16 md:left-3 md:h-[86px] md:w-[86px]"
          >
            <ArrowIcon direction="left" />
          </button>

          <div
            ref={sliderRef}
            data-focus-strip
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[64px] py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-[76px] md:gap-5 md:px-[104px]"
          >
            {categoryCards.map((card, index) => (
              <div
                key={card.id}
                data-focus-item
                className={`relative h-[110px] min-w-[150px] snap-start overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#d8d8d8_0%,#d2d2d2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-700 ease-out sm:h-[124px] sm:min-w-[180px] sm:rounded-[26px] md:h-[146px] md:min-w-[220px] md:rounded-[30px] ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
                }`}
                style={{ transitionDelay: `${200 + index * 80}ms` }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0)_58%)]" />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollCards("right")}
            className="absolute right-1 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#b9b9b9] bg-white text-[#10b6eb] shadow-[0_10px_18px_rgba(0,0,0,0.06)] transition-transform hover:scale-[1.03] sm:right-2 sm:h-16 sm:w-16 md:right-3 md:h-[86px] md:w-[86px]"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
