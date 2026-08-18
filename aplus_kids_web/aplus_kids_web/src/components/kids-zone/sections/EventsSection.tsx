const events = [
  {
    title: "School Visits",
    description: "Fun activities and learning moments with A+ Kids.",
  },
  {
    title: "Family Days",
    description: "Weekend programs for kids, parents, and friends.",
  },
  {
    title: "Creative Workshops",
    description: "Hands-on sessions for art, stories, music, and games.",
  },
];

export default function EventsSection({ content }: { content?: ContentItem }) {
  return (
    <section
      id="events"
      className="flex min-h-screen w-full scroll-mt-32 items-center bg-white px-4 py-12 sm:px-6 md:px-10 lg:px-16 xl:px-20"
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="max-w-[760px]">
          <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#F04B23]">
            Explore
          </span>
          <h2 className="mt-4 text-[42px] font-bold leading-[1.05] text-[#071B63] sm:text-[54px] md:text-[62px] lg:text-[76px] xl:text-[86px]">
            {content?.title || <><span>Events &</span><br />Memories</>}
          </h2>
        </div>

        {content?.description ? <p className="mt-5 max-w-2xl text-[18px] font-medium leading-7 text-[#526382]">{content.description}</p> : null}

        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3 lg:mt-12">
          {events.map((event) => (
            <article
              key={event.title}
              className="min-h-[220px] rounded-[8px] bg-[#F7FCFF] p-6 shadow-[0_14px_35px_rgba(7,27,99,0.08)] sm:min-h-[250px] sm:p-7 md:min-h-[300px]"
            >
              <div className="h-3 w-20 rounded-full bg-[#FFE36E]" />
              <h3 className="mt-8 text-[26px] font-bold leading-tight text-[#13A8DF] sm:text-[30px] md:text-[32px]">
                {event.title}
              </h3>
              <p className="mt-4 text-[17px] font-medium leading-[1.5] text-[#071B63]/75 sm:text-[18px]">
                {event.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
import type { ContentItem } from "@/components/admin/adminData";
