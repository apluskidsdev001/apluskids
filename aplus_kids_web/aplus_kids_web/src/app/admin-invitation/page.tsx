import type { Metadata } from "next";
import { Suspense } from "react";
import AdminInvitationPage from "@/components/auth/AdminInvitationPage";

export const metadata: Metadata = { title: "Accept Admin Invitation | A Plus Kids TV", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-sky-50 text-sm text-slate-600">Preparing secure verification…</main>}><AdminInvitationPage/></Suspense>;
}
