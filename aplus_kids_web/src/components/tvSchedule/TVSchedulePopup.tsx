import { getYouTubeEmbedUrl } from "../trailers/youtube";

type TVSchedulePopupProps = {
  program: {
    name: string;
    timePeriod: string;
    description: string;
    contact: string;
    trailerUrl: string;
    links: { label: string; href: string }[];
  };
  onClose: () => void;
};

export default function TVSchedulePopup({
  program,
  onClose,
}: TVSchedulePopupProps) {
  const embedUrl = getYouTubeEmbedUrl(program.trailerUrl);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#07256f]/88 px-5 py-6 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-[1390px] overflow-y-auto rounded-[30px] bg-[radial-gradient(circle_at_76%_12%,rgba(85,150,255,0.38),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f1f7ff_48%,#dce9ff_100%)] p-12 shadow-[0_30px_90px_rgba(0,20,84,0.42)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close program details"
          className="absolute right-7 top-7 z-20 grid h-14 w-14 place-items-center rounded-full bg-white text-[34px] font-bold leading-none text-[#071B63] shadow-[0_12px_28px_rgba(7,27,99,0.16)]"
        >
          x
        </button>

        <div className="pointer-events-none absolute left-[36%] top-20 text-[58px] font-bold text-[#ffd83d]">
          *
        </div>
        <div className="pointer-events-none absolute right-[8%] top-16 text-[54px] font-bold text-[#fff1a8]">
          *
        </div>
        <div className="pointer-events-none absolute bottom-8 left-[18%] h-28 w-80 rounded-[50%] bg-white/62 blur-sm" />

        <div className="grid gap-12 lg:grid-cols-[480px_1fr]">
          <div className="relative min-h-[620px]">
            <span className="inline-flex items-center gap-3 rounded-full bg-[#d7e9ff] px-5 py-3 text-[18px] font-bold text-[#005eff]">
              <span className="text-[20px] leading-none">TV</span>
              TV Schedule
            </span>

            <h3 className="mt-6 text-[62px] font-bold leading-[1.02] text-[#071B63]">
              {program.name}
            </h3>

            <p className="mt-8 inline-flex rounded-full bg-[#ffd83d] px-6 py-4 text-[23px] font-bold text-[#071B63]">
              {program.timePeriod}
            </p>

            <h4 className="mt-10 text-[26px] font-bold text-[#071B63]">
              About this program
            </h4>
            <p className="mt-4 max-w-[410px] text-[21px] font-medium leading-[1.55] text-[#071B63]/82">
              {program.description}
            </p>

            <h4 className="mt-10 text-[26px] font-bold text-[#071B63]">
              Contact
            </h4>
            <p className="mt-4 text-[23px] font-bold text-[#071B63]">
              {program.contact}
            </p>

          </div>

          <aside className="relative pt-14">
            <h4 className="mb-6 text-[28px] font-bold text-[#071B63]">
              Program Trailer
            </h4>
            <div className="aspect-video overflow-hidden rounded-[24px] bg-black shadow-[0_22px_52px_rgba(7,27,99,0.22)]">
              {embedUrl ? (
                <iframe
                  title={`${program.name} trailer`}
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-center gap-7">
              <a
                href="/watch"
                className="inline-flex h-16 items-center gap-5 rounded-[28px] bg-[#005eff] px-9 text-[22px] font-bold text-white shadow-[0_12px_28px_rgba(0,94,255,0.24)]"
              >
                More videos
                <span className="grid h-10 w-16 place-items-center rounded-full bg-white/16 text-[18px]">
                  TV
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
