"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/utils/auth";

const navItems = [
  { href: "/admin/home", label: "Dashboard", icon: "/icons/admin-sidebar/dashboard.png" },
  { href: "/admin/watch", label: "Watch Page", icon: "/icons/admin-sidebar/watch.png" },
  { href: "/admin/kids-zone", label: "Kids Zone", icon: "/icons/admin-sidebar/kids-zone.png" },
  { href: "/admin/kids-champ", label: "Kids Champ", icon: "/icons/admin-sidebar/kids-champ.png" },
  { href: "/admin/account-management", label: "Account management", icon: "/icons/admin-sidebar/account.png" },
  { href: "/admin/footer", label: "Footer", icon: "/icons/admin-sidebar/footer.png" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<"allowed" | "forbidden">("allowed");
  const [connection, setConnection] = useState<"checking" | "online" | "offline">("checking");
  const [connectionDetails,setConnectionDetails]=useState("Checking the Kids Champ API and database connection.");
  const [connectionPopup,setConnectionPopup]=useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/overview");
      if (response.status === 401) {
        setAccess("forbidden");
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
        return false;
      }
      const body=await response.json().catch(()=>null) as {message?:string;code?:string}|null;
      setConnection(response.ok ? "online" : "offline");
      setConnectionDetails(response.ok?"The Kids Champ API and database are responding normally.":body?.message||`The API returned HTTP ${response.status}.`);
      return response.ok;
    } catch {
      setConnection("offline");
      setConnectionDetails("The API server could not be reached. Check that the backend is running on port 8081 and that PostgreSQL is available.");
      return false;
    }
  }, [pathname, router]);

  useEffect(() => {
    const initial = window.setTimeout(() => void checkConnection(), 0);
    const timer = window.setInterval(() => void checkConnection(), 15_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [checkConnection]);

  if (access === "forbidden") return <div className="grid min-h-screen place-items-center bg-[#F6F9FD] p-6 text-center"><div><h1 className="text-xl font-semibold text-[#14264A]">Administrator access required</h1><p className="mt-2 text-sm text-[#68758A]">Your account does not have permission to open this workspace.</p><Link href="/" className="mt-5 inline-flex rounded-lg bg-[#087BF1] px-4 py-2 text-sm font-semibold text-white">Return to website</Link></div></div>;

  return (
    <div className="min-h-screen bg-[#F6F9FD] text-[#14264A]">
      <aside className="group fixed inset-y-0 left-0 z-50 hidden w-[76px] flex-col overflow-hidden border-r border-[#E4EBF3] bg-white py-3 shadow-[5px_0_22px_rgba(19,60,115,.03)] transition-[width] duration-200 ease-out hover:w-[242px] laptop:flex">
        <Link href="/admin/home" className="flex h-[52px] w-[242px] items-center gap-3 px-[17px]" aria-label="A Plus Kids admin home">
          <Image src="/images/brand/a-plus-logo.png" alt="A Plus Kids" width={42} height={42} className="h-[42px] w-[42px] object-contain" priority />
          <span className="whitespace-nowrap text-[14px] font-bold text-[#14264A] opacity-0 transition-opacity duration-150 group-hover:opacity-100">A Plus Kids TV</span>
        </Link>
        <span className="ml-[17px] mt-1 w-[220px] text-[9px] font-bold tracking-wide text-[#087BF1]">KIDS TV</span>
        <nav className="mt-7 flex w-[242px] flex-col gap-3 px-3" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} className={`flex h-12 w-[216px] items-center gap-4 rounded-[12px] px-2.5 transition ${active ? "bg-gradient-to-r from-[#0789F9] to-[#0875E8] text-white shadow-[0_9px_19px_rgba(8,123,241,.28)]" : "text-[#50627E] hover:bg-[#EDF6FF] hover:text-[#087BF1]"}`}><span className="grid size-7 shrink-0 place-items-center"><Image src={item.icon} alt="" width={26} height={26} className={`size-[26px] object-contain ${active ? "brightness-0 invert" : ""}`} /></span><span className="whitespace-nowrap text-[13px] font-semibold opacity-0 transition-opacity duration-150 group-hover:opacity-100">{item.label}</span></Link>;
          })}
        </nav>
        <div className="mt-auto flex w-[242px] gap-3 px-4 pb-2">
          <a href="/" target="_blank" title="View public website" aria-label="View public website" className="grid size-10 shrink-0 place-items-center rounded-full text-[20px] text-[#50627E] hover:bg-[#EDF6FF] hover:text-[#087BF1]">↗</a><span className="my-auto whitespace-nowrap text-[12px] font-semibold text-[#5B6C85] opacity-0 transition-opacity duration-150 group-hover:opacity-100">View public website</span>
        </div>
      </aside>

      <div className="laptop:pl-[76px]">
        <header className="sticky top-0 z-40 h-[68px] border-b border-[#E7EDF4] bg-white/95 px-4 backdrop-blur-xl tablet:px-7 laptop:px-8">
          <div className="mx-auto flex h-full max-w-[1420px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#E8F3FF] text-[12px] font-bold text-[#087BF1]">AD</span>
              <div><p className="text-[13px] font-bold text-[#14264A]">Administrator</p><p className="text-[11px] text-[#8190A5]">Local workspace</p></div>
            </div>
            <button type="button" onClick={() => {setConnectionPopup(true);void checkConnection();}} title="Open database connection details" className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold ${connection === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : connection === "offline" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`} aria-live="polite"><span className={`size-2 rounded-full ${connection === "online" ? "bg-emerald-500" : connection === "offline" ? "bg-red-500" : "bg-amber-500"}`} />{connection === "online" ? "Database connected" : connection === "offline" ? "Database disconnected" : "Checking database"}</button>
          </div>
        </header>
        <main className="mx-auto max-w-[1420px] px-4 py-7 tablet:px-7 laptop:px-8 laptop:py-9">{children}</main>
        {connectionPopup?<div className="fixed inset-0 z-[180] grid place-items-center bg-[#102044]/30 p-4"><div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#2488F4]">System connection</p><h2 className="mt-1 text-[19px] font-semibold">{connection==="online"?"Database connected":connection==="checking"?"Checking connection":"Database disconnected"}</h2></div><button onClick={()=>setConnectionPopup(false)} className="grid size-8 place-items-center rounded-full bg-[#F1F5F9] text-[#50627E]">×</button></div><div className={`mt-5 rounded-[12px] border p-4 text-[12px] leading-5 ${connection==="online"?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-red-200 bg-red-50 text-red-800"}`}>{connectionDetails}</div>{connection!=="online"?<div className="mt-4 rounded-[12px] bg-[#F7FAFE] p-4 text-[12px] leading-5 text-[#526178]"><p className="font-semibold text-[#263852]">Common fixes</p><ul className="mt-2 list-disc space-y-1 pl-4"><li>Start the A+ Kids API on port 8081.</li><li>Confirm PostgreSQL is running and the database credentials are valid.</li><li>Retry after the API health check succeeds.</li></ul></div>:null}<button onClick={()=>void checkConnection()} className="mt-5 h-10 w-full rounded-[10px] bg-[#1689F7] text-[12px] font-semibold text-white">Check again</button></div></div>:null}
      </div>
    </div>
  );
}
