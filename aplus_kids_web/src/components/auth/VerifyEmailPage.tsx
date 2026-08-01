"use client";

import { sitePath } from "@/utils/sitePath";

export default function VerifyEmailPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#eaf7ff,#ffffff)] px-4">
      <section className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-[0_24px_70px_rgba(14,72,135,0.16)] tablet:p-10">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-3xl text-blue-600">@</div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Verify during registration</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Email verification now uses a six-digit code entered directly on the registration page.</p>
        <a href={sitePath("/register/")} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1670ef] px-5 text-sm font-bold text-white">Go to registration</a>
      </section>
    </main>
  );
}
