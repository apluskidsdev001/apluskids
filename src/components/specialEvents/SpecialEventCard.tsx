import { getYouTubeThumbnail } from "@/components/trailers/youtube";

type SpecialEventCardProps = {
  name: string;
  date: string;
  place: string;
  youtubeUrl: string;
  onClick: () => void;
};

export default function SpecialEventCard({
  name,
  date,
  place,
  youtubeUrl,
  onClick,
}: SpecialEventCardProps) {
  const thumbnail = getYouTubeThumbnail(youtubeUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-[#DCE7F2] bg-white p-2 text-left shadow-[0_10px_28px_rgba(24,54,94,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B7D8F4] hover:shadow-[0_18px_38px_rgba(24,54,94,0.14)] tablet:w-[280px] tablet:rounded-[22px] tablet:p-2.5 laptop:w-[300px] desktop:w-[320px] monitor:w-[350px]"
    >
      <span
        className="relative block aspect-video overflow-hidden rounded-[14px] bg-[#DCEEFF] tablet:rounded-[17px]"
        style={
          thumbnail
            ? {
                backgroundImage: `url(${thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <span className="absolute inset-0 bg-gradient-to-t from-[#071B63]/60 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-[#5627FF] shadow-sm tablet:left-3 tablet:top-3 tablet:px-3 tablet:text-[11px]">
          Special Event · {place}
        </span>
        <span className="absolute inset-0 grid place-items-center opacity-90 transition-transform group-hover:scale-105">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-[0_8px_20px_rgba(7,27,99,0.16)] backdrop-blur-md tablet:h-12 tablet:w-12">
            <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-[#0C84E8]" />
          </span>
        </span>
      </span>
      <span className="block px-2 pb-2 pt-3">
        <span className="line-clamp-2 block min-h-[40px] text-[14px] font-semibold leading-[1.4] text-[#102A56] tablet:min-h-[44px] tablet:text-[15px]">
          {name}
        </span>
        <span className="mt-1 block text-[11px] font-medium leading-tight text-[#67809F] tablet:text-[12px]">
          {date}
        </span>
      </span>
    </button>
  );
}
