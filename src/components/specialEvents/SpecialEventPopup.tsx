type SpecialEventPopupProps = {
  event: {
    name: string;
    date: string;
    place: string;
    description: string;
    guests: string[];
    contact: string;
    links: { label: string; href: string }[];
  };
  onClose: () => void;
};

export default function SpecialEventPopup({
  event,
  onClose,
}: SpecialEventPopupProps) {
  const primaryLink = event.links[0];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#07256f]/88 px-5 py-6 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-[1180px] overflow-y-auto rounded-[30px] bg-[radial-gradient(circle_at_42%_42%,rgba(222,198,255,0.48),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f7f4ff_48%,#eef5ff_100%)] p-8 shadow-[0_30px_90px_rgba(0,20,84,0.42)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="absolute right-7 top-7 z-20 grid h-14 w-14 place-items-center rounded-full bg-white text-[34px] font-bold leading-none text-[#071B63] shadow-[0_12px_28px_rgba(7,27,99,0.16)]"
        >
          x
        </button>

        <div className="pointer-events-none absolute left-[47%] top-24 text-[48px] font-bold text-[#ffc20a]">
          *
        </div>
        <div className="pointer-events-none absolute left-[50%] top-44 text-[38px] font-bold text-[#ff49b0]">
          ♪
        </div>
        <div className="pointer-events-none absolute left-[36%] top-28 text-[36px] font-bold text-[#57b7ff]">
          ))
        </div>

        <div className="grid gap-9 lg:grid-cols-[1fr_426px]">
          <div className="relative min-h-[620px]">
            <span className="inline-flex items-center gap-3 rounded-full bg-[#eadcff] px-5 py-3 text-[18px] font-bold text-[#5627ff]">
              <span className="text-[22px] leading-none">*</span>
              Special Event
            </span>

            <h3 className="mt-5 max-w-[600px] text-[56px] font-bold leading-[1.04] text-[#071B63]">
              {event.name}
            </h3>
            <p className="mt-6 max-w-[560px] text-[23px] font-medium leading-[1.42] text-[#071B63]/82">
              {event.description}
            </p>

            <div className="mt-8 h-[250px] max-w-[650px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_25%_45%,rgba(255,255,255,0.72),transparent_22%),linear-gradient(135deg,#d7c8ff_0%,#ffc4eb_48%,#dff3ff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_44px_rgba(86,39,255,0.14)]">
              <div className="flex h-full items-end justify-between px-8 pb-7">
                <div className="grid h-36 w-36 place-items-center rounded-full bg-[#0c84e8] text-[54px] font-bold text-[#ffc20a] shadow-[0_16px_34px_rgba(7,27,99,0.22)]">
                  A+
                </div>
                <div className="mb-5 rounded-[20px] bg-[#ff5aa9] px-8 py-4 text-[34px] font-bold text-white shadow-[0_12px_28px_rgba(255,73,176,0.24)]">
                  ON AIR
                </div>
                <div className="grid h-36 w-44 place-items-center rounded-[32px] bg-[#ffc20a] text-[52px] font-bold text-[#0c84e8] shadow-[0_16px_34px_rgba(7,27,99,0.2)]">
                  TV
                </div>
              </div>
            </div>

            <h4 className="mt-7 text-[24px] font-bold text-[#071B63]">
              Who comes
            </h4>
            <div className="mt-4 flex flex-wrap gap-4">
              {event.guests.map((guest) => (
                <span
                  key={guest}
                  className="rounded-full bg-white px-6 py-3 text-[17px] font-bold text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.1)]"
                >
                  {guest}
                </span>
              ))}
            </div>
          </div>

          <aside className="relative mt-24 overflow-hidden rounded-[34px] border border-white bg-white/62 p-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_22px_54px_rgba(86,39,255,0.16)] backdrop-blur-xl">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle_at_18%_100%,rgba(198,177,255,0.6),transparent_32%),radial-gradient(circle_at_72%_100%,rgba(198,177,255,0.52),transparent_30%)]" />

            <div className="relative flex gap-5 border-b border-[#dcd7ff] pb-7">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[#eadcff] text-[28px] font-bold text-[#5627ff]">
                D
              </span>
              <div>
                <p className="text-[18px] font-bold text-[#071B63]/62">Date</p>
                <p className="mt-3 text-[23px] font-bold text-[#071B63]">
                  {event.date}
                </p>
                <p className="mt-2 text-[18px] font-medium text-[#071B63]/80">
                  Event day
                </p>
              </div>
            </div>

            <div className="relative flex gap-5 border-b border-[#dcd7ff] py-7">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[#eadcff] text-[28px] font-bold text-[#5627ff]">
                P
              </span>
              <div>
                <p className="text-[18px] font-bold text-[#071B63]/62">Place</p>
                <p className="mt-3 text-[23px] font-bold text-[#071B63]">
                  {event.place}
                </p>
              </div>
            </div>

            <div className="relative flex gap-5 py-7">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[#eadcff] text-[28px] font-bold text-[#5627ff]">
                C
              </span>
              <div>
                <p className="text-[18px] font-bold text-[#071B63]/62">
                  Contact
                </p>
                <p className="mt-3 text-[23px] font-bold text-[#071B63]">
                  {event.contact}
                </p>
              </div>
            </div>

            {primaryLink ? (
              <a
                href={primaryLink.href}
                className="relative mt-3 flex h-16 items-center justify-center gap-4 rounded-[28px] bg-[linear-gradient(180deg,#ffd83d,#ffb51f)] text-[24px] font-bold text-[#071B63] shadow-[0_12px_24px_rgba(255,181,31,0.28)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071B63] text-[17px] text-[#ffc20a]">
                  *
                </span>
                {primaryLink.label}
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
