export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[744px] w-full overflow-hidden bg-white pt-[124px]">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-[66%_50%]"
      >
        <source src="/videos/home/hero_video.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-white/10" />
      <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_17%,rgba(255,255,255,0.66)_36%,rgba(255,255,255,0.13)_58%,rgba(255,255,255,0)_76%)]" />
      <div className="absolute inset-y-0 left-0 w-[50%] bg-[radial-gradient(circle_at_15%_52%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.82)_38%,rgba(255,255,255,0)_72%)]" />

      <svg
        aria-hidden="true"
        className="absolute left-0 top-0 z-10 h-[16%] w-full"
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
        className="absolute -bottom-px left-0 z-10 h-[18%] w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 260"
      >
        <path
          fill="#ffffff"
          d="M0 78C157 83 312 112 459 138C656 173 875 184 1091 143C1215 119 1328 77 1440 26V260H0V78Z"
        />
      </svg>

      <div className="relative z-20 flex h-full items-center px-7 pb-20 pt-4 sm:px-10 md:px-16 lg:px-[5vw]">
        <div className="max-w-[640px]">
          <h1 className="text-[46px] font-bold leading-[1.04] tracking-normal text-[#071B63] sm:text-[58px] md:text-[72px] lg:text-[92px]">
            Where Little
            <br />
            Minds <span className="text-[#ff3b0a]">Learn,</span>
            <br />
            <span className="text-[#ffc20a]">Laugh</span>{" "}
            <span className="text-[#111827]">&</span>{" "}
            <span className="text-[#0077ff]">Grow!</span>
          </h1>

          <p className="mt-8 max-w-[560px] text-[17px] font-medium leading-[1.45] text-[#071B63] sm:text-[20px] md:text-[24px]">
            Sri Lanka&apos;s First 24/7 Kids TV Channel with safe,
            <br className="hidden sm:block" /> fun, and educational
            entertainment for every child.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/watch"
              className="flex h-16 items-center gap-4 rounded-[32px] bg-[linear-gradient(135deg,#147dff,#35bdff)] px-8 text-[20px] font-medium text-white shadow-[0_14px_30px_rgba(20,125,255,0.24)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                <span className="ml-1 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
              </span>
              Watch Now
            </a>
            <a
              href="/kids-zone"
              className="flex h-16 items-center gap-4 rounded-[32px] bg-white/90 px-8 text-[20px] font-medium text-[#081944] shadow-[0_14px_30px_rgba(8,25,68,0.1)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf5ff] text-[#168dff]">
                <span className="grid grid-cols-2 gap-1">
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                  <span className="h-2 w-2 rounded-sm bg-current" />
                </span>
              </span>
              Explore Shows
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
