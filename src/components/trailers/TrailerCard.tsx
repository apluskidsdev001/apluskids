import { getYouTubeThumbnail } from "./youtube";

type TrailerCardProps = {
  title: string;
  youtubeUrl: string;
  onClick: () => void;
};

export default function TrailerCard({
  title,
  youtubeUrl,
  onClick,
}: TrailerCardProps) {
  const thumbnail = getYouTubeThumbnail(youtubeUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[132px] shrink-0 text-left md:w-[240px]"
    >
      <span
        className="relative block h-[124px] overflow-hidden rounded-[14px] bg-[#d8d8d8] shadow-[0_12px_26px_rgba(7,27,99,0.1)] md:h-[135px] md:rounded-[22px] md:shadow-[0_16px_32px_rgba(7,27,99,0.1)]"
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
        <span className="absolute inset-0 bg-black/5 transition-colors group-hover:bg-black/0" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/80 shadow-[0_8px_20px_rgba(7,27,99,0.16)] backdrop-blur-md">
            <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-[#0C84E8]" />
          </span>
        </span>
      </span>
      <span className="mt-2 block text-left text-[13px] font-bold leading-tight text-[#071B63] md:mt-3 md:text-center md:text-[17px]">
        {title}
      </span>
    </button>
  );
}
