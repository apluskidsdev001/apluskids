import Image from "next/image";
import { sitePath } from "@/utils/sitePath";
import type { ContentItem } from "@/components/admin/adminData";

const birthdayChips = [
  {
    label: "TV Feature",
    icon: "/icons/taskbar/play.png",
    alt: "TV feature icon",
  },
  {
    label: "Birthday Shoutout",
    icon: "/icons/shortcuts/cake.png",
    alt: "Birthday cake icon",
  },
  {
    label: "Photo Wish",
    icon: "/icons/shortcuts/gallery.png",
    alt: "Photo wish icon",
  },
];

function BirthdayIllustration() {
  return (
    <div
      className="birthday-cake-stage relative mx-auto w-full max-w-[960px] overflow-visible bg-[#F5FBFF] md:-translate-x-12 lg:-translate-x-20 xl:-translate-x-28"
    >
      <div className="pointer-events-none absolute left-[20%] top-[24%] h-52 w-52 rounded-full bg-[#FFE36E]/42 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[18%] right-[18%] h-40 w-40 rounded-full bg-[#13A8DF]/16 blur-3xl" />
      <div className="birthday-confetti confetti-one" />
      <div className="birthday-confetti confetti-two" />
      <div className="birthday-confetti confetti-three" />
      <div className="birthday-confetti confetti-four" />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="block h-auto w-full bg-[#F5FBFF] object-contain"
      >
        <source src={sitePath("/videos/kidszone-hero/cake.mp4")} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,251,255,0)_58%,#F5FBFF_86%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(245,251,255,0)_0%,#F5FBFF_88%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-[linear-gradient(90deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-[linear-gradient(270deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]" />
    </div>
  );
}

