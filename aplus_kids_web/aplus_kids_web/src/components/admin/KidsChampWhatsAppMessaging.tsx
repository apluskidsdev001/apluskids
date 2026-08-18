"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/utils/auth";
import { getAdminFriendlyErrorMessage } from "./AdminNotice";

type Campaign = {
  id: string; channel: string; status: string; recipientCount: number; messageTemplate: string;
  name?: string; source?: string; templateName?: string; languageCode?: string;
  queuedCount?: number; sendingCount?: number; acceptedCount?: number; deliveredCount?: number;
  readCount?: number; failedCount?: number; ignoredCount?: number; createdAt: string; completedAt?: string;
};
type Recipient = {
  id: number; participantId: string; name: string; destination: string; status: string; attempts: number;
  failureReason?: string; sentAt?: string; lastAttemptAt?: string; nextAttemptAt?: string; deliveredAt?: string; readAt?: string;
};
type DeliveryEvent = { id: number; status: string; providerStatus?: string; attempt: number; details?: string; providerTimestamp?: string; occurredAt: string };
type Template = { id: string; metaTemplateId?: string; name: string; languageCode: string; category: string; status: string; body: string; variables: string[]; disabled: boolean; syncedAt: string };

const pill: Record<string, string> = {
  QUEUED: "bg-blue-50 text-blue-700", SENDING: "bg-violet-50 text-violet-700", SENT: "bg-cyan-50 text-cyan-700",
  DELIVERED: "bg-emerald-50 text-emerald-700", READ: "bg-green-100 text-green-800", FAILED: "bg-red-50 text-red-700",
  PARTIAL: "bg-amber-50 text-amber-800", COMPLETED: "bg-emerald-50 text-emerald-700", SKIPPED: "bg-slate-100 text-slate-700",
  DELETED: "bg-slate-100 text-slate-500", CANCELLED: "bg-slate-100 text-slate-600",
};

