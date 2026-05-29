type SpecialEventCardProps = {
  name: string;
  date: string;
  place: string;
  thumbnail?: string;
  onClick: () => void;
};

export default function SpecialEventCard({
  name,
  date,
  place,
  thumbnail,
  onClick,
}: SpecialEventCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[124px] shrink-0 overflow-hidden rounded-[16px] bg-white text-left shadow-[0_12px_28px_rgba(7,27,99,0.12)] transition-transform duration-300 hover:-translate-y-1 md:w-[240px] md:rounded-[22px] md:shadow-[0_16px_34px_rgba(7,27,99,0.12)]"
    >
      <div
        className="h-[74px] rounded-b-[16px] bg-[#d8d8d8] md:h-[135px] md:rounded-b-[22px]"
        style={
          thumbnail
            ? {
                backgroundImage: `url(${thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <div className="px-4 py-3 md:px-5 md:py-4">
        <h3 className="text-[13px] font-bold leading-tight text-[#071B63] md:text-[17px]">
          {name}
        </h3>
        <p className="mt-1 text-[11px] font-medium leading-tight text-[#071B63] md:mt-2 md:text-[13px]">
          {date}
        </p>
        <p className="mt-1 text-[11px] font-medium leading-tight text-[#071B63]/70 md:text-[13px]">
          {place}
        </p>
      </div>
    </button>
  );
}
