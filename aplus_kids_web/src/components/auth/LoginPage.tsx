"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { sitePath } from "@/utils/sitePath";
import { backendFetch } from "@/utils/backendActivity";

type LoginView = "login" | "forgot" | "sent";

const fieldClass =
  "h-14 w-full rounded-xl border border-slate-200 bg-white px-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10";

function FieldIcon({ type }: { type: "mail" | "lock" }) {
  return type === "mail" ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <path d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z" />
      <path d="m4.5 7.5 6.15 4.61a2.25 2.25 0 0 0 2.7 0L19.5 7.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2.25" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        {visible ? (
          <><path d="M3 3l18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9 5.5 9 8a10.7 10.7 0 0 1-2.1 3.3M6.2 6.2C4.2 7.6 3 10 3 12c0 2.5 3.5 8 9 8 1 0 1.9-.2 2.7-.5" /></>
        ) : (
          <><path d="M3 12c0-2.5 3.5-8 9-8s9 5.5 9 8-3.5 8-9 8-9-5.5-9-8Z" /><circle cx="12" cy="12" r="2.5" /></>
        )}
      </svg>
    </button>
  );
}

export default function LoginPage({ embedded = false, onCreateAccount, onLoginSuccess }: { embedded?: boolean; onCreateAccount?: () => void; onLoginSuccess?: () => void }) {
  const [view, setView] = useState<LoginView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [resetAddress, setResetAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  function showLogin() {
    setView("login");
    setMessage("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rememberMe = form.get("rememberMe") === "on";
    setLoginError("");
    setMessage("");
    setIsLoggingIn(true);

    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.get("login"),
          password: form.get("password"),
          rememberMe,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | {
            accessToken?: string;
            message?: string;
            user?: { accountHolderName?: string; roles?: string[] };
          }
        | null;

      if (!response.ok || !result?.accessToken) {
        throw new Error(result?.message || "Login failed. Please check your details and try again.");
      }

      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      window.localStorage.removeItem("aplus-access-token");
      window.sessionStorage.removeItem("aplus-access-token");
      window.localStorage.removeItem("aplus-current-user");
      window.sessionStorage.removeItem("aplus-current-user");
      storage.setItem("aplus-access-token", result.accessToken);
      if (result.user) storage.setItem("aplus-current-user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("aplus:user-updated"));
      const isAdministrator = result.user?.roles?.some(
        (role) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN",
      );
      if (isAdministrator) {
        window.location.assign(sitePath("/admin/"));
      } else if (embedded && onLoginSuccess) {
        onLoginSuccess();
      } else {
        const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
        const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : sitePath("/profile/");
        window.location.assign(destination);
      }
    } catch (error) {
      const fallback = "Unable to connect to the login server. Please try again.";
      const errorMessage = error instanceof Error ? error.message : fallback;
      setLoginError(errorMessage === "Failed to fetch" ? fallback : errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSendingReset(true);
    setMessage("");
    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetAddress }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Could not request a reset link.");
      setView("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request a reset link.");
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <main className={embedded ? "relative grid min-h-full place-items-center bg-white px-3 py-5 tablet:px-6" : "relative -mb-24 grid min-h-screen place-items-center overflow-hidden bg-[#6bc6f7] px-3 pb-28 pt-28 tablet:px-6 laptop:mb-0 laptop:pb-12 laptop:pt-32"}>
      {!embedded && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(37,150,238,0.16),rgba(255,255,255,0.12))]" />}

      <section className="relative w-full max-w-[500px] rounded-[28px] bg-white/96 p-5 [font-family:Arial,Helvetica,sans-serif] shadow-[0_28px_80px_rgba(14,72,135,0.24)] backdrop-blur-sm tablet:rounded-[40px] tablet:p-9 desktop:max-w-[540px] desktop:p-11">
        {view === "login" && (
          <>
            <a href={sitePath("/")} aria-label="Go to A Plus Kids home" className="mx-auto block w-fit">
              <Image src={sitePath("/icons/taskbar/logo.png")} alt="A Plus Kids" width={600} height={600} priority className="h-28 w-64 object-cover object-center tablet:h-32 tablet:w-72" />
            </a>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 tablet:text-3xl">Welcome back!</h1>
              <p className="mt-2 text-sm text-slate-500">Log in to continue your A Plus Kids journey.</p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleLogin}>
              <label className="relative block">
                <span className="sr-only">Email or phone number</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FieldIcon type="mail" /></span>
                <input required name="login" autoComplete="username" inputMode="email" placeholder="Email or phone number" className={fieldClass} />
              </label>
              <label className="relative block">
                <span className="sr-only">Password</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FieldIcon type="lock" /></span>
                <input required minLength={8} type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Password" className={`${fieldClass} pr-12`} />
                <PasswordToggle visible={showPassword} onClick={() => setShowPassword((visible) => !visible)} />
              </label>
              <div className="flex items-center justify-between gap-3 text-xs tablet:text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600"><input name="rememberMe" type="checkbox" className="size-4 accent-[#1976ed]" />Remember me</label>
                <button type="button" onClick={() => setView("forgot")} className="font-medium text-[#1670ef] hover:underline">Forgot password?</button>
              </div>
              <button disabled={isLoggingIn} type="submit" className="min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-65">{isLoggingIn ? "Logging in..." : "Log in"}</button>
            </form>

            {loginError && <p role="alert" aria-live="assertive" className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs leading-5 text-red-700">{loginError}</p>}
            {message && <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-blue-50 p-3 text-center text-xs leading-5 text-blue-700">{message}</p>}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-center text-sm text-slate-600">New to A Plus Kids TV?</p>
              {embedded ? <button type="button" onClick={onCreateAccount} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#3182f6] bg-white px-5 text-sm font-medium text-[#1670ef] transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100">Create Account</button> : <a href={sitePath("/register/")} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#3182f6] bg-white px-5 text-sm font-medium text-[#1670ef] transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100">Create Account</a>}
            </div>
          </>
        )}

        {view === "forgot" && (
          <>
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-[#3182f6]"><FieldIcon type="lock" /></div>
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-slate-950 tablet:text-3xl">Forgot password?</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Enter your account email and we&apos;ll send a reset link.</p>
            </div>
            <form className="mt-7" onSubmit={handleForgotPassword}>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email address
                <span className="relative block">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><FieldIcon type="mail" /></span>
                  <input required type="email" value={resetAddress} onChange={(event) => setResetAddress(event.target.value)} autoFocus placeholder="Enter your email address" className={fieldClass} />
                </span>
              </label>
              <button disabled={isSendingReset} type="submit" className="mt-5 min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-medium text-white shadow-lg shadow-blue-200 hover:brightness-105 disabled:opacity-60">{isSendingReset ? "Sending..." : "Send reset link"}</button>
            </form>
            {message && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-center text-xs text-red-700">{message}</p>}
            <button type="button" onClick={showLogin} className="mx-auto mt-6 flex items-center gap-2 text-sm font-medium text-[#1670ef] hover:underline">← Back to login</button>
          </>
        )}

        {view === "sent" && (
          <div className="py-3 text-center tablet:py-6">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-[#3182f6]"><FieldIcon type="mail" /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950 tablet:text-3xl">Check your email!</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">We sent a password reset link to<br /><strong className="break-all text-slate-700">{resetAddress}</strong></p>
            <p className="mx-auto mt-7 max-w-sm rounded-xl bg-amber-50 p-4 text-left text-sm leading-6 text-slate-600">If you don&apos;t see the message, check your spam or junk folder.</p>
            <button type="button" onClick={showLogin} className="mt-7 min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] text-base font-medium text-white shadow-lg shadow-blue-200 hover:brightness-105">Back to login</button>
            <button type="button" onClick={() => { setMessage(""); setView("forgot"); }} className="mt-3 min-h-13 w-full rounded-xl border border-[#3182f6] bg-white text-base font-medium text-[#1670ef] hover:bg-blue-50">Request another link</button>
          </div>
        )}
      </section>
    </main>
  );
}
