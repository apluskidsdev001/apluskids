"use client";

import Image from "next/image";
import { useState } from "react";
import { sitePath } from "@/utils/sitePath";

type Section =
  | "Dashboard"
  | "My Profile"
  | "Orders"
  | "Wishlist"
  | "Notifications"
  | "Settings";

const menuItems: { label: Section; icon: string }[] = [
  { label: "Dashboard", icon: "⌂" },
  { label: "My Profile", icon: "♙" },
  { label: "Orders", icon: "⬡" },
  { label: "Wishlist", icon: "♡" },
  { label: "Notifications", icon: "♧" },
  { label: "Settings", icon: "⚙" },
];

const stats = [
  {
    label: "Rank",
    value: "12",
    note: "Top 10% of users",
    icon: "★",
    color: "#7146e8",
    background: "#f2edff",
  },
  {
    label: "Achievements",
    value: "4",
    note: "Top 20% of users",
    icon: "♛",
    color: "#ef3780",
    background: "#fff0f6",
  },
  {
    label: "Top 3 Finishes",
    value: "9",
    note: "Top 15% of users",
    icon: "🏆",
    color: "#f2aa00",
    background: "#fff8e8",
  },
  {
    label: "Kudos Received",
    value: "6",
    note: "Top 40% of users",
    icon: "♥",
    color: "#f44783",
    background: "#eef7ff",
  },
];

const activities = [
  { icon: "🏆", title: "Quiz Champion", text: "You finished in the top 3!", time: "Today" },
  { icon: "⭐", title: "New achievement", text: "Super Learner badge unlocked", time: "Yesterday" },
  { icon: "🎬", title: "Watchlist updated", text: "Added Rhyme Doo to your list", time: "2 days ago" },
];

