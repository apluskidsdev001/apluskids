"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/utils/auth";
import { getAdminFriendlyErrorMessage } from "./AdminNotice";

type Notify = (message: string) => void;
type WhatsAppAdminConfig = {
  graphApiVersion: string;
  phoneNumberId: string;
  businessAccountId: string;
  tokenConfigured: boolean;
  maskedToken: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
  lastTestedAt?: string;
};
type ConnectionResult = {
  success: boolean;
  message: string;
  solutions: string[];
  testedAt: string;
  displayPhoneNumber?: string;
  qualityRating?: string;
};
type TemplateOption = {
  id: string;
  name: string;
  languageCode: string;
  status: string;
  variables: string[];
  disabled: boolean;
};

const field = "mt-1 min-h-11 w-full rounded-xl border border-[#D9E4F1] bg-white px-3 text-[12px] text-[#263A58] outline-none transition focus:border-[#2188F4] focus:ring-4 focus:ring-blue-100";
const secondary = "min-h-10 rounded-xl border border-[#D7E4F2] bg-white px-4 text-[11px] font-semibold text-[#405675] transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45";
const primary = "min-h-11 rounded-xl bg-gradient-to-r from-[#087DF3] to-[#2A98F7] px-5 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(26,128,239,.25)] disabled:cursor-not-allowed disabled:opacity-45";

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }) : "Not tested yet";
}

