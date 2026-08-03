"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/utils/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", symbol: "⌂" },
  { href: "/admin/watch", label: "Watch Page", symbol: "▻" },
  { href: "/admin/kids-zone", label: "Kids Zone", symbol: "✦" },
  { href: "/admin/kids-champ", label: "Kids Champ", symbol: "★" },
  { href: "/admin/account-management", label: "Account management", symbol: "⚙" },
  { href: "/admin/footer", label: "Footer", symbol: "▥" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<"allowed" | "forbidden">("allowed");
  const [connection, setConnection] = useState<"checking" | "online" | "offline">("checking");

  const checkConnection = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/overview");
      if (response.status === 401) {
        setAccess("forbidden");
        router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
        return false;
      }
      setConnection(response.ok ? "online" : "offline");
      return response.ok;
    } catch {
      setConnection("offline");
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
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[76px] flex-col items-center border-r border-[#E4EBF3] bg-white py-3 shadow-[5px_0_22px_rgba(19,60,115,.03)] laptop:flex">
        <Link href="/admin" className="grid size-[52px] place-items-center" aria-label="A Plus Kids admin home">
          <Image src="/images/brand/a-plus-logo.png" alt="A Plus Kids" width={42} height={42} className="h-[42px] w-[42px] object-contain" priority />
        </Link>
        <span className="mt-1 text-[9px] font-bold tracking-wide text-[#087BF1]">KIDS TV</span>
        <nav className="mt-7 flex w-full flex-col items-center gap-3" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} className={`grid size-12 place-items-center rounded-[12px] text-[22px] transition ${active ? "bg-[#087BF1] text-white shadow-[0_8px_16px_rgba(8,123,241,.32)]" : "text-[#50627E] hover:bg-[#EDF6FF] hover:text-[#087BF1]"}`}><span aria-hidden>{item.symbol}</span></Link>;
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 pb-2">
          <a href="/" target="_blank" title="View public website" aria-label="View public website" className="grid size-10 place-items-center rounded-full text-[20px] text-[#50627E] hover:bg-[#EDF6FF] hover:text-[#087BF1]">↗</a>
        </div>
      </aside>

      <div className="laptop:pl-[76px]">
        <header className="sticky top-0 z-40 h-[68px] border-b border-[#E7EDF4] bg-white/95 px-4 backdrop-blur-xl tablet:px-7 laptop:px-8">
          <div className="mx-auto flex h-full max-w-[1420px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#E8F3FF] text-[12px] font-bold text-[#087BF1]">AD</span>
              <div><p className="text-[13px] font-bold text-[#14264A]">Administrator</p><p className="text-[11px] text-[#8190A5]">Local workspace</p></div>
            </div>
            <button type="button" onClick={() => void checkConnection()} title="Check database connection" className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold ${connection === "online" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : connection === "offline" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`} aria-live="polite"><span className={`size-2 rounded-full ${connection === "online" ? "bg-emerald-500" : connection === "offline" ? "bg-red-500" : "bg-amber-500"}`} />{connection === "online" ? "Database connected" : connection === "offline" ? "Database disconnected" : "Checking database"}</button>
          </div>
        </header>
        <main className="mx-auto max-w-[1420px] px-4 py-7 tablet:px-7 laptop:px-8 laptop:py-9">{children}</main>
      </div>
    </div>
  );
}