export default function BirthdaySection({ content }: { content?: ContentItem }) {
  return (
    <section
      id="birthdays"
      className="relative flex min-h-screen w-full scroll-mt-32 items-center overflow-hidden bg-[#F5FBFF] px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20"
    >
      <div className="pointer-events-none absolute left-[7%] top-[18%] h-3 w-3 rounded-full bg-[#FFD23F]/70" />
      <div className="pointer-events-none absolute left-[15%] bottom-[22%] h-4 w-4 rounded-full bg-[#13A8DF]/34" />
      <div className="pointer-events-none absolute right-[8%] top-[24%] h-5 w-5 rounded-full bg-[#F04B23]/20" />
      <div className="pointer-events-none absolute right-[18%] bottom-[18%] h-3 w-3 rounded-full bg-[#FFD23F]/64" />
      <div className="pointer-events-none absolute left-[31%] top-[12%] h-16 w-16 rounded-full border border-[#13A8DF]/12" />
      <div className="pointer-events-none absolute right-[38%] bottom-[10%] h-20 w-20 rounded-full border border-[#FFD23F]/22" />
      <div className="pointer-events-none absolute left-[4%] bottom-[8%] h-40 w-40 rounded-full bg-[#FFD23F]/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[6%] top-[16%] h-44 w-44 rounded-full bg-[#13A8DF]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[9%] top-[31%] h-2 w-8 rotate-12 rounded-full bg-[#F04B23]/28" />
      <div className="pointer-events-none absolute left-[48%] bottom-[18%] h-2 w-7 -rotate-12 rounded-full bg-[#13A8DF]/28" />
      <div className="pointer-events-none absolute right-[12%] top-[46%] h-2 w-8 rotate-[24deg] rounded-full bg-[#FFD23F]/70" />
      <div className="pointer-events-none absolute right-[30%] top-[17%] h-3 w-3 rounded-full bg-[#F04B23]/22" />
      <div className="pointer-events-none absolute left-[6%] top-[42%] h-2.5 w-2.5 rounded-full bg-[#FFD23F]/80" />
      <div className="pointer-events-none absolute left-[12%] top-[57%] h-2 w-10 rotate-12 rounded-full bg-[#F04B23]/24" />
      <div className="pointer-events-none absolute left-[24%] bottom-[16%] h-2 w-2 rounded-full bg-[#13A8DF]/45" />
      <div className="pointer-events-none absolute left-[37%] top-[27%] h-3 w-3 rounded-full bg-[#FFD23F]/56" />
      <div className="pointer-events-none absolute right-[21%] top-[33%] h-2.5 w-2.5 rounded-full bg-[#F04B23]/24" />
      <div className="pointer-events-none absolute right-[18%] bottom-[28%] h-2 w-9 -rotate-[22deg] rounded-full bg-[#FFD23F]/80" />
      <div className="pointer-events-none absolute right-[7%] bottom-[20%] h-16 w-16 rounded-full border border-[#13A8DF]/10" />
      <div className="pointer-events-none absolute left-[50%] top-[18%] hidden h-14 w-14 rounded-full border border-[#FFD23F]/18 sm:block" />
      <div className="pointer-events-none absolute right-[42%] top-[58%] hidden h-2.5 w-2.5 rounded-full bg-[#13A8DF]/34 md:block" />
      <div className="pointer-events-none absolute left-[18%] bottom-[31%] hidden h-2 w-8 -rotate-[18deg] rounded-full bg-[#FFD23F]/62 md:block" />
      <div className="pointer-events-none absolute right-[4%] top-[58%] hidden h-2 w-2 rounded-full bg-[#F04B23]/30 lg:block" />
      <div className="pointer-events-none absolute left-[43%] bottom-[8%] hidden h-20 w-20 rounded-full border border-[#F04B23]/10 lg:block" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1320px] items-center gap-8 md:grid-cols-[1.28fr_0.72fr] lg:gap-10">
        <BirthdayIllustration />

        <div>
          <span className="text-[20px] font-medium uppercase tracking-normal text-[#13A8DF] sm:text-[24px]">
            Birthday Wishes
          </span>
          <h2 className="mt-3 text-[42px] font-medium leading-[1.1] text-black sm:text-[56px] lg:text-[66px]">
            {content?.title || <><span>Make Their</span><br />Day <span className="text-[#FFD23F]">Special!</span></>}
          </h2>
          <p className="mt-5 max-w-[560px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]">
            {content?.description || "Send your birthday wishes and get featured on A+ Kids"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {birthdayChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full bg-white/88 py-2 pl-2 pr-4 text-[15px] font-normal leading-none text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.07)] transition-transform hover:-translate-y-0.5 sm:text-[16px]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5FBFF]">
                  <Image
                    src={sitePath(chip.icon)}
                    alt={chip.alt}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </span>
                {chip.label}
              </span>
            ))}
          </div>
          <a
            href={content?.linkUrl || "/birthdays"}
            className="birthday-cta mt-9 inline-flex h-14 items-center gap-4 rounded-full bg-[#13A8DF] pl-7 pr-3 text-[21px] font-normal leading-none tracking-normal text-white no-underline shadow-[0_14px_28px_rgba(19,168,223,0.22)] transition-transform hover:scale-[1.03] hover:no-underline"
          >
            {content?.linkLabel || "Send Birthday"}
            <span
              aria-hidden="true"
              className="birthday-cta-arrow flex h-10 w-10 items-center justify-center rounded-full bg-[#071B63]"
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
      </div>
      <style>{`
        .birthday-cake-stage {
          animation: birthdayCakeFloat 5.8s ease-in-out infinite;
        }

        .birthday-confetti {
          border-radius: 9999px;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .confetti-one {
          background: #ffd23f;
          height: 12px;
          left: 24%;
          top: 20%;
          width: 12px;
        }

        .confetti-two {
          background: #13a8df;
          height: 9px;
          right: 28%;
          top: 28%;
          width: 9px;
        }

        .confetti-three {
          background: #f04b23;
          bottom: 26%;
          height: 10px;
          left: 33%;
          width: 10px;
        }

        .confetti-four {
          background: #ffd23f;
          bottom: 31%;
          height: 8px;
          right: 20%;
          width: 8px;
        }

        .birthday-cta:hover .birthday-cta-arrow {
          animation: birthdayArrowNudge 520ms ease both;
        }

        @keyframes birthdayCakeFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes birthdayArrowNudge {
          0%,
          100% {
            transform: translateX(0);
          }

          48% {
            transform: translateX(5px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .birthday-cake-stage,
          .birthday-cta:hover .birthday-cta-arrow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
