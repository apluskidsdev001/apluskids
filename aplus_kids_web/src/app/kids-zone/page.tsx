export default function KidsZonePage() {
  return (
    <section className="relative h-screen w-full overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="/videos/home/hero_video.mp4"
          type="video/mp4"
        />
      </video>

      {/* Soft Overlay */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-6 md:px-16 lg:px-24">

        <div className="max-w-[650px]">

          <h1 className="font-fredoka text-[52px] font-bold leading-[1.05] tracking-[-2px] text-[#071B63] md:text-[82px]">

            Where Little
            <br />

            Minds{" "}
            <span className="text-[#F04414]">
              Learn,
            </span>

            <br />

            <span className="text-[#F9B800]">
              Laugh
            </span>{" "}

            <span className="text-[#111827]">
              &
            </span>{" "}

            <span className="text-[#0B7CFF]">
              Grow!
            </span>

          </h1>

          <p className="mt-6 max-w-[560px] text-[18px] font-semibold leading-8 text-[#071B63] md:text-[20px]">
            Sri Lanka’s First 24/7 Kids TV Channel with safe,
            fun, and educational entertainment for every child.
          </p>

          <button className="mt-10 rounded-full bg-[#F04414] px-8 py-4 text-[15px] font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:bg-[#e63e10]">
            Explore Now
          </button>

        </div>
      </div>
    </section>
  );
}