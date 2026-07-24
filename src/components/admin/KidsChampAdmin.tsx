"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/utils/auth";

type Submission = {
  id: string; trackingCode: string; childName: string; ageAtSubmission: number;
  workTitle?: string; reviewStatus: string; telecastStatus: string;
  submittedAt: string; photoAvailable: boolean; rejectionReason?: string;
};
type Batch = {
  id: string; batchCode: string; status: string; photoCount: number;
  firstDownloadedAt?: string; deleteAfter?: string; daysRemaining: number;
  telecastDate?: string; alternateTelecastDate?: string; createdAt: string; deletedAt?: string;
};
type Guest = {
  id: string; parentName: string; mobile: string; email?: string; countryCode: string;
  province: string; hometown: string; submissionCount: number;
  firstSubmittedAt: string; lastSubmittedAt: string;
};
type Tab = "submissions" | "batches" | "users";

const pill = "h-11 min-w-36 rounded-full border border-slate-200 px-6 text-xs font-bold uppercase transition hover:-translate-y-0.5 hover:shadow-sm active:scale-95";
const smallButton = "rounded-full px-5 py-2.5 text-xs font-bold uppercase text-white transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default function KidsChampAdmin() {
  const [items, setItems] = useState<Submission[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tab, setTab] = useState<Tab>("submissions");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(100);
  const [remainder, setRemainder] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [submissionsResponse, batchesResponse, guestsResponse] = await Promise.all([
        apiFetch("/api/v1/admin/kids-champ/submissions"),
        apiFetch("/api/v1/admin/kids-champ/batches"),
        apiFetch("/api/v1/admin/kids-champ/guests"),
      ]);
      if (!submissionsResponse.ok) {
        const error = await submissionsResponse.json().catch(() => null);
        throw new Error(error?.message || "Administrator access is required.");
      }
      setItems(await submissionsResponse.json());
      if (batchesResponse.ok) setBatches(await batchesResponse.json());
      if (guestsResponse.ok) setGuests(await guestsResponse.json());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Kids Champ information could not be loaded.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const guestSubmissions = useMemo(() => guests.reduce((sum, guest) => sum + guest.submissionCount, 0), [guests]);

  async function review(item: Submission, status: string) {
    let reason: string | undefined;
    if (status === "REJECTED") {
      reason = window.prompt("Enter the rejection reason:")?.trim();
      if (!reason) return;
    }
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/review`, {
      method: "PATCH", body: JSON.stringify({ status, reason }),
    });
    setNotice(response.ok ? "Submission updated and notification sent." : (await response.json().catch(() => null))?.message || "Update failed.");
    await load();
  }

  async function removePhoto(item: Submission) {
    if (!window.confirm(`Delete the stored photo for ${item.childName}? The submission information will remain saved.`)) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/photo`, { method: "DELETE" });
    setNotice(response.ok ? "Photo deleted. Submission information remains saved." : "Photo deletion failed.");
    await load();
  }

  async function createBatch() {
    const response = await apiFetch("/api/v1/admin/kids-champ/batches", {
      method: "POST", body: JSON.stringify({ limit, includeRemainder: remainder }),
    });
    setNotice(response.ok ? "ZIP batch created successfully." : (await response.json().catch(() => null))?.message || "ZIP creation failed.");
    await load();
  }

  async function download(batch: Batch) {
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${batch.id}/download`);
    if (!response.ok) {
      setNotice((await response.json().catch(() => null))?.message || "Download failed.");
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url; link.download = `${batch.batchCode}.zip`; link.click();
    URL.revokeObjectURL(url);
    setNotice("Download started. The 10-day automatic deletion countdown is active.");
    await load();
  }

  async function removeBatch(batch: Batch) {
    if (!window.confirm(`Permanently delete ${batch.batchCode} and all photos inside it?`)) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${batch.id}`, { method: "DELETE" });
    setNotice(response.ok ? "ZIP and stored photos deleted." : "ZIP deletion failed.");
    await load();
  }

  return (
    <div className="pb-20">
      <header className="pt-4 tablet:pt-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2488f4]">A Plus administration</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,3.5rem)] font-black uppercase tracking-[-0.045em] text-black">Kids Champ</h1>
      </header>

      <section className="mt-10 grid gap-3 tablet:grid-cols-3">
        {[
          ["Non-logged people", guests.length],
          ["Guest submissions", guestSubmissions],
          ["All submissions", items.length],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl bg-white px-5 py-4 shadow-[0_8px_25px_rgba(30,55,90,.03)]">
            <p className="text-[11px] font-medium text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-[#102a56]">{value}</p>
          </article>
        ))}
      </section>

      <nav className="mt-7 flex flex-wrap gap-3" aria-label="Kids Champ sections">
        {(["submissions", "batches", "users"] as Tab[]).map((value) => (
          <button key={value} type="button" onClick={() => setTab(value)}
            className={`${pill} ${tab === value ? "border-[#07032f] bg-[#07032f] text-white" : "bg-white text-black"}`}>
            {value}
          </button>
        ))}
      </nav>

      {notice && <div role="status" className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-800">{notice}</div>}

      {tab === "batches" && (
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 tablet:p-7">
          <div className="flex flex-wrap items-end gap-5">
            <label className="text-xs font-bold text-slate-700">Photos per ZIP
              <input type="number" min={1} max={500} value={limit} onChange={(event) => setLimit(Number(event.target.value))}
                className="mt-2 block h-12 w-44 rounded-lg border border-slate-200 px-4 text-base outline-none focus:border-[#2488f4] focus:ring-4 focus:ring-blue-100"/>
            </label>
            <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={remainder} onChange={(event) => setRemainder(event.target.checked)} className="size-5 accent-[#2488f4]"/>
              Include remaining photos below limit
            </label>
            <button type="button" disabled={busy} onClick={() => void createBatch()} className={`${smallButton} mb-1 bg-[#2488f4]`}>Create ZIP</button>
          </div>
        </section>
      )}

      <section className="mt-8 space-y-5">
        {tab === "submissions" && items.map((item) => (
          <article key={item.id} className="grid items-center gap-4 rounded-[26px] bg-white p-5 shadow-[0_5px_18px_rgba(38,57,82,.12)] tablet:grid-cols-[64px_1.2fr_.8fr_.9fr_1fr_auto] tablet:px-7">
            <div className="grid size-14 place-items-center rounded-xl bg-[linear-gradient(135deg,#132b50,#35a7e7)] text-xl font-black text-white">{item.childName.slice(0, 1).toUpperCase()}</div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">ID</p><p className="mt-1 break-all text-xs font-bold">{item.trackingCode}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Name</p><p className="mt-1 text-sm font-bold">{item.childName}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Status</p><p className="mt-1 text-xs font-bold">{item.reviewStatus.replaceAll("_", " ")}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Submitted</p><p className="mt-1 text-xs font-bold">{date(item.submittedAt)}</p></div>
            <div className="flex flex-wrap gap-2 tablet:justify-end">
              <button onClick={() => void review(item, "APPROVED")} className={`${smallButton} bg-[#087b11]`}>Approve</button>
              <button onClick={() => void review(item, "REJECTED")} className={`${smallButton} bg-red-600`}>Reject</button>
              {item.photoAvailable && <button onClick={() => void removePhoto(item)} className={`${smallButton} bg-red-600`}>Delete photo</button>}
            </div>
          </article>
        ))}

        {tab === "batches" && batches.map((batch) => (
          <article key={batch.id} className="grid items-center gap-4 rounded-[26px] bg-white p-5 shadow-[0_5px_18px_rgba(38,57,82,.12)] tablet:grid-cols-[64px_.7fr_1.25fr_.8fr_.9fr_.9fr_auto_120px_42px] tablet:px-7">
            <div className="relative grid size-14 place-items-center rounded-lg border-2 border-black text-sm font-black text-black"><span>ZIP</span><span className="absolute -top-1 right-1 size-3 border-l-2 border-b-2 border-black bg-white"/></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">ID</p><p className="mt-1 truncate text-xs font-bold">{batch.id.slice(0, 8)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">ZIP name</p><p className="mt-1 text-xs font-bold">{batch.batchCode}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Photo count</p><p className="mt-1 text-sm font-black">{batch.photoCount}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Date zipped</p><p className="mt-1 text-xs font-bold">{date(batch.createdAt)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Downloaded</p><p className="mt-1 text-xs font-bold">{date(batch.firstDownloadedAt)}</p></div>
            <div className="flex gap-2"><button onClick={() => void download(batch)} disabled={Boolean(batch.deletedAt)} className={`${smallButton} bg-[#087b11]`}>Download</button><button onClick={() => void removeBatch(batch)} disabled={Boolean(batch.deletedAt)} className={`${smallButton} bg-red-600`}>Delete</button></div>
            <p className="text-xs font-bold">{batch.deletedAt ? "Deleted" : batch.firstDownloadedAt ? `${batch.daysRemaining} days remain` : "Not downloaded yet"}</p>
            <span className={`grid size-9 place-items-center rounded-full text-xl font-black ${batch.deletedAt ? "bg-red-100 text-red-600" : batch.firstDownloadedAt ? "border-2 border-emerald-600 text-emerald-700" : "bg-slate-200 text-slate-400"}`}>{batch.deletedAt ? "×" : batch.firstDownloadedAt ? "✓" : ""}</span>
          </article>
        ))}

        {tab === "users" && guests.map((guest) => (
          <article key={guest.id} className="grid items-center gap-4 rounded-[26px] bg-white p-5 shadow-[0_5px_18px_rgba(38,57,82,.12)] tablet:grid-cols-[64px_.8fr_1.1fr_1fr_1fr_.7fr] tablet:px-7">
            <div className="grid size-14 place-items-center rounded-xl bg-[linear-gradient(135deg,#132b50,#35a7e7)] text-xl font-black text-white">{guest.parentName.slice(0, 1).toUpperCase()}</div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">ID</p><p className="mt-1 truncate text-xs font-bold">{guest.id.slice(0, 8)}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Name</p><p className="mt-1 text-sm font-bold">{guest.parentName}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Mobile</p><p className="mt-1 text-xs font-bold">{guest.mobile}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Hometown</p><p className="mt-1 text-sm font-bold">{guest.hometown}</p></div>
            <div><p className="text-[10px] font-bold uppercase text-slate-400">Submissions</p><p className="mt-1 text-xl font-black">{guest.submissionCount}</p></div>
          </article>
        ))}

        {!busy && ((tab === "submissions" && !items.length) || (tab === "batches" && !batches.length) || (tab === "users" && !guests.length)) &&
          <div className="rounded-[26px] bg-white p-10 text-center text-sm font-medium text-slate-500">No {tab} found.</div>}
      </section>
    </div>
  );
}
