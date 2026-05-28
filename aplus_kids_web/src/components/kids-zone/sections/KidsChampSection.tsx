import Image from "next/image";

function ChampIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <Image
        src="/images/KidsZone/kids_champ.png"
        alt="Kids Champ creativity illustration"
        width={720}
        height={560}
        className="h-auto w-full object-contain"
        priority={false}
      />
    </div>
  );
}

export default function KidsChampSection() {
  return (
    <section className="flex min-h-screen w-full items-center bg-white px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20">
      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-8 md:grid-cols-[1fr_1fr] lg:gap-14">
        <div>
          <h2 className="text-[42px] font-medium leading-[1.12] text-black sm:text-[54px] lg:text-[66px]">
            Show Your
            <br />
            <span className="text-[#FFD23F]">Creativity</span>
            <br />
            in <span className="text-[#13A8DF]">Kids</span>{" "}
            <span className="text-[#0877EF]">Champ!</span>
          </h2>
          <p className="mt-5 max-w-[520px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]">
            Upload your artwork and share your talent with others
          </p>
          <a
            href="#kids-champ"
            className="mt-9 inline-flex h-14 items-center gap-5 rounded-full bg-[#0B8ED8] px-7 text-[21px] font-normal leading-none tracking-normal text-white shadow-[0_14px_28px_rgba(11,142,216,0.22)] transition-transform hover:scale-[1.03]"
          >
            Upload Drawing <span aria-hidden="true">-&gt;</span>
          </a>
        </div>

        <ChampIllustration />
      </div>
    </section>
  );
}
