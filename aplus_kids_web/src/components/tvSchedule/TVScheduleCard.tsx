type TVScheduleCardProps = {
  name: string;
  timePeriod: string;
  thumbnail?: string;
  isCurrent?: boolean;
  onClick: () => void;
};

export default function TVScheduleCard({
  name,
  timePeriod,
  thumbnail,
  isCurrent = false,
  onClick,
}: TVScheduleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full shrink-0 items-center gap-4 rounded-[16px] border bg-white p-4 text-left transition-transform duration-300 hover:-translate-y-1 md:block md:w-[240px] md:overflow-hidden md:rounded-[22px] md:p-0 ${
        isCurrent
          ? "border-[#F04B23] shadow-[0_16px_34px_rgba(240,75,35,0.2)]"
          : "border-transparent shadow-[0_10px_24px_rgba(7,27,99,0.1)] md:shadow-[0_16px_34px_rgba(7,27,99,0.12)]"
      }`}
    >
      {isCurrent ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-[#F04B23] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
          Now Playing
        </span>
      ) : null}
      <div
        className="h-14 w-14 shrink-0 rounded-[14px] bg-[#d8d8d8] md:h-[135px] md:w-auto md:rounded-none md:rounded-b-[22px]"
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
      <div className="min-w-0 flex-1 md:px-5 md:py-4">
        <h3 className="text-[14px] font-bold leading-tight text-[#071B63] md:text-[17px]">
          {name}
        </h3>
        <p className="mt-2 text-[12px] font-medium leading-tight text-[#071B63]/68 md:mt-3 md:text-[13px] md:text-[#071B63]">
          {timePeriod}
        </p>
      </div>
      <span className="text-[26px] font-medium leading-none text-[#071B63]/60 md:hidden">
        &gt;
      </span>
    </button>
  );
}
