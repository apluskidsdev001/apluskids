export default function KidsZoneHero() {
  return (
    <section className="w-full bg-white px-6 py-12 md:px-10 lg:px-16">
      <div className="mx-auto mt-12 grid max-w-[1120px] items-center gap-10 md:mt-14 md:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h1 className="font-bold leading-[1.08] text-black">
            <span className="block text-[45px] md:text-[55px] lg:text-[70px]">
              Welcome to
            </span>

            <span className="mt-4 block whitespace-nowrap text-[66px] leading-none md:text-[88px] lg:text-[110px]">
              <span className="text-[#13A8DF]">Kids</span>{" "}
              <span className="text-[#F04B23]">Zone</span>
            </span>
          </h1>

          <p className="mt-6 max-w-[420px] text-[23px] font-medium leading-[1.35] text-black md:text-[17px]">
            A safe and happy place for kids to celebrate, compete, 
            explore and create amazing memories
          </p>
        </div>
       
      {/*Hero video animation*/}

        <div className="flex justify-center md:justify-end">
          <div className="relative w-full max-w-[2000px] overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="block w-full scale-[1.12] border-0 bg-transparent object-contain outline-none"
            >
              <source
                src="/videos/kidszone-hero/kidszone_hero.mp4"
                type="video/mp4"
              />
            </video>
            <div className="pointer-events-none absolute bottom-0 right-0 h-full w-6 bg-white" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-6 w-full bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
