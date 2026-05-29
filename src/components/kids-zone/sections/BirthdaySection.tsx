import { sitePath } from "@/utils/sitePath";

function BirthdayIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[8px] bg-transparent">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="block h-auto w-full bg-transparent object-contain"
      >
        <source src={sitePath("/videos/kidszone-hero/cake.mp4")} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,rgba(245,251,255,0)_0%,#F5FBFF_100%)]" />
    </div>
  );
}

export default function BirthdaySection() {
  return (
    <section className="flex min-h-screen w-full items-center bg-[#F5FBFF] px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20">
      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-8 md:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <BirthdayIllustration />

        <div>
          <span className="text-[20px] font-medium uppercase tracking-normal text-[#13A8DF] sm:text-[24px]">
            Birthday Wishes
          </span>
          <h2 className="mt-3 text-[42px] font-medium leading-[1.1] text-black sm:text-[56px] lg:text-[66px]">
            Make Their
            <br />
            Day <span className="text-[#FFD23F]">Special!</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]">
            Send your birthday wishes and get featured on A+ Kids
          </p>
          <a
            href="#birthday"
            className="mt-9 inline-flex h-14 items-center gap-5 rounded-full bg-[#13A8DF] px-7 text-[21px] font-normal leading-none tracking-normal text-white shadow-[0_14px_28px_rgba(19,168,223,0.22)] transition-transform hover:scale-[1.03]"
          >
            Send Birthday <span aria-hidden="true">-&gt;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
