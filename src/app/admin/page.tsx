import Link from "next/link";
import PublishAllButton from "@/components/admin/PublishAllButton";

const pageCards = [
  {
    title: "Home Page",
    description: "Manage the hero, shortcuts, live card, special events and shared Home sections.",
    href: "/admin/home",
    preview: "/?adminPreview=1",
    colour: "bg-[#FFF2E9] text-[#E95B1D]",
    icon: "H",
    features: ["Hero", "Shortcuts", "Special events"],
  },
  {
    title: "Watch Page",
    description: "Manage titles, categories, YouTube programs, trailers and shorts.",
    href: "/admin/watch",
    preview: "/watch?adminPreview=1",
    colour: "bg-[#E8F3FF] text-[#0877EF]",
    icon: "▶",
    features: ["Video playlist", "Categories", "Page titles"],
  },
  {
    title: "Kids Zone",
    description: "Edit Hero, Birthday, Kids Champ and Events section content.",
    href: "/admin/kids-zone",
    preview: "/kids-zone?adminPreview=1",
    colour: "bg-[#FFF2E9] text-[#E95B1D]",
    icon: "★",
    features: ["Section titles", "Descriptions", "Action links"],
  },
  {
    title: "Footer",
    description: "Update brand text, contact details, navigation and social links.",
    href: "/admin/footer",
    preview: "/?adminPreview=1#site-footer",
    colour: "bg-[#EBF8F0] text-[#238A55]",
    icon: "▤",
    features: ["Contact details", "Links", "Brand content"],
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <section className="flex flex-col gap-5 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2488F4]">Content overview</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[#17243D] tablet:text-[38px]">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-[15px] font-normal leading-7 text-[#68758A]">
            Manage the editable areas of A Plus Kids TV from one focused workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2"><Link href="/" target="_blank" className="inline-flex h-11 w-fit items-center rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[14px] font-medium text-[#33445F] shadow-sm">View public website ↗</Link><PublishAllButton /></div>
      </section>

      <section className="mt-8 grid gap-4 tablet:grid-cols-3">
        {[
          ["4", "Editable pages"],
          ["Draft", "Publishing mode"],
          ["Local", "Storage status"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[18px] border border-[#E1E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(25,48,79,0.05)]">
            <p className="text-[25px] font-semibold text-[#17243D]">{value}</p>
            <p className="mt-1 text-[13px] font-normal text-[#77859A]">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#17243D] tablet:text-[25px]">Editable pages</h2>
            <p className="mt-1 text-[13px] font-normal text-[#77859A]">Choose a page to manage its content.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 tablet:grid-cols-2 desktop:grid-cols-3">
          {pageCards.map((page) => (
            <article key={page.title} className="rounded-[22px] border border-[#E1E8F0] bg-white p-5 shadow-[0_10px_28px_rgba(25,48,79,0.06)]">
              <div className={`grid h-12 w-12 place-items-center rounded-[14px] text-[20px] ${page.colour}`}>{page.icon}</div>
              <h3 className="mt-5 text-[20px] font-semibold text-[#17243D]">{page.title}</h3>
              <p className="mt-2 min-h-[48px] text-[14px] font-normal leading-6 text-[#6B788C]">{page.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {page.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-[#F2F5F9] px-3 py-1.5 text-[11px] font-medium text-[#617087]">{feature}</span>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link href={page.href} className="inline-flex h-10 items-center justify-center rounded-[11px] bg-[#2488F4] px-4 text-[13px] font-medium text-white">Edit page</Link>
                <Link href={page.preview} target="_blank" className="inline-flex h-10 items-center justify-center rounded-[11px] border border-[#D7E2EE] px-4 text-[13px] font-medium text-[#44536A]">Preview</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-9 rounded-[22px] border border-[#D8E8F7] bg-[#EDF6FF] p-5 tablet:p-6">
        <h2 className="text-[17px] font-semibold text-[#173A68]">Safe setup</h2>
        <p className="mt-2 max-w-4xl text-[13px] font-normal leading-6 text-[#55708F]">
          Draft preview and publishing are active in this browser. Use Preview to review changes, then Publish on an editor page or Publish all drafts here. A shared database is still required for other devices.
        </p>
      </section>
    </>
  );
}
