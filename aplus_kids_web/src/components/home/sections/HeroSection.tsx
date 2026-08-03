"use client";

import { defaultHomeHero, type HomeHeroContent } from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { sitePath } from "@/utils/sitePath";

export default function HeroSection() {
  const hero = useAdminDisplayContent<HomeHeroContent>("aplus-admin-home-hero", "aplus-published-home-hero", defaultHomeHero);

  return (
    <section className="relative mx-3 mt-[88px] h-[345px] min-h-0 w-auto overflow-hidden rounded-[24px] bg-white pt-0 shadow-[0_16px_38px_rgba(7,27,99,0.12)] tablet:h-[520px] tablet:rounded-[30px] desktop:mx-0 desktop:mt-0 desktop:h-screen desktop:min-h-[820px] desktop:w-full desktop:rounded-none desktop:pt-[124px] desktop:shadow-none">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-[62%_50%] tablet:object-[68%_50%] desktop:object-[66%_50%]"
      >
        <source src={sitePath(hero.videoUrl)} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.92)_30%,rgba(255,255,255,0.36)_58%,rgba(255,255,255,0)_82%)] desktop:bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_17%,rgba(255,255,255,0.66)_36%,rgba(255,255,255,0.13)_58%,rgba(255,255,255,0)_76%)]" />
      <div className="absolute inset-y-0 left-0 w-[64%] bg-[radial-gradient(circle_at_15%_52%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.82)_38%,rgba(255,255,255,0)_72%)] desktop:w-[50%]" />

      <svg
        aria-hidden="true"
        className="absolute left-0 top-0 z-10 hidden h-[16%] w-full desktop:block"
        preserveAspectRatio="none"
        viewBox="0 0 1440 220"
      >
        <path
          fill="#ffffff"
          d="M0 0H1440V47C1270 77 1090 88 881 70C646 51 468 18 242 31C143 36 64 31 0 18V0Z"
        />
      </svg>

      <svg
        aria-hidden="true"
        className="absolute -bottom-px left-0 z-10 hidden h-[18%] w-full desktop:block"
        preserveAspectRatio="none"
        viewBox="0 0 1440 260"
      >
        <path
          fill="#ffffff"
          d="M0 78C157 83 312 112 459 138C656 173 875 184 1091 143C1215 119 1328 77 1440 26V260H0V78Z"
        />
      </svg>

      <div className="relative z-20 flex h-full items-center px-5 py-6 sm:px-10 desktop:px-[5vw] desktop:pb-20 desktop:pt-4">
        <div className="max-w-[210px] tablet:max-w-[440px] desktop:max-w-[640px]">
          <h1 className="text-[29px] font-bold leading-[1.08] tracking-normal text-[#071B63] sm:text-[42px] tablet:text-[56px] desktop:text-[92px]">
            {hero.titleLineOne}
            <br />
            <span className="text-[#ff3b0a]">{hero.titleLineTwo}</span>
            <br />
            <span className="text-[#0077ff]">{hero.titleLineThree}</span>
          </h1>

          <p className="mt-5 max-w-[180px] text-[12px] font-medium leading-[1.45] text-[#071B63] sm:text-[16px] tablet:max-w-[390px] tablet:text-[18px] desktop:mt-8 desktop:max-w-[560px] desktop:text-[24px]">
            {hero.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 desktop:mt-9">
            <a
              href={sitePath(hero.primaryUrl)}
              className="flex h-11 items-center gap-2 rounded-[24px] bg-[linear-gradient(135deg,#147dff,#35bdff)] px-4 text-[13px] font-medium text-white shadow-[0_14px_30px_rgba(20,125,255,0.24)] desktop:h-16 desktop:gap-4 desktop:rounded-[32px] desktop:px-8 desktop:text-[20px]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 desktop:h-9 desktop:w-9">
                <span className="ml-1 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white desktop:border-y-[7px] desktop:border-l-[11px]" />
              </span>
              <span>{hero.primaryLabel}</span>
            </a>
            <a
              href={sitePath(hero.secondaryUrl)}
              className="hidden h-16 items-center gap-4 rounded-[32px] bg-white/90 px-8 text-[20px] font-medium text-[#081944] shadow-[0_14px_30px_rgba(8,25,68,0.1)] desktop:flex"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf5ff] text-[#168dff]">
                <span className="grid grid-cols-2 gap-1">
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                </span>
              </span>
              {hero.secondaryLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
