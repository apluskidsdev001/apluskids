import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "A Plus Kids Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={roboto.className}><AdminShell>{children}</AdminShell></div>;
}
