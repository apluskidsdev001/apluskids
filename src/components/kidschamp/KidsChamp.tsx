"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { countries, getCountryCode } from "@/utils/countries";
import { apiFetch } from "@/utils/auth";

type Child = { publicId: string; fullName: string; dateOfBirth: string };
type Profile = { accountHolderName: string; email: string; phone: string; children: Child[] };
type Submission = {
  id: string; trackingCode: string; childName: string; workTitle?: string;
  reviewStatus: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason?: string; telecastStatus: string; telecastDate?: string;
  alternateTelecastDate?: string; submittedAt: string; photoAvailable: boolean;
};
type Language = "en" | "si" | "ta";
type ClaimableHistory = { id: string; parentName: string; maskedPhone: string; submissionCount: number };

const words = {
  en: { title: "Kids Champ", intro: "Share one creation made by your child. Our team will review it for A+ Kids TV.", submit: "Send creation", track: "Track a submission", code: "Tracking code", lookup: "Check status", consent: "I am the parent or legal guardian and allow A+ Kids to review and broadcast this creation." },
  si: { title: "Kids Champ", intro: "ඔබේ දරුවා නිර්මාණය කළ එක් නිර්මාණයක් අප වෙත එවන්න. A+ Kids TV සඳහා අපගේ කණ්ඩායම එය පරීක්ෂා කරනු ඇත.", submit: "නිර්මාණය යවන්න", track: "යොමු කළ නිර්මාණය බලන්න", code: "Tracking code", lookup: "තත්ත්වය බලන්න", consent: "මම දෙමාපියෙකු හෝ නීත්‍යානුකූල භාරකරුවෙකු වන අතර මෙම නිර්මාණය පරීක්ෂා කිරීමට සහ විකාශය කිරීමට A+ Kids වෙත අවසර දෙමි." },
  ta: { title: "Kids Champ", intro: "உங்கள் குழந்தை உருவாக்கிய ஒரு படைப்பை அனுப்புங்கள். A+ Kids TV-க்காக எங்கள் குழு அதை மதிப்பாய்வு செய்யும்.", submit: "படைப்பை அனுப்பவும்", track: "சமர்ப்பிப்பைக் கண்காணிக்கவும்", code: "Tracking code", lookup: "நிலையைப் பார்க்கவும்", consent: "நான் பெற்றோர் அல்லது சட்டப்பூர்வ பாதுகாவலர்; இந்தப் படைப்பை மதிப்பாய்வு செய்து ஒளிபரப்ப A+ Kids-க்கு அனுமதி அளிக்கிறேன்." },
};

const field = "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10";
const statusNames: Record<string, string> = {
  SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", APPROVED: "Approved", REJECTED: "Not approved",
  NOT_SELECTED: "Awaiting telecast selection", SELECTED: "Selected for telecast", SCHEDULED: "Telecast scheduled",
  TELECASTED: "Telecasted", CANCELLED: "Telecast cancelled",
};

