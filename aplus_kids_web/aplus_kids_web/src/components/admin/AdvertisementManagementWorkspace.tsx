"use client";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Image from "next/image";
import { apiFetch, resolveApiBaseUrl } from "@/utils/auth";
import { getAdminFriendlyErrorMessage } from "./AdminNotice";

type Tab =
  "overview" | "library" | "placements" | "schedule" | "analytics" | "history";
type Status = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
type ContentType = "IMAGE" | "GIF" | "VIDEO" | "CARD" | "EMBED";
type Ad = {
  id: string;
  name: string;
  contentType: ContentType;
  status: Status;
  lifecycle: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  altText?: string;
  destinationUrl?: string;
  openNewTab: boolean;
  fitMode: "CONTAIN" | "COVER";
  backgroundColor: string;
  desktopMedia: boolean;
  mobileMedia: boolean;
  externalSourceUrl?: string;
  startsAt?: string;
  endsAt?: string;
  priority: number;
  rotationWeight: number;
  impressions: number;
  clicks: number;
  slots: string[];
  createdAt: string;
  updatedAt: string;
};
type Audit = {
  advertisementId: string;
  action: string;
  details: string;
  actor: string;
  createdAt: string;
};
type DailyMetric = { date: string; impressions: number; clicks: number };
type AnalyticsSeries = {
  advertisementId: string;
  name: string;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  points: DailyMetric[];
};
type AnalyticsResponse = {
  from: string;
  to: string;
  days: number;
  series: AnalyticsSeries[];
};
type AnalyticsMetric = "impressions" | "clicks" | "ctr";
type AnalyticsRange = "DAY" | "WEEK" | "MONTH" | "CUSTOM";
type Notify = (message: string) => void;
const slots = [
  { id: "HOME_AFTER_HERO", page: "Home", name: "After Hero" },
  { id: "HOME_AFTER_SHORTCUTS", page: "Home", name: "After Shortcuts" },
  { id: "HOME_BEFORE_SCHEDULE", page: "Home", name: "Before TV Schedule" },
  { id: "KIDS_ZONE_AFTER_HERO", page: "Kids Zone", name: "After Hero" },
  { id: "WATCH_BEFORE_CATEGORIES", page: "Watch", name: "Before Categories" },
  { id: "MARKET_PROMO_BANNER", page: "Market", name: "Promotional Banner" },
] as const;
const input =
  "min-h-11 w-full rounded-xl border border-[#D9E4F1] bg-white px-3 text-[12px] text-[#263A58] outline-none focus:border-[#2188F4] focus:ring-4 focus:ring-blue-100";
const secondary =
  "min-h-10 rounded-xl border border-[#D7E4F2] bg-white px-4 text-[11px] font-semibold text-[#405675] hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40";
const primary =
  "min-h-10 rounded-xl bg-gradient-to-r from-[#087DF3] to-[#2A98F7] px-4 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(26,128,239,.25)] disabled:opacity-40";