function Dashboard() {
  return (
    <>
      <section className="relative isolate grid overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_14px_42px_rgba(55,71,120,0.08)] tablet:min-h-[190px] tablet:grid-cols-[1.08fr_0.92fr] desktop:min-h-[200px] monitor:min-h-[220px]">
        <div className="relative z-10 flex min-h-[178px] flex-col justify-center bg-[linear-gradient(112deg,#f0f4ff_0%,#f7f9ff_72%,#ffffff_100%)] px-5 py-7 tablet:min-h-0 tablet:px-7 desktop:px-9 monitor:px-11">
          <span className="mb-3 w-fit rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7047e8] shadow-sm">
            My dashboard
          </span>
          <p className="text-[clamp(1.75rem,3.2vw,2.8rem)] font-semibold leading-tight tracking-[-0.025em] text-slate-950">
            Hello Shehan! <span aria-hidden="true">👋</span>
          </p>
          <p className="mt-3 max-w-[430px] text-sm leading-6 text-slate-500 tablet:text-base tablet:leading-7">
            Welcome back! Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>

        <div className="relative min-h-[165px] overflow-hidden bg-white px-3 tablet:min-h-full tablet:px-0">
          <div className="pointer-events-none absolute -left-10 top-0 z-10 hidden h-full w-24 bg-gradient-to-r from-white/0 to-white tablet:block" />
          <div className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full bg-[#e6f3ff]/70 blur-3xl tablet:size-56" />
          <Image
            src={sitePath("/images/profile/Hero.png")}
            alt="Colourful toys, a teddy bear and a friendly dinosaur"
            width={407}
            height={150}
            priority
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 48vw, 620px"
            className="relative z-0 h-full w-full object-contain object-center tablet:absolute tablet:bottom-0 tablet:right-2 tablet:object-right-center desktop:right-5 monitor:right-8"
          />
        </div>
      </section>

      <section aria-label="Account highlights" className="profile-panel mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="flex min-h-[126px] items-center gap-3 rounded-[18px] border border-white/90 p-3 tablet:p-4"
            style={{ background: stat.background }}
          >
            <div
              className="grid size-12 shrink-0 place-items-center rounded-full text-xl tablet:size-14"
              style={{ color: stat.color, backgroundColor: `${stat.color}18` }}
              aria-hidden="true"
            >
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium leading-tight text-slate-600 tablet:text-sm">
                {stat.label}
              </p>
              <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-900">{stat.value}</p>
              <p className="mt-2 truncate text-[10px] font-medium text-[#7047e8] tablet:text-xs">
                {stat.note} <span aria-hidden="true">›</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 desktop:grid-cols-[1.35fr_0.85fr]">
        <article className="profile-panel">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7047e8]">Your week</p>
              <h2 className="mt-1 text-xl font-semibold text-[#142b53] tablet:text-2xl">Learning journey</h2>
            </div>
            <span className="rounded-full bg-[#edf8ff] px-3 py-1 text-xs font-medium text-[#1580b9]">4 day streak 🔥</span>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2" aria-label="Weekly activity">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="text-center">
                <div className="mx-auto flex h-24 max-w-10 items-end overflow-hidden rounded-full bg-[#f1f4fa]">
                  <div
                    className={`w-full rounded-full ${index < 4 ? "bg-gradient-to-t from-[#7146e8] to-[#a78bfa]" : "bg-[#dfe5ef]"}`}
                    style={{ height: `${[74, 48, 88, 62, 24, 18, 10][index]}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{day}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="profile-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#142b53] tablet:text-2xl">Recent activity</h2>
            <button type="button" className="text-sm font-medium text-[#7047e8] hover:underline">View all</button>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {activities.map((activity) => (
              <div key={activity.title} className="flex gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f1ff]" aria-hidden="true">
                  {activity.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                  <p className="truncate text-xs text-slate-500">{activity.text}</p>
                </div>
                <time className="whitespace-nowrap text-[10px] text-slate-400">{activity.time}</time>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function SectionHero({ title, subtitle, image, alt }: { title: string; subtitle: string; image: string; alt: string }) {
  return (
    <section className="grid min-h-[150px] overflow-hidden rounded-[22px] border border-white bg-[linear-gradient(110deg,#f5f7ff,#fff)] shadow-[0_14px_42px_rgba(55,71,120,0.07)] tablet:grid-cols-[1fr_390px]">
      <div className="flex flex-col justify-center px-5 py-7 tablet:px-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
      <div className="relative hidden min-h-[150px] tablet:block">
        <Image src={sitePath(image)} alt={alt} fill sizes="390px" className="object-contain object-right-center" />
      </div>
    </section>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#7146e8] focus:ring-4 focus:ring-[#7146e8]/10";

function FormGroup({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="grid size-8 place-items-center rounded-full text-sm text-white" style={{ backgroundColor: color }}>{icon}</span>
        {title}
      </legend>
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">{children}</div>
    </fieldset>
  );
}

function ProfileForm() {
  const [saved, setSaved] = useState(false);

  return (
    <>
      <SectionHero
        title="Hello Shehan! 👋"
        subtitle="Welcome back! Keep your family details up to date for a better A Plus Kids experience."
        image="/images/profile/Hero1.png"
        alt="A teddy bear and friendly dinosaur with colourful toys"
      />
      <form
        className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1fr)_250px] monitor:grid-cols-[minmax(0,1fr)_280px]"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <section className="profile-panel space-y-6">
          <FormGroup title="Personal Information" icon="●" color="#7047e8">
            {[
              ["Full name", "Shehan Aravinda", "text"],
              ["Email address", "shehan@example.com", "email"],
              ["Phone number", "077 123 4567", "tel"],
              ["Date of birth", "1986-04-15", "date"],
            ].map(([label, value, type]) => (
              <label key={label} className="grid gap-1.5 text-xs font-medium text-slate-600">
                {label}<input type={type} defaultValue={value} className={fieldClass} />
              </label>
            ))}
          </FormGroup>

          <FormGroup title="Child Information" icon="★" color="#f43f8c">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Child name<input defaultValue="Dinuka Perera" className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Child age<input defaultValue="7 Years" className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Favourite programme<select defaultValue="A Plus Kids TV" className={fieldClass}><option>A Plus Kids TV</option><option>Rhyme Doo</option><option>Kids Champ</option></select></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Favourite toy<select defaultValue="Building Blocks" className={fieldClass}><option>Building Blocks</option><option>Art Set</option><option>Soft Toys</option></select></label>
          </FormGroup>

          <FormGroup title="Address Information" icon="⌖" color="#7047e8">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Address<input defaultValue="123/4, Lake Road, Colombo 08" className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">City<input defaultValue="Colombo" className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Province<select defaultValue="Western Province" className={fieldClass}><option>Western Province</option><option>Central Province</option><option>Southern Province</option></select></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Postal code<input defaultValue="00800" className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Country<select defaultValue="Sri Lanka" className={fieldClass}><option>Sri Lanka</option></select></label>
          </FormGroup>

          <FormGroup title="Security" icon="♙" color="#22b55f">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Password<input type="password" defaultValue="password" className={fieldClass} /></label>
            <button type="button" className="mt-auto h-11 rounded-xl border border-[#d8ccff] text-sm font-medium text-[#7047e8] hover:bg-[#f7f4ff]">Change password</button>
            <div className="flex h-11 items-center rounded-xl bg-emerald-50 px-3 text-xs font-medium text-emerald-600">Two-step verification enabled</div>
          </FormGroup>
        </section>

        <aside className="profile-panel h-fit">
          <h2 className="text-lg font-semibold text-slate-900">Profile completion</h2>
          <div className="mx-auto mt-5 grid size-28 place-items-center rounded-full bg-[conic-gradient(#7047e8_0_75%,#eee9ff_75%)]">
            <div className="grid size-[86px] place-items-center rounded-full bg-white text-2xl font-semibold text-[#7047e8]">75%</div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">Great job! ✨</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Complete your profile to get a better experience.</p>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-800">👑 Parent member benefits</h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
              <li>✦ Exclusive prices and discounts</li><li>✦ Priority birthday requests</li><li>✦ Early access to Kids Champ</li><li>✦ Special member support</li>
            </ul>
          </div>
          <Image src={sitePath("/images/profile/ChatGPT Image May 21, 2026, 09_58_18 AM 1.png")} alt="Dinosaur holding a birthday gift" width={200} height={150} className="mx-auto mt-5 h-32 w-auto object-contain" />
        </aside>

        <div className="flex flex-wrap items-center justify-center gap-3 desktop:col-span-2">
          <button type="reset" className="min-w-40 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="min-w-40 rounded-xl bg-[#f62983] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-pink-200 hover:bg-[#df1d70]">Save changes</button>
          {saved && <span role="status" className="w-full text-center text-sm text-emerald-600">Saved for this preview ✓</span>}
        </div>
      </form>
    </>
  );
}

const notificationRows = [
  ["Your order #A10045 has been shipped", "Your order is on the way and will be delivered soon.", "2 hours ago", "🛍️"],
  ["Dinuka’s birthday request approved", "The birthday request has been approved and scheduled.", "Yesterday", "🎂"],
  ["Your artwork is selected for review", "Your Kids Champ artwork is now under review.", "1 day ago", "🏆"],
  ["Special offer just for you!", "Get 20% off selected educational toys.", "2 days ago", "🏷️"],
  ["Kids Zone: New video uploaded", "A new fun learning video is now available.", "3 days ago", "⭐"],
];

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-[#f62983]" : "bg-slate-300"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} /></button>;
}

function NotificationsPanel() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<number[]>([]);
  const [preferences, setPreferences] = useState([true, true, true, true, false, true]);
  const filters = ["All", "Orders", "Birthday Requests", "Kids Champ", "Promotions", "System"];
  return (
    <>
      <SectionHero title="My Notifications" subtitle="Your important account, order and Kids Zone updates." image="/images/profile/ChatGPT Image May 21, 2026, 12_27_21 PM 1.png" alt="Purple notification bell with an envelope and teddy bear" />
      <div className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1fr)_260px]">
        <section className="profile-panel">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium ${filter === item ? "border-[#f62983] bg-pink-50 text-[#f62983]" : "border-slate-200 text-slate-600"}`}>{item}</button>)}
          </div>
          <div className="mt-3 flex items-center justify-between border-y border-slate-100 py-3 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => setSelected(selected.length === notificationRows.length ? [] : notificationRows.map((_, i) => i))}>☐ Select all</button>
            <button type="button" className="text-[#3478f6]">✓ Mark all as read</button>
          </div>
          <div className="mt-3 space-y-2">
            {notificationRows.map((row, index) => (
              <article key={row[0]} className={`flex items-center gap-3 rounded-xl border p-3 ${index < 3 ? "border-pink-100 bg-pink-50/45" : "border-slate-100"}`}>
                <input type="checkbox" checked={selected.includes(index)} onChange={() => setSelected((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index])} className="size-4 accent-[#f62983]" aria-label={`Select ${row[0]}`} />
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm">{row[3]}</span>
                <div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-800">{row[0]}</h3><p className="mt-1 truncate text-xs text-slate-500">{row[1]}</p></div>
                <div className="text-right"><p className="whitespace-nowrap text-[10px] text-slate-400">{row[2]}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] ${index < 3 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{index < 3 ? "Unread" : "Read"}</span></div>
              </article>
            ))}
          </div>
        </section>
        <aside className="space-y-5">
          <section className="profile-panel">
            <h2 className="text-base font-semibold text-slate-900">⚙ Notification preferences</h2>
            <p className="mt-1 text-xs text-slate-500">Manage what you want to hear about.</p>
            <div className="mt-5 space-y-4">
              {["Orders & deliveries", "Birthday requests", "Kids Champ updates", "Promotions & offers", "New arrivals", "System updates"].map((label, index) => <div key={label} className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600"><span>{label}</span><Toggle label={label} enabled={preferences[index]} onChange={() => setPreferences((items) => items.map((value, i) => i === index ? !value : value))} /></div>)}
            </div>
          </section>
          <section className="profile-panel">
            <h2 className="text-base font-semibold text-slate-900">Activity summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 desktop:grid-cols-1">
              {[["Total notifications", "18"], ["Unread", "7"], ["This week", "12"], ["This month", "28"]].map(([label, value]) => <div key={label} className="flex justify-between rounded-xl bg-[#fafbff] p-3 text-xs text-slate-500"><span>{label}</span><strong className="text-slate-800">{value}</strong></div>)}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState([true, true, true, false]);
  return (
    <>
      <SectionHero title="Settings" subtitle="Manage your account security, notifications and communication preferences." image="/images/profile/ChatGPT Image May 21, 2026, 01_12_37 PM 1.png" alt="Friendly dinosaur beside a purple settings gear" />
      <div className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-5">
          <section className="profile-panel">
            <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-full bg-pink-50 text-xl">🛡️</span><div><h2 className="text-lg font-semibold text-slate-900">Security</h2><p className="text-sm text-slate-500">Keep your account secure by updating your password.</p></div></div>
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 p-4"><span className="grid size-10 place-items-center rounded-xl bg-pink-50">🔒</span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-800">Change password</h3><p className="text-xs text-slate-500">Update your account password regularly.</p></div><button type="button" className="rounded-lg border border-pink-300 px-5 py-2 text-xs font-medium text-[#f62983]">Change</button></div>
          </section>
          <section className="profile-panel">
            <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-full bg-blue-50 text-xl">🔔</span><div><h2 className="text-lg font-semibold text-slate-900">Notification preferences</h2><p className="text-sm text-slate-500">Choose which notifications you want to receive.</p></div></div>
            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {[["Orders & deliveries", "Order and delivery updates", "🛍️"], ["Birthday requests", "Birthday request news", "🎂"], ["Kids Champ updates", "Activities and results", "🏆"], ["Promotions & offers", "Offers and exciting promotions", "🏷️"]].map(([title, subtitle, icon], index) => <div key={title} className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#faf6ff]">{icon}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-800">{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div><Toggle label={title} enabled={settings[index]} onChange={() => setSettings((items) => items.map((value, i) => i === index ? !value : value))} /></div>)}
            </div>
          </section>
        </div>
        <aside className="profile-panel h-fit">
          <h2 className="text-base font-semibold text-slate-900">🎧 Need help?</h2>
          <div className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">{["Help centre", "Contact support", "Terms & conditions", "Privacy policy"].map((item) => <a key={item} href={item === "Contact support" ? "mailto:apluskidstvinfo@gmail.com" : "#"} className="flex justify-between py-3 hover:text-[#7047e8]"><span>{item}</span><span>›</span></a>)}</div>
          <Image src={sitePath("/images/profile/ChatGPT Image May 20, 2026, 05_49_37 PM 1.png")} alt="A Plus Kids support dinosaur" width={149} height={156} className="mx-auto mt-5 h-32 w-auto object-contain" />
        </aside>
      </div>
    </>
  );
}

function SimpleSection({ section }: { section: "Orders" | "Wishlist" }) {
  const content = {
    Orders: ["Your orders", "Track your A Plus Kids Market orders in one place.", "📦", "No active orders"],
    Wishlist: ["My wishlist", "Keep your favourite toys and programmes close.", "💗", "Your wishlist is ready"],
  }[section];

  return (
    <section className="profile-panel min-h-[430px]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7047e8]">A Plus Kids account</p>
      <h1 className="mt-1 text-2xl font-semibold text-[#142b53] tablet:text-3xl">{content[0]}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">{content[1]}</p>
      <div className="mt-10 grid min-h-64 place-items-center rounded-[22px] border border-dashed border-[#d9dff0] bg-[#fafbff] p-6 text-center">
        <div>
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-4xl shadow-sm">{content[2]}</div>
          <h2 className="mt-5 text-lg font-medium text-slate-800">{content[3]}</h2>
          <p className="mt-2 text-sm text-slate-500">New items will appear here automatically.</p>
        </div>
      </div>
    </section>
  );
}

export default function ProfileDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("Dashboard");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_48%,#f7f8fc_100%)] px-4 pb-16 pt-[104px] tablet:px-6 laptop:px-8 laptop:pt-[136px] desktop:px-10 monitor:px-12">
      <div className="mx-auto grid max-w-[1680px] gap-5 laptop:grid-cols-[250px_minmax(0,1fr)] desktop:grid-cols-[280px_minmax(0,1fr)] monitor:grid-cols-[300px_minmax(0,1fr)] monitor:gap-8">
        <aside className="rounded-[24px] border border-slate-100 bg-white p-3 shadow-[0_18px_50px_rgba(55,71,120,0.08)] laptop:sticky laptop:top-[126px] laptop:h-fit laptop:p-4">
          <div className="rounded-[18px] bg-[linear-gradient(135deg,#f7f4ff,#f2f9ff)] px-3 py-4 laptop:px-4 laptop:py-5">
            <div className="flex items-center gap-3">
              <Image
                src={sitePath("/images/profile/Profile pic.png")}
                alt=""
                width={84}
                height={84}
                className="size-14 rounded-full tablet:size-16"
              />
              <div className="min-w-0">
                <p className="text-base font-semibold leading-tight text-slate-900 tablet:text-lg">Welcome!</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Sign in to access your A Plus Kids account.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 laptop:grid-cols-1">
              <a
                href={sitePath("/login/")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7047e8] px-4 text-sm font-medium text-white shadow-lg shadow-[#7047e8]/20 transition hover:bg-[#5f36d4] focus:outline-none focus:ring-4 focus:ring-[#7047e8]/20"
              >
                Login
              </a>
              <a
                href={sitePath("/register/")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8ccff] bg-white px-4 text-center text-sm font-medium text-[#7047e8] transition hover:bg-[#f8f6ff] focus:outline-none focus:ring-4 focus:ring-[#7047e8]/10"
              >
                Create account
              </a>
            </div>
          </div>

          <nav aria-label="Profile navigation" className="mt-2 flex gap-2 overflow-x-auto pb-2 laptop:grid laptop:overflow-visible">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveSection(item.label)}
                className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm transition tablet:text-base laptop:w-full ${
                  activeSection === item.label
                    ? "bg-[#fff0f6] font-medium text-[#d92d70]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                aria-current={activeSection === item.label ? "page" : undefined}
              >
                <span className="w-5 text-center text-xl" aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 tablet:text-base laptop:w-full"
              onClick={() => window.alert("Logout will be connected when authentication backend is added.")}
            >
              <span className="w-5 text-center text-xl" aria-hidden="true">↪</span>
              Logout
            </button>
          </nav>

          <div className="relative mt-5 hidden min-h-[154px] overflow-hidden rounded-[18px] border border-slate-200 bg-gradient-to-br from-white to-[#f6f2ff] p-4 laptop:block">
            <Image
              src={sitePath("/images/profile/ChatGPT Image May 20, 2026, 05_49_37 PM 1.png")}
              alt="Friendly A Plus Kids support dinosaur"
              width={149}
              height={156}
              className="absolute -bottom-1 -left-5 h-28 w-auto"
            />
            <div className="ml-[82px]">
              <h2 className="text-base font-semibold text-slate-900">Need help?</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">We are here for you.</p>
              <a href="mailto:apluskidstvinfo@gmail.com" className="mt-4 inline-flex rounded-lg bg-[#7146e8] px-3 py-2 text-[11px] font-medium text-white hover:bg-[#5f36d4]">
                Contact support
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {activeSection === "Dashboard" && <Dashboard />}
          {activeSection === "My Profile" && <ProfileForm />}
          {activeSection === "Notifications" && <NotificationsPanel />}
          {activeSection === "Settings" && <SettingsPanel />}
          {(activeSection === "Orders" || activeSection === "Wishlist") && (
            <SimpleSection section={activeSection} />
          )}
        </div>
      </div>
    </main>
  );
}