function StatusCard({ item }: { item: Submission }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-semibold text-[#142b53]">{item.childName}</p><p className="mt-1 text-xs text-slate-500">{item.trackingCode}</p></div>
      <span className="rounded-full bg-[#e9f4ff] px-3 py-1 text-xs font-semibold text-[#1976d2]">{statusNames[item.reviewStatus]}</span>
    </div>
    <p className="mt-4 text-sm text-slate-600">Telecast: {statusNames[item.telecastStatus] || item.telecastStatus}</p>
    {item.telecastDate && <p className="mt-1 text-sm font-medium text-slate-700">Date: {item.telecastDate}</p>}
    {item.alternateTelecastDate && <p className="mt-1 text-sm text-slate-600">Alternative date: {item.alternateTelecastDate}</p>}
    {item.rejectionReason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Reason: {item.rejectionReason}</p>}
  </article>;
}

export default function KidsChamp() {
  const [language, setLanguage] = useState<Language>("en");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [childId, setChildId] = useState("");
  const [detailsMode, setDetailsMode] = useState<"profile" | "manual">("manual");
  const [country, setCountry] = useState("Sri Lanka");
  const [result, setResult] = useState<Submission | null>(null);
  const [mine, setMine] = useState<Submission[]>([]);
  const [tracking, setTracking] = useState("");
  const [trackResult, setTrackResult] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [busy, setBusy] = useState(false);
  const [claimable, setClaimable] = useState<ClaimableHistory[]>([]);
  const [liveVersion, setLiveVersion] = useState(0);
  const copy = words[language];

  useEffect(() => {
    apiFetch("/api/v1/profile").then(async response => {
      if (!response.ok) return;
      const data = await response.json() as Profile;
      setProfile(data); setChildId(data.children[0]?.publicId || "");
      setDetailsMode(data.children.length ? "profile" : "manual");
      const list = await apiFetch("/api/v1/kids-champ/my-submissions");
      if (list.ok) setMine(await list.json());
      const histories = await apiFetch("/api/v1/kids-champ/claimable-history");
      if (histories.ok) setClaimable(await histories.json());
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void apiFetch("/api/v1/kids-champ/events", { signal: controller.signal }).then(async (response) => {
      if (!response.ok || !response.body) return;
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer="";
      while(!controller.signal.aborted){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const events=buffer.split("\n\n");buffer=events.pop()??"";if(events.some(event=>event.includes("event:update")))setLiveVersion(value=>value+1);}
    }).catch(()=>undefined);
    return ()=>controller.abort();
  }, []);

  useEffect(() => {
    if (!liveVersion) return;
    if (profile) apiFetch("/api/v1/kids-champ/my-submissions").then(async response=>{if(response.ok)setMine(await response.json());}).catch(()=>undefined);
    if (tracking.trim()) apiFetch(`/api/v1/kids-champ/track/${encodeURIComponent(tracking.trim())}`).then(async response=>{if(response.ok)setTrackResult(await response.json());}).catch(()=>undefined);
  }, [liveVersion, profile, tracking]);

  const countryCode = useMemo(() => getCountryCode(country), [country]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setResult(null); setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const photo = form.get("photo") as File | null;
    const usingProfile = Boolean(profile) && detailsMode === "profile";
    if (!usingProfile && !countryCode) {
      setError("Please choose a valid country from the suggestions."); setBusy(false); return;
    }
    if (!photo || photo.size === 0) {
      setError("Please choose one photo."); setBusy(false); return;
    }
    if (photo.size > 8 * 1024 * 1024) {
      setError("The photo must be 8 MB or smaller."); setBusy(false); return;
    }
    if (!(["image/jpeg", "image/png"] as string[]).includes(photo.type)) {
      setError("Please use a JPEG or PNG photo."); setBusy(false); return;
    }
    if (usingProfile) {
      form.set("childId", childId);
      form.set("manualDetails", "false");
    } else {
      form.delete("childId");
      form.set("countryCode", countryCode);
      form.set("manualDetails", "true");
    }
    try {
      const response = await apiFetch("/api/v1/kids-champ/submissions", { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The submission could not be sent.");
      setResult(body as Submission); setMine(current => [body as Submission, ...current]);
      formElement.reset(); setCountry("Sri Lanka");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The submission could not be sent."); }
    finally { setBusy(false); }
  }

  async function lookup(event: FormEvent) {
    event.preventDefault(); setTrackingError(""); setTrackResult(null); setBusy(true);
    try {
      const response = await apiFetch(`/api/v1/kids-champ/track/${encodeURIComponent(tracking.trim())}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Tracking code not found.");
      setTrackResult(body as Submission);
    } catch (reason) { setTrackingError(reason instanceof Error ? reason.message : "Tracking code not found."); }
    finally { setBusy(false); }
  }

  async function claimHistory(guestId: string) {
    if (!childId) return;
    setBusy(true);setError("");
    try {
      const response=await apiFetch("/api/v1/kids-champ/claim-history",{method:"POST",body:JSON.stringify({guestId,childId})});
      const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.message||"Previous submissions could not be linked.");
      setMine((current)=>[...(body as Submission[]),...current]);setClaimable((current)=>current.filter((item)=>item.id!==guestId));
    } catch(reason){setError(reason instanceof Error?reason.message:"Previous submissions could not be linked.");}
    finally{setBusy(false);}
  }

  return <main className="kidschamp-chat min-h-screen bg-[#f7fcff] px-3 pb-8 pt-28 text-slate-800 sm:px-6 sm:pt-32">
    <section className="mx-auto flex h-[calc(100vh-9rem)] min-h-[620px] max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/75 shadow-[0_28px_80px_rgba(73,164,223,.22)] backdrop-blur-xl">
      <header className="z-20 flex items-center justify-between border-b border-white/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => history.back()} className="grid size-10 place-items-center rounded-full bg-[#e8f8ff] text-xl text-[#10275d] transition hover:-translate-x-0.5 hover:bg-white" aria-label="Go back">‹</button>
          <div className="grid size-11 place-items-center overflow-hidden rounded-full bg-white shadow-sm"><Image src="/icons/shortcuts/KidsChamp.png" alt="" width={40} height={40} className="size-10 object-contain"/></div>
          <div className="min-w-0"><h1 className="truncate text-base font-bold text-[#10275d] sm:text-lg">A Plus Kids Kids Champ</h1><p className="text-xs font-medium text-[#4c8eb7]">online · photo submission</p></div>
        </div>
        <a href="tel:0768212266" className="grid size-11 place-items-center rounded-full bg-[#e8f8ff] transition hover:-translate-y-0.5 hover:bg-white" aria-label="Call A Plus Kids"><span className="text-xl">☎</span></a>
      </header>

      <div className="relative flex-1 overflow-y-auto bg-[#d8f3ff] p-4 sm:p-6" style={{backgroundImage:"linear-gradient(rgba(216,243,255,.42),rgba(216,243,255,.42)),url('/images/kidschamp/kcback.png')",backgroundSize:"760px auto",backgroundRepeat:"repeat"}}>
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <div className="w-fit max-w-[92%] rounded-[4px_22px_22px_22px] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:max-w-[78%]">
            <div className="mb-4 flex rounded-2xl bg-[#eef9ff] p-1">{(["en","si","ta"] as Language[]).map(item => <button key={item} type="button" onClick={() => setLanguage(item)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${language === item ? "bg-[#31aee4] text-white shadow-sm" : "text-[#5f7b99] hover:bg-white"}`}>{item === "en" ? "English" : item === "si" ? "සිංහල" : "தமிழ்"}</button>)}</div>
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-[#0f91b9]">{copy.title}</p><p className="mt-2 text-sm font-medium leading-7 text-[#10275d] sm:text-base">{copy.intro}</p>
          </div>

          <form onSubmit={submit} className="w-full max-w-4xl rounded-[4px_24px_24px_24px] border border-white/80 bg-white/92 p-5 shadow-sm backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold text-[#10275d]">{copy.submit}</h2>
          <p className="mt-1 text-sm text-[#527392]">Please send one clear photo and the child&apos;s details, just like sending them through WhatsApp.</p>
          {profile ? <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
            <button type="button" onClick={() => setDetailsMode("profile")} disabled={!profile.children.length} className={`rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${detailsMode === "profile" ? "bg-white text-[#1976d2] shadow-sm" : "text-slate-600"}`}>Use my child profile</button>
            <button type="button" onClick={() => setDetailsMode("manual")} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${detailsMode === "manual" ? "bg-white text-[#1976d2] shadow-sm" : "text-slate-600"}`}>Enter details manually</button>
          </div> : null}
          {profile && detailsMode === "profile" && profile.children.length ? <label className="mt-4 block text-sm font-medium">Child profile<select name="childId" value={childId} onChange={e => setChildId(e.target.value)} className={`${field} mt-2`} required>{profile.children.map(child => <option key={child.publicId} value={child.publicId}>{child.fullName}</option>)}</select></label> : null}
          {profile && !profile.children.length ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No child profile is available. Enter the details manually, or <a href="/profile" className="font-semibold underline">add a child profile</a>.</div> : null}
          {!profile || detailsMode === "manual" ? <div className="mt-5 grid gap-4 tablet:grid-cols-2">
              <label className="text-sm font-medium">Child&apos;s full name<input name="childName" className={`${field} mt-2`} required maxLength={120}/></label>
              <label className="text-sm font-medium">Date of birth<input name="dateOfBirth" type="date" className={`${field} mt-2`} required max={new Date().toISOString().slice(0,10)}/></label>
              <label className="text-sm font-medium">Parent / guardian name<input name="parentName" className={`${field} mt-2`} required maxLength={120}/></label>
              <label className="text-sm font-medium">Mobile number<input name="phone" type="tel" className={`${field} mt-2`} placeholder="+94 77 123 4567" required/></label>
              <label className="text-sm font-medium">Email (optional)<input name="email" type="email" className={`${field} mt-2`} maxLength={254}/></label>
              <label className="text-sm font-medium">Country<input value={country} onChange={e => setCountry(e.target.value)} list="kc-countries" className={`${field} mt-2`} required/><datalist id="kc-countries">{countries.map(item => <option key={item}>{item}</option>)}</datalist></label>
              <label className="text-sm font-medium">Province<input name="province" className={`${field} mt-2`} required maxLength={120}/></label>
              <label className="text-sm font-medium">Hometown<input name="hometown" className={`${field} mt-2`} required maxLength={120}/></label>
            </div> : null}
          <div className="mt-4 grid gap-4 tablet:grid-cols-2">
            <label className="text-sm font-medium">Artwork category<select name="category" className={`${field} mt-2`} required><option>Drawing</option><option>Painting</option><option>Handcraft</option></select></label>
            <label className="text-sm font-medium">Creation title (optional)<input name="workTitle" className={`${field} mt-2`} maxLength={160}/></label>
            <label className="text-sm font-medium">One photo<input name="photo" type="file" accept="image/jpeg,image/png" className={`${field} mt-2 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-[#1976d2]`} required/></label>
          </div>
          <label className="mt-4 block text-sm font-medium">About this creation (optional)<textarea name="workDescription" maxLength={1000} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10"/></label>
          <label className="mt-5 flex gap-3 rounded-xl bg-[#f3f9ff] p-4 text-sm leading-6"><input name="consent" value="true" type="checkbox" required className="mt-1 size-4 accent-[#238df4]"/><span>{copy.consent}</span></label>
          <label className="mt-3 flex gap-3 rounded-xl bg-[#f3fff7] p-4 text-sm leading-6"><input name="whatsappConsent" value="true" type="checkbox" className="mt-1 size-4 accent-emerald-600"/><span>I agree to receive Kids Champ status and telecast updates through WhatsApp. This is optional.</span></label>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy || (Boolean(profile) && detailsMode === "profile" && !childId)} className="mt-5 h-12 w-full rounded-2xl bg-[#31aee4] font-bold text-white shadow-md shadow-sky-100 transition hover:bg-[#229bd2] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Sending…" : copy.submit}</button>
        </form>

          {result && <div className="ml-auto w-fit max-w-[92%] rounded-[22px_4px_22px_22px] border border-[#bcefd2] bg-[#dcf8c6] p-5 shadow-sm sm:max-w-[72%]"><p className="font-bold text-emerald-900">✓ Successfully submitted!</p><p className="mt-2 text-sm text-emerald-800">Keep this private tracking code:</p><p className="mt-2 select-all text-xl font-bold tracking-wide text-[#10275d]">{result.trackingCode}</p><span className="mt-2 block text-right text-[10px] text-emerald-700">sent ✓✓</span></div>}

          <form onSubmit={lookup} className="w-fit max-w-[92%] rounded-[4px_22px_22px_22px] border border-white/80 bg-white/92 p-5 shadow-sm sm:min-w-[380px]">
            <h2 className="text-lg font-bold text-[#142b53]">{copy.track}</h2>
            <label className="mt-4 block text-sm font-medium">{copy.code}<input value={tracking} onChange={e => setTracking(e.target.value.toUpperCase())} className={`${field} mt-2 uppercase`} placeholder="KC-2026-XXXXXXXXXX" required/></label>
            <button disabled={busy} className="mt-4 h-11 w-full rounded-xl bg-[#142b53] font-semibold text-white transition hover:bg-[#1d4076] active:scale-[.99] disabled:opacity-60">{copy.lookup}</button>
            {trackingError && <p className="mt-3 text-sm text-red-600">{trackingError}</p>}
          </form>
          {trackResult && <div className="ml-auto w-full max-w-xl"><StatusCard item={trackResult}/></div>}
          {profile && claimable.length > 0 && <section className="w-full max-w-3xl rounded-[4px_22px_22px_22px] bg-amber-50/95 p-5 shadow-sm"><h2 className="text-lg font-bold text-amber-950">Link previous guest submissions</h2><p className="mt-1 text-sm text-amber-800">These histories match a verified phone or email on your account. Select the child profile above, then link them.</p><div className="mt-4 space-y-2">{claimable.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><span className="text-sm text-slate-700"><strong>{item.submissionCount} submission{item.submissionCount===1?"":"s"}</strong> · {item.maskedPhone}</span><button type="button" disabled={busy||!childId} onClick={()=>void claimHistory(item.id)} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Link to selected child</button></div>)}</div></section>}
          {profile && mine.length > 0 && <section className="w-full max-w-3xl rounded-[4px_22px_22px_22px] bg-white/92 p-5 shadow-sm"><h2 className="mb-3 text-lg font-bold text-[#142b53]">Your previous submissions</h2><div className="space-y-3">{mine.map(item => <StatusCard key={item.id} item={item}/>)}</div></section>}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/80 bg-white/88 px-4 py-3 backdrop-blur-xl sm:px-6"><button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[name="photo"]')?.click()} className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8f8ff] text-3xl font-light text-[#31aee4] transition hover:bg-[#d6f3ff]" aria-label="Choose photo">+</button><div className="h-12 flex-1 rounded-full bg-[#f1f9fe] px-5 py-3 text-sm text-[#9ab3c7]">Choose a photo above and complete the message…</div><span className="grid size-12 place-items-center rounded-full bg-[#31aee4] text-xl text-white">➤</span></div>
    </section>
    <style jsx global>{`.kidschamp-chat,.kidschamp-chat *{letter-spacing:0}.kidschamp-chat button,.kidschamp-chat a,.kidschamp-chat input[type=file],.kidschamp-chat select{cursor:pointer}`}</style>
  </main>;
}
