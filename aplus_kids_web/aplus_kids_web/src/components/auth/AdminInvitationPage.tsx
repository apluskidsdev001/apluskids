"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptAdministratorInvitation, resendAdministratorInvitation, validateAdministratorInvitation } from "@/utils/auth";

type VerificationStep = "code" | "password" | "success";
const inputClass = "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";
const secondaryButton = "min-h-11 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45";

export default function AdminInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<VerificationStep>("code");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function clearFeedback() { setError(""); setMessage(""); }

  async function verifyCode() {
    clearFeedback();
    if (!email.trim()) { setError("Enter the email address that received the administrator invitation."); return; }
    if (code.length !== 6) { setError("Enter the six-digit code from your invitation email."); return; }
    setBusy(true);
    try {
      await validateAdministratorInvitation(email, code);
      setStep("password");
      setMessage("Code confirmed. Create your administrator password to finish.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That code could not be confirmed. Check it or request a new code.");
    } finally { setBusy(false); }
  }

  async function createAccount() {
    clearFeedback();
    if (password.length < 8) { setError("Use a password with at least eight characters."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setBusy(true);
    try {
      await acceptAdministratorInvitation(email, code, password, confirmPassword);
      setPassword(""); setConfirmPassword(""); setStep("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The administrator account could not be created. Verify the code again.");
      setStep("code"); setCode("");
    } finally { setBusy(false); }
  }

  async function resend() {
    clearFeedback();
    if (!email.trim()) { setError("Enter the invited email address before requesting another code."); return; }
    setBusy(true);
    try {
      await resendAdministratorInvitation(email);
      setCode(""); setResendSeconds(60);
      setMessage("A new six-digit code was sent. Previous codes can no longer be used.");
      window.setTimeout(() => codeInput.current?.focus(), 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "A new code could not be sent. Please try again shortly.");
    } finally { setBusy(false); }
  }

  function changeEmail() {
    setStep("code"); setCode(""); setPassword(""); setConfirmPassword(""); clearFeedback();
    setMessage("Enter the email address that received the invitation, then enter its code.");
  }

  const stepNumber = step === "code" ? 1 : step === "password" ? 2 : 3;
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_12%_12%,#dff4ff_0_2px,transparent_3px),linear-gradient(145deg,#eaf7ff,#f7fbff_55%,#fff8e9)] px-3 py-8 tablet:px-6 tablet:py-12 laptop:px-10 laptop:py-16 desktop:px-14 monitor:px-20">
    <section className="w-full max-w-[460px] rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-[0_26px_80px_rgba(18,74,135,.18)] tablet:max-w-[540px] tablet:rounded-[32px] tablet:p-8 laptop:max-w-[600px] laptop:p-10 desktop:max-w-[640px] desktop:p-11 monitor:max-w-[680px] monitor:p-12">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 tablet:size-20" aria-hidden="true"><span className="text-2xl font-black text-blue-600">A+</span></div>
      <p className="mt-5 text-center text-xs font-bold uppercase tracking-[.18em] text-blue-600">Administrator invitation</p>
      <h1 className="mt-2 text-center text-2xl font-bold tracking-[-.03em] text-slate-950 tablet:text-3xl laptop:text-[34px]">{step==="code"?"Verify your work email":step==="password"?"Create your password":"Account created successfully"}</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-slate-600">{step==="code"?"Enter the six-digit code sent by A Plus Kids. No administrator access exists until verification is complete.":step==="password"?"Your code is correct. Set the password you will use to access the Admin Panel.":"Your email is verified and your administrator access is ready."}</p>

      <div className="mx-auto mt-6 flex max-w-sm items-center" aria-label={`Step ${stepNumber} of 3`}>
        {[1,2,3].map((item,index)=><div key={item} className={`flex items-center ${index<2?"flex-1":""}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${item<=stepNumber?"bg-blue-600 text-white":"bg-slate-100 text-slate-500"}`}>{item<stepNumber?"✓":item}</span>{index<2?<span className={`h-1 flex-1 ${item<stepNumber?"bg-blue-600":"bg-slate-100"}`}/>:null}</div>)}
      </div>

      {step==="code"?<div className="mt-7 grid gap-4">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Invited email address<input type="email" autoComplete="email" value={email} onChange={event=>{setEmail(event.target.value);clearFeedback();}} className={inputClass} placeholder="name@example.com"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Six-digit verification code<input ref={codeInput} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={event=>{setCode(event.target.value.replace(/\D/g,"").slice(0,6));clearFeedback();}} onKeyDown={event=>{if(event.key==="Enter")void verifyCode();}} className={`${inputClass} text-center text-xl font-bold tracking-[.35em]`} placeholder="000000"/></label>
        <button type="button" onClick={()=>void verifyCode()} disabled={busy||!email.trim()||code.length!==6} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-45">{busy?"Checking code...":"Verify code"}</button>
        <div className="grid gap-2 tablet:grid-cols-3">
          <button type="button" onClick={()=>void resend()} disabled={busy||!email.trim()||resendSeconds>0} className={secondaryButton}>{resendSeconds>0?`Resend in ${resendSeconds}s`:"Resend code"}</button>
          <button type="button" onClick={changeEmail} disabled={busy} className={secondaryButton}>Change email</button>
          <button type="button" onClick={()=>router.push("/login")} disabled={busy} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Exit</button>
        </div>
      </div>:null}

      {step==="password"?<div className="mt-7 grid gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><p className="text-xs font-bold text-emerald-800">Email code confirmed</p><p className="mt-1 break-all text-xs text-emerald-700">{email}</p></div>
        <div className="grid gap-4 tablet:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">New password<input type="password" autoComplete="new-password" value={password} onChange={event=>{setPassword(event.target.value);clearFeedback();}} className={inputClass}/></label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event=>{setConfirmPassword(event.target.value);clearFeedback();}} onKeyDown={event=>{if(event.key==="Enter")void createAccount();}} className={inputClass}/></label>
        </div>
        <p className="text-xs leading-5 text-slate-500">Use at least eight characters. Your password is submitted only when you create the account.</p>
        <button type="button" onClick={()=>void createAccount()} disabled={busy||password.length<8||!confirmPassword} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-45">{busy?"Creating account...":"Create administrator account"}</button>
        <div className="grid gap-2 tablet:grid-cols-2"><button type="button" onClick={changeEmail} disabled={busy} className={secondaryButton}>Change email or code</button><button type="button" onClick={()=>router.push("/login")} disabled={busy} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Exit</button></div>
      </div>:null}

      {step==="success"?<div className="mt-7 text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">✓</div><div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">Verification completed. You can now log in using <strong>{email}</strong>.</div><button type="button" onClick={()=>router.push("/login")} className="mt-6 min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200">Go to login</button></div>:null}

      {error?<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{error}</p>:null}
      {message&&step!=="success"?<p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">{message}</p>:null}
    </section>
  </main>;
}
