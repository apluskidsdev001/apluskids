"use client";

import Image from "next/image";
import { useState } from "react";
import { sitePath } from "@/utils/sitePath";

type LoginView = "login" | "forgot" | "sent";

const fieldClass =
  "h-14 w-full rounded-xl border border-slate-200 bg-white px-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10";

export default function LoginPage() {
  const [view, setView] = useState<LoginView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [resetAddress, setResetAddress] = useState("");
  const [message, setMessage] = useState("");

  function showLogin() {
    setView("login");
    setMessage("");
  }

  return (
    <main
      className="relative -mb-24 grid min-h-screen place-items-center overflow-hidden bg-[#6bc6f7] bg-cover bg-center bg-no-repeat px-3 py-6 tablet:px-6 tablet:py-10 laptop:mb-0"
      style={{
        backgroundImage: `url("${sitePath("/images/login/Gemini_Generated_Image_p1rgy1p1rgy1p1rg 1.png")}")`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(37,150,238,0.05),rgba(255,255,255,0.03))]" />

      <section className="relative w-full max-w-[500px] rounded-[28px] bg-white/96 p-5 shadow-[0_28px_80px_rgba(14,72,135,0.24)] backdrop-blur-sm tablet:rounded-[40px] tablet:p-9 desktop:max-w-[540px] desktop:p-11 monitor:max-w-[580px]">
        {view === "login" ? (
          <>
            <a href={sitePath("/")} aria-label="Go to A Plus Kids home" className="mx-auto block w-fit">
              <Image src={sitePath("/icons/taskbar/logo.png")} alt="A Plus Kids" width={120} height={60} priority className="h-16 w-auto object-contain" />
            </a>
            <div className="mt-3 text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">Welcome back!</h1>
              <p className="mt-2 text-sm text-slate-500">Log in to continue your A Plus Kids journey.</p>
            </div>

            <form
              className="mt-7 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage("Login is ready. Authentication will work after the backend is connected.");
              }}
            >
              <label className="relative block">
                <span className="sr-only">Email or phone number</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden="true">✉</span>
                <input required name="login" autoComplete="username" placeholder="Email or phone number" className={fieldClass} />
              </label>
              <label className="relative block">
                <span className="sr-only">Password</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden="true">🔒</span>
                <input required minLength={8} type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Password" className={`${fieldClass} pr-12`} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-700">
                  {showPassword ? "◉" : "◎"}
                </button>
              </label>
              <div className="flex items-center justify-between gap-3 text-xs tablet:text-sm">
                <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" className="size-4 accent-[#1976ed]" />Remember me</label>
                <button type="button" onClick={() => setView("forgot")} className="font-medium text-[#1670ef] hover:underline">Forgot password?</button>
              </div>
              <button type="submit" className="min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-medium text-white shadow-lg shadow-blue-200 hover:brightness-105">Log in</button>
            </form>

            {message ? <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-center text-xs leading-5 text-blue-700">{message}</p> : null}

            <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-200" /><span>or</span><span className="h-px flex-1 bg-slate-200" /></div>
            <div className="space-y-3">
              <button type="button" onClick={() => setMessage("Google sign-in will be connected with the authentication backend.")} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"><span className="text-lg font-semibold text-[#4285f4]">G</span>Continue with Google</button>
              <button type="button" onClick={() => setMessage("Facebook sign-in will be connected with the authentication backend.")} className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"><span className="grid size-5 place-items-center rounded-full bg-[#1877f2] text-xs font-semibold text-white">f</span>Continue with Facebook</button>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-center text-sm text-slate-600">New to A Plus Kids TV?</p>
              <a
                href={sitePath("/register/")}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#3182f6] bg-white px-5 text-sm font-medium text-[#1670ef] transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-[#3182f6]/10"
              >
                Create Account
              </a>
            </div>
          </>
        ) : null}

        {view === "forgot" ? (
          <>
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-4xl" aria-hidden="true">🔐</div>
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">Forgot password?</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Enter your email or phone number and we&apos;ll send a reset link.</p>
            </div>
            <form
              className="mt-7"
              onSubmit={(event) => {
                event.preventDefault();
                setView("sent");
              }}
            >
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email or phone number
                <span className="relative block">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl" aria-hidden="true">✉</span>
                  <input required value={resetAddress} onChange={(event) => setResetAddress(event.target.value)} placeholder="Enter your email or phone number" className={fieldClass} />
                </span>
              </label>
              <button type="submit" className="mt-5 min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-medium text-white shadow-lg shadow-blue-200 hover:brightness-105">Send reset link</button>
            </form>
            <div className="my-6 h-px bg-slate-200" />
            <button type="button" onClick={showLogin} className="mx-auto flex items-center gap-2 text-sm font-medium text-[#1670ef] hover:underline">← Back to login</button>
          </>
        ) : null}

        {view === "sent" ? (
          <div className="py-3 text-center tablet:py-6">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-4xl" aria-hidden="true">🔐</div>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">Check your email!</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">We sent a password reset link to<br /><strong className="text-slate-700">{resetAddress}</strong></p>
            <div className="mx-auto mt-7 flex max-w-sm items-start gap-3 rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-slate-600"><span className="text-2xl" aria-hidden="true">💡</span><p>If you don&apos;t see the message, check your spam or junk folder.</p></div>
            <button type="button" onClick={showLogin} className="mt-7 min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-medium text-white shadow-lg shadow-blue-200 hover:brightness-105">Back to login</button>
            <button type="button" onClick={() => setMessage("A new reset link has been requested.")} className="mt-3 min-h-13 w-full rounded-xl border border-[#3182f6] bg-white text-base font-medium text-[#1670ef] hover:bg-blue-50">↻ Resend link</button>
            {message ? <p role="status" className="mt-3 text-xs text-emerald-600">{message}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