export default function WhatsAppAdminSettingsPanel({ notify }: { notify: Notify }) {
  const [config, setConfig] = useState<WhatsAppAdminConfig | null>(null);
  const [draft, setDraft] = useState({ graphApiVersion: "v25.0", phoneNumberId: "", businessAccountId: "", accessToken: "" });
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateParameters, setTemplateParameters] = useState<string[]>([]);
  const [testPhone, setTestPhone] = useState("");
  const [connection, setConnection] = useState<ConnectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configResponse, templateResponse] = await Promise.all([
        apiFetch("/api/v1/admin/kids-champ/whatsapp/config"),
        apiFetch("/api/v1/admin/kids-champ/whatsapp/templates"),
      ]);
      const body = await configResponse.json().catch(() => null) as WhatsAppAdminConfig | null;
      if (!configResponse.ok || !body) throw new Error("WhatsApp settings could not be loaded.");
      const available = templateResponse.ok
        ? (await templateResponse.json() as TemplateOption[]).filter((item) => item.status === "APPROVED" && !item.disabled)
        : [];
      setConfig(body);
      setDraft({ graphApiVersion: body.graphApiVersion, phoneNumberId: body.phoneNumberId, businessAccountId: body.businessAccountId, accessToken: "" });
      setTemplates(available);
      setSelectedTemplateId((current) => available.some((item) => item.id === current) ? current : available[0]?.id ?? "");
      setTemplateParameters((current) => {
        const target = available.find((item) => item.id === selectedTemplateId) ?? available[0];
        return target && current.length === target.variables.length ? current : target?.variables.map(() => "") ?? [];
      });
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "WhatsApp configuration"));
    } finally {
      setLoading(false);
    }
  }, [notify, selectedTemplateId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
    // Loading is intentionally limited to the initial mount and explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseTemplate(id: string) {
    const template = templates.find((item) => item.id === id) ?? null;
    setSelectedTemplateId(id);
    setTemplateParameters(template?.variables.map(() => "") ?? []);
  }

  async function save() {
    const accountChanged = Boolean(config && (
      config.phoneNumberId !== draft.phoneNumberId.replaceAll(/\D/g, "")
      || config.businessAccountId !== draft.businessAccountId.replaceAll(/\D/g, "")
    ));
    if (accountChanged && !window.confirm("Switch the connected Meta account? Existing synchronized templates will be removed and must be synchronized from the new account.")) return;
    setSaving(true);
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/whatsapp/config", { method: "PUT", body: JSON.stringify(draft), notifyDataUpdated: false });
      const body = await response.json().catch(() => null) as (WhatsAppAdminConfig & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message);
      setConfig(body);
      setDraft((current) => ({ ...current, accessToken: "" }));
      setConnection(null);
      if (accountChanged) { setTemplates([]); setSelectedTemplateId(""); setTemplateParameters([]); }
      notify(accountChanged ? "Meta account changed. Test the connection, then synchronize its templates." : "WhatsApp configuration saved securely.");
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "WhatsApp configuration"));
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTestingConnection(true);
    setConnection(null);
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/whatsapp/connection-test", { method: "POST", notifyDataUpdated: false });
      const body = await response.json().catch(() => null) as (ConnectionResult & { message?: string }) | null;
      if (!response.ok || !body) throw new Error(body?.message);
      setConnection(body);
      notify(body.success ? "WhatsApp connection confirmed." : getAdminFriendlyErrorMessage(body.message, "WhatsApp connection"));
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "WhatsApp connection"));
    } finally {
      setTestingConnection(false);
    }
  }

  async function sendTest() {
    if (!selectedTemplate) { notify("Synchronize and choose an approved Meta template first."); return; }
    if (templateParameters.some((value) => !value.trim())) { notify("Complete every template value before sending the test."); return; }
    setSendingTest(true);
    try {
      const response = await apiFetch("/api/v1/admin/kids-champ/whatsapp/test", {
        method: "POST",
        body: JSON.stringify({ phone: testPhone, templateId: selectedTemplate.id, templateParameters }),
        notifyDataUpdated: false,
      });
      const body = await response.json().catch(() => null) as { success?: boolean; message?: string; testedAt?: string } | null;
      if (!response.ok || !body?.success) throw new Error(body?.message);
      setConfig((current) => current ? { ...current, lastTestStatus: "SUCCESS", lastTestMessage: body.message, lastTestedAt: body.testedAt } : current);
      notify("Approved WhatsApp template sent successfully.");
    } catch (reason) {
      notify(getAdminFriendlyErrorMessage(reason instanceof Error ? reason.message : undefined, "WhatsApp delivery"));
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) return <div className="mt-5 grid min-h-[360px] place-items-center rounded-[22px] border border-[#DDE7F2] bg-white"><div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500"/><p className="mt-4 text-sm font-semibold text-[#415674]">Loading WhatsApp settings…</p></div></div>;

  return <div className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
    <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 shadow-[0_10px_30px_rgba(31,83,139,.06)] tablet:p-6 laptop:p-7">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-600">Super Admin configuration</p><h3 className="mt-1 text-xl font-semibold text-[#203653]">WhatsApp Cloud API account</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#75849A]">Connect or switch the Meta account used by A+ Kids. Credentials are encrypted by the backend and saved tokens are never returned to this page.</p></div><span className={`self-start rounded-full border px-3 py-2 text-[10px] font-bold ${config?.tokenConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{config?.tokenConfigured ? "● Token configured" : "Setup required"}</span></div>
      <div className="mt-6 grid gap-4 tablet:grid-cols-2"><label className="text-[11px] font-bold text-[#536781]">Graph API version<input value={draft.graphApiVersion} onChange={(event) => setDraft({ ...draft, graphApiVersion: event.target.value })} className={field} placeholder="v25.0"/></label><label className="text-[11px] font-bold text-[#536781]">Phone Number ID<input inputMode="numeric" value={draft.phoneNumberId} onChange={(event) => setDraft({ ...draft, phoneNumberId: event.target.value })} className={field}/></label><label className="text-[11px] font-bold text-[#536781]">WhatsApp Business Account ID<input inputMode="numeric" value={draft.businessAccountId} onChange={(event) => setDraft({ ...draft, businessAccountId: event.target.value })} className={field}/></label><label className="text-[11px] font-bold text-[#536781]">Permanent system-user token<input type="password" autoComplete="new-password" value={draft.accessToken} onChange={(event) => setDraft({ ...draft, accessToken: event.target.value })} className={field} placeholder={config?.tokenConfigured ? `${config.maskedToken} — leave blank to keep it` : "Paste the permanent Meta token"}/></label></div>
      <div className="mt-6 flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between"><p className="text-[10px] leading-4 text-[#8291A6]">Changing the account IDs removes the previous account’s local template cache. Historical campaigns remain available.</p><button type="button" onClick={() => void save()} disabled={saving || !draft.phoneNumberId.trim() || !draft.businessAccountId.trim()} className={primary}>{saving ? "Saving securely…" : "Save WhatsApp account"}</button></div>
    </section>

    <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 shadow-[0_10px_30px_rgba(31,83,139,.06)] tablet:p-6 laptop:p-7">
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-blue-600">Connection health</p><h3 className="mt-1 text-xl font-semibold text-[#203653]">Test and verify</h3><p className="mt-2 text-xs leading-5 text-[#75849A]">Confirm that the Phone Number ID belongs to the configured WhatsApp Business Account.</p>
      <button type="button" onClick={() => void testConnection()} disabled={testingConnection || !config?.tokenConfigured} className={`${secondary} mt-5 w-full`}>{testingConnection ? "Checking Meta connection…" : "Test Meta connection"}</button>
      {connection ? <div role="status" className={`mt-3 rounded-xl border p-4 text-xs ${connection.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}><strong>{connection.success ? "Connection is ready" : "Connection needs attention"}</strong><p className="mt-1 leading-5">{connection.success ? connection.message : getAdminFriendlyErrorMessage(connection.message, "WhatsApp connection")}</p>{connection.success && connection.displayPhoneNumber ? <p className="mt-2 text-[10px] font-semibold">{connection.displayPhoneNumber} · quality {connection.qualityRating || "not available"}</p> : null}{!connection.success ? connection.solutions.map((solution) => <p key={solution} className="mt-1 text-[10px]">• {solution}</p>) : null}</div> : null}

      <div className="mt-5 border-t border-[#E7EDF4] pt-5"><h4 className="text-sm font-semibold text-[#203653]">Approved-template test</h4><p className="mt-1 text-[10px] leading-4 text-[#75849A]">This sends a real template message. Use a number you are authorized to contact.</p><label className="mt-4 block text-[11px] font-bold text-[#536781]">Test recipient number<input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} className={field} placeholder="07XXXXXXXX"/></label><label className="mt-3 block text-[11px] font-bold text-[#536781]">Approved template<select value={selectedTemplateId} onChange={(event) => chooseTemplate(event.target.value)} className={field}><option value="">Choose a synchronized template</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.languageCode}</option>)}</select></label>{selectedTemplate ? <div className="mt-3 grid gap-2">{selectedTemplate.variables.map((variable, index) => <label key={variable} className="text-[10px] font-bold text-[#66758B]">Value for {`{{${variable}}}`}<input value={templateParameters[index] ?? ""} onChange={(event) => setTemplateParameters((current) => current.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} className={field} placeholder={index === 0 ? "Example recipient name" : `Example value ${index + 1}`}/></label>)}</div> : null}<button type="button" onClick={() => void sendTest()} disabled={sendingTest || !config?.tokenConfigured || !testPhone.trim() || !selectedTemplate} className="mt-3 min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-[11px] font-bold text-white disabled:opacity-45">{sendingTest ? "Sending approved template…" : "Send approved-template test"}</button></div>

      <div className={`mt-5 rounded-xl border p-4 ${config?.lastTestStatus === "SUCCESS" ? "border-emerald-200 bg-emerald-50" : "border-[#E0E7EF] bg-[#F8FAFC]"}`}><p className="text-[10px] font-bold uppercase tracking-wide text-[#7A879A]">Latest delivery test</p><p className="mt-2 text-sm font-semibold text-[#203653]">{config?.lastTestStatus || "Not tested"}</p><p className="mt-1 text-[10px] leading-4 text-[#66758B]">{config?.lastTestStatus === "FAILED" ? getAdminFriendlyErrorMessage(config.lastTestMessage, "WhatsApp delivery") : config?.lastTestMessage || "Save the account, synchronize templates, then run a test."}</p><p className="mt-2 text-[10px] text-[#8996A8]">{dateLabel(config?.lastTestedAt)}</p></div>
    </section>
  </div>;
}
