import Image from "next/image";
import { sitePath } from "@/utils/sitePath";
import type { ContentItem } from "@/components/admin/adminData";

function ChampIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] overflow-visible bg-white lg:max-w-[700px]">
      <div className="pointer-events-none absolute left-[18%] top-[18%] h-44 w-44 rounded-full bg-[#FFD23F]/24 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[14%] right-[16%] h-40 w-40 rounded-full bg-[#13A8DF]/12 blur-3xl" />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="relative z-10 block h-auto w-full bg-white object-contain"
      >
        <source src={sitePath("/videos/kidszone-hero/kidzChamp.mp4")} type="video/mp4" />
      </video>
    </div>
  );
}

export default function KidsChampSection({ content }: { content?: ContentItem }) {
  return (
    <section
      id="kids-champ-section"
      className="relative flex min-h-screen w-full scroll-mt-32 items-center overflow-hidden bg-white px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20"
    >
      <div className="pointer-events-none absolute left-[7%] top-[24%] h-3 w-3 rounded-full bg-[#FFD23F]/80" />
      <div className="pointer-events-none absolute left-[32%] bottom-[16%] h-2.5 w-2.5 rounded-full bg-[#13A8DF]/38" />
      <div className="pointer-events-none absolute left-[46%] top-[18%] h-2 w-9 rotate-12 rounded-full bg-[#FFD23F]/62" />
      <div className="pointer-events-none absolute right-[8%] top-[30%] h-16 w-16 rounded-full border border-[#13A8DF]/12" />
      <div className="pointer-events-none absolute right-[16%] bottom-[18%] h-2 w-10 -rotate-[22deg] rounded-full bg-[#0877EF]/18" />
      <div className="pointer-events-none absolute right-[34%] top-[48%] h-3 w-3 rounded-full bg-[#F04B23]/22" />
      <div className="pointer-events-none absolute left-[5%] bottom-[12%] h-36 w-36 rounded-full bg-[#FFD23F]/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[5%] top-[18%] h-40 w-40 rounded-full bg-[#13A8DF]/8 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-8 md:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div>
          <h2 className="text-[42px] font-medium leading-[1.12] text-black sm:text-[54px] lg:text-[66px]">
            {content?.title || <><span>Show Your</span><br /><span className="text-[#FFD23F]">Creativity</span><br />in <span className="text-[#13A8DF]">Kids</span>{" "}<span className="text-[#0877EF]">Champ!</span></>}
          </h2>
          <p className="mt-5 max-w-[520px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]">
            {content?.description || "Upload your artwork and share your talent with others"}
          </p>
          <a
            href={content?.linkUrl || "/kids-champ"}
            className="kids-champ-cta mt-9 inline-flex h-14 items-center gap-4 rounded-full bg-[#0B8ED8] pl-7 pr-3 text-[21px] font-normal leading-none tracking-normal text-white shadow-[0_14px_28px_rgba(11,142,216,0.22)] transition-transform hover:scale-[1.03]"
          >
            {content?.linkLabel || "Upload Drawing"}
            <span
              aria-hidden="true"
              className="kids-champ-cta-arrow flex h-10 w-10 items-center justify-center rounded-full bg-[#071B63]"
            >
              <Image
                src={sitePath("/icons/shortcuts/Arrow 1.png")}
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] object-contain"
              />
            </span>
          </a>
        </div>

        <ChampIllustration />
      </div>
      <style>{`
        .kids-champ-cta:hover .kids-champ-cta-arrow {
          animation: kidsChampArrowNudge 520ms ease both;
        }

        @keyframes kidsChampArrowNudge {
          0%,
          100% {
            transform: translateX(0);
          }

          48% {
            transform: translateX(5px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kids-champ-cta:hover .kids-champ-cta-arrow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