function StatusPill({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${pill[value] ?? "bg-slate-100 text-slate-700"}`}>{value.replaceAll("_", " ")}</span>;
}

function formatTime(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }

export function WhatsAppMessagingWorkspace({ notify, onClose, compact = false }: { notify: (message: string) => void; onClose?: () => void; compact?: boolean }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCampaigns = useCallback(async (quiet = false) => {
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/campaigns");
      if (!response.ok) throw new Error("Message campaigns could not be loaded.");
      const body = (await response.json() as Campaign[]).filter((item) => item.channel === "WHATSAPP");
      setCampaigns(body); setSelectedCampaignId((current) => current && body.some((item) => item.id === current) ? current : body[0]?.id ?? null);
    } catch (reason) { if (!quiet) notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "message campaigns")); }
    finally { if (!quiet) setCampaignsLoading(false); }
  }, [notify]);

  const loadRecipients = useCallback(async (campaignId: string, quiet = false) => {
    const response = await apiFetch(`/api/v1/admin/kids-champ/campaigns/${campaignId}/recipients`);
    if (!response.ok) { if (!quiet) notify("Campaign recipients could not be loaded."); return; }
    setRecipients(await response.json() as Recipient[]);
  }, [notify]);

  // The initial reads intentionally populate this server-backed workspace on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadCampaigns(); const refresh = () => void loadCampaigns(true); window.addEventListener("aplus-data-updated", refresh); const timer = window.setInterval(refresh, 3000); return () => { window.removeEventListener("aplus-data-updated", refresh); window.clearInterval(timer); }; }, [loadCampaigns]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!selectedCampaignId) return; void loadRecipients(selectedCampaignId); const timer = window.setInterval(() => void loadRecipients(selectedCampaignId, true), 3000); return () => window.clearInterval(timer); }, [selectedCampaignId, loadRecipients]);
  useEffect(() => { if (!selectedRecipientId) return; apiFetch(`/api/v1/admin/kids-champ/campaign-recipients/${selectedRecipientId}/events`).then(async (response) => { if (response.ok) setEvents(await response.json() as DeliveryEvent[]); }).catch(() => undefined); }, [selectedRecipientId, recipients]);

  const selectedCampaign = campaigns.find((item) => item.id === selectedCampaignId) ?? null;
  const stats = useMemo(() => campaigns.reduce((value, item) => ({
    queued: value.queued + (item.queuedCount ?? 0), sending: value.sending + (item.sendingCount ?? 0),
    accepted: value.accepted + (item.acceptedCount ?? 0), delivered: value.delivered + (item.deliveredCount ?? 0),
    read: value.read + (item.readCount ?? 0), failed: value.failed + (item.failedCount ?? 0),
  }), { queued: 0, sending: 0, accepted: 0, delivered: 0, read: 0, failed: 0 }), [campaigns]);
  const visibleCampaigns = campaigns.filter((item) => (statusFilter === "ALL" || statusFilter === "ATTENTION" && ["FAILED", "PARTIAL"].includes(item.status) || item.status === statusFilter) && (!search.trim() || `${item.name ?? ""} ${item.messageTemplate} ${item.source ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())));
  const progress = selectedCampaign ? Math.round((((selectedCampaign.acceptedCount ?? 0) + (selectedCampaign.deliveredCount ?? 0) + (selectedCampaign.readCount ?? 0) + (selectedCampaign.ignoredCount ?? 0) + (selectedCampaign.failedCount ?? 0)) / Math.max(1, selectedCampaign.recipientCount)) * 100) : 0;

  async function recipientAction(action: "retry" | "ignore" | "delete") {
    const ids = [...selectedRecipients].filter((id) => recipients.some((item) => item.id === id && item.status === "FAILED"));
    if (!ids.length) { notify("Select at least one failed recipient."); return; }
    setBusy(true);
    try {
      const response = await apiFetch(`/api/v1/admin/kids-champ/campaign-recipients/${action}`, { method: "POST", body: JSON.stringify({ recipientIds: ids }) });
      const body = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) { notify(getAdminFriendlyErrorMessage(body?.message, "message delivery")); return; }
      setSelectedRecipients(new Set()); if (selectedCampaignId) await loadRecipients(selectedCampaignId, true); await loadCampaigns(true);
      notify(`${ids.length} failed message${ids.length === 1 ? "" : "s"} ${action === "retry" ? "scheduled for retry" : action === "ignore" ? "ignored" : "removed from the active queue"}.`);
    } catch { notify("The recipient action could not be completed."); } finally { setBusy(false); }
  }

  function exportCampaign() {
    if (!selectedCampaign) return;
    const rows = [["Name", "Destination", "Status", "Attempts", "Failure", "Accepted", "Delivered", "Read"], ...recipients.map((item) => [item.name, item.destination, item.status, String(item.attempts), item.failureReason ? getAdminFriendlyErrorMessage(item.failureReason, "message delivery") : "", item.sentAt ?? "", item.deliveredAt ?? "", item.readAt ?? ""])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `whatsapp-${selectedCampaign.id}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  function selectCampaign(id: string) { setSelectedCampaignId(id); setSelectedRecipients(new Set()); setSelectedRecipientId(null); setRecipients([]); setEvents([]); }

  return <section className={`flex min-h-0 flex-col overflow-hidden bg-[#F6F9FD] ${compact ? "h-[88vh] w-full max-w-[1320px] rounded-[20px] shadow-2xl" : "min-h-[720px] rounded-[20px] border border-[#DFE8F2]"}`}>
    <header className="border-b border-[#DFE8F2] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-emerald-600">WhatsApp operations</p><h2 className="mt-1 text-[24px] font-semibold text-[#17243D]">Messaging workspace</h2><p className="mt-1 text-[12px] text-[#718096]">Campaign progress, recipient delivery evidence, retries and failures in one place.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadCampaigns()} className="h-9 rounded-[9px] border border-[#D8E2EC] px-3 text-[11px] font-bold text-[#526178]">Refresh</button>{onClose ? <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-[#D8E2EC]" aria-label="Close messaging workspace">×</button> : null}</div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 tablet:grid-cols-6">{[["Queued", stats.queued, "text-blue-700"], ["Sending", stats.sending, "text-violet-700"], ["Accepted", stats.accepted, "text-cyan-700"], ["Delivered", stats.delivered, "text-emerald-700"], ["Read", stats.read, "text-green-700"], ["Failed", stats.failed, "text-red-700"]].map(([label, value, color]) => <div key={String(label)} className="rounded-[12px] border border-[#E1E8F0] bg-[#FBFDFF] p-3"><strong className={`text-[22px] ${color}`}>{Number(value).toLocaleString()}</strong><span className="mt-1 block text-[10px] font-bold uppercase text-[#718096]">{label}</span></div>)}</div>
    </header>
    <div className="grid min-h-0 flex-1 desktop:grid-cols-[390px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-[#DFE8F2] bg-white p-4">
        <div className="grid grid-cols-[1fr_130px] gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns" className="h-9 rounded-[9px] border border-[#D8E2EC] px-3 text-[11px] outline-none focus:border-blue-400"/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-[9px] border border-[#D8E2EC] px-2 text-[11px]"><option value="ALL">All statuses</option><option value="ATTENTION">Needs attention</option><option>QUEUED</option><option>SENDING</option><option>COMPLETED</option><option>PARTIAL</option><option>FAILED</option><option>CANCELLED</option></select></div>
        <div className="mt-3 space-y-2">{campaignsLoading ? <p className="py-8 text-center text-[12px] text-[#718096]">Loading campaigns…</p> : visibleCampaigns.map((item) => <button key={item.id} type="button" onClick={() => selectCampaign(item.id)} className={`w-full rounded-[13px] border p-3 text-left ${selectedCampaignId === item.id ? "border-emerald-300 bg-emerald-50" : "border-[#E1E8F0] hover:border-blue-200"}`}><div className="flex items-start justify-between gap-2"><strong className="line-clamp-1 text-[12px] text-[#263852]">{item.name || "WhatsApp campaign"}</strong><StatusPill value={item.status}/></div><p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#718096]">{item.messageTemplate}</p><div className="mt-2 flex justify-between text-[9px] font-semibold text-[#8490A2]"><span>{item.recipientCount} recipients · {item.source || "MANUAL"}</span><span>{formatTime(item.createdAt)}</span></div></button>)}{!campaignsLoading && !visibleCampaigns.length ? <p className="py-8 text-center text-[12px] text-[#718096]">No campaigns match these filters.</p> : null}</div>
      </aside>
      <main className="min-h-0 overflow-y-auto p-4 tablet:p-5">{selectedCampaign ? <>
        <section className="rounded-[16px] border border-[#E0E7EF] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="text-[17px] font-semibold text-[#17243D]">{selectedCampaign.name || "WhatsApp campaign"}</h3><StatusPill value={selectedCampaign.status}/></div><p className="mt-1 text-[11px] text-[#718096]">{selectedCampaign.source || "MANUAL"} · {selectedCampaign.templateName || "Free-form message"} · {selectedCampaign.languageCode || "No language specified"}</p></div><button type="button" onClick={exportCampaign} className="h-9 rounded-[9px] border border-[#D8E2EC] px-3 text-[11px] font-bold text-[#526178]">Export results</button></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7ECF2]"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }}/></div><div className="mt-2 flex justify-between text-[10px] font-semibold text-[#718096]"><span>{progress}% processed</span><span>{selectedCampaign.recipientCount} recipients</span></div><p className="mt-4 whitespace-pre-wrap rounded-[12px] bg-[#F6F8FB] p-3 text-[11px] leading-5 text-[#40516B]">{selectedCampaign.messageTemplate}</p></section>
        <section className="mt-4 rounded-[16px] border border-[#E0E7EF] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-[15px] font-semibold">Recipients</h3><p className="mt-1 text-[10px] text-[#718096]">Select failed messages for retry, ignore, or removal.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedRecipients(new Set(recipients.filter((item) => item.status === "FAILED").map((item) => item.id)))} className="text-[10px] font-bold text-blue-700">Select failures</button><button disabled={busy || !selectedRecipients.size} onClick={() => void recipientAction("retry")} className="rounded-[8px] bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">Retry</button><button disabled={busy || !selectedRecipients.size} onClick={() => void recipientAction("ignore")} className="rounded-[8px] border border-slate-300 px-3 py-2 text-[10px] font-bold disabled:opacity-40">Ignore</button><button disabled={busy || !selectedRecipients.size} onClick={() => void recipientAction("delete")} className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700 disabled:opacity-40">Delete</button></div></div>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[11px]"><thead><tr className="border-b border-[#E8EDF3] text-[9px] uppercase text-[#718096]"><th className="p-2"></th><th className="p-2">Recipient</th><th className="p-2">Status</th><th className="p-2">Attempts</th><th className="p-2">Latest evidence</th><th className="p-2">Failure</th></tr></thead><tbody>{recipients.map((item) => <tr key={item.id} onClick={() => setSelectedRecipientId(item.id)} className={`cursor-pointer border-b border-[#EDF1F5] ${selectedRecipientId === item.id ? "bg-blue-50" : "hover:bg-[#FAFCFF]"}`}><td className="p-2"><input type="checkbox" disabled={item.status !== "FAILED"} checked={selectedRecipients.has(item.id)} onClick={(event) => event.stopPropagation()} onChange={() => setSelectedRecipients((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} className="size-4 accent-emerald-600 disabled:opacity-25"/></td><td className="p-2"><strong className="block text-[#263852]">{item.name}</strong><span className="text-[9px] text-[#8490A2]">{item.destination}</span></td><td className="p-2"><StatusPill value={item.status}/></td><td className="p-2 font-semibold">{item.attempts}/3</td><td className="p-2 text-[10px] text-[#718096]">{formatTime(item.readAt || item.deliveredAt || item.sentAt || item.lastAttemptAt)}</td><td className="max-w-[220px] p-2 text-[10px] text-red-700">{item.failureReason ? getAdminFriendlyErrorMessage(item.failureReason, "message delivery") : "—"}</td></tr>)}</tbody></table></div>
        </section>
        {selectedRecipientId ? <section className="mt-4 rounded-[16px] border border-[#E0E7EF] bg-white p-4"><h3 className="text-[15px] font-semibold">Delivery timeline</h3><div className="mt-4 space-y-3">{events.map((event, index) => <div key={event.id} className="grid grid-cols-[24px_1fr] gap-3"><span className={`mt-0.5 grid size-6 place-items-center rounded-full text-[9px] font-bold text-white ${event.status === "FAILED" ? "bg-red-500" : "bg-emerald-500"}`}>{index + 1}</span><div className="border-b border-[#EDF1F5] pb-3"><div className="flex flex-wrap items-center gap-2"><StatusPill value={event.status}/><span className="text-[9px] text-[#8490A2]">Attempt {event.attempt} · {formatTime(event.providerTimestamp || event.occurredAt)}</span></div>{event.details ? <p className="mt-1 text-[10px] leading-4 text-[#526178]">{event.status === "FAILED" ? getAdminFriendlyErrorMessage(event.details, "message delivery") : event.details}</p> : null}</div></div>)}{!events.length ? <p className="text-[11px] text-[#718096]">No delivery events have been recorded yet.</p> : null}</div></section> : null}
      </> : <div className="grid h-full place-items-center text-[12px] text-[#718096]">Select a campaign to inspect delivery.</div>}</main>
    </div>
  </section>;
}

type ComposeParticipant = { id: string; name: string; phone: string; location: string; whatsappConsented: boolean; whatsappConsentStatus: string };
type MessagingReadiness = { ready: boolean; tokenConfigured: boolean; approvedTemplateCount: number; issues: string[] };

export function WhatsAppComposePanel({ notify }: { notify: (message: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [participants, setParticipants] = useState<ComposeParticipant[]>([]);
  const [readiness, setReadiness] = useState<MessagingReadiness | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [parameters, setParameters] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [campaignName, setCampaignName] = useState("Kids Champ WhatsApp update");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templateResponse, participantResponse, readinessResponse] = await Promise.all([
        apiFetch("/api/v1/admin/kids-champ/whatsapp/templates"),
        apiFetch("/api/v1/admin/kids-champ/participants"),
        apiFetch("/api/v1/admin/kids-champ/whatsapp/readiness"),
      ]);
      if (!templateResponse.ok || !participantResponse.ok || !readinessResponse.ok) throw new Error("Messaging information could not be loaded.");
      const approved = (await templateResponse.json() as Template[]).filter((item) => item.status === "APPROVED" && !item.disabled);
      const people = await participantResponse.json() as ComposeParticipant[];
      const currentReadiness = await readinessResponse.json() as MessagingReadiness;
      setTemplates(approved);
      setParticipants(people);
      setReadiness(currentReadiness);
      setSelectedTemplateId((current) => approved.some((item) => item.id === current) ? current : approved[0]?.id ?? "");
      const target = approved[0];
      setParameters(target?.variables.map((_, index) => index === 0 ? "{name}" : "") ?? []);
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "WhatsApp messaging"));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Loading remote campaign data on mount is the synchronization performed by this effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) ?? null;
  const eligible = participants.filter((item) => item.whatsappConsented && Boolean(item.phone?.trim()));
  const visible = eligible.filter((item) => !search.trim() || `${item.name} ${item.phone} ${item.location}`.toLowerCase().includes(search.trim().toLowerCase()));
  const renderedParticipants = visible.slice(0, 200);
  const preview = selectedTemplate ? parameters.reduce((body, value, index) => body.replaceAll(`{{${index + 1}}}`, value === "{name}" ? "Participant name" : value || `Value ${index + 1}`), selectedTemplate.body) : "";

  function chooseTemplate(id: string) {
    const template = templates.find((item) => item.id === id) ?? null;
    setSelectedTemplateId(id);
    setParameters(template?.variables.map((_, index) => index === 0 ? "{name}" : "") ?? []);
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function queueCampaign() {
    if (!readiness?.ready) { notify(readiness?.issues[0] || "Complete the WhatsApp setup before sending messages."); return; }
    if (!selectedTemplate) { notify("Choose an approved WhatsApp template."); return; }
    if (!selected.size) { notify("Select at least one consented participant."); return; }
    if (parameters.some((value) => !value.trim())) { notify("Complete every template value."); return; }
    if (!window.confirm(`Queue this WhatsApp template for ${selected.size} selected participant${selected.size === 1 ? "" : "s"}?`)) return;
    setSending(true);
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/campaigns", {
        method: "POST",
        body: JSON.stringify({
          channel: "WHATSAPP",
          templateId: selectedTemplate.id,
          participantIds: [...selected],
          templateParameters: parameters,
          name: campaignName.trim() || "Kids Champ WhatsApp update",
          source: "MESSAGING_CENTER",
        }),
      });
      const body = await response.json().catch(() => null) as { id?: string; recipientCount?: number; message?: string } | null;
      if (!response.ok) throw new Error(body?.message);
      setSelected(new Set());
      notify(`${body?.recipientCount ?? selected.size} WhatsApp message${(body?.recipientCount ?? selected.size) === 1 ? "" : "s"} queued successfully.`);
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "message campaign"));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="mt-5 grid min-h-[420px] place-items-center rounded-[20px] border border-[#DFE8F2] bg-white"><div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500"/><p className="mt-3 text-xs font-semibold text-[#526178]">Loading recipients and approved templates…</p></div></div>;

  return <div className="mt-5 grid gap-4 desktop:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <section className="rounded-[20px] border border-[#DFE8F2] bg-white p-5 shadow-[0_10px_28px_rgba(31,83,139,.06)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-600">Audience</p><h2 className="mt-1 text-xl font-semibold text-[#17243D]">Select message recipients</h2><p className="mt-1 text-[11px] text-[#718096]">Only participants with an active WhatsApp opt-in and a usable phone number are available.</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">{selected.size} selected</span></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search participant, phone or hometown" className="mt-5 h-11 w-full rounded-xl border border-[#D8E2EC] px-3 text-xs outline-none focus:border-blue-400"/><div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold"><button type="button" onClick={() => setSelected(new Set(visible.map((item) => item.id)))} className="text-blue-700">Select filtered ({visible.length})</button><button type="button" onClick={() => setSelected(new Set())} className="text-slate-600">Clear selection</button><span className="text-[#8A97A8]">{eligible.length} eligible of {participants.length} participants</span></div>{visible.length > renderedParticipants.length ? <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[10px] text-blue-700">Showing the first 200 matches for smooth scrolling. Refine the search to find another participant; “Select filtered” still selects all {visible.length} matches.</p> : null}<div className="mt-4 max-h-[500px] overflow-y-auto rounded-xl border border-[#E2E8F0]"><table className="w-full min-w-[620px] text-left text-[11px]"><thead className="sticky top-0 bg-[#F7FAFD] text-[9px] uppercase text-[#718096]"><tr><th className="p-3"></th><th className="p-3">Participant</th><th className="p-3">Phone</th><th className="p-3">Hometown</th><th className="p-3">Consent</th></tr></thead><tbody>{renderedParticipants.map((item) => <tr key={item.id} className="border-t border-[#EDF1F5] hover:bg-blue-50/40"><td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} className="size-4 accent-blue-600" aria-label={`Select ${item.name}`}/></td><td className="p-3 font-semibold text-[#263852]">{item.name}</td><td className="p-3 text-[#526178]">{item.phone}</td><td className="p-3 text-[#526178]">{item.location || "Not provided"}</td><td className="p-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">OPTED IN</span></td></tr>)}{!visible.length ? <tr><td colSpan={5} className="p-8 text-center text-xs text-[#718096]">No eligible participants match this search.</td></tr> : null}</tbody></table></div></section>

    <aside className="rounded-[20px] border border-[#DFE8F2] bg-white p-5 shadow-[0_10px_28px_rgba(31,83,139,.06)]"><div className={`rounded-xl border p-4 ${readiness?.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><strong className={`text-xs ${readiness?.ready ? "text-emerald-800" : "text-amber-900"}`}>{readiness?.ready ? "WhatsApp is ready" : "Setup required before sending"}</strong>{readiness?.issues.map((issue) => <p key={issue} className="mt-1 text-[10px] text-amber-800">• {issue}</p>)}</div><label className="mt-5 block text-[11px] font-bold text-[#536781]">Campaign name<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#D8E2EC] px-3 text-xs outline-none focus:border-blue-400"/></label><label className="mt-4 block text-[11px] font-bold text-[#536781]">Approved template<select value={selectedTemplateId} onChange={(event) => chooseTemplate(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#D8E2EC] bg-white px-3 text-xs"><option value="">Choose a template</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.languageCode}</option>)}</select></label>{selectedTemplate ? <><div className="mt-4 space-y-3">{selectedTemplate.variables.map((variable, index) => <label key={variable} className="block text-[10px] font-bold text-[#66758B]">Value for {`{{${variable}}}`}<input value={parameters[index] ?? ""} onChange={(event) => setParameters((current) => current.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} placeholder={index === 0 ? "Use {name} for each participant" : `Enter value ${index + 1}`} className="mt-1 h-10 w-full rounded-[10px] border border-[#D8E2EC] px-3 text-[11px] outline-none focus:border-blue-400"/></label>)}</div><div className="mt-4 rounded-xl bg-[#F5F8FB] p-4"><p className="text-[9px] font-bold uppercase tracking-wide text-blue-600">Preview</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[#40516B]">{preview}</p></div></> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-[11px] text-[#718096]">Synchronize and choose an approved template.</p>}<button type="button" onClick={() => void queueCampaign()} disabled={sending || !readiness?.ready || !selectedTemplate || !selected.size} className="mt-5 min-h-12 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,.22)] disabled:cursor-not-allowed disabled:opacity-40">{sending ? "Queuing campaign…" : `Review and queue ${selected.size || ""} message${selected.size === 1 ? "" : "s"}`}</button><p className="mt-3 text-center text-[9px] leading-4 text-[#8795A8]">The backend rechecks consent, template approval, recipient limits and phone numbers before anything enters the delivery queue.</p></aside>
  </div>;
}

export function WhatsAppTemplatesPanel({ notify }: { notify: (message: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]); const [loading, setLoading] = useState(true); const [syncing, setSyncing] = useState(false); const [filter, setFilter] = useState("ALL"); const [selected, setSelected] = useState<Template | null>(null);
  const load = useCallback(async () => { const response = await apiFetch("/api/v1/admin/kids-champ/whatsapp/templates"); if (response.ok) setTemplates(await response.json() as Template[]); else notify("WhatsApp templates could not be loaded."); setLoading(false); }, [notify]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  async function sync() { setSyncing(true); try { const response = await apiFetch("/api/v1/admin/kids-champ/whatsapp/templates/sync", { method: "POST" }); const body = await response.json().catch(() => null) as Template[] | { message?: string } | null; if (!response.ok) { notify(getAdminFriendlyErrorMessage(!Array.isArray(body) ? body?.message : undefined, "message templates")); return; } setTemplates(body as Template[]); notify(`${(body as Template[]).length} WhatsApp templates synchronized from Meta.`); } catch { notify("Templates could not be synchronized."); } finally { setSyncing(false); } }
  async function toggle(item: Template) { const response = await apiFetch(`/api/v1/admin/kids-champ/whatsapp/templates/${item.id}`, { method: "PATCH", body: JSON.stringify({ disabled: !item.disabled }) }); if (!response.ok) { notify("Template availability could not be updated."); return; } const body = await response.json() as Template; setTemplates((current) => current.map((value) => value.id === body.id ? body : value)); if (selected?.id === body.id) setSelected(body); }
  const visible = templates.filter((item) => filter === "ALL" || filter === "ENABLED" && !item.disabled || filter === "DISABLED" && item.disabled || item.status === filter);
  return <div className="mt-5 grid gap-4 desktop:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-[18px] border border-[#E0E7EF] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[17px] font-semibold">WhatsApp templates</h3><p className="mt-1 text-[11px] text-[#718096]">Approved Meta templates and language variants available to campaign composers.</p></div><div className="flex gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 rounded-[9px] border border-[#D8E2EC] px-2 text-[11px]"><option value="ALL">All</option><option value="APPROVED">Approved</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option><option value="ENABLED">Enabled</option><option value="DISABLED">Disabled</option></select><button type="button" onClick={() => void sync()} disabled={syncing} className="h-9 rounded-[9px] bg-blue-600 px-3 text-[11px] font-bold text-white disabled:opacity-50">{syncing ? "Syncing…" : "Sync from Meta"}</button></div></div><div className="mt-4 space-y-2">{loading ? <p className="py-8 text-center text-[12px] text-[#718096]">Loading templates…</p> : visible.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className={`flex w-full items-center justify-between gap-3 rounded-[12px] border p-3 text-left ${selected?.id === item.id ? "border-blue-300 bg-blue-50" : "border-[#E1E8F0]"}`}><div><strong className="text-[12px] text-[#263852]">{item.name}</strong><p className="mt-1 text-[10px] text-[#718096]">{item.languageCode} · {item.category} · {item.variables.length} variables</p></div><div className="flex items-center gap-2"><StatusPill value={item.status}/>{item.disabled ? <span className="rounded-full bg-slate-200 px-2 py-1 text-[9px] font-bold text-slate-700">DISABLED</span> : null}</div></button>)}{!loading && !visible.length ? <p className="py-8 text-center text-[12px] text-[#718096]">No synchronized templates match this filter.</p> : null}</div></section><aside className="rounded-[18px] border border-[#E0E7EF] bg-white p-5">{selected ? <><p className="text-[10px] font-bold uppercase tracking-[.12em] text-blue-600">Template preview</p><h3 className="mt-2 text-[16px] font-semibold">{selected.name}</h3><p className="mt-1 text-[10px] text-[#718096]">{selected.languageCode} · synchronized {formatTime(selected.syncedAt)}</p><div className="mt-4 whitespace-pre-wrap rounded-[13px] bg-[#F5F8FB] p-4 text-[12px] leading-6 text-[#40516B]">{selected.body || "Meta did not provide body content."}</div><div className="mt-3 flex flex-wrap gap-1">{selected.variables.map((value) => <span key={value} className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">Variable {`{{${value}}}`}</span>)}</div><button type="button" onClick={() => void toggle(selected)} className={`mt-5 h-9 w-full rounded-[9px] text-[11px] font-bold ${selected.disabled ? "bg-emerald-600 text-white" : "border border-red-200 bg-red-50 text-red-700"}`}>{selected.disabled ? "Enable for campaigns" : "Disable locally"}</button></> : <p className="py-10 text-center text-[12px] text-[#718096]">Select a template to preview it.</p>}</aside></div>;
}

export function WhatsAppConsentControl({ participantId, status, notify, onChanged }: { participantId: string; status: string; notify: (message: string) => void; onChanged?: (status: string) => void }) {
  const [value, setValue] = useState(status); const [reason, setReason] = useState(""); const [saving, setSaving] = useState(false);
  async function save() { if (value === "OPTED_OUT" && !reason.trim()) { notify("Add the opt-out reason before saving."); return; } setSaving(true); try { const response = await apiFetch(`/api/v1/admin/kids-champ/whatsapp/preferences/${participantId}`, { method: "PATCH", body: JSON.stringify({ status: value, reason: reason.trim() || null }) }); const body = await response.json().catch(() => null) as { status?: string; message?: string } | null; if (!response.ok) { notify(getAdminFriendlyErrorMessage(body?.message, "message preference")); return; } onChanged?.(body?.status || value); notify("WhatsApp preference updated and audited."); } catch { notify("WhatsApp preference could not be saved."); } finally { setSaving(false); } }
  return <div className="rounded-[13px] border border-emerald-200 bg-emerald-50/60 p-4"><h4 className="text-[12px] font-semibold text-emerald-900">WhatsApp consent</h4><p className="mt-1 text-[10px] leading-4 text-emerald-800">Opt-out always overrides consent recorded on older submissions.</p><select value={value} onChange={(event) => setValue(event.target.value)} className="mt-3 h-9 w-full rounded-[9px] border border-emerald-200 bg-white px-3 text-[11px]"><option value="UNKNOWN">Not provided</option><option value="OPTED_IN">Opted in</option><option value="OPTED_OUT">Opted out</option></select>{value === "OPTED_OUT" ? <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required opt-out reason" className="mt-2 min-h-20 w-full rounded-[9px] border border-emerald-200 bg-white p-3 text-[11px] outline-none"/> : null}<button type="button" onClick={() => void save()} disabled={saving || value === status} className="mt-3 h-9 w-full rounded-[9px] bg-emerald-600 text-[11px] font-bold text-white disabled:opacity-40">{saving ? "Saving…" : "Save preference"}</button></div>;
}
