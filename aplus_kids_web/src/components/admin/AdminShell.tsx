"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/utils/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/watch", label: "Watch Page", icon: "▶" },
  { href: "/admin/kids-zone", label: "Kids Zone", icon: "★" },
  { href: "/admin/kids-champ", label: "Kids Champ", icon: "KC" },
  { href: "/admin/account-management", label: "Account & Management", icon: "AM" },
  { href: "/admin/footer", label: "Footer", icon: "▤" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<"checking" | "allowed" | "forbidden">("checking");

  useEffect(() => {
    let active = true;
    apiFetch("/api/v1/admin/kids-champ/overview").then((response) => {
      if (!active) return;
      if (response.ok) setAccess("allowed");
      else if (response.status === 401) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      else setAccess("forbidden");
    }).catch(() => { if (active) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`); });
    return () => { active = false; };
  }, [pathname, router]);

  if (access === "checking") return <div className="grid min-h-screen place-items-center bg-[#F3F6FA] text-sm font-medium text-[#68758A]">Checking administrator access...</div>;
  if (access === "forbidden") return <div className="grid min-h-screen place-items-center bg-[#F3F6FA] p-6 text-center"><div><h1 className="text-xl font-semibold text-[#17243D]">Administrator access required</h1><p className="mt-2 text-sm text-[#68758A]">Your account does not have permission to open this workspace.</p><Link href="/" className="mt-5 inline-flex rounded-lg bg-[#2488F4] px-4 py-2 text-sm font-semibold text-white">Return to website</Link></div></div>;

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#17243D]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] border-r border-[#DFE6EF] bg-[#102A56] px-4 py-6 text-white laptop:flex laptop:flex-col">
        <Link href="/admin" className="px-3 text-[21px] font-semibold tracking-[-0.02em]">
          A Plus Admin
        </Link>
        <p className="mt-1 px-3 text-[12px] font-normal text-white/55">Content workspace</p>

        <nav className="mt-9 space-y-1.5" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 items-center gap-3 rounded-[14px] px-4 text-[14px] font-medium transition-colors ${
                  active ? "bg-[#2488F4] text-white" : "text-white/72 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[15px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[16px] bg-white/8 p-4">
          <p className="text-[12px] font-medium text-white/60">Public website</p>
          <Link href="/" target="_blank" className="mt-2 inline-flex text-[14px] font-medium text-[#7DC4FF]">
            View live site →
          </Link>
        </div>
      </aside>

      <div className="laptop:pl-[260px]">
        <header className="sticky top-0 z-40 border-b border-[#DFE6EF] bg-white/92 px-4 py-3 backdrop-blur-xl tablet:px-7 laptop:px-9">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <Link href="/admin" className="text-[17px] font-semibold text-[#102A56] laptop:hidden">A Plus Admin</Link>
            <nav className="flex max-w-full gap-1 overflow-x-auto laptop:hidden" aria-label="Mobile admin navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-medium ${
                    (item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))
                      ? "bg-[#2488F4] text-white"
                      : "bg-[#EEF3F8] text-[#53637C]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-3 laptop:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E8F3FF] text-[13px] font-semibold text-[#0877EF]">AD</span>
              <div>
                <p className="text-[13px] font-medium">Administrator</p>
                <p className="text-[11px] font-normal text-[#8290A5]">Local workspace</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 tablet:px-7 laptop:px-9 laptop:py-9">{children}</main>
      </div>
    </div>
  );
}