const emptyDraft = {
  name: "",
  contentType: "IMAGE" as ContentType,
  title: "",
  description: "",
  buttonLabel: "Learn more",
  altText: "",
  destinationUrl: "",
  openNewTab: true,
  fitMode: "CONTAIN" as "CONTAIN" | "COVER",
  backgroundColor: "#FFFFFF",
  externalSourceUrl: "",
  startsAt: "",
  endsAt: "",
  priority: 0,
  rotationWeight: 1,
  slots: [] as string[],
};
function currentUser() {
  if (typeof window === "undefined") return false;
  try {
    const raw =
      localStorage.getItem("aplus-current-user") ||
      sessionStorage.getItem("aplus-current-user");
    return Boolean(
      raw &&
      (JSON.parse(raw) as { roles?: string[] }).roles?.includes(
        "ROLE_SUPER_ADMIN",
      ),
    );
  } catch {
    return false;
  }
}
function label(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (v) => v.toUpperCase());
}
function date(value?: string) {
  return value
    ? new Date(value).toLocaleString("en-LK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Colombo",
      })
    : "Not set";
}
function todayInColombo() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}
function shiftIsoDate(value: string, days: number) {
  const result = new Date(`${value}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
function inclusiveDays(from: string, to: string) {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}
function analyticsWindow(
  range: AnalyticsRange,
  customFrom: string,
  customTo: string,
) {
  const today = todayInColombo();
  const to = range === "CUSTOM" ? customTo : today;
  const from =
    range === "CUSTOM"
      ? customFrom
      : shiftIsoDate(today, range === "DAY" ? 0 : range === "WEEK" ? -6 : -29);
  const days =
    /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
      ? inclusiveDays(from, to)
      : 0;
  return {
    from,
    to,
    days,
    valid: days >= 1 && days <= 365 && to <= today,
    today,
  };
}
function ratio(ad: Ad) {
  return ad.impressions
    ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%`
    : "0.0%";
}
function normalizeDestination(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: "", valid: true };
  if (trimmed.startsWith("/") && !trimmed.startsWith("//"))
    return { value: trimmed, valid: true };
  const candidate = /^[\w-]+(?:\.[\w-]+)+(?:[/?#].*)?$/i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;
  try {
    const parsed = new URL(candidate);
    return {
      value: candidate,
      valid: ["http:", "https:"].includes(parsed.protocol),
    };
  } catch {
    return { value: trimmed, valid: false };
  }
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
function xml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function StatusPill({ value }: { value: string }) {
  const tone =
    value === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "SCHEDULED"
        ? "bg-violet-50 text-violet-700 border-violet-200"
        : value === "DRAFT"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : value === "PAUSED"
            ? "bg-slate-50 text-slate-700 border-slate-200"
            : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${tone}`}
    >
      {label(value)}
    </span>
  );
}
function Metric({
  name,
  value,
  detail,
  tone = "blue",
}: {
  name: string;
  value: number | string;
  detail: string;
  tone?: string;
}) {
  const colors: { [key: string]: string } = {
    blue: "text-blue-700 bg-blue-50",
    green: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
    violet: "text-violet-700 bg-violet-50",
  };
  return (
    <article className="rounded-[18px] border border-[#DDE7F2] bg-white p-4 shadow-sm tablet:p-5">
      <span className="text-[10px] font-bold text-[#61738E]">{name}</span>
      <strong
        className={`mt-3 block w-fit rounded-xl px-3 py-2 text-2xl ${colors[tone] || colors.blue}`}
      >
        {value}
      </strong>
      <p className="mt-3 text-[9px] leading-4 text-[#8795A8]">{detail}</p>
    </article>
  );
}
function TabIcon({ tab }: { tab: Tab }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (tab === "overview")
    return (
      <svg viewBox="0 0 32 32">
        <rect x="4" y="4" width="9" height="9" rx="2" {...shared} />
        <rect x="19" y="4" width="9" height="9" rx="2" {...shared} />
        <rect x="4" y="19" width="9" height="9" rx="2" {...shared} />
        <rect x="19" y="19" width="9" height="9" rx="2" {...shared} />
      </svg>
    );
  if (tab === "library")
    return (
      <svg viewBox="0 0 32 32">
        <path
          d="M5 7h22v18H5zM9 11h7v6H9zM19 11h4M19 15h4M9 21h14"
          {...shared}
        />
      </svg>
    );
  if (tab === "placements")
    return (
      <svg viewBox="0 0 32 32">
        <path
          d="M5 5h9v9H5zM18 5h9v9h-9zM5 18h9v9H5zM18 18h9v9h-9z"
          {...shared}
        />
      </svg>
    );
  if (tab === "schedule")
    return (
      <svg viewBox="0 0 32 32">
        <rect x="5" y="7" width="22" height="20" rx="3" {...shared} />
        <path d="M10 4v6M22 4v6M5 13h22M11 18h4M18 18h4M11 22h4" {...shared} />
      </svg>
    );
  if (tab === "analytics")
    return (
      <svg viewBox="0 0 32 32">
        <path
          d="M5 27V15h5v12M13.5 27V8h5v19M22 27V4h5v23M4 27h24"
          {...shared}
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 32">
      <path d="M8 4h16v24H8zM12 10h8M12 15h8M12 20h6" {...shared} />
    </svg>
  );
}

export default function AdvertisementManagementWorkspace({
  notify,
}: {
  notify: Notify;
}) {
  const [tab, setTab] = useState<Tab>("overview"),
    [ads, setAds] = useState<Ad[]>([]),
    [history, setHistory] = useState<Audit[]>([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [editor, setEditor] = useState<Ad | null | "new">(null),
    [draft, setDraft] = useState(emptyDraft),
    [desktop, setDesktop] = useState<File | null>(null),
    [mobile, setMobile] = useState<File | null>(null),
    [saving, setSaving] = useState(false),
    [deleteTarget, setDeleteTarget] = useState<Ad | null>(null),
    [deleting, setDeleting] = useState(false),
    [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null),
    [analyticsLoading, setAnalyticsLoading] = useState(false),
    [analyticsAd, setAnalyticsAd] = useState("ALL"),
    [analyticsMetric, setAnalyticsMetric] =
      useState<AnalyticsMetric>("impressions"),
    [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>("MONTH"),
    [analyticsFrom, setAnalyticsFrom] = useState(() =>
      shiftIsoDate(todayInColombo(), -29),
    ),
    [analyticsTo, setAnalyticsTo] = useState(todayInColombo),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [type, setType] = useState("ALL"),
    [superAdmin] = useState(currentUser);
  const deferred = useDeferredValue(search);
  const load = useCallback(
    async (background = false) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const [adResponse, historyResponse] = await Promise.all([
          apiFetch("/api/v1/admin/advertisements"),
          apiFetch("/api/v1/admin/advertisements/history"),
        ]);
        if (!adResponse.ok)
          throw new Error("Advertisements could not be loaded.");
        setAds((await adResponse.json()) as Ad[]);
        if (historyResponse.ok)
          setHistory((await historyResponse.json()) as Audit[]);
      } catch (reason) {
        notify(
          getAdminFriendlyErrorMessage(
            reason instanceof Error ? reason.message : undefined,
            "advertisement management",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [notify],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const selectedAnalyticsWindow = useMemo(
    () => analyticsWindow(analyticsRange, analyticsFrom, analyticsTo),
    [analyticsFrom, analyticsRange, analyticsTo],
  );
  const loadAnalytics = useCallback(
    async (from: string, to: string) => {
      setAnalyticsLoading(true);
      try {
        const query = new URLSearchParams({ from, to });
        const response = await apiFetch(
          `/api/v1/admin/advertisements/analytics?${query.toString()}`,
        );
        const body = (await response.json().catch(() => null)) as
          AnalyticsResponse | { message?: string } | null;
        if (!response.ok || !body || !("series" in body))
          throw new Error(body && "message" in body ? body.message : undefined);
        setAnalytics(body);
      } catch (reason) {
        notify(
          getAdminFriendlyErrorMessage(
            reason instanceof Error ? reason.message : undefined,
            "advertisement analytics",
          ),
        );
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [notify],
  );
  useEffect(() => {
    if (tab !== "analytics" || !selectedAnalyticsWindow.valid) return;
    const previousFrom = shiftIsoDate(
      selectedAnalyticsWindow.from,
      -selectedAnalyticsWindow.days,
    );
    const timer = window.setTimeout(
      () => void loadAnalytics(previousFrom, selectedAnalyticsWindow.to),
      200,
    );
    return () => window.clearTimeout(timer);
  }, [loadAnalytics, selectedAnalyticsWindow, tab]);
  const monitoredAdvertisement =
    analyticsAd === "ALL" || ads.some((ad) => ad.id === analyticsAd)
      ? analyticsAd
      : "ALL";
  const counts = useMemo(
    () => ({
      all: ads.length,
      active: ads.filter((a) => a.lifecycle === "ACTIVE").length,
      scheduled: ads.filter((a) => a.lifecycle === "SCHEDULED").length,
      draft: ads.filter((a) => a.lifecycle === "DRAFT").length,
      attention: ads.filter((a) => ["EXPIRED", "PAUSED"].includes(a.lifecycle))
        .length,
      empty: slots.filter(
        (slot) =>
          !ads.some(
            (a) => a.lifecycle === "ACTIVE" && a.slots.includes(slot.id),
          ),
      ).length,
    }),
    [ads],
  );
  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return ads.filter(
      (a) =>
        (status === "ALL" || a.lifecycle === status) &&
        (type === "ALL" || a.contentType === type) &&
        (!q ||
          a.name.toLowerCase().includes(q) ||
          a.title?.toLowerCase().includes(q) ||
          a.slots.some((v) => v.toLowerCase().includes(q))),
    );
  }, [ads, deferred, status, type]);
  const tabs: Array<{ id: Tab; name: string }> = [
    { id: "overview", name: "Overview" },
    { id: "library", name: "Ad Library" },
    { id: "placements", name: "Page Placements" },
    { id: "schedule", name: "Schedule" },
    { id: "analytics", name: "Analytics" },
    { id: "history", name: "History" },
  ];
  function open(ad?: Ad) {
    setEditor(ad || "new");
    setDesktop(null);
    setMobile(null);
    setDraft(
      ad
        ? {
            name: ad.name,
            contentType: ad.contentType,
            title: ad.title || "",
            description: ad.description || "",
            buttonLabel: ad.buttonLabel || "",
            altText: ad.altText || "",
            destinationUrl: ad.destinationUrl || "",
            openNewTab: ad.openNewTab,
            fitMode: ad.fitMode,
            backgroundColor: ad.backgroundColor,
            externalSourceUrl: ad.externalSourceUrl || "",
            startsAt: ad.startsAt?.slice(0, 16) || "",
            endsAt: ad.endsAt?.slice(0, 16) || "",
            priority: ad.priority,
            rotationWeight: ad.rotationWeight,
            slots: ad.slots,
          }
        : emptyDraft,
    );
  }
  async function save(publish = false) {
    const destination = normalizeDestination(draft.destinationUrl);
    if (!destination.valid) {
      notify(
        "Enter a complete website link such as https://example.com, or an internal page such as /market. You can also leave the destination blank.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        destinationUrl: destination.value || null,
        startsAt: draft.startsAt
          ? new Date(draft.startsAt).toISOString()
          : null,
        endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
      };
      const existing = editor !== "new" && editor ? editor : null;
      let response = await apiFetch(
        existing
          ? `/api/v1/admin/advertisements/${existing.id}`
          : "/api/v1/admin/advertisements",
        {
          method: existing ? "PUT" : "POST",
          body: JSON.stringify(payload),
          notifyDataUpdated: false,
        },
      );
      let body = (await response.json().catch(() => null)) as
        Ad | { message?: string } | null;
      if (!response.ok || !body || !("id" in body))
        throw new Error(body && "message" in body ? body.message : undefined);
      let saved = body as Ad;
      setEditor(saved);
      for (const [variant, file] of [
        ["desktop", desktop],
        ["mobile", mobile],
      ] as const) {
        if (!file) continue;
        const data = new FormData();
        data.append("file", file);
        response = await apiFetch(
          `/api/v1/admin/advertisements/${saved.id}/assets/${variant}`,
          { method: "POST", body: data, notifyDataUpdated: false },
        );
        body = (await response.json().catch(() => null)) as
          Ad | { message?: string } | null;
        if (!response.ok || !body || !("id" in body))
          throw new Error(body && "message" in body ? body.message : undefined);
        saved = body as Ad;
        setEditor(saved);
      }
      if (publish) {
        response = await apiFetch(
          `/api/v1/admin/advertisements/${saved.id}/status`,
          {
            method: "POST",
            body: JSON.stringify({ status: "ACTIVE" }),
            notifyDataUpdated: false,
          },
        );
        body = (await response.json().catch(() => null)) as
          Ad | { message?: string } | null;
        if (!response.ok || !body || !("id" in body))
          throw new Error(body && "message" in body ? body.message : undefined);
      }
      setEditor(null);
      await load(true);
      notify(
        publish
          ? "Advertisement published successfully."
          : existing
            ? "Advertisement changes saved successfully."
            : "Advertisement draft saved successfully.",
      );
    } catch (reason) {
      notify(
        getAdminFriendlyErrorMessage(
          reason instanceof Error ? reason.message : undefined,
          "advertisement save",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  async function exportAnalytics(format: "excel" | "pdf") {
    if (!ads.length) {
      notify("There are no advertisement records to export.");
      return;
    }
    const headers = [
        "Advertisement",
        "Type",
        "Status",
        "Placements",
        "Impressions",
        "Clicks",
        "CTR",
        "Starts",
        "Ends",
      ],
      rows = ads.map((ad) => [
        ad.name,
        label(ad.contentType),
        label(ad.lifecycle),
        ad.slots.map(label).join(", "),
        ad.impressions,
        ad.clicks,
        ratio(ad),
        date(ad.startsAt),
        date(ad.endsAt),
      ]);
    if (format === "excel") {
      const cells = (row: unknown[]) =>
        row
          .map(
            (value) =>
              `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`,
          )
          .join("");
      const document = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F82ED" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Advertisement Analytics"><Table><Row><Cell ss:MergeAcross="8"><Data ss:Type="String">A+ Kids Advertisement Performance Report</Data></Cell></Row><Row>${headers.map((value) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${value}</Data></Cell>`).join("")}</Row>${rows.map((row) => `<Row>${cells(row)}</Row>`).join("")}</Table></Worksheet></Workbook>`;
      download(
        new Blob([`\uFEFF${document}`], { type: "application/vnd.ms-excel" }),
        "aplus-advertisement-analytics.xls",
      );
    } else {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      doc.setFontSize(18);
      doc.setTextColor(18, 49, 91);
      doc.text("A+ Kids Advertisement Performance Report", 10, 13);
      doc.setFontSize(8);
      doc.text(
        `${ads.length} advertisements · Generated ${date(new Date().toISOString())}`,
        10,
        19,
      );
      let y = 27;
      doc.setFillColor(31, 130, 237);
      doc.rect(10, y, 277, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Advertisement", 12, y + 5);
      doc.text("Type", 76, y + 5);
      doc.text("Status", 102, y + 5);
      doc.text("Placements", 130, y + 5);
      doc.text("Views", 207, y + 5);
      doc.text("Clicks", 232, y + 5);
      doc.text("CTR", 258, y + 5);
      y += 7;
      doc.setTextColor(35, 57, 86);
      for (const row of rows) {
        if (y > 194) {
          doc.addPage();
          y = 15;
        }
        doc.setDrawColor(225, 232, 240);
        doc.line(10, y + 7, 287, y + 7);
        doc.setFontSize(7);
        doc.text(String(row[0]).slice(0, 36), 12, y + 5);
        doc.text(String(row[1]), 76, y + 5);
        doc.text(String(row[2]), 102, y + 5);
        doc.text(String(row[3]).slice(0, 42), 130, y + 5);
        doc.text(String(row[4]), 207, y + 5);
        doc.text(String(row[5]), 232, y + 5);
        doc.text(String(row[6]), 258, y + 5);
        y += 8;
      }
      doc.save("aplus-advertisement-analytics.pdf");
    }
    notify(
      `Advertisement analytics exported as ${format === "pdf" ? "PDF" : "Excel"}.`,
    );
  }
  async function changeStatus(ad: Ad, next: Status) {
    try {
      const response = await apiFetch(
        `/api/v1/admin/advertisements/${ad.id}/status`,
        {
          method: "POST",
          body: JSON.stringify({ status: next }),
          notifyDataUpdated: false,
        },
      );
      const body = (await response.json().catch(() => null)) as
        Ad | { message?: string } | null;
      if (!response.ok || !body || !("id" in body))
        throw new Error(body && "message" in body ? body.message : undefined);
      setAds((current) =>
        current.map((item) => (item.id === ad.id ? (body as Ad) : item)),
      );
      notify(`Advertisement ${next.toLowerCase()} successfully.`);
    } catch (reason) {
      notify(
        getAdminFriendlyErrorMessage(
          reason instanceof Error ? reason.message : undefined,
          "advertisement status",
        ),
      );
    }
  }
  async function deleteAdvertisement() {
    if (!deleteTarget || deleteTarget.status === "ACTIVE") return;
    setDeleting(true);
    try {
      const response = await apiFetch(
        `/api/v1/admin/advertisements/${deleteTarget.id}`,
        { method: "DELETE", notifyDataUpdated: false },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message);
      }
      const deletedName = deleteTarget.name;
      if (analyticsAd === deleteTarget.id) setAnalyticsAd("ALL");
      setDeleteTarget(null);
      await load(true);
      if (tab === "analytics" && selectedAnalyticsWindow.valid)
        await loadAnalytics(
          shiftIsoDate(
            selectedAnalyticsWindow.from,
            -selectedAnalyticsWindow.days,
          ),
          selectedAnalyticsWindow.to,
        );
      notify(`Advertisement ${deletedName} was permanently deleted.`);
    } catch (reason) {
      notify(
        getAdminFriendlyErrorMessage(
          reason instanceof Error ? reason.message : undefined,
          "advertisement delete",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }
  if (loading)
    return (
      <div className="mt-6 grid min-h-[420px] place-items-center rounded-[24px] border border-[#DFE9F4] bg-white">
        <div className="text-center">
          <span className="mx-auto block size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
          <p className="mt-4 text-sm font-semibold text-[#415674]">
            Loading advertisement management…
          </p>
        </div>
      </div>
    );
  return (
    <section className="mt-6">
      <div className="flex justify-end gap-2">
        <button
          className={secondary}
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button className={primary} onClick={() => open()}>
          + Create advertisement
        </button>
      </div>
      <nav
        className="mt-4 overflow-x-auto rounded-[28px] border border-[#E2EAF4] bg-white p-2.5 shadow-[0_12px_30px_rgba(30,72,123,.12)] [scrollbar-width:none]"
        aria-label="Advertisement workspaces"
      >
        <div className="flex min-w-max" role="tablist">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`flex min-h-[78px] min-w-[190px] flex-1 items-center justify-center gap-3 border-r border-[#E5EBF3] px-5 text-[14px] font-bold last:border-0 ${active ? "rounded-[20px] bg-gradient-to-br from-[#299CFF] to-[#0869ED] text-white shadow-[0_10px_20px_rgba(13,118,239,.28)]" : "text-[#5D6E8C] hover:bg-[#F4F9FF]"}`}
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl p-1.5 ${active ? "bg-white/15" : "bg-[#F8FBFF] text-[#90ADD6]"}`}
                >
                  <TabIcon tab={item.id} />
                </span>
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>
      {tab === "overview" ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-6">
            <Metric
              name="All advertisements"
              value={counts.all}
              detail="Every retained advertisement"
            />
            <Metric
              name="Active"
              value={counts.active}
              detail="Currently eligible to display"
              tone="green"
            />
            <Metric
              name="Scheduled"
              value={counts.scheduled}
              detail="Waiting for their start time"
              tone="violet"
            />
            <Metric
              name="Draft"
              value={counts.draft}
              detail="Not visible publicly"
              tone="amber"
            />
            <Metric
              name="Needs attention"
              value={counts.attention}
              detail="Paused or expired campaigns"
              tone="red"
            />
            <Metric
              name="Empty slots"
              value={counts.empty}
              detail="Website placements without live media"
              tone="red"
            />
          </div>
          <div className="grid gap-4 laptop:grid-cols-[1.3fr_.7fr]">
            <Panel
              title="Advertisement slot health"
              detail="Live coverage across all six website placements"
            >
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {slots.map((slot) => {
                  const active = ads.filter(
                    (a) =>
                      a.lifecycle === "ACTIVE" && a.slots.includes(slot.id),
                  );
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setTab("placements")}
                      className="flex items-center justify-between rounded-xl border border-[#E3EAF3] bg-[#FAFCFF] p-4 text-left"
                    >
                      <span>
                        <strong className="block text-[11px] text-[#334A68]">
                          {slot.page} · {slot.name}
                        </strong>
                        <small className="mt-1 block text-[9px] text-[#8190A5]">
                          {active.length
                            ? `${active.length} active advertisement${active.length === 1 ? "" : "s"}`
                            : "No live advertisement"}
                        </small>
                      </span>
                      <span
                        className={`size-3 rounded-full ${active.length ? "bg-emerald-500" : "bg-red-400"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Quick actions" detail="Common advertising operations">
              <div className="mt-4 grid gap-2">
                <button className={primary} onClick={() => open()}>
                  Create advertisement
                </button>
                <button
                  className={secondary}
                  onClick={() => setTab("placements")}
                >
                  Manage page placements
                </button>
                <button
                  className={secondary}
                  onClick={() => setTab("schedule")}
                >
                  Review schedule
                </button>
                <button
                  className={secondary}
                  onClick={() => setTab("analytics")}
                >
                  Open performance report
                </button>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}
      {tab === "library" ? (
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#DDE7F2] bg-white">
          <div className="grid gap-3 border-b border-[#E8EEF5] bg-[#FBFDFF] p-4 tablet:grid-cols-3">
            <input
              className={input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search advertisements or placements"
            />
            <select
              className={input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              {[
                "ACTIVE",
                "SCHEDULED",
                "DRAFT",
                "PAUSED",
                "EXPIRED",
                "ARCHIVED",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              className={input}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ALL">All media types</option>
              {["IMAGE", "GIF", "VIDEO", "CARD", "EMBED"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 p-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {filtered.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                open={() => open(ad)}
                status={(next) => void changeStatus(ad, next)}
                remove={() => setDeleteTarget(ad)}
                superAdmin={superAdmin}
              />
            ))}
          </div>
          {!filtered.length ? (
            <Empty text="No advertisements match these filters." />
          ) : null}
        </div>
      ) : null}
      {tab === "placements" ? (
        <div className="mt-5 grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {slots.map((slot) => {
            const assigned = ads.filter(
              (ad) => ad.slots.includes(slot.id) && ad.status !== "ARCHIVED",
            );
            return (
              <Panel key={slot.id} title={slot.page} detail={slot.name}>
                <div className="mt-4 min-h-28 rounded-2xl border border-dashed border-[#C9D8E8] bg-[#F8FBFF] p-4">
                  {assigned.length ? (
                    assigned.map((ad) => (
                      <button
                        key={ad.id}
                        onClick={() => open(ad)}
                        className="mb-2 flex w-full items-center justify-between rounded-xl bg-white p-3 text-left shadow-sm"
                      >
                        <span>
                          <strong className="block text-[11px]">
                            {ad.name}
                          </strong>
                          <small className="text-[9px] text-[#8190A5]">
                            {label(ad.contentType)}
                          </small>
                        </span>
                        <StatusPill value={ad.lifecycle} />
                      </button>
                    ))
                  ) : (
                    <p className="py-6 text-center text-[11px] text-red-600">
                      No advertisement assigned
                    </p>
                  )}
                </div>
                <button
                  className={`${secondary} mt-3 w-full`}
                  onClick={() => {
                    open();
                    setDraft((current) => ({ ...current, slots: [slot.id] }));
                  }}
                >
                  + Assign advertisement
                </button>
              </Panel>
            );
          })}
        </div>
      ) : null}
      {tab === "schedule" ? (
        <Panel
          title="Advertisement schedule"
          detail="All times are displayed in Asia/Colombo"
        >
          <div className="mt-4 divide-y divide-[#EDF2F7]">
            {ads
              .filter((a) => a.startsAt || a.endsAt)
              .sort((a, b) =>
                (a.startsAt || "").localeCompare(b.startsAt || ""),
              )
              .map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => open(ad)}
                  className="grid w-full gap-2 py-4 text-left tablet:grid-cols-[1fr_180px_180px_auto]"
                >
                  <strong className="text-[12px]">{ad.name}</strong>
                  <span className="text-[10px] text-[#718096]">
                    Starts: {date(ad.startsAt)}
                  </span>
                  <span className="text-[10px] text-[#718096]">
                    Ends: {date(ad.endsAt)}
                  </span>
                  <StatusPill value={ad.lifecycle} />
                </button>
              ))}
            {!ads.some((a) => a.startsAt || a.endsAt) ? (
              <Empty text="No scheduled advertisements yet." />
            ) : null}
          </div>
        </Panel>
      ) : null}
      {tab === "analytics" ? (
        <AnalyticsDashboard
          ads={ads}
          report={analytics}
          loading={analyticsLoading}
          selectedAd={monitoredAdvertisement}
          setSelectedAd={setAnalyticsAd}
          metric={analyticsMetric}
          setMetric={setAnalyticsMetric}
          range={analyticsRange}
          setRange={setAnalyticsRange}
          customFrom={analyticsFrom}
          setCustomFrom={setAnalyticsFrom}
          customTo={analyticsTo}
          setCustomTo={setAnalyticsTo}
          window={selectedAnalyticsWindow}
          exportAnalytics={exportAnalytics}
        />
      ) : null}
      {tab === "history" ? (
        <Panel
          title="Advertisement audit history"
          detail="Retained publication, media, schedule and status changes"
        >
          <div className="mt-4 max-h-[720px] divide-y divide-[#EDF2F7] overflow-y-auto">
            {history.map((item, index) => (
              <article
                key={`${item.createdAt}-${index}`}
                className="grid gap-2 py-4 tablet:grid-cols-[190px_1fr]"
              >
                <div>
                  <strong className="text-[10px] uppercase text-blue-700">
                    {label(item.action)}
                  </strong>
                  <p className="mt-1 text-[9px] text-[#8996A8]">
                    {date(item.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#405573]">{item.details}</p>
                  <p className="mt-1 text-[9px] text-[#8996A8]">
                    By {item.actor}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}
      {editor ? (
        <Editor
          existing={editor === "new" ? null : editor}
          draft={draft}
          setDraft={setDraft}
          desktop={desktop}
          setDesktop={setDesktop}
          mobile={mobile}
          setMobile={setMobile}
          close={() => setEditor(null)}
          save={save}
          saving={saving}
          superAdmin={superAdmin}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteAdvertisementDialog
          advertisement={deleteTarget}
          deleting={deleting}
          close={() => setDeleteTarget(null)}
          confirm={() => void deleteAdvertisement()}
        />
      ) : null}
    </section>
  );
}

function Panel({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[22px] border border-[#DDE7F2] bg-white p-5 shadow-[0_10px_28px_rgba(31,83,139,.05)] tablet:p-6">
      <h2 className="text-[17px] font-semibold text-[#203653]">{title}</h2>
      <p className="mt-1 text-[10px] leading-5 text-[#7B899C]">{detail}</p>
      {children}
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="p-10 text-center text-[12px] text-[#7D8BA0]">{text}</p>;
}
function AdCard({
  ad,
  open,
  status,
  remove,
  superAdmin,
}: {
  ad: Ad;
  open: () => void;
  status: (value: Status) => void;
  remove: () => void;
  superAdmin: boolean;
}) {
  const src = ad.desktopMedia
    ? `${resolveApiBaseUrl()}/api/v1/advertisements/${ad.id}/assets/desktop`
    : ad.externalSourceUrl;
  return (
    <article className="overflow-hidden rounded-[18px] border border-[#E0E8F2] bg-white shadow-sm">
      <div
        style={{ backgroundColor: ad.backgroundColor }}
        className="grid aspect-[3/1] place-items-center overflow-hidden bg-[#F4F7FA]"
      >
        {src && ad.contentType === "VIDEO" ? (
          <video
            src={src}
            muted
            className={`h-full w-full ${ad.fitMode === "COVER" ? "object-cover" : "object-contain"}`}
          />
        ) : src && ["IMAGE", "GIF"].includes(ad.contentType) ? (
          <Image
            src={src}
            alt=""
            width={1200}
            height={400}
            unoptimized
            className={`h-full w-full ${ad.fitMode === "COVER" ? "object-cover" : "object-contain"}`}
          />
        ) : (
          <strong className="px-4 text-center text-sm text-[#29415F]">
            {ad.title || label(ad.contentType)}
          </strong>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-semibold">{ad.name}</h3>
            <p className="mt-1 text-[9px] text-[#8190A5]">
              {label(ad.contentType)} · {ad.slots.length} placement
              {ad.slots.length === 1 ? "" : "s"}
            </p>
          </div>
          <StatusPill value={ad.lifecycle} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <small className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <b className="block">{ad.impressions}</b>Views
          </small>
          <small className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <b className="block">{ad.clicks}</b>Clicks
          </small>
          <small className="rounded-lg bg-violet-50 p-2 text-violet-700">
            <b className="block">{ratio(ad)}</b>CTR
          </small>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={secondary} onClick={open}>
            Edit
          </button>
          {ad.status === "ACTIVE" ? (
            <button className={secondary} onClick={() => status("PAUSED")}>
              Pause
            </button>
          ) : ad.status !== "ARCHIVED" && superAdmin ? (
            <button className={primary} onClick={() => status("ACTIVE")}>
              Publish
            </button>
          ) : null}
          {ad.status !== "ARCHIVED" && superAdmin ? (
            <button
              className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-[10px] font-bold text-red-700"
              onClick={() => status("ARCHIVED")}
            >
              Archive
            </button>
          ) : null}
          {superAdmin ? (
            <button
              className="min-h-10 rounded-xl border border-red-200 bg-white px-3 text-[10px] font-bold text-red-700 hover:bg-red-50"
              onClick={remove}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function AnalyticsDashboard({
  ads,
  report,
  loading,
  selectedAd,
  setSelectedAd,
  metric,
  setMetric,
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  window: periodWindow,
  exportAnalytics,
}: {
  ads: Ad[];
  report: AnalyticsResponse | null;
  loading: boolean;
  selectedAd: string;
  setSelectedAd: (value: string) => void;
  metric: AnalyticsMetric;
  setMetric: (value: AnalyticsMetric) => void;
  range: AnalyticsRange;
  setRange: (value: AnalyticsRange) => void;
  customFrom: string;
  setCustomFrom: (value: string) => void;
  customTo: string;
  setCustomTo: (value: string) => void;
  window: ReturnType<typeof analyticsWindow>;
  exportAnalytics: (format: "excel" | "pdf") => Promise<void>;
}) {
  const selectedSeries = (report?.series || []).filter(
    (series) => selectedAd === "ALL" || series.advertisementId === selectedAd,
  );
  const merged = mergeAnalyticsSeries(selectedSeries);
  const previousFrom = periodWindow.valid
    ? shiftIsoDate(periodWindow.from, -periodWindow.days)
    : periodWindow.from;
  const previousTo = periodWindow.valid
    ? shiftIsoDate(periodWindow.from, -1)
    : periodWindow.to;
  const current = periodWindow.valid
    ? merged.filter(
        (point) =>
          point.date >= periodWindow.from && point.date <= periodWindow.to,
      )
    : [];
  const previous = periodWindow.valid
    ? merged.filter(
        (point) => point.date >= previousFrom && point.date <= previousTo,
      )
    : [];
  const currentImpressions = current.reduce(
    (total, point) => total + point.impressions,
    0,
  );
  const currentClicks = current.reduce(
    (total, point) => total + point.clicks,
    0,
  );
  const currentCtr = currentImpressions
    ? (currentClicks / currentImpressions) * 100
    : 0;
  const previousImpressions = previous.reduce(
    (total, point) => total + point.impressions,
    0,
  );
  const previousClicks = previous.reduce(
    (total, point) => total + point.clicks,
    0,
  );
  const previousCtr = previousImpressions
    ? (previousClicks / previousImpressions) * 100
    : 0;
  const currentValue =
    metric === "impressions"
      ? currentImpressions
      : metric === "clicks"
        ? currentClicks
        : currentCtr;
  const previousValue =
    metric === "impressions"
      ? previousImpressions
      : metric === "clicks"
        ? previousClicks
        : previousCtr;
  const change =
    metric === "ctr"
      ? `${currentValue - previousValue >= 0 ? "+" : ""}${(currentValue - previousValue).toFixed(1)} pts`
      : previousValue
        ? `${((currentValue - previousValue) / previousValue) * 100 >= 0 ? "+" : ""}${(((currentValue - previousValue) / previousValue) * 100).toFixed(1)}%`
        : currentValue
          ? "New activity"
          : "No change";
  const monitorName =
    selectedAd === "ALL"
      ? "All advertisements"
      : ads.find((ad) => ad.id === selectedAd)?.name || "Advertisement";
  const displayDate = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString("en-LK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const periodLabel = periodWindow.valid
    ? periodWindow.from === periodWindow.to
      ? displayDate(periodWindow.from)
      : `${displayDate(periodWindow.from)} – ${displayDate(periodWindow.to)}`
    : "Choose a valid period";
  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#DCE7F3] bg-white p-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="grid flex-1 gap-4 laptop:grid-cols-[minmax(240px,.8fr)_minmax(430px,1.2fr)]">
          <Field name="Advertisement to monitor">
            <select
              className={input}
              value={selectedAd}
              onChange={(event) => setSelectedAd(event.target.value)}
            >
              <option value="ALL">All advertisements</option>
              {ads.map((ad) => (
                <option key={ad.id} value={ad.id}>
                  {ad.name} ({label(ad.lifecycle)})
                </option>
              ))}
            </select>
          </Field>
          <div>
            <span className="mb-2 block text-[9px] font-bold uppercase text-[#637591]">
              Reporting period
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Reporting period"
            >
              {(
                [
                  ["DAY", "Day"],
                  ["WEEK", "Week"],
                  ["MONTH", "Month"],
                  ["CUSTOM", "Custom range"],
                ] as Array<[AnalyticsRange, string]>
              ).map(([value, name]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={range === value}
                  className={
                    range === value
                      ? "min-h-10 rounded-xl bg-[#1987F4] px-4 text-[10px] font-bold text-white shadow-sm"
                      : secondary
                  }
                  onClick={() => setRange(value)}
                >
                  {name}
                </button>
              ))}
            </div>
            {range === "CUSTOM" ? (
              <div className="mt-3 grid gap-2 tablet:grid-cols-2">
                <Field name="From date">
                  <input
                    className={input}
                    type="date"
                    value={customFrom}
                    max={customTo || periodWindow.today}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </Field>
                <Field name="To date">
                  <input
                    className={input}
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={periodWindow.today}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
            {!periodWindow.valid ? (
              <p className="mt-2 text-[10px] font-semibold text-red-600">
                Select dates ending today or earlier, with a maximum range of
                365 days.
              </p>
            ) : (
              <p className="mt-2 text-[9px] text-[#8190A5]">{periodLabel}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={secondary}
            onClick={() => void exportAnalytics("excel")}
          >
            Export Excel
          </button>
          <button
            className={secondary}
            onClick={() => void exportAnalytics("pdf")}
          >
            Export PDF
          </button>
        </div>
      </div>
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Metric
          name="Views in period"
          value={currentImpressions.toLocaleString()}
          detail={`${monitorName} · ${periodLabel}`}
        />
        <Metric
          name="Clicks in period"
          value={currentClicks.toLocaleString()}
          detail="Tracked destination visits"
          tone="green"
        />
        <Metric
          name="CTR in period"
          value={`${currentCtr.toFixed(1)}%`}
          detail="Clicks divided by views"
          tone="violet"
        />
        <Metric
          name="Period growth"
          value={change}
          detail={`Compared with the previous ${periodWindow.days === 1 ? "day" : `${periodWindow.days} days`}`}
          tone={currentValue >= previousValue ? "green" : "red"}
        />
      </div>
      <Panel
        title={`${monitorName} growth`}
        detail={`Daily performance for ${periodLabel}, compared with the preceding equal period`}
      >
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Chart metric">
          {(
            [
              ["impressions", "Views"],
              ["clicks", "Clicks"],
              ["ctr", "CTR"],
            ] as Array<[AnalyticsMetric, string]>
          ).map(([value, name]) => (
            <button
              key={value}
              className={
                metric === value
                  ? "min-h-9 rounded-xl bg-[#1987F4] px-4 text-[10px] font-bold text-white shadow-sm"
                  : secondary
              }
              onClick={() => setMetric(value)}
            >
              {name}
            </button>
          ))}
        </div>
        {!periodWindow.valid ? (
          <div className="mt-4 grid h-[280px] place-items-center rounded-[16px] border border-dashed border-red-200 bg-red-50 px-5 text-center text-[11px] font-semibold text-red-700">
            Choose a valid custom date range to load analytics.
          </div>
        ) : loading ? (
          <div className="mt-4 h-[280px] animate-pulse rounded-[16px] bg-slate-100" />
        ) : (
          <GrowthChart points={current} metric={metric} />
        )}
        <p className="mt-2 text-[9px] text-[#8190A5]">
          Daily monitoring begins when analytics tracking is enabled. Lifetime
          totals collected earlier remain available in the table below.
        </p>
      </Panel>
      <Panel
        title="Advertisement performance"
        detail="Select an advertisement below to inspect its individual growth"
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[11px]">
            <thead className="bg-[#F6F9FD] text-[9px] uppercase text-[#718096]">
              <tr>
                <th className="p-3">Advertisement</th>
                <th>Type</th>
                <th>Lifetime views</th>
                <th>Lifetime clicks</th>
                <th>CTR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr
                  key={ad.id}
                  className={`border-b border-[#EDF2F7] ${selectedAd === ad.id ? "bg-blue-50" : "hover:bg-[#F8FBFF]"}`}
                >
                  <td className="p-3 font-semibold">
                    <button
                      className="text-left text-blue-700 hover:underline"
                      onClick={() => setSelectedAd(ad.id)}
                    >
                      {ad.name}
                    </button>
                  </td>
                  <td>{label(ad.contentType)}</td>
                  <td>{ad.impressions.toLocaleString()}</td>
                  <td>{ad.clicks.toLocaleString()}</td>
                  <td>{ratio(ad)}</td>
                  <td>
                    <StatusPill value={ad.lifecycle} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
function mergeAnalyticsSeries(series: AnalyticsSeries[]): DailyMetric[] {
  const points = new Map<string, DailyMetric>();
  for (const item of series)
    for (const point of item.points) {
      const current = points.get(point.date) || {
        date: point.date,
        impressions: 0,
        clicks: 0,
      };
      current.impressions += point.impressions;
      current.clicks += point.clicks;
      points.set(point.date, current);
    }
  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}
function GrowthChart({
  points,
  metric,
}: {
  points: DailyMetric[];
  metric: AnalyticsMetric;
}) {
  const width = 900,
    height = 270,
    left = 52,
    right = 18,
    top = 18,
    bottom = 38,
    graphWidth = width - left - right,
    graphHeight = height - top - bottom;
  const values = points.map((point) =>
    metric === "ctr"
      ? point.impressions
        ? (point.clicks / point.impressions) * 100
        : 0
      : point[metric],
  );
  const maximum = Math.max(1, ...values);
  const coordinates = values.map((value, index) => ({
    x: left + (index / Math.max(1, values.length - 1)) * graphWidth,
    y: top + graphHeight - (value / maximum) * graphHeight,
    value,
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coordinates.length
    ? `${left},${top + graphHeight} ${line} ${left + graphWidth},${top + graphHeight}`
    : "";
  const dateLabel = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-LK", {
      month: "short",
      day: "numeric",
    });
  const xIndexes = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ].filter((index) => index >= 0);
  const colour =
    metric === "clicks" ? "#10B981" : metric === "ctr" ? "#7C3AED" : "#2188F4";
  return (
    <div className="mt-4 overflow-x-auto rounded-[16px] border border-[#E4ECF5] bg-[#FBFDFF] p-2 tablet:p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[620px]"
        role="img"
        aria-label={`${label(metric)} growth chart`}
      >
        <defs>
          <linearGradient
            id="advertisementGrowthFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={colour} stopOpacity="0.22" />
            <stop offset="100%" stopColor={colour} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = top + graphHeight - step * graphHeight;
          return (
            <g key={step}>
              <line
                x1={left}
                x2={left + graphWidth}
                y1={y}
                y2={y}
                stroke="#E6EDF5"
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#7D8CA0"
              >
                {metric === "ctr"
                  ? `${(maximum * step).toFixed(1)}%`
                  : Math.round(maximum * step).toLocaleString()}
              </text>
            </g>
          );
        })}
        {area ? (
          <polygon points={area} fill="url(#advertisementGrowthFill)" />
        ) : null}
        {line ? (
          <polyline
            points={line}
            fill="none"
            stroke={colour}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {coordinates.map((point, index) =>
          points.length <= 90 ||
          index % 7 === 0 ||
          index === points.length - 1 ? (
            <circle
              key={points[index].date}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="white"
              stroke={colour}
              strokeWidth="2"
            >
              <title>{`${dateLabel(points[index].date)}: ${metric === "ctr" ? `${point.value.toFixed(1)}%` : Math.round(point.value).toLocaleString()}`}</title>
            </circle>
          ) : null,
        )}
        {xIndexes.map((index) => {
          const x =
            left + (index / Math.max(1, points.length - 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - 10}
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize="9"
              fill="#7D8CA0"
            >
              {points[index] ? dateLabel(points[index].date) : ""}
            </text>
          );
        })}
        {!values.some(Boolean) ? (
          <text
            x={left + graphWidth / 2}
            y={top + graphHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#75869D"
          >
            No activity was recorded during this period
          </text>
        ) : null}
      </svg>
    </div>
  );
}
function DeleteAdvertisementDialog({
  advertisement,
  deleting,
  close,
  confirm,
}: {
  advertisement: Ad;
  deleting: boolean;
  close: () => void;
  confirm: () => void;
}) {
  const active = advertisement.status === "ACTIVE";
  return (
    <div
      className="fixed inset-0 z-[240] grid place-items-center bg-[#0B1930]/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-advertisement-title"
    >
      <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl">
        <span className="grid size-11 place-items-center rounded-full bg-red-100 text-xl font-bold text-red-600">
          !
        </span>
        <h2
          id="delete-advertisement-title"
          className="mt-4 text-lg font-semibold text-[#243A57]"
        >
          Delete advertisement?
        </h2>
        <p className="mt-2 text-[11px] leading-5 text-[#65758B]">
          <strong>{advertisement.name}</strong> and its uploaded media will be
          permanently removed. Its audit-history entry will be retained.
        </p>
        {active ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">
            This advertisement is active. Pause or archive it before permanent
            deletion so it is removed safely from every placement.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 tablet:flex-row tablet:justify-end">
          <button className={secondary} onClick={close} disabled={deleting}>
            Cancel
          </button>
          <button
            className="min-h-10 rounded-xl bg-red-600 px-4 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={confirm}
            disabled={deleting || active}
          >
            {deleting
              ? "Deleting…"
              : active
                ? "Pause or archive first"
                : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
function Editor({
  existing,
  draft,
  setDraft,
  desktop,
  setDesktop,
  mobile,
  setMobile,
  close,
  save,
  saving,
  superAdmin,
}: {
  existing: Ad | null;
  draft: typeof emptyDraft;
  setDraft: Dispatch<SetStateAction<typeof emptyDraft>>;
  desktop: File | null;
  setDesktop: (v: File | null) => void;
  mobile: File | null;
  setMobile: (v: File | null) => void;
  close: () => void;
  save: (publish?: boolean) => Promise<void>;
  saving: boolean;
  superAdmin: boolean;
}) {
  const media = ["IMAGE", "GIF", "VIDEO"].includes(draft.contentType);
  const destination = normalizeDestination(draft.destinationUrl);
  const destinationInvalid =
    Boolean(draft.destinationUrl.trim()) && !destination.valid;
  return (
    <div
      className="fixed inset-0 z-[220] overflow-y-auto bg-[#0B1930]/45 p-3 backdrop-blur-[2px] tablet:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="ml-auto min-h-full w-full max-w-3xl rounded-[24px] bg-white p-5 shadow-2xl tablet:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">
              Advertisement editor
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {existing ? "Edit advertisement" : "Create advertisement"}
            </h2>
            <p className="mt-1 text-xs text-[#75849A]">
              Details, media, destination, placements and schedule.
            </p>
          </div>
          <button
            className="grid size-10 place-items-center rounded-full bg-slate-100"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-6 grid gap-4 tablet:grid-cols-2">
          <Field name="Internal name">
            <input
              className={input}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field name="Content type">
            <select
              className={input}
              value={draft.contentType}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contentType: e.target.value as ContentType,
                })
              }
            >
              {["IMAGE", "GIF", "VIDEO", "CARD", "EMBED"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field name="Visible title">
            <input
              className={input}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field name="Button label">
            <input
              className={input}
              value={draft.buttonLabel}
              onChange={(e) =>
                setDraft({ ...draft, buttonLabel: e.target.value })
              }
            />
          </Field>
          <div className="tablet:col-span-2">
            <Field name="Description">
              <textarea
                className={`${input} min-h-24 py-3`}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
          </div>
          <Field name="Alternative text">
            <input
              className={input}
              value={draft.altText}
              onChange={(e) => setDraft({ ...draft, altText: e.target.value })}
            />
          </Field>
          <Field name="Destination link">
            <input
              className={`${input} ${destinationInvalid ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
              placeholder="https://example.com or /market"
              value={draft.destinationUrl}
              aria-invalid={destinationInvalid}
              onChange={(e) =>
                setDraft({ ...draft, destinationUrl: e.target.value })
              }
              onBlur={() => {
                if (
                  destination.valid &&
                  destination.value !== draft.destinationUrl
                )
                  setDraft({ ...draft, destinationUrl: destination.value });
              }}
            />
            <small
              className={destinationInvalid ? "text-red-600" : "text-[#7B8BA2]"}
            >
              {destinationInvalid
                ? "Use https://example.com, example.com, /market, or leave this blank."
                : "Optional. Website addresses without https:// are completed automatically."}
            </small>
          </Field>
          {draft.contentType === "EMBED" ? (
            <div className="tablet:col-span-2">
              <Field name="Approved YouTube or Vimeo link">
                <input
                  className={input}
                  value={draft.externalSourceUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, externalSourceUrl: e.target.value })
                  }
                />
              </Field>
            </div>
          ) : null}
          {media ? (
            <>
              <Field name="Desktop media">
                <input
                  type="file"
                  accept={
                    draft.contentType === "VIDEO"
                      ? "video/mp4,video/webm"
                      : "image/jpeg,image/png,image/webp,image/gif"
                  }
                  className={`${input} py-2`}
                  onChange={(e) => setDesktop(e.target.files?.[0] || null)}
                />
                <small>
                  {desktop?.name ||
                    (!existing?.desktopMedia
                      ? "Required before publishing"
                      : "Existing media will be kept")}
                </small>
              </Field>
              <Field name="Optional mobile media">
                <input
                  type="file"
                  accept={
                    draft.contentType === "VIDEO"
                      ? "video/mp4,video/webm"
                      : "image/jpeg,image/png,image/webp,image/gif"
                  }
                  className={`${input} py-2`}
                  onChange={(e) => setMobile(e.target.files?.[0] || null)}
                />
                <small>{mobile?.name || "Uses desktop media when empty"}</small>
              </Field>
            </>
          ) : null}
          <Field name="Fit mode">
            <select
              className={input}
              value={draft.fitMode}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  fitMode: e.target.value as "CONTAIN" | "COVER",
                })
              }
            >
              <option>CONTAIN</option>
              <option>COVER</option>
            </select>
          </Field>
          <Field name="Background colour">
            <input
              type="color"
              className={input}
              value={draft.backgroundColor}
              onChange={(e) =>
                setDraft({ ...draft, backgroundColor: e.target.value })
              }
            />
          </Field>
          <Field name="Starts at">
            <input
              type="datetime-local"
              className={input}
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            />
          </Field>
          <Field name="Ends at">
            <input
              type="datetime-local"
              className={input}
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
            />
          </Field>
          <Field name="Priority">
            <input
              type="number"
              className={input}
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: Number(e.target.value) })
              }
            />
          </Field>
          <Field name="Rotation weight (1-100)">
            <input
              type="number"
              min="1"
              max="100"
              className={input}
              value={draft.rotationWeight}
              onChange={(e) =>
                setDraft({ ...draft, rotationWeight: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-[11px] font-semibold">
          <input
            type="checkbox"
            checked={draft.openNewTab}
            onChange={(e) =>
              setDraft({ ...draft, openNewTab: e.target.checked })
            }
          />{" "}
          Open destination in a new tab
        </label>
        <div className="mt-6">
          <p className="text-[11px] font-bold text-[#536781]">
            Page placements
          </p>
          <div className="mt-2 grid gap-2 tablet:grid-cols-2">
            {slots.map((slot) => (
              <label
                key={slot.id}
                className="flex items-center gap-3 rounded-xl border border-[#DFE8F2] p-3 text-[10px]"
              >
                <input
                  type="checkbox"
                  checked={draft.slots.includes(slot.id)}
                  onChange={() =>
                    setDraft({
                      ...draft,
                      slots: draft.slots.includes(slot.id)
                        ? draft.slots.filter((v) => v !== slot.id)
                        : [...draft.slots, slot.id],
                    })
                  }
                />
                <span>
                  <b className="block">{slot.page}</b>
                  {slot.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 tablet:flex-row tablet:justify-end">
          <button className={secondary} onClick={close}>
            Cancel
          </button>
          <button
            className={secondary}
            disabled={saving || !draft.name.trim() || destinationInvalid}
            onClick={() => void save(false)}
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Save draft"}
          </button>
          {superAdmin ? (
            <button
              className={primary}
              disabled={
                saving ||
                !draft.name.trim() ||
                !draft.slots.length ||
                destinationInvalid
              }
              onClick={() => void save(true)}
            >
              {saving ? "Publishing…" : "Save and publish"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
function Field({ name, children }: { name: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[10px] font-bold text-[#536781]">
      {name}
      {children}
    </label>
  );
}
