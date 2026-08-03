"use client";

import { type FormEvent, useState } from "react";
import { sitePath } from "@/utils/sitePath";
import { backendFetch } from "@/utils/backendActivity";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus({ ok: false, message: "This reset link is missing its token." });
      return;
    }
    if (form.get("password") !== form.get("confirmPassword")) {
      setStatus({ ok: false, message: "Passwords do not match." });
      return;
    }
    setSubmitting(true);
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
    try {
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.get("password"), confirmPassword: form.get("confirmPassword") }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Password reset failed.");
      setStatus({ ok: true, message: "Your password has been changed. You can now log in." });
      formElement.reset();
    } catch (error) {
      setStatus({ ok: false, message: error instanceof Error ? error.message : "Password reset failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#eaf7ff,#ffffff)] px-4">
      <section className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(14,72,135,0.16)] tablet:p-10">
        <h1 className="text-center text-2xl font-bold text-slate-950">Create a new password</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Use at least 8 characters.</p>
        {!status?.ok && <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">New password<input required minLength={8} name="password" type="password" autoComplete="new-password" className="h-12 rounded-xl border border-slate-200 px-4" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Confirm password<input required minLength={8} name="confirmPassword" type="password" autoComplete="new-password" className="h-12 rounded-xl border border-slate-200 px-4" /></label>
          <button disabled={submitting} className="min-h-12 w-full rounded-xl bg-[#1670ef] font-bold text-white disabled:opacity-60">{submitting ? "Updating..." : "Update password"}</button>
        </form>}
        {status && <p role={status.ok ? "status" : "alert"} className={`mt-5 rounded-xl p-3 text-center text-sm ${status.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status.message}</p>}
        {status?.ok && <a href={sitePath("/login/")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1670ef] font-bold text-white">Go to login</a>}
      </section>
    </main>
  );
}
