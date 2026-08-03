"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { apiFetch } from "@/utils/auth";
import { KidsChampStatusBadge as StatusBadge } from "./KidsChampStatusBadge";
import { KidsChampWhatsAppIcon as WhatsAppIcon } from "./KidsChampWhatsAppIcon";
import { KidsChampConfirmationDialog as ConfirmationDialog } from "./KidsChampConfirmationDialog";

function KidsChampLoadingScreen() {
  const [loading,setLoading]=useState(false);
  useEffect(()=>{const update=(event:Event)=>setLoading(((event as CustomEvent<{count:number}>).detail?.count||0)>0);window.addEventListener("aplus-api-activity",update);return()=>window.removeEventListener("aplus-api-activity",update);},[]);
  if(!loading)return null;
  return <div className="fixed inset-0 z-[300] grid place-items-center bg-[#102044]/20 backdrop-blur-[1px]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-[18px] border border-white/70 bg-white px-6 py-5 shadow-2xl"><span className="size-6 animate-spin rounded-full border-[3px] border-[#B8DAFF] border-t-[#1689F7]"/><div><p className="text-[14px] font-semibold text-[#172A4B]">Saving your changes</p><p className="mt-0.5 text-[11px] text-[#708099]">Please wait while the database is updated.</p></div></div></div>;
}
type MockSubmission = {
  id: string; participantId: string; phone: string; trackingCode: string; childName: string; initials: string; age: number; location: string; category: string;
  participantType: "Guest" | "Registered"; reviewStatus: "New" | "Pending review" | "Under review" | "Approved" | "Rejected";
  tvStatus: "Not selected" | "Selected" | "Scheduled" | "Telecasted"; fileStatus: "Ready" | "Missing" | "Processing failed";
  reviewer: string; submittedAt: string; submittedDate: string; reviewedDate?: string; previewed: boolean; batchId?: string | null; photoUrl?: string; photoFile?: File;
};
const submissions: MockSubmission[] = [];
const upcomingTelecasts: Array<{episode:string;date:string;time:string;entries:number;status:string}> = [];

type Workspace = "Overview" | "Submissions" | "ZIP" | "Participants" | "Account & Management";
type OverviewSubmissionFilter = "approved" | "pending" | "today" | null;
type OverviewZipView = "all" | "telecasted" | "whatsapp-attention";

type AdminSubmissionResponse = {
  id: string;
  participantId: string;
  phone: string;
  trackingCode: string;
  childName: string;
  ageAtSubmission: number;
  hometown: string;
  category: string;
  workTitle?: string;
  reviewStatus: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  telecastStatus:
    | "NOT_SELECTED"
    | "SELECTED"
    | "SCHEDULED"
    | "TELECASTED"
    | "CANCELLED";
  participantType: "Guest" | "Registered";
  reviewer: string;
  submittedAt: string;
  reviewedAt?: string;
  previewed: boolean;
  photoAvailable: boolean;
  batchId?: string | null;
};

type AdminSubmissionPageResponse = {
  items: AdminSubmissionResponse[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

const reviewStatusLabels: Record<AdminSubmissionResponse["reviewStatus"], MockSubmission["reviewStatus"]> = {
  SUBMITTED: "New",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const telecastStatusLabels: Record<AdminSubmissionResponse["telecastStatus"], MockSubmission["tvStatus"]> = {
  NOT_SELECTED: "Not selected",
  SELECTED: "Selected",
  SCHEDULED: "Scheduled",
  TELECASTED: "Telecasted",
  CANCELLED: "Not selected",
};

function toMockSubmission(item: AdminSubmissionResponse): MockSubmission {
  const submitted = new Date(item.submittedAt);
  return {
    id: item.id,
    participantId: item.participantId,
    phone: item.phone,
    trackingCode: item.trackingCode,
    childName: item.childName,
    initials: item.childName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    age: item.ageAtSubmission,
    location: item.hometown,
    category: item.category,
    participantType: item.participantType,
    reviewStatus: reviewStatusLabels[item.reviewStatus],
    tvStatus: telecastStatusLabels[item.telecastStatus],
    fileStatus: item.photoAvailable ? "Ready" : "Missing",
    reviewer: item.reviewer,
    submittedAt: submitted.toLocaleString(),
    submittedDate: item.submittedAt.slice(0, 10),
    reviewedDate: item.reviewedAt?.slice(0, 10),
    previewed: item.previewed,
    batchId: item.batchId,
  };
}

type AdminBatchResponse = {
  id: string;
  batchCode: string;
  status: "READY" | "DOWNLOADED" | "DELETED";
  photoCount: number;
  firstDownloadedAt?: string;
  editedAt?: string;
  daysRemaining: number;
  telecastDate?: string;
  alternateTelecastDate?: string;
  telecastCompletedAt?: string;
  createdAt: string;
  deletedAt?: string;
  submissionIds: string[];
};

function toZipBatch(item: AdminBatchResponse): ZipBatch {
  return {
    id: item.id,
    code: item.batchCode,
    photos: item.photoCount,
    size: "Server archive",
    status: item.status === "DELETED" ? "Ready" : "Ready",
    expires: `${item.daysRemaining} days`,
    progress: 100,
    telecastStatus: item.telecastCompletedAt ? "Telecast completed" : item.telecastDate ? "Scheduled" : "Not scheduled",
    telecastDate: item.telecastDate || "",
    telecastCompleted: Boolean(item.telecastCompletedAt),
    recipientIds: item.submissionIds || [],
    edited: Boolean(item.editedAt),
    editedAt: item.editedAt ? item.editedAt.slice(0, 10) : "",
    deleted: item.status === "DELETED",
    deletedAt: item.deletedAt ? item.deletedAt.slice(0, 10) : "",
    downloaded: Boolean(item.firstDownloadedAt),
    downloadedAt: item.firstDownloadedAt ? item.firstDownloadedAt.slice(0, 10) : "",
    createdAt: item.createdAt.slice(0, 10),
  };
}
type ZipBatch = { id?: string; code:string;photos:number;size:string;status:string;expires:string;progress:number;telecastStatus:string;telecastDate:string;telecastCompleted:boolean;recipientIds:string[];edited:boolean;editedAt:string;deleted:boolean;deletedAt:string;downloaded:boolean;downloadedAt:string;createdAt:string };
type ParticipantRecord = {
  reference: string;
  name: string;
  age: number;
  type: string;
  location: string;
  phone: string;
  submissions: number;
  approved: number;
  telecasted: number;
  whatsapp: string;
  joinedDate: string;
  lastSubmissionDate: string;
};
type DuplicateGuest = {
  firstId: string; secondId: string; firstName: string; secondName: string;
  firstPhone: string; secondPhone: string; firstHometown: string; secondHometown: string;
  firstSubmissions: number; secondSubmissions: number; reasons: string[];
  matchType: "GUEST_GUEST" | "REGISTERED_GUEST";
};
const zipBatches: ZipBatch[] = [];
const participants: ParticipantRecord[] = [];
type DrawerKind =
  | "submissions"
  | "reviews"
  | "telecast"
  | "zips"
  | "participants"
  | "attention"
  | "activity"
  | "calendar"
  | "notifications";

type DrawerState = {
  kind: DrawerKind;
  title: string;
  submission?: MockSubmission;
  onSaveSubmission?: (submission: MockSubmission) => void;
  zipBatch?: ZipBatch;
  onDeleteZip?: (code: string) => void;
  onUpdateZip?: (zip: ZipBatch) => void;
  participant?: ParticipantRecord;
  onSaveParticipant?: (participant: ParticipantRecord) => void;
} | null;

type CalendarWorkspaceFilter = {
  date: string;
  mode: "submitted" | "reviewed";
};

const workspaces: Workspace[] = [
  "Overview",
  "Submissions",
  "ZIP",
  "Participants",
];

function WorkspaceTabIcon({ workspace }: { workspace: Workspace }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (workspace === "Overview") return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="4" width="9" height="9" rx="2" {...shared}/><rect x="19" y="4" width="9" height="9" rx="2" {...shared}/><rect x="4" y="19" width="9" height="9" rx="2" {...shared}/><rect x="19" y="19" width="9" height="9" rx="2" {...shared}/></svg>;
  if (workspace === "Submissions") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 3.5h10l5 5v19H9z" {...shared}/><path d="M19 3.5v6h5M13 15h7M13 20h7M13 25h4" {...shared}/></svg>;
  if (workspace === "ZIP") return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="3" {...shared}/><path d="M10.7 10.7a7.5 7.5 0 0 0 0 10.6M21.3 10.7a7.5 7.5 0 0 1 0 10.6M6.7 6.7a13.2 13.2 0 0 0 0 18.6M25.3 6.7a13.2 13.2 0 0 1 0 18.6" {...shared}/></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="11" r="4.5" {...shared}/><path d="M4.5 27c.8-5.2 4-8 8.5-8s7.7 2.8 8.5 8M22.5 7.5a4 4 0 0 1 0 7.8M23 19.3c3 .6 4.6 3 5 6.2" {...shared}/></svg>;
}

const fieldClass =
  "h-10 w-full rounded-[10px] border border-[#D8E2EC] bg-white px-3 text-[13px] outline-none focus:border-[#2488F4] focus:ring-3 focus:ring-blue-100";
const secondaryButton =
  "h-10 rounded-[10px] border border-[#D7E2EE] bg-white px-4 text-[12px] font-semibold text-[#526178] transition hover:bg-[#F4F7FA]";
const primaryButton =
  "h-10 rounded-[10px] bg-[#2488F4] px-4 text-[12px] font-semibold text-white transition hover:bg-[#0877EF]";

type KidsChampSettings = {
  categories: string[];
  maxFileSizeMb: number;
  allowedFileTypes: string;
  automaticTracking: boolean;
  dailyTelecastLimit: number;
  defaultTelecastTime: string;
  zipBatchSize: number;
  zipExpiryDays: number;
  zipWarningDays: number;
  minimumAge: number;
  maximumAge: number;
  frequentParticipantThreshold: number;
  requireWhatsAppConsent: boolean;
  campaignLimit: number;
  defaultMessage: string;
};

const defaultKidsChampSettings: KidsChampSettings = {
  categories: ["Drawing", "Painting", "Handcraft"],
  maxFileSizeMb: 10,
  allowedFileTypes: "JPG, JPEG, PNG, WEBP",
  automaticTracking: true,
  dailyTelecastLimit: 12,
  defaultTelecastTime: "15:00",
  zipBatchSize: 120,
  zipExpiryDays: 14,
  zipWarningDays: 2,
  minimumAge: 4,
  maximumAge: 16,
  frequentParticipantThreshold: 4,
  requireWhatsAppConsent: true,
  campaignLimit: 250,
  defaultMessage:
    "Hello {name}, thank you for being part of A+ Kids Champ. Reference: {reference}.",
};

function PrivateValue({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <span className={enabled ? "select-none blur-[5px]" : ""}>{children}</span>
  );
}

type GrowthMetric = "submissions" | "participants";
type GrowthPoint = {
  label: string;
  submissions: number;
  participants: number;
};

const growthSeries: { key: GrowthMetric; label: string; color: string }[] = [
  { key: "submissions", label: "Submissions", color: "#7C3AED" },
  { key: "participants", label: "Participants", color: "#059669" },
];

function InsightsGrowthChart({ points }: { points: GrowthPoint[] }) {
  const [selected, setSelected] = useState<GrowthMetric[]>(
    growthSeries.map((series) => series.key),
  );
  const [hovered, setHovered] = useState<{
    metric: GrowthMetric;
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const width = 760;
  const height = 245;
  const padding = 28;
  const activeSeries = growthSeries.filter((series) =>
    selected.includes(series.key),
  );
  const indexedValues = activeSeries.flatMap((series) => {
    const baseline = Math.max(points[0][series.key], 1);
    return points.map((point) => (point[series.key] / baseline) * 100);
  });
  const minimum = Math.min(...indexedValues, 90);
  const maximum = Math.max(...indexedValues, 110);
  const range = Math.max(maximum - minimum, 1);

  function toggleSeries(key: GrowthMetric) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" aria-label="Visible growth metrics">
        {growthSeries.map((series) => {
          const checked = selected.includes(series.key);
          return (
            <label
              key={series.key}
              className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-semibold transition ${checked ? "border-[#CFD9E5] bg-white text-[#344660]" : "border-[#E6EBF1] bg-[#F6F8FA] text-[#8B96A6]"}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSeries(series.key)}
                className="size-4 accent-[#0877EF]"
              />
              <i
                className="size-2.5 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              {series.label}
            </label>
          );
        })}
        <span className="ml-auto flex items-center gap-2 text-[11px] font-medium text-red-600">
          <i className="h-0.5 w-5 bg-red-500" />
          Red segment = decline
        </span>
      </div>

      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label="Growth comparison for submissions and participants"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            {growthSeries.map((series) => (
              <linearGradient
                key={series.key}
                id={`growth-fill-${series.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0" stopColor={series.color} stopOpacity=".2" />
                <stop offset="55%" stopColor={series.color} stopOpacity=".08" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0" />
              </linearGradient>
            ))}
            <filter
              id="growth-line-glow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodColor="#1E3A5F"
                floodOpacity=".12"
              />
            </filter>
          </defs>
          {[0.2, 0.4, 0.6, 0.8, 1].map((linePosition) => (
            <line
              key={linePosition}
              x1={padding}
              x2={width - padding}
              y1={height * linePosition - 12}
              y2={height * linePosition - 12}
              stroke="#E5EBF2"
              strokeDasharray="5 7"
            />
          ))}
          {activeSeries.map((series) => {
            const baseline = Math.max(points[0][series.key], 1);
            const coordinates = points.map((point, index) => ({
              value: point[series.key],
              x:
                padding + index * ((width - padding * 2) / (points.length - 1)),
              y:
                height -
                padding -
                (((point[series.key] / baseline) * 100 - minimum) / range) *
                  (height - padding * 2),
            }));
            const areaPath = `M${coordinates.map((point) => `${point.x},${point.y}`).join(" L")} L${coordinates.at(-1)?.x},${height - padding} L${coordinates[0].x},${height - padding} Z`;
            return (
              <g key={series.key}>
                <path d={areaPath} fill={`url(#growth-fill-${series.key})`} />
                {coordinates.slice(1).map((point, index) => {
                  const previous = coordinates[index];
                  const declining = point.value < previous.value;
                  return (
                    <line
                      key={`${series.key}-${index}`}
                      x1={previous.x}
                      y1={previous.y}
                      x2={point.x}
                      y2={point.y}
                      stroke={declining ? "#EF4444" : series.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#growth-line-glow)"
                    />
                  );
                })}
                {coordinates.map((point, index) => {
                  const declining =
                    index > 0 && point.value < coordinates[index - 1].value;
                  return (
                    <circle
                      key={`${series.key}-point-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="white"
                      stroke={declining ? "#EF4444" : series.color}
                      strokeWidth="2"
                      className="cursor-pointer transition-[r] hover:r-[6px]"
                      filter="url(#growth-line-glow)"
                      onMouseEnter={() =>
                        setHovered({
                          metric: series.key,
                          index,
                          x: point.x,
                          y: point.y,
                        })
                      }
                      onFocus={() =>
                        setHovered({
                          metric: series.key,
                          index,
                          x: point.x,
                          y: point.y,
                        })
                      }
                      onBlur={() => setHovered(null)}
                      tabIndex={0}
                      aria-label={`${points[index].label}: ${point.value} ${series.label.toLowerCase()}`}
                    />
                  );
                })}
              </g>
            );
          })}
          {activeSeries.length === 0 ? (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              fill="#8490A2"
              fontSize="13"
            >
              Select at least one metric to view its trend
            </text>
          ) : null}
        </svg>
        {hovered
          ? (() => {
              const point = points[hovered.index];
              const previous =
                hovered.index > 0 ? points[hovered.index - 1] : null;
              const metric = growthSeries.find(
                (series) => series.key === hovered.metric,
              )!;
              const change = previous
                ? point[hovered.metric] - previous[hovered.metric]
                : 0;
              const left = `${(hovered.x / width) * 100}%`;
              const top = `${(hovered.y / height) * 100}%`;
              return (
                <div
                  className={`pointer-events-none absolute z-20 w-48 rounded-[10px] bg-[#17243D] p-3 text-white shadow-xl ${hovered.x > width * 0.72 ? "-translate-x-full" : hovered.x < width * 0.28 ? "translate-x-0" : "-translate-x-1/2"} -translate-y-[calc(100%+10px)]`}
                  style={{ left, top }}
                  role="tooltip"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-[12px]">{point.label}</strong>
                    <span
                      className={`text-[10px] font-bold ${change < 0 ? "text-red-300" : change > 0 ? "text-emerald-300" : "text-white/60"}`}
                    >
                      {hovered.index === 0
                        ? "Starting day"
                        : `${change > 0 ? "+" : ""}${change} ${metric.label.toLowerCase()}`}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {growthSeries.map((series) => (
                      <div
                        key={series.key}
                        className="flex items-center justify-between gap-3 text-[10px]"
                      >
                        <span className="flex items-center gap-1.5 text-white/70">
                          <i
                            className="size-2 rounded-full"
                            style={{ backgroundColor: series.color }}
                          />
                          {series.label}
                        </span>
                        <strong>{point[series.key].toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                  {change < 0 ? (
                    <p className="mt-2 border-t border-white/10 pt-2 text-[9px] font-semibold text-red-300">
                      Declined from the previous day
                    </p>
                  ) : null}
                </div>
              );
            })()
          : null}
        <div
          className="grid text-center text-[11px] font-medium text-[#8490A2]"
          style={{
            gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
          }}
        >
          {points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-[#98A2B1]">
          Series are indexed to their first-day value so trends with different
          units can be compared accurately.
        </p>
      </div>
    </div>
  );
}



function OverviewGrowthSection({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [points, setPoints] = useState<GrowthPoint[]>([]);
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/growth").then(async (response) => {
      if (!response.ok) throw new Error("Growth data could not be loaded.");
      const body=await response.json() as Array<{date:string;submissions:number;participants:number}>;
      setPoints(body.map((item)=>({label:new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"}),submissions:item.submissions,participants:item.participants})));
    }).catch((reason)=>notify(reason instanceof Error?reason.message:"Growth data could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <section className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white">
        <div className="flex w-full items-start justify-between gap-4 border-b border-[#E7ECF2] p-5 text-left tablet:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#2488F4]">
              Programme activity
            </p>
            <h2 className="mt-1 text-[21px] font-semibold">
              Submission and participant growth
            </h2>
            <p className="mt-1 text-[12px] text-[#8490A2]">
              Daily activity for the last seven days.
            </p>
          </div>
          <span className="rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-[#0877EF]">Last 7 days</span>
        </div>
        <div className="p-5 tablet:p-6">
          <div className="mt-5">
            {points.length ? <InsightsGrowthChart points={points} /> : <p className="py-12 text-center text-[12px] text-[#8490A2]">No growth data is available.</p>}
          </div>
        </div>
      </section>
    </>
  );
}

type CalendarMetrics = {
  submissions: number;
  reviews: number;
  telecasts: number;
  zips: number;
  warnings: number;
};

function CalendarDayCell({
  day,
  dateLabel,
  current,
  selected,
  metrics,
  onOpen,
}: {
  day: number;
  dateLabel: string;
  current: boolean;
  selected: boolean;
  metrics?: CalendarMetrics;
  onOpen: () => void;
}) {
  const hasActivity = Boolean(metrics && (metrics.submissions || metrics.reviews || metrics.telecasts || metrics.zips || metrics.warnings));
  const dots = metrics ? [
    metrics.submissions ? "bg-sky-500" : null,
    metrics.reviews ? "bg-amber-400" : null,
    metrics.telecasts ? "bg-violet-500" : null,
    metrics.zips ? "bg-emerald-500" : null,
  ].filter(Boolean) : [];

  return (
    <button
      type="button"
      disabled={!current}
      onClick={onOpen}
      aria-label={`${dateLabel}${metrics?.warnings ? `, ${metrics.warnings} items need attention` : ""}`}
      className={`relative min-h-[52px] rounded-[10px] border p-2 text-left transition tablet:min-h-[66px] ${current ? "border-transparent bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-sm" : "border-transparent bg-white/45 text-slate-300"} ${selected ? "border-[#2488F4] bg-[#EFF8FF] ring-2 ring-[#2488F4]/25" : ""}`}
    >
      <span
        className={`grid size-8 place-items-center rounded-full text-[13px] font-bold ${selected ? "bg-[#2488F4] text-white" : current ? "text-[#334155]" : "text-slate-300"}`}
      >
        {day}
      </span>
      {metrics?.warnings ? <span className="absolute right-2 top-2 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold text-white">{metrics.warnings}</span> : null}
      {hasActivity ? <span className="absolute bottom-2 left-2 flex gap-1">{dots.map((color, index) => <i key={`${color}-${index}`} className={`size-1.5 rounded-full ${color}`} />)}</span> : null}
    </button>
  );
}

function OverviewCalendar({
  openDay,
  onNavigate,
  notify,
}: {
  openDay: (dateLabel: string) => void;
  onNavigate: (section: "submissions" | "zips" | "telecasts" | "tasks" | "warnings", dateLabel: string) => void;
  notify: (message: string) => void;
}) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [view, setView] = useState<"Year" | "Month" | "Week">("Month");
  const [displayMonth, setDisplayMonth] = useState(() => new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpDate, setJumpDate] = useState(() => new Intl.DateTimeFormat("en-CA").format(new Date()));
  const [calendarMetrics, setCalendarMetrics] = useState<Record<string, CalendarMetrics>>({});
  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/admin/kids-champ/submissions"),
      apiFetch("/api/v1/admin/kids-champ/batches"),
      apiFetch("/api/v1/admin/kids-champ/calendar/tasks"),
    ]).then(async ([submissionResponse, batchResponse, taskResponse]) => {
      const submissionItems = submissionResponse.ok ? await submissionResponse.json() as AdminSubmissionResponse[] : [];
      const batchItems = batchResponse.ok ? await batchResponse.json() as AdminBatchResponse[] : [];
      const taskItems = taskResponse.ok ? await taskResponse.json() as Array<{ date: string; completedAt?: string }> : [];
      const next: Record<string, CalendarMetrics> = {};
      const metric = (date: string) => next[date] ??= { submissions: 0, reviews: 0, telecasts: 0, zips: 0, warnings: 0 };
      submissionItems.forEach((item) => {
        metric(item.submittedAt.slice(0, 10)).submissions += 1;
        if (item.reviewedAt) metric(item.reviewedAt.slice(0, 10)).reviews += 1;
      });
      batchItems.forEach((item) => {
        metric(item.createdAt.slice(0, 10)).zips += 1;
        if (item.telecastDate) metric(item.telecastDate).telecasts += 1;
        if (item.status !== "DELETED" && item.daysRemaining <= 0) metric(item.createdAt.slice(0, 10)).warnings += 1;
      });
      taskItems.forEach((item) => {
        if (!item.completedAt) metric(item.date).warnings += 1;
      });
      setCalendarMetrics(next);
    }).catch(() => setCalendarMetrics({}));
  }, []);
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const leadingDays = new Date(displayYear, displayMonth, 1).getDay();
  const previousMonthDays = new Date(displayYear, displayMonth, 0).getDate();
  const trailingDays = 42 - leadingDays - daysInMonth;
  const cells = [
    ...Array.from({ length: leadingDays }, (_, index) => ({
      day: previousMonthDays - leadingDays + index + 1,
      current: false,
      key: `previous-${index}`,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      current: true,
      key: `current-${index}`,
    })),
    ...Array.from({ length: trailingDays }, (_, index) => ({
      day: index + 1,
      current: false,
      key: `next-${index}`,
    })),
  ];
  const metricsForDay = (day: number): CalendarMetrics => {
    const date = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarMetrics[date] ?? { submissions: 0, reviews: 0, telecasts: 0, zips: 0, warnings: 0 };
  };
  const selectedDate = new Date(
    displayYear,
    displayMonth,
    Math.min(selectedDay, daysInMonth),
  );
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  const weekCells = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const selectedMetrics = calendarMetrics[selectedDateKey] ?? { submissions: 0, reviews: 0, telecasts: 0, zips: 0, warnings: 0 };
  const selectedDateLabel = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  function changeMonth(offset: number) {
    const next = new Date(displayYear, displayMonth + offset, 1);
    setDisplayYear(next.getFullYear());
    setDisplayMonth(next.getMonth());
    setSelectedDay(1);
    setView("Month");
  }
  function goToToday() {
    const today = new Date();
    setDisplayYear(today.getFullYear());
    setDisplayMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setView("Month");
  }
  function applyJumpDate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(jumpDate)) return;
    const next = new Date(`${jumpDate}T00:00:00`);
    if (Number.isNaN(next.getTime())) return;
    setDisplayYear(next.getFullYear());
    setDisplayMonth(next.getMonth());
    setSelectedDay(next.getDate());
    setView("Month");
    setJumpOpen(false);
  }
  useEffect(() => {
    const handleCommand = (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      if (command === "today") goToToday();
      if (command === "month") setView("Month");
      if (command === "jump") setJumpOpen(true);
    };
    window.addEventListener("kids-champ-calendar-command", handleCommand);
    return () => window.removeEventListener("kids-champ-calendar-command", handleCommand);
  }, [displayMonth, displayYear, selectedDay]);

  return (
    <section
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white"
      aria-labelledby="overview-calendar-title"
    >
      <div className="flex flex-col gap-4 border-b border-[#E7EBF0] px-4 py-4 tablet:px-5">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h2
              id="overview-calendar-title"
              className="text-[18px] font-semibold"
            >
              Operations calendar
            </h2>
            <p className="mt-1 text-[12px] text-[#8490A2]">
              Select a day or enter a date to jump directly to it.
            </p>
          </div>
          <button type="button" onClick={goToToday} className="rounded-[9px] border border-[#D8E4F0] bg-white px-3 py-2 text-[11px] font-bold text-[#0877EF]">Today</button>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-[13px] border border-[#E5EBF2] bg-[#FBFDFF] p-2">
          <button type="button" onClick={() => changeMonth(-1)} className="grid size-9 place-items-center rounded-[9px] text-[18px] font-semibold text-[#526178] transition hover:bg-[#EAF4FF]" aria-label="Previous month">‹</button>
          <div className="flex min-w-0 items-center gap-2"><div className="text-center"><p className="text-[15px] font-bold text-[#17243D]">{monthNames[displayMonth]}</p><p className="mt-0.5 text-[10px] font-medium text-[#718096]">Select a day to manage its work</p></div><select value={displayYear} onChange={(event) => { setDisplayYear(Number(event.target.value)); setSelectedDay(1); setView("Month"); }} className="h-8 rounded-[8px] border border-[#D8E4F0] bg-white px-2 text-[11px] font-bold text-[#334155] outline-none focus:border-[#2488F4]" aria-label="Calendar year">{[2024, 2025, 2026, 2027, 2028].map((year) => <option key={year}>{year}</option>)}</select></div>
          <button type="button" onClick={() => changeMonth(1)} className="grid size-9 place-items-center rounded-[9px] text-[18px] font-semibold text-[#526178] transition hover:bg-[#EAF4FF]" aria-label="Next month">›</button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 bg-[#F4F7FB] desktop:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 p-3 tablet:p-4">
        {view === "Month" ? (
          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-7 gap-1.5">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="rounded-[8px] bg-white py-3 text-center text-[11px] font-bold uppercase text-[#EF684D]"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {cells.map((cell) => {
                  const metrics = cell.current
                    ? metricsForDay(cell.day)
                    : undefined;
                  const dateLabel = `${monthNames[displayMonth]} ${cell.day}, ${displayYear}`;
                  return (
                    <CalendarDayCell
                      key={cell.key}
                      day={cell.day}
                      dateLabel={dateLabel}
                      current={cell.current}
                      selected={cell.current && cell.day === selectedDay}
                      metrics={metrics}
                    onOpen={() => setSelectedDay(cell.day)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
        {view === "Week" ? (
          <div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="rounded-[8px] bg-white py-3 text-center text-[11px] font-bold uppercase text-[#EF684D]"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {weekCells.map((date) => {
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const metrics = calendarMetrics[dateKey] ?? { submissions: 0, reviews: 0, telecasts: 0, zips: 0, warnings: 0 };
                const label = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                return (
                  <CalendarDayCell
                    key={date.toISOString()}
                    day={date.getDate()}
                    dateLabel={label}
                    current
                    selected={
                      date.getDate() === selectedDay &&
                      date.getMonth() === displayMonth
                    }
                    metrics={metrics}
                    onOpen={() => { setDisplayMonth(date.getMonth()); setDisplayYear(date.getFullYear()); setSelectedDay(date.getDate()); }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
        {view === "Year" ? (
          <div className="grid gap-2 tablet:grid-cols-3 desktop:grid-cols-4">
            {monthNames.map((month, index) => (
              <button
                key={month}
                onClick={() => {
                  setDisplayMonth(index);
                  setSelectedDay(1);
                  setView("Month");
                }}
                className={`min-h-28 rounded-[9px] bg-white p-4 text-left transition hover:shadow-sm ${index === displayMonth ? "ring-2 ring-inset ring-[#F26B4D]" : ""}`}
              >
                <span
                  className={`text-[13px] font-semibold ${index === displayMonth ? "text-[#EF684D]" : "text-[#4E5968]"}`}
                >
                  {month}
                </span>
                <span className="mt-5 block text-[11px] text-[#9AA1AB]">
                  Open month · {displayYear}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <aside className="hidden min-h-0 overflow-hidden border-l border-[#E2EAF3] bg-white p-4 desktop:block">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-[#E5EBF2] bg-white px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2488F4]">Selected-day agenda</p><h3 className="mt-1 text-[19px] font-semibold text-[#17243D]">{selectedDateLabel}</h3><p className="mt-1 text-[11px] text-[#718096]">Manage the day without leaving the calendar.</p></div>
        <CalendarDayPanel key={selectedDateLabel} notify={notify} dateLabel={selectedDateLabel} onNavigate={onNavigate} />
      </aside>
      </div>
      <div className="grid gap-4 border-t border-[#E5EBF2] bg-white p-4 desktop:hidden tablet:grid-cols-[1.15fr_.85fr] tablet:p-5">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2488F4]">Selected day</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-[19px] font-semibold text-[#17243D]">{selectedDateLabel}</h3><p className="mt-1 text-[12px] text-[#718096]">A focused view of the work planned and received that day.</p></div><button type="button" onClick={() => openDay(selectedDateLabel)} className="rounded-[9px] bg-[#17243D] px-3 py-2 text-[11px] font-bold text-white">Open day workspace</button></div>
          <div className="mt-4 grid grid-cols-2 gap-2 tablet:grid-cols-4">
            {[{ label: "Submissions", value: selectedMetrics.submissions, color: "bg-sky-500" }, { label: "Approvals", value: selectedMetrics.reviews, color: "bg-amber-400" }, { label: "ZIP batches", value: selectedMetrics.zips, color: "bg-emerald-500" }, { label: "Telecasts", value: selectedMetrics.telecasts, color: "bg-violet-500" }].map((item) => <div key={item.label} className="rounded-[12px] border border-[#E4EBF3] bg-[#FBFDFF] p-3"><i className={`block size-2 rounded-full ${item.color}`} /><strong className="mt-3 block text-[20px] leading-none text-[#17243D]">{item.value}</strong><span className="mt-1 block text-[10px] font-semibold text-[#718096]">{item.label}</span></div>)}
          </div>
        </div>
        <aside className={`rounded-[15px] border p-4 ${selectedMetrics.warnings ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#64748B]">Day status</p>
          <h3 className={`mt-2 text-[17px] font-semibold ${selectedMetrics.warnings ? "text-red-800" : "text-emerald-800"}`}>{selectedMetrics.warnings ? `${selectedMetrics.warnings} item${selectedMetrics.warnings === 1 ? "" : "s"} need attention` : "No unresolved tasks"}</h3>
          <p className="mt-2 text-[12px] leading-5 text-[#526178]">{selectedMetrics.warnings ? "Open the day workspace to complete tasks and resolve expired or delayed work." : "Use this day to review its activity or add a new operations task."}</p>
          <button type="button" onClick={() => openDay(selectedDateLabel)} className={`mt-4 text-[11px] font-bold ${selectedMetrics.warnings ? "text-red-700" : "text-emerald-700"}`}>{selectedMetrics.warnings ? "Resolve work →" : "Plan this day →"}</button>
        </aside>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#E5EBF2] px-4 py-3 text-[11px] text-[#6E7C91] tablet:px-5">
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-[#2488F4]" />
          Submissions
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-[#7B8797]" />
          Approvals
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-violet-500" />
          Telecasts
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" />
          ZIPs
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-red-500" />
          Warnings
        </span>
        <span className="ml-auto">Red badge = work that needs attention</span>
      </div>
      {jumpOpen ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#102A56]/30 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="calendar-jump-title">
          <section className="w-full max-w-sm rounded-[18px] border border-[#DCE7F2] bg-white p-5 shadow-[0_20px_55px_rgba(20,52,93,.22)]">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold text-[#087BF1]">Operations calendar</p><h3 id="calendar-jump-title" className="mt-1 text-[18px] font-semibold text-[#17243D]">Jump to date</h3><p className="mt-1 text-[12px] text-[#718096]">Choose the day you want to review.</p></div><button type="button" onClick={() => setJumpOpen(false)} className="grid size-8 place-items-center rounded-full bg-[#F2F6FA] text-[#60708A]" aria-label="Close date picker">×</button></div>
            <label className="mt-5 block text-[11px] font-semibold text-[#526178]">Date<input type="date" value={jumpDate} onChange={(event) => setJumpDate(event.target.value)} className={`${fieldClass} mt-1.5`} autoFocus /></label>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setJumpOpen(false)} className={secondaryButton}>Cancel</button><button type="button" onClick={applyJumpDate} className={primaryButton}>Go to date</button></div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function CalendarModal({
  onClose,
  onOpenDay,
  onNavigate,
  notify,
}: {
  onClose: () => void;
  onOpenDay: (dateLabel: string) => void;
  onNavigate: (section: "submissions" | "zips" | "telecasts" | "tasks" | "warnings", dateLabel: string) => void;
  notify: (message: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] bg-[#F6F9FD]"
      role="dialog"
      aria-modal="true"
      aria-label="Operations calendar"
      onMouseDown={onClose}
    >
      <div
        className="flex h-screen w-full flex-col overflow-hidden bg-white"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-7">
          <div>
            <p className="text-[11px] font-semibold text-[#087BF1]">Page manager</p>
            <h2 className="mt-1 text-[24px] font-semibold tracking-[-.025em] text-[#17243D]">
              Calendar and daily operations
            </h2>
            <p className="mt-1 text-[12px] text-[#718096]">Monitor submissions, ZIP batches, telecasts, and daily operations all in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("kids-champ-calendar-command", { detail: "today" }))} className={secondaryButton}>▣&nbsp; Today</button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("kids-champ-calendar-command", { detail: "jump" }))} className={secondaryButton}>▣&nbsp; Jump to date</button><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-[#D7E2EE] text-[18px] text-[#66758B]" aria-label="Close calendar">×</button></div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-[#F6F9FD] p-3 tablet:p-5">
          <OverviewCalendar openDay={onOpenDay} onNavigate={onNavigate} notify={notify} />
        </div>
      </div>
    </div>
  );
}

function SideDrawer({
  title,
  description,
  onClose,
  onBack,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onBack?: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-[#102A56]/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kc-drawer-title"
      onMouseDown={onClose}
    >
      <section
        className={`ml-auto flex h-full w-full flex-col bg-[#F5F7FA] shadow-[-24px_0_70px_rgba(16,42,86,.22)] ${wide ? "max-w-[900px]" : "max-w-[640px]"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#DFE6EF] bg-white px-5 py-5 tablet:px-6">
          {onBack ? <button type="button" onClick={onBack} className="grid size-10 shrink-0 place-items-center rounded-full border border-[#D7E2EE] bg-white text-[18px] text-[#526178]" aria-label="Back to calendar">←</button> : null}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#2488F4]">
              Kids Champ
            </p>
            <h2
              id="kc-drawer-title"
              className="mt-1 text-[22px] font-semibold tracking-[-.02em] text-[#17243D]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[13px] leading-5 text-[#718096]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[#D7E2EE] bg-white text-[18px] text-[#66758B]"
            aria-label="Close panel"
          >
            x
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 tablet:p-6">{children}</div>
      </section>
    </div>
  );
}

function Overview({
  openDrawer,
  openCalendar,
  goToWorkspace,
  openSubmissions,
  openZipView,
  notify,
}: {
  openDrawer: (kind: DrawerKind, title: string) => void;
  openCalendar: () => void;
  goToWorkspace: (workspace: Workspace) => void;
  openSubmissions: (filter: OverviewSubmissionFilter) => void;
  openZipView: (view: OverviewZipView) => void;
  notify: (message: string) => void;
}) {
  const [metrics, setMetrics] = useState({ totalSubmissions: 0, newToday: 0, pendingReviews: 0, approved: 0, selectedForTv: 0, telecasted: 0, uniqueParticipants: 0, activeBatches: 0 });
  const [overviewState, setOverviewState] = useState<"loading" | "ready" | "error">("loading");
  const [overviewReload, setOverviewReload] = useState(0);
  const [whatsAppCampaigns, setWhatsAppCampaigns] = useState<CampaignQueueItem[]>([]);
  const [liveActivity, setLiveActivity] = useState<Array<{id:string;title:string;detail:string;time:string;tone:"blue"|"green"|"red"|"violet";category:string}>>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState("All");
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/overview")
      .then(async (response) => {
        if (!response.ok) throw new Error("Overview metrics could not be loaded.");
        setMetrics(await response.json());
        setOverviewState("ready");
      })
      .catch((reason) => {
        setOverviewState("error");
        notify(reason instanceof Error ? reason.message : "Overview metrics could not be loaded.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewReload]);
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/activity").then(async (response) => {
      if (!response.ok) return;
      const body=await response.json() as Array<{action:string;entityType:string;entityId:string;details?:string;actor:string;createdAt:string}>;
      const category=(type:string)=>type === "SUBMISSION" ? "Submissions" : type === "BATCH" ? "ZIP" : type === "GUEST" || type === "CHILD_PROFILE" ? "Participants" : type === "CALENDAR_TASK" ? "Calendar" : type === "SETTINGS" ? "Settings" : type === "CAMPAIGN" ? "Campaigns" : "Overview";
      setLiveActivity(body.map((item)=>({id:`${item.entityId}-${item.createdAt}`,title:item.action.replaceAll("_"," ").toLowerCase(),detail:`${item.actor}${item.details?` · ${item.details}`:""}`,time:new Date(item.createdAt).toLocaleString(),tone:"blue",category:category(item.entityType)})));
    }).catch(()=>undefined);
  }, []);
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/campaigns")
      .then(async (response) => {
        if (response.ok) setWhatsAppCampaigns((await response.json() as CampaignQueueItem[]).filter((item) => item.channel === "WHATSAPP"));
      })
      .catch(() => undefined);
  }, [overviewReload]);
  const failedCampaigns = whatsAppCampaigns.filter((item) => item.status === "FAILED" || item.status === "PARTIAL").length;
  const queuedCampaigns = whatsAppCampaigns.filter((item) => item.status === "QUEUED").length;
  const liveAttention = [
    {id:"pending",title:"Submissions waiting for approval",detail:"Open the approval queue",count:metrics.pendingReviews,severity:metrics.pendingReviews?"warning":"info",section:"submissions",icon:"◷",style:"border-l-[#FF4B4B] bg-[#FFF7F7]",iconStyle:"bg-[#FFE5E5] text-[#FF4141]",countStyle:"border-red-200 bg-[#FFE6E6] text-[#A52B2B]"},
    {id:"production",title:"Active ZIP & telecast batches",detail:"Monitor delivery readiness and telecast dates",count:metrics.activeBatches,severity:"info",section:"zips",icon:"▣",style:"border-l-[#FF8A3D] bg-[#FFF9F4]",iconStyle:"bg-[#FFEBDD] text-[#F27022]",countStyle:"border-orange-200 bg-[#FFF0E5] text-[#A94B12]"},
    {id:"whatsapp",title:"WhatsApp campaigns needing attention",detail:"Review failed or partially sent campaigns",count:failedCampaigns,severity:failedCampaigns?"warning":"info",section:"zips",icon:"◔",style:"border-l-[#FFB800] bg-[#FFFCF4]",iconStyle:"bg-[#FFF1C8] text-[#E6A400]",countStyle:"border-amber-200 bg-[#FFF3D8] text-[#976400]"},
  ];
  const priorities = [
    {
      label: "Review approvals",
      value: String(metrics.pendingReviews),
      detail: metrics.pendingReviews ? "New work is waiting now" : "Approval queue is clear",
      tone: "coral",
      status: metrics.pendingReviews ? "warning" : "success",
      kind: "submissions" as DrawerKind,
      calendar: false,
    },
    {
      label: "New submissions",
      value: String(metrics.newToday),
      detail: "Received today",
      tone: "blue",
      status: "normal",
      kind: "submissions" as DrawerKind,
      calendar: false,
    },
    {
      label: "ZIP & telecast",
      value: String(metrics.activeBatches),
      detail: "Batches currently in operation",
      tone: "violet",
      status: "normal",
      kind: "zips" as DrawerKind,
      calendar: false,
    },
    {
      label: "WhatsApp queue",
      value: String(queuedCampaigns + failedCampaigns),
      detail: failedCampaigns ? `${failedCampaigns} campaign${failedCampaigns === 1 ? "" : "s"} need attention` : "No delivery errors",
      tone: failedCampaigns ? "red" : "blue",
      status: failedCampaigns ? "warning" : "success",
      kind: "zips" as DrawerKind,
      calendar: false,
    },
  ];
  const secondary = [
    {
      label: "Approved",
      value: String(metrics.approved),
      detail: `${metrics.totalSubmissions ? ((metrics.approved / metrics.totalSubmissions) * 100).toFixed(1) : "0.0"}% approval rate`,
      status: "success",
      kind: "submissions" as DrawerKind,
    },
    {
      label: "Telecasted",
      value: String(metrics.telecasted),
      detail: "Recorded telecasts",
      status: "success",
      kind: "telecast" as DrawerKind,
    },
    {
      label: "Participants",
      value: String(metrics.uniqueParticipants),
      detail: "Registered and guest participants",
      status: "normal",
      kind: "participants" as DrawerKind,
    },
    {
      label: "Operations calendar",
      value: String(new Date().getDate()).padStart(2, "0"),
      detail: "Schedules, deadlines and telecasts",
      status: "normal",
      kind: "calendar" as DrawerKind,
    },
  ];
  const tone: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    red: "bg-red-50 text-red-700",
    coral: "bg-orange-50 text-[#E95B40]",
  };
  const statusCard: Record<string, string> = {
    normal: "border-[#E0E7EF] bg-white hover:border-[#BFDDFB]",
    success: "border-emerald-300 bg-emerald-50/70 hover:border-emerald-500",
    warning: "border-red-300 bg-red-50/70 hover:border-red-500",
  };
  const priorityIcons: Record<string, { src: string; alt: string }> = {
    "Review approvals": { src: "/icons/kids-champ/review.png", alt: "Review approvals" },
    "New submissions": { src: "/icons/kids-champ/new-submission.png", alt: "New submissions" },
    "ZIP & telecast": { src: "/icons/kids-champ/zip.png", alt: "ZIP and telecast" },
    "WhatsApp queue": { src: "/icons/kids-champ/whatsapp.gif", alt: "WhatsApp queue" },
  };
  const summaryIcons: Record<string, { src: string; alt: string }> = {
    Approved: { src: "/icons/kids-champ/approved.png", alt: "Approved" },
    Telecasted: { src: "/icons/kids-champ/telecast.png", alt: "Telecasted" },
    Participants: { src: "/icons/kids-champ/participants.png", alt: "Participants" },
    "Operations calendar": { src: "/icons/kids-champ/calendar.png", alt: "Operations calendar" },
  };
  const activityCategories = ["All", "Overview", "Submissions", "ZIP", "Participants", "Calendar", "Settings", "Campaigns"];
  const filteredActivity = activityFilter === "All" ? liveActivity : liveActivity.filter((item) => item.category === activityFilter);

  return (
    <div className="space-y-7">
      {overviewState === "error" ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-900">
          <span><strong>Overview data could not be loaded.</strong> No zero values are being shown as live data.</span>
          <button type="button" onClick={() => { setOverviewState("loading"); setOverviewReload((value) => value + 1); }} className="rounded-[8px] bg-red-700 px-3 py-1.5 text-[11px] font-bold text-white">Retry</button>
        </section>
      ) : null}
      <section aria-labelledby="priority-heading">
        <div className="mb-4">
          <h2 id="priority-heading" className="text-[20px] font-semibold">
            Today&apos;s priorities
          </h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">
            Start with the work that needs attention now.
          </p>
        </div>
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          {overviewState === "loading" ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[190px] animate-pulse rounded-[18px] border border-[#E0E7EF] bg-[#F3F6F9]" />) : priorities.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.calendar ? openCalendar() : item.label === "Review approvals" ? openSubmissions("pending") : item.label === "New submissions" ? openSubmissions("today") : item.label === "WhatsApp queue" ? openZipView("whatsapp-attention") : openZipView("all")}
              className={`group relative flex min-h-[205px] flex-col items-center justify-center rounded-[18px] border p-5 text-center transition hover:-translate-y-0.5 ${statusCard[item.status]}`}
            >
              <div className="flex items-center justify-center">
                <span className={`grid size-12 place-items-center rounded-[14px] ${tone[item.tone]}`}>
                  <Image
                    src={priorityIcons[item.label].src}
                    alt={priorityIcons[item.label].alt}
                    width={34}
                    height={34}
                    unoptimized={item.label === "WhatsApp queue"}
                    className="size-[34px] object-contain"
                  />
                </span>
                <span className="absolute right-5 top-5 text-[#A2ADBA] group-hover:text-[#0877EF]">
                  -&gt;
                </span>
              </div>
              <p className="mt-4 text-[44px] font-semibold leading-none tracking-[-.055em]">
                {item.value}
              </p>
              <p className="mt-3 text-[14px] font-bold text-[#354963]">
                {item.label}
              </p>
              <p
                className={`mt-2 text-[12px] ${item.status === "warning" ? "font-medium text-red-700" : "text-[#8793A5]"}`}
              >
                {item.detail}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-[18px] font-semibold"><Image src="/icons/kids-champ/programme-summary.png" alt="" width={22} height={22} className="size-[22px] object-contain" />Programme summary</h2>
        <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
          {secondary.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.kind === "submissions" ? openSubmissions(item.label === "Approved" ? "approved" : null) : item.label === "Telecasted" ? openZipView("telecasted") : item.kind === "participants" ? goToWorkspace("Participants") : item.kind === "calendar" ? openCalendar() : openZipView("all")}
              className={`group relative flex min-h-[150px] flex-col items-center justify-center rounded-[15px] border px-4 py-4 text-center transition hover:-translate-y-0.5 ${statusCard[item.status]}`}
            >
              <div>
                  <span className="mx-auto grid size-10 place-items-center rounded-[12px] bg-white/70">
                    <Image src={summaryIcons[item.label].src} alt={summaryIcons[item.label].alt} width={28} height={28} className="size-7 object-contain" />
                  </span>
                  <p className="mt-2 text-[34px] font-semibold leading-none tracking-[-.045em]">
                    {item.value}
                  </p>
                  <p className="mt-3 text-[13px] font-bold text-[#43556D]">
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${item.status === "warning" ? "font-medium text-red-700" : item.status === "success" ? "font-medium text-emerald-700" : "text-[#8793A5]"}`}
                  >
                    {item.detail}
                  </p>
              </div>
                <span className="absolute right-4 top-4 text-[#A2ADBA] group-hover:text-[#0877EF]">-&gt;</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 desktop:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white shadow-[0_8px_26px_rgba(30,72,123,.05)]">
          <div className="flex items-start justify-between gap-4">
            <div className="p-5 tablet:p-6">
              <h2 className="flex items-center gap-2 text-[18px] font-semibold"><span className="grid size-7 place-items-center rounded-full bg-red-500 text-[15px] text-white">!</span>Needs attention</h2>
              <p className="mt-1 text-[12px] text-[#8490A2]">
                Prioritised by urgency and age.
              </p>
            </div>
            <button
              onClick={() => openSubmissions("pending")}
              className="mr-5 mt-6 text-[12px] font-semibold text-[#0877EF] tablet:mr-6"
            >
              View all
            </button>
          </div>
          <div className="border-t border-[#EDF1F5]">
            {liveAttention.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.id === "pending" ? openSubmissions("pending") : item.id === "whatsapp" ? openZipView("whatsapp-attention") : openZipView("all")}
                className={`flex w-full items-center gap-3 border-b border-[#F0F2F5] border-l-[3px] px-4 py-3 text-left transition hover:brightness-[.98] tablet:px-5 ${item.style}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full text-[22px] ${item.iconStyle}`}
                >{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#344660]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#8793A5]">
                    {item.detail}
                  </span>
                </span>
                <span className={`grid size-8 shrink-0 place-items-center rounded-[9px] border text-[11px] font-bold ${item.countStyle}`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E0E7EF] bg-white p-5 shadow-[0_8px_26px_rgba(30,72,123,.05)] tablet:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-[18px] font-semibold"><Image src="/icons/kids-champ/activity.gif" alt="" width={28} height={28} unoptimized className="size-7 object-contain" />Recent activity</h2>
              <p className="mt-1 text-[12px] text-[#8490A2]">
                Latest operational changes.
              </p>
            </div>
            <button
              onClick={() => setActivityModalOpen(true)}
              className="text-[12px] font-semibold text-[#0877EF]"
            >
              Show all
            </button>
          </div>
          <div className="relative mt-5 space-y-0 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-[#DCEBFC]">
            {liveActivity.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDrawer("activity", item.title)}
                className="relative flex w-full gap-3 py-1.5 text-left"
              >
                <span
                  className={`z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-white ${item.tone === "green" ? "bg-emerald-500" : item.tone === "red" ? "bg-red-500" : item.tone === "violet" ? "bg-violet-500" : "bg-[#1684F5]"}`}
                />
                <span>
                  <span className="block text-[12px] font-bold text-[#344660]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#8793A5]">
                    {item.detail} · {item.time}
                  </span>
                </span>
              </button>
            ))}
            {!liveActivity.length ? <p className="text-[12px] text-[#8490A2]">No recorded activity yet.</p> : null}
          </div>
        </section>
      </div>

      <OverviewGrowthSection notify={notify} />
      {activityModalOpen ? (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="activity-history-title" onMouseDown={() => setActivityModalOpen(false)}>
          <section className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between border-b border-[#E3E9F0] p-5">
              <div><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#2488F4]">Kids Champ history</p><h2 id="activity-history-title" className="mt-1 text-[22px] font-semibold">All recent activity</h2><p className="mt-1 text-[12px] text-[#7A879A]">Up to the latest 500 recorded operational changes.</p></div>
              <button type="button" onClick={() => setActivityModalOpen(false)} className="grid size-10 place-items-center rounded-full border border-[#D7E2EE] text-[#66758B]" aria-label="Close activity history">x</button>
            </header>
            <div className="flex gap-2 overflow-x-auto border-b border-[#E5EBF2] p-4">{activityCategories.map((category) => <button key={category} type="button" onClick={() => setActivityFilter(category)} className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold ${activityFilter === category ? "bg-[#2488F4] text-white" : "bg-[#F1F4F7] text-[#66758B]"}`}>{category}</button>)}</div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-2">{filteredActivity.map((item) => <article key={item.id} className="flex gap-3 rounded-[13px] border border-[#E5EBF2] p-4"><span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-blue-500"/><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[13px] capitalize text-[#344660]">{item.title}</strong><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{item.category}</span></span><span className="mt-1 block text-[11px] text-[#8793A5]">{item.detail} · {item.time}</span></span></article>)}</div>
              {!filteredActivity.length ? <p className="py-12 text-center text-[12px] text-[#8490A2]">No activity is available for this category.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ArtworkThumbnail({
  item,
  onOpen,
}: {
  item: MockSubmission;
  onOpen: () => void;
}) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl);
  useEffect(() => {
    if (item.photoUrl || !/^[0-9a-f-]{36}$/i.test(item.id)) return;
    let active = true;
    let objectUrl = "";
    apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/photo`)
      .then(async (response) => {
        if (!response.ok) return;
        objectUrl = URL.createObjectURL(await response.blob());
        if (active) setPhotoUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.id, item.photoUrl]);
  const artwork = (
    <div
      className={`relative grid h-full w-full place-items-center overflow-hidden bg-cover bg-center bg-no-repeat bg-gradient-to-br ${item.category === "Painting" ? "from-orange-200 via-rose-200 to-violet-300" : item.category === "Handcraft" ? "from-amber-100 via-emerald-200 to-cyan-300" : "from-blue-100 via-indigo-200 to-violet-300"}`}
      style={
        photoUrl
          ? { backgroundImage: `url("${photoUrl}")` }
          : undefined
      }
    >
      {!photoUrl ? (
        <>
          <span className="absolute -right-3 -top-3 size-12 rounded-full bg-white/35" />
          <span className="absolute -bottom-4 -left-3 size-14 rotate-12 rounded-[14px] bg-white/25" />
          <strong className="relative text-[12px] text-[#263852]/75">
            {item.initials}
          </strong>
        </>
      ) : null}
    </div>
  );
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={(event) =>
          setPointer({ x: event.clientX, y: event.clientY })
        }
        onMouseMove={(event) =>
          setPointer({ x: event.clientX, y: event.clientY })
        }
        onMouseLeave={() => setPointer(null)}
        className="size-12 overflow-hidden rounded-[10px] border-2 border-white shadow-sm ring-1 ring-[#DCE4ED]"
        aria-label={`Preview artwork by ${item.childName}`}
      >
        {artwork}
      </button>
      {pointer ? (
        <div
          className="pointer-events-none fixed z-[200] h-36 w-48 overflow-hidden rounded-[13px] border-4 border-white bg-white shadow-2xl"
          style={{
            left:
              pointer.x > window.innerWidth - 220
                ? pointer.x - 205
                : pointer.x + 14,
            top: Math.min(pointer.y + 14, window.innerHeight - 165),
          }}
        >
          {artwork}
          <span className="absolute inset-x-0 bottom-0 bg-[#17243D]/85 px-2 py-1.5 text-[9px] font-semibold text-white">
            {item.category} · click to open
          </span>
        </div>
      ) : null}
    </>
  );
}

function OpenSubmissionField({
  onOpen,
  children,
  className = "",
}: {
  onOpen: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Open submission details and edit"
      className={`rounded-[8px] px-2 py-1.5 text-left transition hover:bg-[#EDF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2488F4] ${className}`}
    >
      {children}
    </button>
  );
}

function SubmissionRow({
  item,
  privacy,
  selected,
  onSelect,
  onOpen,
  notify,
}: {
  item: MockSubmission;
  privacy: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  notify: (message: string) => void;
}) {
  const approvalPresentation = item.reviewStatus === "Approved"
    ? { label: "Approved", style: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
    : item.reviewStatus === "Rejected"
      ? { label: "Rejected", style: "bg-red-50 text-red-700 ring-red-200" }
      : { label: item.reviewStatus === "Under review" ? "In review" : "Pending", style: "bg-amber-50 text-amber-800 ring-amber-200" };
  function copyCode() {
    void navigator.clipboard.writeText(item.trackingCode);
    notify(`${item.trackingCode} copied.`);
  }
  return (
    <tr
      className={`border-b border-[#EDF1F5] text-[12px] text-[#40516A] last:border-0 hover:bg-[#F9FBFD] ${selected ? "bg-blue-50/50" : ""}`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${item.childName}`}
          className="size-4 accent-[#2488F4]"
        />
      </td>
      <td className="px-3 py-3">
        <ArtworkThumbnail item={item} onOpen={onOpen} />
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          <span className="block font-semibold text-[#263852]">
            <PrivateValue enabled={privacy}>{item.childName}</PrivateValue>
          </span>
          <span className="mt-0.5 block text-[10px] text-[#8793A5]">
            {item.participantType}
          </span>
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={copyCode}
            className="grid size-7 place-items-center rounded-[7px] border border-[#DCE4ED] bg-white text-[13px] text-[#58708E] hover:border-[#2488F4] hover:text-[#0877EF]"
            aria-label={`Copy ${item.trackingCode}`}
          >
            ⧉
          </button>
          <OpenSubmissionField
            onOpen={onOpen}
            className="font-mono text-[11px] font-semibold text-[#365A82]"
          >
            <PrivateValue enabled={privacy}>{item.trackingCode}</PrivateValue>
          </OpenSubmissionField>
        </div>
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          {item.age} · {item.location}
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          {item.category}
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          <span className="block">{item.submittedDate}</span>
          <span className="text-[10px] text-[#8793A5]">{item.submittedAt}</span>
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${approvalPresentation.style}`}>{approvalPresentation.label}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onOpen}
          className="rounded-[8px] bg-[#EDF5FF] px-3 py-2 font-semibold text-[#0877EF] hover:bg-[#2488F4] hover:text-white"
        >
          {item.reviewStatus === "Approved" ? "Open" : "Review"}
        </button>
      </td>
    </tr>
  );
}

function SubmissionsWorkspace({
  privacy,
  openSubmission,
  notify,
  calendarFilter,
  clearCalendarFilter,
  initialOverviewFilter,
}: {
  privacy: boolean;
  openSubmission: (
    item: MockSubmission,
    onSave: (submission: MockSubmission) => void,
  ) => void;
  notify: (message: string) => void;
  calendarFilter: CalendarWorkspaceFilter | null;
  clearCalendarFilter: () => void;
  initialOverviewFilter: OverviewSubmissionFilter;
}) {
  const [records, setRecords] = useState<MockSubmission[]>([]);
  const [backendState, setBackendState] = useState<"loading" | "live" | "error">("loading");
  const [connectionOpen,setConnectionOpen]=useState(false);
  const [connectionReason,setConnectionReason]=useState("Checking the Kids Champ service…");
  const [lastConnectionCheck,setLastConnectionCheck]=useState<Date|null>(null);
  const [approvalFilter, setApprovalFilter] = useState(initialOverviewFilter === "approved" ? "Approved" : initialOverviewFilter === "pending" ? "Not approved" : "All");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exactAge, setExactAge] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateMode, setDateMode] = useState(calendarFilter || initialOverviewFilter === "today" ? "Specific date" : "Any time");
  const [specificDate, setSpecificDate] = useState(calendarFilter?.date ?? (initialOverviewFilter === "today" ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date()) : "2026-08-01"));
  const [dateFrom, setDateFrom] = useState("2026-07-25");
  const [dateTo, setDateTo] = useState("2026-08-01");
  const [month, setMonth] = useState("2026-08");
  const [year, setYear] = useState("2026");
  const [week, setWeek] = useState("2026-W31");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submissionPage, setSubmissionPage] = useState(0);
  const [submissionTotalItems, setSubmissionTotalItems] = useState(0);
  const [submissionTotalPages, setSubmissionTotalPages] = useState(0);
  const [summaryTotals,setSummaryTotals]=useState({pendingReviews:0,approved:0,totalSubmissions:0});

  useEffect(()=>{apiFetch("/api/v1/admin/kids-champ/overview").then(async(response)=>{if(response.ok){const value=await response.json() as {pendingReviews:number;approved:number;totalSubmissions:number};setSummaryTotals({pendingReviews:value.pendingReviews,approved:value.approved,totalSubmissions:value.totalSubmissions});}}).catch(()=>undefined);},[]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(submissionPage), size: "25" });
    if (search.trim()) params.set("search", search.trim());
    if (approvalFilter !== "All" && approvalFilter !== "New") params.set("approval", approvalFilter);
    if (locationFilter !== "All") params.set("location", locationFilter);
    const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);
    const setDateWindow = (from: string, to: string) => {
      params.set("dateFrom", from);
      params.set("dateTo", to);
    };
    if (exactAge) {
      params.set("minAge", exactAge);
      params.set("maxAge", exactAge);
    } else {
      if (ageMin) params.set("minAge", ageMin);
      if (ageMax) params.set("maxAge", ageMax);
    }
    if (dateMode === "Specific date" && specificDate) setDateWindow(specificDate, specificDate);
    if (dateMode === "Date range" && dateFrom && dateTo) setDateWindow(dateFrom, dateTo);
    if (dateMode === "Month" && /^\d{4}-\d{2}$/.test(month)) {
      const [selectedYear, selectedMonth] = month.split("-").map(Number);
      setDateWindow(`${month}-01`, toIsoDate(new Date(Date.UTC(selectedYear, selectedMonth, 0))));
    }
    if (dateMode === "Year" && /^\d{4}$/.test(year)) setDateWindow(`${year}-01-01`, `${year}-12-31`);
    if (dateMode === "Week" && /^\d{4}-W\d{2}$/.test(week)) {
      const [weekYear, weekNumber] = week.split("-W").map(Number);
      const fourth = new Date(Date.UTC(weekYear, 0, 4));
      const start = new Date(fourth);
      start.setUTCDate(fourth.getUTCDate() - (fourth.getUTCDay() || 7) + 1 + (weekNumber - 1) * 7);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
      setDateWindow(toIsoDate(start), toIsoDate(end));
    }
    apiFetch(`/api/v1/admin/kids-champ/submissions/page?${params}`)
      .then(async (response) => {
        if (!response.ok) { const error=await response.json().catch(()=>null) as {message?:string;code?:string}|null; throw new Error(error?.message||`The backend returned HTTP ${response.status}.`); }
        const body = (await response.json()) as AdminSubmissionPageResponse;
        if (!cancelled) {
          setRecords(body.items.map(toMockSubmission));
          setSubmissionTotalItems(body.totalItems);
          setSubmissionTotalPages(body.totalPages);
          setSelected(new Set());
          setBackendState("live");
          setConnectionReason("Database and Kids Champ service are connected.");
          setLastConnectionCheck(new Date());
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setRecords([]);
          setBackendState("error");
          setConnectionReason(reason instanceof Error?reason.message:"The Kids Champ service could not be reached.");
          setLastConnectionCheck(new Date());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [submissionPage, search, approvalFilter, locationFilter, exactAge, ageMin, ageMax, dateMode, specificDate, dateFrom, dateTo, month, year, week]);

  async function saveSubmission(updated: MockSubmission) {
    const current = records.find((item) => item.id === updated.id);
    if (!current || backendState !== "live") {
      notify("Submission changes cannot be saved while the backend is unavailable.");
      return;
    }
    try {
      let saved: AdminSubmissionResponse | null = null;
      if (current.category !== updated.category) {
        const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            category: updated.category,
          }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "The submission update could not be saved.");
        saved = body as AdminSubmissionResponse;
      }
      if (current.reviewStatus !== updated.reviewStatus) {
        const status = updated.reviewStatus === "Approved" ? "APPROVED" : updated.reviewStatus === "Rejected" ? "REJECTED" : updated.reviewStatus === "Under review" ? "UNDER_REVIEW" : "SUBMITTED";
        const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${updated.id}/review`, { method: "PATCH", body: JSON.stringify({ status, reason: updated.reviewStatus === "Rejected" ? "Rejected from the administrator review panel." : null }) });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "The submission review could not be saved.");
        saved = body as AdminSubmissionResponse;
      }
      const next = saved ? toMockSubmission(saved) : current;
      setRecords((items) => items.map((item) => item.id === updated.id ? next : item));
      if (current.childName !== updated.childName || current.trackingCode !== updated.trackingCode || current.age !== updated.age || current.location !== updated.location || current.participantType !== updated.participantType || current.reviewer !== updated.reviewer || current.submittedDate !== updated.submittedDate) notify("Only submission category and review status can be changed here; profile details stay protected in the account record.");
      else notify("Submission changes saved to the backend.");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "The submission update could not be saved.");
    }
  }
  const locations = [...new Set(records.map((item) => item.location))].sort();
  const visible = useMemo(
    () =>
      records.filter((item) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          item.childName.toLowerCase().includes(query) ||
          item.trackingCode.toLowerCase().includes(query);
        const matchesApproval =
          approvalFilter === "All" ||
          (approvalFilter === "Waiting"
            ? item.reviewStatus === "New" || item.reviewStatus === "Pending review" || item.reviewStatus === "Under review"
            : approvalFilter === "Not approved"
            ? item.reviewStatus !== "Approved"
            : approvalFilter === "New"
              ? item.reviewStatus === "New"
              : item.reviewStatus === approvalFilter);
        const matchesAge =
          (!exactAge || item.age === Number(exactAge)) &&
          (!ageMin || item.age >= Number(ageMin)) &&
          (!ageMax || item.age <= Number(ageMax));
        const matchesLocation =
          locationFilter === "All" || item.location === locationFilter;
        let matchesDate = true;
        if (dateMode === "Specific date")
          matchesDate = calendarFilter?.mode === "reviewed"
            ? item.reviewedDate === specificDate
            : item.submittedDate === specificDate;
        if (dateMode === "Date range")
          matchesDate =
            item.submittedDate >= dateFrom && item.submittedDate <= dateTo;
        if (dateMode === "Month")
          matchesDate = item.submittedDate.startsWith(month);
        if (dateMode === "Year")
          matchesDate = item.submittedDate.startsWith(year);
        if (dateMode === "Week" && week) {
          const [weekYear, weekNumber] = week.split("-W").map(Number);
          const fourth = new Date(Date.UTC(weekYear, 0, 4));
          const start = new Date(fourth);
          start.setUTCDate(
            fourth.getUTCDate() -
              (fourth.getUTCDay() || 7) +
              1 +
              (weekNumber - 1) * 7,
          );
          const end = new Date(start);
          end.setUTCDate(start.getUTCDate() + 6);
          const value = new Date(`${item.submittedDate}T00:00:00Z`);
          matchesDate = value >= start && value <= end;
        }
        return (
          matchesSearch &&
          matchesApproval &&
          matchesAge &&
          matchesLocation &&
          matchesDate
        );
      }),
    [
      records,
      search,
      approvalFilter,
      exactAge,
      ageMin,
      ageMax,
      locationFilter,
      dateMode,
      specificDate,
      dateFrom,
      dateTo,
      month,
      year,
      week,
      calendarFilter,
    ],
  );
  const pendingVisible = visible.filter((item) => item.reviewStatus !== "Approved" && item.reviewStatus !== "Rejected").length;
  function toggleSelection(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    const allSelected =
      visible.length > 0 && visible.every((item) => selected.has(item.id));
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((item) =>
        allSelected ? next.delete(item.id) : next.add(item.id),
      );
      return next;
    });
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (backendState !== "live") {
      notify("Submissions cannot be deleted while the backend is unavailable.");
      return;
    }
    const ids = [...selected];
    const results = await Promise.all(ids.map(async (id) => {
      const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${id}`, { method: "DELETE" });
      return { id, response };
    }));
    const failed = results.filter(({ response }) => !response.ok);
    if (failed.length) {
      notify(`${failed.length} submission${failed.length === 1 ? "" : "s"} could not be deleted. Batched submissions are protected.`);
    }
    const deletedIds = new Set(results.filter(({ response }) => response.ok).map(({ id }) => id));
    setRecords((current) => current.filter((item) => !deletedIds.has(item.id)));
    notify(
      `${deletedIds.size} submission${deletedIds.size === 1 ? "" : "s"} deleted from the database.`,
    );
    setSelected(new Set());
  }

  async function approveSubmissions(ids: string[]) {
    if (!ids.length) return;
    if (backendState !== "live") {
      notify("Submissions cannot be approved while the backend is unavailable.");
      return;
    }
    const response = await apiFetch("/api/v1/admin/kids-champ/submissions/approve", {
      method: "POST",
      body: JSON.stringify({ submissionIds: ids }),
    });
    const body = await response.json().catch(() => null) as { approvedCount?: number; alreadyApprovedCount?: number; message?: string } | null;
    if (!response.ok) {
      notify(body?.message || "The approval could not be saved.");
      return;
    }
    const approvedIds = new Set(ids);
    setRecords((current) => current.map((item) => approvedIds.has(item.id) ? { ...item, reviewStatus: "Approved" } : item));
    const newlyApproved = body?.approvedCount ?? 0;
    const alreadyApproved = body?.alreadyApprovedCount ?? 0;
    notify(`${newlyApproved} approved${alreadyApproved ? `; ${alreadyApproved} already approved and ignored` : ""}. ZIP processing started automatically.`);
    setSelected(new Set());
  }

  function approveSelected() { void approveSubmissions([...selected]); }

  function approveAllVisible() {
    void approveSubmissions(visible.filter((item) => item.reviewStatus !== "Approved").map((item) => item.id));
  }

  function exportVisible() {
    const headers = [
      "Child",
      "Tracking code",
      "Age",
      "Home town",
      "Category",
      "Approval",
      "Submitted date",
    ];
    const rows = visible.map((item) => [
      item.childName,
      item.trackingCode,
      item.age,
      item.location,
      item.category,
      item.reviewStatus === "Approved" ? "Approved" : "Not approved",
      item.submittedDate,
    ]);
    const escapeXml = (value: string | number) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const xmlRows = [headers, ...rows]
      .map(
        (row, rowIndex) =>
          `<Row>${row.map((cell) => `<Cell><Data ss:Type="${rowIndex && typeof cell === "number" ? "Number" : "String"}">${escapeXml(cell)}</Data></Cell>`).join("")}</Row>`,
      )
      .join("");
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Submissions"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${workbook}`], { type: "application/vnd.ms-excel" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "kids-champ-filtered-submissions.xls";
    link.click();
    URL.revokeObjectURL(url);
    notify(`${visible.length} filtered records exported.`);
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E0E8F1] bg-white shadow-[0_10px_28px_rgba(30,72,123,.05)]">
      <div className="flex flex-col gap-4 p-5 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-.025em]">Submission workspace</h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">Approve and manage every Kids Champ entry on one page. Approved photos are queued for ZIP processing automatically.</p>
        </div>
        <button type="button" onClick={()=>setConnectionOpen(true)} className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2488F4] ${backendState === "live" ? "bg-emerald-50 text-emerald-700" : backendState === "loading" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}><i className={`size-2 rounded-full ${backendState === "live" ? "bg-emerald-500" : backendState === "loading" ? "bg-blue-500" : "bg-amber-500"}`} />{backendState === "live" ? "Database connected" : backendState === "loading" ? "Loading data" : "Database unavailable"}</button>
      </div>
      {connectionOpen?<div className="fixed inset-0 z-[190] grid place-items-center bg-[#102044]/30 p-4"><div className="w-full max-w-md rounded-[20px] border border-[#E0E8F2] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#2488F4]">Connection status</p><h3 className="mt-1 text-[20px] font-semibold">{backendState==="live"?"Database connected":backendState==="loading"?"Checking connection":"Database unavailable"}</h3></div><button onClick={()=>setConnectionOpen(false)} className="grid size-8 place-items-center rounded-full bg-[#F2F6FB] text-[#526178]">×</button></div><div className={`mt-5 rounded-[13px] border p-4 text-[12px] leading-5 ${backendState==="live"?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-amber-200 bg-amber-50 text-amber-900"}`}><p className="font-semibold">{connectionReason}</p>{lastConnectionCheck?<p className="mt-2 text-[11px] opacity-75">Last checked: {lastConnectionCheck.toLocaleTimeString()}</p>:null}</div>{backendState!=="live"?<div className="mt-4 rounded-[13px] bg-[#F7FAFE] p-4 text-[12px] leading-5 text-[#526178]"><p className="font-semibold text-[#263852]">What an administrator can check</p><ul className="mt-2 list-disc space-y-1 pl-4"><li>Confirm the API server is running on the configured address.</li><li>Check the database service and its connection settings.</li><li>Confirm your network can reach the API, then click the status chip again after a retry.</li></ul></div>:null}<button onClick={()=>{setConnectionOpen(false);setSubmissionPage(0);}} className={`${primaryButton} mt-5 w-full`}>{backendState==="live"?"Close":"Retry connection"}</button></div></div>:null}
      {calendarFilter ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-blue-900">
            Showing submissions {calendarFilter.mode === "reviewed" ? "reviewed" : "received"} on {calendarFilter.date}
          </p>
          <button type="button" onClick={clearCalendarFilter} className="text-[12px] font-semibold text-blue-700 hover:underline">
            Show all submissions
          </button>
        </div>
      ) : null}
      <div className="border-t border-[#E5EBF2]">
        <div className="grid gap-3 bg-[#FBFDFF] p-4 tablet:grid-cols-3">
          {[{ icon: "◷", label: "Waiting for approval", value: summaryTotals.pendingReviews, style: "border-[#FBD589] bg-[#FFFAEC] text-[#9A4F00]", action:()=>{setApprovalFilter("Waiting");setSubmissionPage(0);notify("Showing submissions waiting for approval.");} }, { icon: "✓", label: "Approved", value: summaryTotals.approved, style: "border-[#A9E9CF] bg-[#F1FCF7] text-[#087D55]", action:()=>{setApprovalFilter("Approved");setSubmissionPage(0);notify("Showing approved submissions.");} }, { icon: "♧", label: "Matching records", value: summaryTotals.totalSubmissions, style: "border-[#B9D6FF] bg-[#F2F7FF] text-[#1154B5]", action:()=>{setApprovalFilter("All");setSearch("");setSubmissionPage(0);notify("Showing all records.");} }].map((metric) => <button type="button" key={metric.label} onClick={metric.action} className={`relative overflow-hidden rounded-[10px] border px-5 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2488F4] ${metric.style}`}><span className="absolute right-5 top-3 grid size-10 place-items-center rounded-full bg-current/10 text-[22px]">{metric.icon}</span><strong className="block text-[27px] leading-none">{metric.value}</strong><span className="mt-1.5 block text-[11px] font-semibold">{metric.label}</span></button>)}
        </div>
        <div className="flex flex-col gap-3 border-b border-[#E5EBF2] p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <label className="relative w-full max-w-sm">
            <span className="sr-only">Search submissions</span>
            <input
              value={search}
              onChange={(event) => { setSubmissionPage(0); setSearch(event.target.value); }}
              className={fieldClass}
              placeholder="Search child name or tracking code"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["All", "New", "Not approved", "Approved"] as const).map((filter) => <button key={filter} type="button" onClick={() => { setSubmissionPage(0); setApprovalFilter(filter); }} className={`h-9 rounded-[10px] border px-3 text-[11px] font-semibold ${approvalFilter === filter ? "border-[#9ED1FF] bg-[#EAF5FF] text-[#0877EF]" : "border-[#E1E8F0] bg-white text-[#68778C] hover:border-[#BDD8F5]"}`}>{filter === "Not approved" ? "Waiting" : filter === "New" ? "New submissions" : filter}</button>)}
            <button onClick={approveAllVisible} disabled={!pendingVisible} className="h-10 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40">Approve {pendingVisible || "all"} shown</button>
            <button
              onClick={() => setFiltersOpen((value) => !value)}
              className={`${secondaryButton} ${filtersOpen ? "border-blue-300 bg-blue-50 text-blue-700" : ""}`}
            >
              Filters
            </button>
            <button onClick={exportVisible} className={secondaryButton}>
              Export filtered
            </button>
          </div>
        </div>
        {filtersOpen ? (
          <div className="grid gap-3 border-b border-[#E5EBF2] bg-[#F8FAFC] p-4 tablet:grid-cols-3 desktop:grid-cols-6">
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Exact age
              <input
                type="number"
                min="1"
                value={exactAge}
                onChange={(event) => { setSubmissionPage(0); setExactAge(event.target.value); }}
                className={`${fieldClass} mt-1`}
                placeholder="Any"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Age from
              <input
                type="number"
                min="1"
                value={ageMin}
                onChange={(event) => { setSubmissionPage(0); setAgeMin(event.target.value); }}
                className={`${fieldClass} mt-1`}
                placeholder="Min"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Age to
              <input
                type="number"
                min="1"
                value={ageMax}
                onChange={(event) => { setSubmissionPage(0); setAgeMax(event.target.value); }}
                className={`${fieldClass} mt-1`}
                placeholder="Max"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Approval
              <select
                value={approvalFilter}
                onChange={(event) => { setSubmissionPage(0); setApprovalFilter(event.target.value); }}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                <option>Approved</option>
                <option>Not approved</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Home town
              <select
                value={locationFilter}
                onChange={(event) => { setSubmissionPage(0); setLocationFilter(event.target.value); }}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                {locations.map((location) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Sent date
              <select
                value={dateMode}
                onChange={(event) => { setSubmissionPage(0); setDateMode(event.target.value); }}
                className={`${fieldClass} mt-1`}
              >
                <option>Any time</option>
                <option>Specific date</option>
                <option>Date range</option>
                <option>Week</option>
                <option>Month</option>
                <option>Year</option>
              </select>
            </label>
            {dateMode === "Specific date" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Date
                <input
                  type="date"
                  value={specificDate}
                  onChange={(event) => { setSubmissionPage(0); setSpecificDate(event.target.value); }}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Date range" ? (
              <>
                <label className="text-[10px] font-semibold uppercase text-[#748197]">
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => { setSubmissionPage(0); setDateFrom(event.target.value); }}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
                <label className="text-[10px] font-semibold uppercase text-[#748197]">
                  To
                  <input
                    type="date"
                    min={dateFrom}
                    value={dateTo}
                    onChange={(event) => { setSubmissionPage(0); setDateTo(event.target.value); }}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
              </>
            ) : null}
            {dateMode === "Week" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Week
                <input
                  type="week"
                  value={week}
                  onChange={(event) => { setSubmissionPage(0); setWeek(event.target.value); }}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Month" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Month
                <input
                  type="month"
                  value={month}
                  onChange={(event) => { setSubmissionPage(0); setMonth(event.target.value); }}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Year" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Year
                <select
                  value={year}
                  onChange={(event) => { setSubmissionPage(0); setYear(event.target.value); }}
                  className={`${fieldClass} mt-1`}
                >
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                </select>
              </label>
            ) : null}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setExactAge("");
                  setAgeMin("");
                  setAgeMax("");
                  setApprovalFilter("All");
                  setLocationFilter("All");
                  setSubmissionPage(0);
                  setDateMode("Any time");
                }}
                className={`${secondaryButton} w-full`}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : null}
        {selected.size ? (
          <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
            <strong className="mr-2 text-[12px] text-blue-900">
              {selected.size} selected
            </strong>
            <button
              onClick={() => void approveSelected()}
              className="h-9 rounded-[9px] bg-emerald-600 px-3 text-[11px] font-semibold text-white hover:bg-emerald-700"
            >
              Approve selected
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-9 rounded-[9px] bg-red-600 px-3 text-[11px] font-semibold text-white"
            >
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[11px] font-semibold text-blue-700"
            >
              Clear selection
            </button>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[.04em] text-[#718096] shadow-[0_1px_0_#E5EBF2]">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      visible.length > 0 &&
                      visible.every((item) => selected.has(item.id))
                    }
                    onChange={selectAllVisible}
                    aria-label="Select all filtered submissions"
                    className="size-4 accent-[#2488F4]"
                  />
                </th>
                <th className="px-3 py-3">Photo</th>
                <th className="px-3 py-3">Child</th>
                <th className="px-3 py-3">Tracking code</th>
                <th className="px-3 py-3">Age / home town</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Sent</th>
                <th className="px-3 py-3 text-center">Approval</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <SubmissionRow
                  key={item.id}
                  item={item}
                  privacy={privacy}
                  selected={selected.has(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                  onOpen={() =>
                    openSubmission(item, (updated) => void saveSubmission(updated))
                  }
                  notify={notify}
                />
              ))}
            </tbody>
          </table>
          {!visible.length ? (
            <div className="py-16 text-center text-[13px] text-[#8490A2]">
              No submissions match the selected filters.
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-[#E5EBF2] px-4 py-3">
          <p className="text-[12px] text-[#8490A2]">
            Showing {visible.length} matching records from {submissionTotalItems} submissions
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => setSubmissionPage((page) => Math.max(0, page - 1))} disabled={submissionPage === 0 || backendState !== "live"} className="text-[11px] font-semibold text-[#0877EF] disabled:opacity-35">Previous</button>
            <span className="text-[11px] text-[#66758B]">Page {submissionTotalPages ? submissionPage + 1 : 0} of {submissionTotalPages}</span>
            <button onClick={() => setSubmissionPage((page) => Math.min(Math.max(0, submissionTotalPages - 1), page + 1))} disabled={backendState !== "live" || submissionPage >= submissionTotalPages - 1} className="text-[11px] font-semibold text-[#0877EF] disabled:opacity-35">Next</button>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${backendState === "live" ? "bg-emerald-50 text-emerald-700" : backendState === "loading" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
              {backendState === "live" ? "Live backend data" : backendState === "loading" ? "Loading backend data" : "Backend unavailable"}
            </span>
          </div>
        </div>
      </div>
      {deleteConfirmOpen ? (
        <ConfirmationDialog
          title={`Delete ${selected.size} submission${selected.size === 1 ? "" : "s"}?`}
          description="The selected records will be soft-deleted from the database and recorded in the backend audit log. Submissions already assigned to a ZIP batch are protected."
          confirmLabel="Delete submissions"
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            void deleteSelected();
            setDeleteConfirmOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

type CampaignStatus = "Unsent" | "Queued" | "Sending" | "Sent" | "Error" | "Ignored";
type CampaignRecipient = {
  id: string;
  participantId: string;
  name: string;
  phone: string;
  trackingCode: string;
  status: CampaignStatus;
  attempts: number;
  selected: boolean;
  campaignId?: string;
  deliveryId?: number;
  failureReason?: string;
};

type CampaignQueueItem = {
  id: string;
  channel: string;
  status: string;
  recipientCount: number;
  messageTemplate: string;
  createdAt: string;
};

type QueuedDelivery = {
  id: number;
  name: string;
  destination: string;
  status: string;
  attempts: number;
  failureReason?: string;
};

function WhatsAppQueueModal({ onClose, notify, initialFilter = "ALL" }: { onClose: () => void; notify: (message: string) => void; initialFilter?: string }) {
  const [campaigns, setCampaigns] = useState<CampaignQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<QueuedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [campaignFilter, setCampaignFilter] = useState(initialFilter);

  useEffect(() => {
    const load = async () => {
      const response = await apiFetch("/api/v1/admin/kids-champ/campaigns");
      if (!response.ok) { notify("Message queue could not be loaded."); setLoading(false); return; }
      const items = await response.json() as CampaignQueueItem[];
      setCampaigns(items.filter((item) => item.channel === "WHATSAPP"));
      setLoading(false);
    };
    void load();
  }, [notify]);

  useEffect(() => {
    if (!selectedId) return;
    const load = async () => {
      const response = await apiFetch(`/api/v1/admin/kids-champ/campaigns/${selectedId}/recipients`);
      if (response.ok) setDeliveries(await response.json() as QueuedDelivery[]);
    };
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [selectedId]);

  async function actOnSelectedCampaigns(action: "retry" | "ignore" | "delete") {
    const campaignIds = [...selectedCampaigns];
    if (!campaignIds.length) return;
    const records = await Promise.all(campaignIds.map(async (id) => { const response = await apiFetch(`/api/v1/admin/kids-champ/campaigns/${id}/recipients`); return response.ok ? await response.json() as QueuedDelivery[] : []; }));
    const recipientIds = records.flat().filter((item) => item.status === "FAILED").map((item) => item.id);
    if (!recipientIds.length) { notify("The selected campaigns have no failed messages to process."); return; }
    const response = await apiFetch(`/api/v1/admin/kids-champ/campaign-recipients/${action}`, { method: "POST", body: JSON.stringify({ recipientIds }) });
    if (!response.ok) { notify("Selected campaigns could not be updated."); return; }
    setSelectedCampaigns(new Set());
    if (selectedId && campaignIds.includes(selectedId)) setDeliveries((current) => current.map((item) => item.status === "FAILED" ? { ...item, status: action === "retry" ? "QUEUED" : action === "ignore" ? "SKIPPED" : "DELETED", failureReason: action === "retry" ? undefined : item.failureReason } : item));
    notify(`${recipientIds.length} failed message${recipientIds.length === 1 ? "" : "s"} ${action === "retry" ? "queued for retry" : action === "ignore" ? "ignored" : "deleted from the queue"}.`);
  }
  const visibleCampaigns = campaigns.filter((item) => {
    if (campaignFilter === "ALL") return true;
    if (campaignFilter === "ATTENTION") return item.status === "FAILED" || item.status === "PARTIAL";
    return item.status === campaignFilter;
  });
  const queueStats = [
    { label: "Needs attention", value: campaigns.filter((item) => item.status === "FAILED" || item.status === "PARTIAL").reduce((sum, item) => sum + item.recipientCount, 0), detail: "Requires action", style: "border-orange-100 bg-orange-50 text-orange-700", icon: "!" },
    { label: "Retry ready", value: campaigns.filter((item) => item.status === "FAILED").reduce((sum, item) => sum + item.recipientCount, 0), detail: "Ready to resend", style: "border-blue-100 bg-blue-50 text-blue-700", icon: "↻" },
    { label: "Delivered", value: campaigns.filter((item) => item.status === "COMPLETED").reduce((sum, item) => sum + item.recipientCount, 0), detail: "Successfully sent", style: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: "✓" },
    { label: "Errors", value: campaigns.filter((item) => item.status === "FAILED").reduce((sum, item) => sum + item.recipientCount, 0), detail: "Delivery failed", style: "border-red-100 bg-red-50 text-red-600", icon: "×" },
  ];

  return <div className="fixed inset-0 z-[115] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="wp-queue-title">
    <section className="flex h-[88vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
      <header className="border-b border-[#E3E9F0] p-5"><div className="flex items-start justify-between"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#20B65B] text-lg text-white">◔</span><div><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#20A45A]">WhatsApp</p><h2 id="wp-queue-title" className="mt-1 text-[22px] font-semibold">Message queue</h2><p className="mt-1 text-[12px] text-[#7A879A]">Live delivery status. Select a campaign to view each recipient.</p></div></div><button onClick={onClose} className="grid size-9 place-items-center rounded-[10px] border border-[#D7E2EE]" aria-label="Close message queue">×</button></div><div className="mt-5 grid gap-3 tablet:grid-cols-4">{queueStats.map((item) => <div key={item.label} className={`flex items-center gap-3 rounded-[10px] border p-3 ${item.style}`}><span className="grid size-8 place-items-center rounded-full bg-white/70 text-[20px] font-bold">{item.icon}</span><span><strong className="block text-[19px] leading-none">{item.value.toLocaleString()}</strong><span className="mt-1 block text-[10px] font-bold">{item.label}</span><span className="block text-[9px] opacity-70">{item.detail}</span></span></div>)}</div></header>
      <div className="grid min-h-0 flex-1 tablet:grid-cols-[390px_1fr]">
        <div className="min-h-0 overflow-y-auto border-b border-[#E3E9F0] p-4 tablet:border-b-0 tablet:border-r">
          <div className="mb-3 flex flex-wrap items-center gap-2"><select value={campaignFilter} onChange={(event) => { setSelectedCampaigns(new Set()); setCampaignFilter(event.target.value); }} className="rounded-[8px] border border-[#D8E2EC] px-2 py-1 text-[11px]"><option value="ALL">All campaigns</option><option value="ATTENTION">Needs attention</option><option value="FAILED">Failed only</option><option value="QUEUED">Queued</option><option value="COMPLETED">Sent</option><option value="PARTIAL">Partially sent</option></select><button onClick={() => setSelectedCampaigns(new Set(visibleCampaigns.map((item) => item.id)))} className="text-[11px] font-semibold text-[#0877EF]">Select filtered</button><button onClick={() => void actOnSelectedCampaigns("retry")} disabled={!selectedCampaigns.size} className="rounded-[8px] bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40">Retry selected</button><button onClick={() => void actOnSelectedCampaigns("ignore")} disabled={!selectedCampaigns.size} className="rounded-[8px] border border-slate-300 px-2 py-1 text-[10px] font-semibold disabled:opacity-40">Ignore selected</button><button onClick={() => void actOnSelectedCampaigns("delete")} disabled={!selectedCampaigns.size} className="rounded-[8px] border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 disabled:opacity-40">Delete selected</button></div>{loading ? <p className="p-3 text-[12px] text-[#7A879A]">Loading queue…</p> : visibleCampaigns.length ? visibleCampaigns.map((item) => <div key={item.id} className={`mb-2 flex items-start gap-2 rounded-[12px] border p-3 ${selectedId === item.id ? "border-emerald-300 bg-emerald-50" : "border-[#E1E7EE]"}`}><input type="checkbox" checked={selectedCampaigns.has(item.id)} onChange={() => setSelectedCampaigns((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} className="mt-1 size-4 accent-emerald-600" aria-label={`Select campaign ${item.id}`} /><button onClick={() => { setDeliveries([]); setSelectedId(item.id); }} className="min-w-0 flex-1 text-left"><div className="flex justify-between gap-2"><strong className="text-[12px]">{item.recipientCount} recipient{item.recipientCount === 1 ? "" : "s"}</strong><StatusBadge label={item.status === "COMPLETED" ? "Sent" : item.status === "PARTIAL" ? "Partial" : item.status === "FAILED" ? "Error" : "Queued"} /></div><p className="mt-1 truncate text-[10px] text-[#7A879A]">{item.messageTemplate}</p></button></div>) : <p className="p-3 text-[12px] text-[#7A879A]">No WhatsApp campaigns match this filter.</p>}
        </div>
        <div className="min-h-0 overflow-y-auto p-4">{selectedId ? <>{["Queued", "Sending", "Sent", "Failed", "Ignored"].map((label) => <span key={label} className="mr-2 text-[11px] text-[#66758B]">{label}: {deliveries.filter((item) => (label === "Failed" ? item.status === "FAILED" : item.status === label.toUpperCase())).length}</span>)}<div className="mt-4 divide-y divide-[#EDF1F5] rounded-[12px] border border-[#E1E7EE]">{deliveries.map((item) => <div key={item.id} className="flex items-center gap-3 p-3"><div className="min-w-0 flex-1"><strong className="block text-[12px]">{item.name}</strong><p className="text-[10px] text-[#8490A2]">{item.destination} · attempt {item.attempts}</p>{item.failureReason ? <p className="mt-1 text-[10px] text-red-700">{item.failureReason}</p> : null}</div><StatusBadge label={item.status === "FAILED" ? "Error" : item.status === "SKIPPED" ? "Ignored" : item.status === "READ" ? "Read" : item.status === "DELIVERED" ? "Delivered" : item.status === "SENT" ? "Accepted" : item.status === "SENDING" ? "Sending" : item.status === "DELETED" ? "Deleted" : "Queued"} /></div>)}</div></> : <p className="pt-8 text-center text-[12px] text-[#7A879A]">Select a campaign to see its messages.</p>}</div>
      </div>
    </section>
  </div>;
}

function WhatsAppCampaignModal({
  telecastDate,
  members,
  zipCode,
  onClose,
  notify,
}: {
  telecastDate: string;
  members: MockSubmission[];
  zipCode: string;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const englishTemplate = `Hello {name}, your Kids Champ artwork ({trackingCode}) is scheduled for telecast on {telecastDate}. Thank you for participating!`;
  const sinhalaTemplate = `ආයුබෝවන් {name}, ${zipCode} හි ඔබගේ Kids Champ නිර්මාණය ({trackingCode}) {telecastDate} දින රූපවාහිනියේ විකාශය කිරීමට නියමිතයි. සහභාගී වූ ඔබට ස්තූතියි!`;
  const [step, setStep] = useState<"Compose" | "Preview" | "Progress">(
    "Compose",
  );
  const [language, setLanguage] = useState<"English" | "Sinhala">("Sinhala");
  const [message, setMessage] = useState(sinhalaTemplate);
  const [filter, setFilter] = useState<"All" | CampaignStatus>("All");
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>(() =>
    members.map((item) => ({
      id: item.id,
      participantId: item.participantId,
      name: item.childName,
      phone: item.phone,
      trackingCode: item.trackingCode,
      status: "Unsent",
      attempts: 0,
      selected: true,
    })),
  );
  const recipientsRef = useRef(recipients);
  useEffect(() => { recipientsRef.current = recipients; }, [recipients]);
  const personalize = (recipient: CampaignRecipient) =>
    message
      .replaceAll("{name}", recipient.name)
      .replaceAll("{trackingCode}", recipient.trackingCode)
      .replaceAll("{telecastDate}", telecastDate || "the date to be announced");
  const counts = recipients.reduce(
    (result, item) => ({ ...result, [item.status]: result[item.status] + 1 }),
    { Queued: 0, Error: 0, Unsent: 0, Sending: 0, Sent: 0, Ignored: 0 } as Record<
      CampaignStatus,
      number
    >,
  );
  const completed = counts.Sent + counts.Error + counts.Ignored;
  const visible = recipients.filter(
    (item) => filter === "All" || item.status === filter,
  );

  async function startSending(ids?: string[]) {
    const targets =
      ids ??
      recipients
        .filter(
          (item) =>
            item.selected &&
            (item.status === "Unsent" || item.status === "Error"),
        )
        .map((item) => item.id);
    if (!targets.length) return;
    setStep("Progress");
    setSending(true);
    setRecipients((current) => current.map((item) => targets.includes(item.id) ? { ...item, status: "Sending" } : item));
    const targetRecipients = recipients.filter((item) => targets.includes(item.id));
    const results = await Promise.all(targetRecipients.map(async (recipient) => {
      const response = await apiFetch("/api/v1/admin/kids-champ/campaigns", {
        method: "POST",
        body: JSON.stringify({
          channel: "WHATSAPP",
          messageTemplate: personalize(recipient),
          participantIds: [recipient.participantId],
          templateName: language === "Sinhala" ? "kids_champ_telecast_si" : "kids_champ_telecast_en",
          languageCode: language === "Sinhala" ? "si_LK" : "en_US",
          templateParameters: language === "Sinhala"
            ? [recipient.name, zipCode, recipient.trackingCode, telecastDate]
            : [recipient.name, recipient.trackingCode, telecastDate],
        }),
      });
      const body = await response.json().catch(() => null) as { id?: string; message?: string } | null;
      return { id: recipient.id, ok: response.ok, campaignId: body?.id, message: response.ok ? undefined : body?.message };
    }));
    const resultById = new Map(results.map((result) => [result.id, result]));
    setRecipients((current) => current.map((item) => {
      const result = resultById.get(item.id);
      return result ? { ...item, status: result.ok ? "Queued" : "Error", campaignId: result.campaignId, attempts: item.attempts + 1, selected: !result.ok, failureReason: result.message } : item;
    }));
    setSending(false);
    const failed = results.filter((result) => !result.ok);
    notify(failed.length ? `${results.length - failed.length} messages queued; ${failed.length} could not be queued${failed[0].message ? `: ${failed[0].message}` : "."}` : `${results.length} personalized WhatsApp messages queued for delivery.`);
  }

  useEffect(() => {
    if (step !== "Progress") return;
    const refresh = async () => {
      const tracked = recipientsRef.current.filter((item) => item.campaignId);
      const updates = await Promise.all(tracked.map(async (item) => {
        const response = await apiFetch(`/api/v1/admin/kids-champ/campaigns/${item.campaignId}/recipients`);
        const body = response.ok ? await response.json() as Array<{ id:number; status:string; attempts:number; failureReason?:string }> : [];
        return { recipientId: item.id, delivery: body[0] };
      }));
      setRecipients((current) => current.map((item) => {
        const update = updates.find((value) => value.recipientId === item.id)?.delivery;
        if (!update) return item;
        const status: CampaignStatus = update.status === "SENT" || update.status === "DELIVERED" || update.status === "READ" ? "Sent" : update.status === "FAILED" ? "Error" : update.status === "SKIPPED" ? "Ignored" : update.status === "SENDING" ? "Sending" : "Queued";
        return { ...item, status, attempts: update.attempts, deliveryId: update.id, failureReason: update.failureReason };
      }));
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [step]);

  async function actionSelectedFailures(action: "retry" | "ignore") {
    const ids = recipients.filter((item) => item.selected && item.status === "Error" && item.deliveryId).map((item) => item.deliveryId as number);
    if (!ids.length) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/campaign-recipients/${action}`, { method: "POST", body: JSON.stringify({ recipientIds: ids }) });
    if (!response.ok) { notify(`Selected failed messages could not be ${action === "retry" ? "retried" : "ignored"}.`); return; }
    setRecipients((current) => current.map((item) => ids.includes(item.deliveryId ?? -1) ? { ...item, status: action === "retry" ? "Queued" : "Ignored", selected: false, failureReason: undefined } : item));
    notify(`${ids.length} failed message${ids.length === 1 ? "" : "s"} ${action === "retry" ? "queued for retry" : "ignored"}.`);
  }

  function toggleRecipient(id: string) {
    setRecipients((current) =>
      current.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  }

  if (minimized)
    return (
      <aside
        className="fixed bottom-5 right-5 z-[115] w-[340px] rounded-[16px] border border-emerald-200 bg-white p-4 shadow-2xl"
        aria-label="Minimized WhatsApp campaign"
      >
        <div className="flex items-center gap-3">
          <WhatsAppIcon />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">{zipCode}</p>
            <p className="text-[10px] text-[#7A879A]">
              {sending ? "Sending messages…" : "Campaign paused on screen"}
            </p>
          </div>
          <button
            onClick={() => setMinimized(false)}
            className="rounded-[8px] border border-[#DCE4ED] px-2.5 py-1.5 text-[10px] font-semibold text-[#526178]"
          >
            Expand
          </button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E7ECF2]">
          <div
            className="h-full rounded-full bg-[#20B15A] transition-all"
            style={{
              width: `${recipients.length ? (completed / recipients.length) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-semibold">
          <span className="text-emerald-700">{counts.Queued} queued</span>
          <span className="text-red-600">{counts.Error} errors</span>
          <span className="text-[#7A879A]">{counts.Unsent} unsent</span>
        </div>
      </aside>
    );

  return (
    <div
      className="fixed inset-0 z-[115] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wp-campaign-title"
      onMouseDown={() => !sending && onClose()}
    >
      <section
        className="flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[#E3E9F0] p-5">
          <div className="flex gap-3">
            <WhatsAppIcon />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#20A45A]">
                WhatsApp campaign
              </p>
              <h2
                id="wp-campaign-title"
                className="mt-1 text-[22px] font-semibold"
              >
                Telecast notification
              </h2>
              <p className="mt-1 text-[12px] text-[#7A879A]">
                Personalized delivery to every photo sender.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="grid size-9 place-items-center rounded-full border border-[#D7E2EE] text-[18px] text-[#66758B]"
              aria-label="Minimize campaign"
            >
              −
            </button>
            <button
              onClick={onClose}
              disabled={sending}
              className="grid size-9 place-items-center rounded-full border border-[#D7E2EE] disabled:opacity-40"
              aria-label="Close campaign"
            >
              x
            </button>
          </div>
        </header>
        <div className="flex gap-2 border-b border-[#E7ECF2] px-5 py-3">
          {(["Compose", "Preview", "Progress"] as const).map((item) => (
            <span
              key={item}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${step === item ? "bg-[#17243D] text-white" : "bg-[#F0F3F7] text-[#7A879A]"}`}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {step === "Compose" ? (
            <div className="grid gap-5 tablet:grid-cols-[1fr_280px]">
              <div>
                <div className="mb-4">
                  <p className="text-[12px] font-semibold text-[#526178]">Message language</p>
                  <div className="mt-2 inline-flex rounded-[10px] bg-[#F0F3F7] p-1">
                    {(["English", "Sinhala"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setLanguage(item);
                          setMessage(item === "Sinhala" ? sinhalaTemplate : englishTemplate);
                        }}
                        className={`rounded-[8px] px-4 py-2 text-[11px] font-semibold ${language === item ? "bg-white text-[#17243D] shadow-sm" : "text-[#7A879A]"}`}
                      >
                        {item === "Sinhala" ? "සිංහල" : "English"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="text-[12px] font-semibold text-[#526178]">
                  Message template
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-2 min-h-44 w-full rounded-[12px] border border-[#D8E2EC] p-3 text-[13px] leading-6 outline-none focus:border-[#2488F4]"
                  />
                </label>
                <p className="mt-2 text-[10px] text-[#8490A2]">
                  Variables: {`{name}`} · {`{trackingCode}`} ·{" "}
                  {`{telecastDate}`}
                </p>
              </div>
              <aside className="rounded-[14px] border border-[#DDE6EF] bg-[#F7FAFC] p-4">
                <h3 className="text-[13px] font-semibold">Delivery settings</h3>
                <p className="mt-3 text-[11px] text-[#7A879A]">Telecast date</p>
                <p className="mt-1 text-[14px] font-semibold">
                  {telecastDate || "Not scheduled"}
                </p>
                <p className="mt-4 text-[11px] text-[#7A879A]">Language</p>
                <p className="mt-1 text-[14px] font-semibold">{language === "Sinhala" ? "සිංහල" : "English"}</p>
                <p className="mt-4 text-[11px] text-[#7A879A]">Recipients</p>
                <p className="mt-1 text-[24px] font-semibold">
                  {recipients.filter((item) => item.selected).length}
                </p>
                <p className="mt-1 text-[10px] text-[#8490A2]">
                  Each message will use the child’s name.
                </p>
              </aside>
            </div>
          ) : null}
          {step === "Preview" ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[17px] font-semibold">
                    Confirm personalized messages
                  </h3>
                  <p className="mt-1 text-[12px] text-[#7A879A]">
                    Review samples and choose exactly who should receive them.
                  </p>
                </div>
                <strong className="text-[13px] text-[#20A45A]">
                  {recipients.filter((item) => item.selected).length} selected
                </strong>
              </div>
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {recipients.map((recipient) => (
                  <label
                    key={recipient.id}
                    className={`flex cursor-pointer gap-3 rounded-[13px] border p-3 ${recipient.selected ? "border-emerald-200 bg-emerald-50/60" : "border-[#E1E7EE]"}`}
                  >
                    <input
                      type="checkbox"
                      checked={recipient.selected}
                      onChange={() => toggleRecipient(recipient.id)}
                      className="mt-1 size-4 accent-emerald-600"
                    />
                    <span>
                      <strong className="text-[12px]">{recipient.name}</strong>
                      <span className="ml-2 text-[10px] text-[#8490A2]">
                        {recipient.phone}
                      </span>
                      <span className="mt-2 block rounded-[9px] bg-white p-2 text-[10px] leading-5 text-[#526178]">
                        {personalize(recipient)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {step === "Progress" ? (
            <div>
              <div className="grid grid-cols-3 gap-3 tablet:grid-cols-6">
                {[
                  ["Queued", counts.Queued, "text-blue-700 bg-blue-50"],
                  ["Sent", counts.Sent, "text-emerald-700 bg-emerald-50"],
                  ["Errors", counts.Error, "text-red-700 bg-red-50"],
                  ["Ignored", counts.Ignored, "text-slate-700 bg-slate-100"],
                  ["Unsent", counts.Unsent, "text-slate-700 bg-slate-50"],
                  ["Sending", counts.Sending, "text-blue-700 bg-blue-50"],
                ].map(([label, value, style]) => (
                  <div key={label} className={`rounded-[13px] p-4 ${style}`}>
                    <p className="text-[22px] font-semibold">{value}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="h-3 overflow-hidden rounded-full bg-[#E7ECF2]">
                  <div
                    className="h-full rounded-full bg-[#20B15A] transition-all"
                    style={{
                      width: `${recipients.length ? (completed / recipients.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-[#7A879A]">
                  Processed {completed} of {recipients.length}. Errors are
                  isolated and sending continues automatically.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(["All", "Queued", "Sending", "Sent", "Error", "Ignored", "Unsent"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-full px-3 py-2 text-[10px] font-semibold ${filter === item ? "bg-[#17243D] text-white" : "bg-[#F0F3F7] text-[#66758B]"}`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setRecipients((current) =>
                      current.map((item) =>
                        visible.some((record) => record.id === item.id)
                          ? { ...item, selected: true }
                          : item,
                      ),
                    )
                  }
                  disabled={sending}
                  className="ml-auto text-[10px] font-semibold text-[#0877EF]"
                >
                  Select filtered
                </button>
              </div>
              <div className="mt-3 divide-y divide-[#EDF1F5] rounded-[13px] border border-[#E1E7EE]">
                {visible.map((recipient) => (
                  <label
                    key={recipient.id}
                    className="flex items-center gap-3 px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={recipient.selected}
                      disabled={sending || recipient.status === "Sending"}
                      onChange={() => toggleRecipient(recipient.id)}
                      className="size-4 accent-[#2488F4]"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px]">
                        {recipient.name}
                      </strong>
                      <span className="text-[10px] text-[#8490A2]">
                        {recipient.phone} · attempt {recipient.attempts}
                      </span>
                    </span>
                    <StatusBadge label={recipient.status} />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t border-[#E3E9F0] p-4">
          <button
            onClick={() =>
              step === "Compose"
                ? onClose()
                : setStep(step === "Progress" ? "Preview" : "Compose")
            }
            disabled={sending}
            className={secondaryButton}
          >
            {step === "Compose" ? "Cancel" : "Back"}
          </button>
          {step === "Compose" ? (
            <button
              onClick={() => setStep("Preview")}
              disabled={!message.trim() || !telecastDate}
              className={`${primaryButton} disabled:opacity-40`}
            >
              Preview messages
            </button>
          ) : step === "Preview" ? (
            <button
              onClick={() => void startSending()}
              disabled={!recipients.some((item) => item.selected)}
              className="h-10 rounded-[10px] bg-[#20B15A] px-4 text-[12px] font-semibold text-white"
            >
              Confirm and queue campaign
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => void actionSelectedFailures("retry")}
                disabled={sending || !recipients.some((item) => item.selected && item.status === "Error")}
                className="h-10 rounded-[10px] border border-red-200 bg-red-50 px-4 text-[12px] font-semibold text-red-700 disabled:opacity-40"
              >
                Retry selected failed
              </button>
              <button
                onClick={() => void actionSelectedFailures("ignore")}
                disabled={sending || !recipients.some((item) => item.selected && item.status === "Error")}
                className="h-10 rounded-[10px] border border-slate-300 bg-white px-4 text-[12px] font-semibold text-slate-700 disabled:opacity-40"
              >
                Ignore selected failed
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}

type ZipCommonSettings = {
  batchSize: number;
  expiryDays: number;
  warningDays: number;
};

function ZipCommonSettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: ZipCommonSettings;
  onSave: (settings: ZipCommonSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(settings);
  return (
    <div
      className="fixed inset-0 z-[115] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zip-settings-title"
      onMouseDown={onClose}
    >
      <section
        className="w-full max-w-[520px] rounded-[20px] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-[#E3E9F0] p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#2488F4]">
              Common ZIP settings
            </p>
            <h2
              id="zip-settings-title"
              className="mt-1 text-[21px] font-semibold"
            >
              ZIP retention
            </h2>
            <p className="mt-1 text-[12px] text-[#7A879A]">
              Defaults applied to newly created ZIP batches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-[#D7E2EE]"
            aria-label="Close ZIP settings"
          >
            x
          </button>
        </header>
        <div className="grid gap-3 p-5 tablet:grid-cols-3">
          <label className="text-[10px] font-semibold uppercase text-[#748197]">
            Batch size
            <input
              type="number"
              min="1"
              value={draft.batchSize}
              onChange={(event) =>
                setDraft({ ...draft, batchSize: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#748197]">
            Expiry days
            <input
              type="number"
              min="1"
              value={draft.expiryDays}
              onChange={(event) =>
                setDraft({ ...draft, expiryDays: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#748197]">
            Warning days
            <input
              type="number"
              min="0"
              value={draft.warningDays}
              onChange={(event) =>
                setDraft({ ...draft, warningDays: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#E3E9F0] p-4">
          <button onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className={primaryButton}
          >
            Save settings
          </button>
        </footer>
      </section>
    </div>
  );
}

function TvZipWorkspace({
  openZip,
  notify,
  commonSettings,
  onSettingsChange,
  createRequest,
  onCreateRequestHandled,
  initialOverviewView,
}: {
  openZip: (
    item: ZipBatch,
    onDelete: (code: string) => void,
    onUpdate: (zip: ZipBatch) => void,
  ) => void;
  notify: (message: string) => void;
  commonSettings: ZipCommonSettings;
  onSettingsChange: (settings: ZipCommonSettings) => void;
  createRequest: string[];
  onCreateRequestHandled: () => void;
  initialOverviewView: OverviewZipView;
}) {
  const [zipRecords, setZipRecords] = useState<ZipBatch[]>([]);
  const [zipSearch, setZipSearch] = useState("");
  const [editingZipId, setEditingZipId] = useState<string | null>(null);
  const [zipStatus, setZipStatus] = useState("All");
  const [campaignZip, setCampaignZip] = useState<ZipBatch | null>(null);
  const [queueOpen, setQueueOpen] = useState(initialOverviewView === "whatsapp-attention");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [batchSubmissions, setBatchSubmissions] = useState<MockSubmission[]>([]);
  const [pendingZipSubmissions, setPendingZipSubmissions] = useState<MockSubmission[]>([]);
  const [pendingZipSelected, setPendingZipSelected] = useState<Set<string>>(new Set());
  const [creatingPendingZip, setCreatingPendingZip] = useState(false);
  const [advancedZipRecoveryOpen, setAdvancedZipRecoveryOpen] = useState(false);
  const [zipRecoveryReason, setZipRecoveryReason] = useState("");
  const [manualZipSearch, setManualZipSearch] = useState("");
  const [manualZipStatus, setManualZipStatus] = useState<"Ready to ZIP" | "Already ZIPped" | "All">("Ready to ZIP");
  const [manualZipDateMode, setManualZipDateMode] = useState<"Any time" | "Specific date" | "Date range">("Any time");
  const [manualZipDate, setManualZipDate] = useState("");
  const [manualZipFrom, setManualZipFrom] = useState("");
  const [manualZipTo, setManualZipTo] = useState("");
  const [zipProgress, setZipProgress] = useState({ readyPhotos: 0, activeTargetSize: commonSettings.batchSize, nextTargetSize: commonSettings.batchSize });
  const loadBatches = () => apiFetch("/api/v1/admin/kids-champ/batches")
    .then(async (response) => {
      if (!response.ok) throw new Error("ZIP batches could not be loaded.");
      setZipRecords(((await response.json()) as AdminBatchResponse[]).map(toZipBatch));
    })
    .catch((reason) => notify(reason instanceof Error ? reason.message : "ZIP batches could not be loaded."));
  useEffect(() => {
    void loadBatches();
    apiFetch("/api/v1/admin/kids-champ/batches/progress").then(async(response)=>{if(response.ok)setZipProgress(await response.json());}).catch(()=>undefined);
    apiFetch("/api/v1/admin/kids-champ/submissions").then(async(response)=>{if(response.ok){const submissions=((await response.json()) as AdminSubmissionResponse[]).map(toMockSubmission);setBatchSubmissions(submissions);const pending=submissions.filter((item)=>item.reviewStatus==="Approved"&&item.fileStatus==="Ready");setPendingZipSubmissions(pending);setPendingZipSelected(new Set());}}).catch(()=>undefined);
  // load once when this workspace mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!createRequest.length) return;
    const requestedCount = createRequest.length;
    const requestedIds = [...createRequest];
    onCreateRequestHandled();
    apiFetch("/api/v1/admin/kids-champ/batches/selected", {
      method: "POST",
      body: JSON.stringify({ submissionIds: requestedIds }),
    }).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The selected ZIP could not be created.");
      setZipRecords((current) => [{ ...toZipBatch(body as AdminBatchResponse), recipientIds: requestedIds }, ...current]);
      notify(`ZIP batch created with ${requestedCount} selected submission${requestedCount === 1 ? "" : "s"}.`);
    }).catch((reason) => notify(reason instanceof Error ? reason.message : "The selected ZIP could not be created."));
  }, [
    createRequest,
    commonSettings.expiryDays,
    notify,
    onCreateRequestHandled,
  ]);
  const visibleZips = zipRecords.filter(
    (item) =>
      (!zipSearch ||
        item.code.toLowerCase().includes(zipSearch.toLowerCase())) &&
      (initialOverviewView !== "telecasted" || item.telecastCompleted) &&
      (zipStatus === "All" ||
        (zipStatus === "Deleted"
          ? item.deleted
          : !item.deleted && item.status === zipStatus)),
  );
  const visibleManualZipSubmissions = useMemo(() => pendingZipSubmissions.filter((item) => {
    const query = manualZipSearch.trim().toLowerCase();
    if (query && !`${item.childName} ${item.trackingCode} ${item.location}`.toLowerCase().includes(query)) return false;
    const zipped = Boolean(item.batchId);
    if (manualZipStatus === "Ready to ZIP" && zipped) return false;
    if (manualZipStatus === "Already ZIPped" && !zipped) return false;
    if (manualZipDateMode === "Specific date" && manualZipDate && item.submittedDate !== manualZipDate) return false;
    if (manualZipDateMode === "Date range" && ((manualZipFrom && item.submittedDate < manualZipFrom) || (manualZipTo && item.submittedDate > manualZipTo))) return false;
    return true;
  }), [pendingZipSubmissions, manualZipSearch, manualZipStatus, manualZipDateMode, manualZipDate, manualZipFrom, manualZipTo]);
  async function deleteZip(code: string) {
    const item = zipRecords.find((record) => record.code === code);
    if (!item?.id) return;
    if (!item.downloaded) {
      notify("Download this ZIP before deleting its archive.");
      return;
    }
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${item.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "The ZIP archive could not be deleted."); return; }
    await loadBatches();
    notify(`${code} archive deleted. Its audit record has been retained.`);
  }

  async function createPendingZip() {
    const submissionIds=[...pendingZipSelected];
    if(!submissionIds.length)return;
    if(!zipRecoveryReason.trim()){notify("Add a recovery reason before creating a manual ZIP.");return;}
    setCreatingPendingZip(true);
    const response=await apiFetch("/api/v1/admin/kids-champ/batches/selected",{method:"POST",body:JSON.stringify({submissionIds,reason:zipRecoveryReason.trim()})});
    const body=await response.json().catch(()=>null);
    setCreatingPendingZip(false);
    if(!response.ok){notify(body?.message||"The selected ZIP could not be created.");return;}
    setZipRecords((current)=>[{...toZipBatch(body as AdminBatchResponse),recipientIds:submissionIds},...current]);
    setPendingZipSubmissions((current)=>current.filter((item)=>!pendingZipSelected.has(item.id)));
    setPendingZipSelected(new Set());
    setZipRecoveryReason("");
    setZipProgress((current)=>({...current,readyPhotos:Math.max(0,current.readyPhotos-submissionIds.length)}));
    notify(`ZIP batch created with ${submissionIds.length} approved submission${submissionIds.length===1?"":"s"}.`);
  }
  async function updateZip(updated: ZipBatch) {
    if (!updated.id || !updated.telecastDate) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${updated.id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ telecastDate: updated.telecastDate, alternateTelecastDate: null }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "The telecast schedule could not be saved."); return; }
    setZipRecords((current) => current.map((item) => item.id === updated.id ? toZipBatch(body as AdminBatchResponse) : item));
    notify(`${updated.code} updated.`);
  }
  async function completeTelecast(item: ZipBatch) {
    if (!item.id || !item.telecastDate || item.telecastCompleted) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${item.id}/telecast-complete`, { method: "POST" });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "The telecast could not be marked complete."); return; }
    setZipRecords((current) => current.map((record) => record.id === item.id ? toZipBatch(body as AdminBatchResponse) : record));
    notify(`${item.code} marked as telecast completed.`);
  }
  async function toggleEdited(item: ZipBatch) {
    if (!item.id || !item.downloaded || editingZipId) return;
    setEditingZipId(item.id);
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${item.id}/edited`, {
      method: "PATCH",
      body: JSON.stringify({ edited: !item.edited }),
    });
    const body = await response.json().catch(() => null);
    setEditingZipId(null);
    if (!response.ok) { notify(body?.message || "The edited status could not be saved."); return; }
    setZipRecords((current) => current.map((record) => record.id === item.id ? toZipBatch(body as AdminBatchResponse) : record));
    notify(`${item.code} edited status saved to the database.`);
  }
  async function downloadZip(item: ZipBatch) {
    if (item.deleted || item.status !== "Ready" || item.progress !== 100) {
      notify("This ZIP must be fully generated and Ready before downloading.");
      return;
    }
    if (!item.id) return;
    const response = await apiFetch(`/api/v1/admin/kids-champ/batches/${item.id}/download`);
    if (!response.ok) { notify("The ZIP archive could not be downloaded."); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.code}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setZipRecords((current) =>
      current.map((record) =>
        record.code === item.code
          ? { ...record, downloaded: true, downloadedAt: "2026-08-01" }
          : record,
      ),
    );
    notify(`${item.code} manifest downloaded.`);
  }
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold">ZIP operations</h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">
            Manage ZIP details, telecast dates and participant notifications.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-2 text-[12px] font-semibold text-emerald-700">Automatic ZIP: {zipProgress.readyPhotos} / {zipProgress.activeTargetSize} photos</span>
      </div>
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex w-full items-center justify-between rounded-[16px] border border-[#DCE5EF] bg-white p-4 text-left shadow-[0_8px_20px_rgba(35,69,118,.03)] transition hover:border-[#BFDDFB] hover:shadow-sm"
      >
        <span className="flex items-center gap-4">
          <span className="grid size-10 place-items-center rounded-full bg-[#EDF6FF] text-[24px] text-[#0877EF]">◷</span>
          <span>
          <strong className="text-[14px] text-[#263852]">ZIP retention</strong>
          <span className="mt-1 block text-[11px] text-[#7A879A]">
            Batch size, default expiry and warning periods.
          </span>
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-[8px] border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700">
            {commonSettings.batchSize} photos / batch
          </span>
          <span className="rounded-[8px] border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700">
            {commonSettings.expiryDays}-day expiry
          </span>
          <span className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
            Warn {commonSettings.warningDays} days before
          </span>
          <span className="ml-2 text-[#9AA5B5]">-&gt;</span>
        </span>
      </button>
      <section className="overflow-hidden rounded-[14px] border border-emerald-200 bg-[#F4FFF9]">
        <div className="flex flex-col gap-3 p-5 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-[18px] font-semibold text-emerald-950"><span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-600">☁</span>Automatic ZIP queue</h3>
            <p className="mt-1 text-[12px] text-emerald-800">Approved photos are added automatically. The ZIP starts when the configured batch size is reached.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAdvancedZipRecoveryOpen((value) => !value)} className={secondaryButton}>
              {advancedZipRecoveryOpen ? "Close advanced recovery" : "Advanced ZIP recovery"}
            </button>
            <button type="button" onClick={()=>setPendingZipSelected((current)=>new Set([...current,...visibleManualZipSubmissions.filter((item)=>!item.batchId).map((item)=>item.id)]))} disabled={!visibleManualZipSubmissions.some((item)=>!item.batchId)} className={advancedZipRecoveryOpen ? secondaryButton : "hidden"}>
              Select all
            </button>
            <button type="button" onClick={()=>setPendingZipSelected(new Set())} disabled={!pendingZipSelected.size} className={advancedZipRecoveryOpen ? secondaryButton : "hidden"}>
              Deselect all
            </button>
            <button type="button" onClick={()=>void createPendingZip()} disabled={!pendingZipSelected.size||creatingPendingZip} className={advancedZipRecoveryOpen ? `${primaryButton} disabled:cursor-not-allowed disabled:opacity-40` : "hidden"}>
              {creatingPendingZip?"Creating ZIP…":`Create ZIP (${pendingZipSelected.size})`}
            </button>
          </div>
        </div>
        {advancedZipRecoveryOpen ? <div className="mx-5 mt-5 space-y-3 rounded-[10px] border border-amber-200 bg-amber-50 p-3">
          <label className="block text-[10px] font-semibold uppercase text-amber-900">Recovery reason
            <input value={zipRecoveryReason} onChange={(event) => setZipRecoveryReason(event.target.value)} className={`${fieldClass} mt-1`} placeholder="Why must this ZIP be created manually?" />
          </label>
          <div className="grid gap-2 tablet:grid-cols-4"><input value={manualZipSearch} onChange={(event)=>setManualZipSearch(event.target.value)} className={fieldClass} placeholder="Search name, code or hometown" /><select value={manualZipStatus} onChange={(event)=>setManualZipStatus(event.target.value as typeof manualZipStatus)} className={fieldClass}><option>Ready to ZIP</option><option>Already ZIPped</option><option>All</option></select><select value={manualZipDateMode} onChange={(event)=>setManualZipDateMode(event.target.value as typeof manualZipDateMode)} className={fieldClass}><option>Any time</option><option>Specific date</option><option>Date range</option></select>{manualZipDateMode === "Specific date" ? <input type="date" value={manualZipDate} onChange={(event)=>setManualZipDate(event.target.value)} className={fieldClass} /> : manualZipDateMode === "Date range" ? <div className="flex gap-2"><input type="date" value={manualZipFrom} onChange={(event)=>setManualZipFrom(event.target.value)} className={`${fieldClass} min-w-0`} /><input type="date" value={manualZipTo} onChange={(event)=>setManualZipTo(event.target.value)} className={`${fieldClass} min-w-0`} /></div> : <span className="flex items-center text-[11px] font-semibold text-amber-800">{visibleManualZipSubmissions.length} matching photos</span>}</div>
          <p className="text-[10px] text-amber-800">New archive names use: <strong>ZipPhotoId001_name_age_Hometown</strong>. Already ZIPped photos are view-only.</p>
        </div> : null}
        <p className="mx-5 mb-5 rounded-[10px] border border-emerald-100 bg-white px-4 py-3 text-[12px] text-emerald-800">
          {zipProgress.readyPhotos} of {zipProgress.activeTargetSize} approved photos are in the automatic ZIP queue. {Math.max(0, zipProgress.activeTargetSize - zipProgress.readyPhotos)} more photo{Math.max(0, zipProgress.activeTargetSize - zipProgress.readyPhotos) === 1 ? "" : "s"} needed before the next ZIP begins.
        </p>
        {advancedZipRecoveryOpen && visibleManualZipSubmissions.length ? (
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E7EDF3]">
            {visibleManualZipSubmissions.map((item)=>(
              <label key={item.id} className={`flex items-center gap-4 px-5 py-3 ${item.batchId ? "cursor-not-allowed bg-slate-50 opacity-65" : "cursor-pointer hover:bg-[#F8FAFC]"}`}>
                <input type="checkbox" disabled={Boolean(item.batchId)} checked={pendingZipSelected.has(item.id)} onChange={()=>setPendingZipSelected((current)=>{const next=new Set(current);if(next.has(item.id))next.delete(item.id);else next.add(item.id);return next;})} className="size-4 accent-emerald-600"/>
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{item.childName}</p><p className="mt-0.5 text-[10px] text-[#7A879A]">{item.trackingCode} · {item.category} · {item.location}</p></div>
                <StatusBadge label={item.batchId ? "ZIPped" : "Approved"}/>
              </label>
            ))}
          </div>
        ) : advancedZipRecoveryOpen ? <p className="px-5 pb-5 text-[12px] text-[#7A879A]">No photos match the manual ZIP filters.</p> : null}
      </section>
      <section className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white shadow-[0_10px_28px_rgba(30,72,123,.05)]">
        <div className="flex flex-col gap-4 border-b border-[#E5EBF2] p-5 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <h3 className="text-[18px] font-semibold">ZIP records</h3>
            <p className="mt-1 text-[12px] text-[#8490A2]">
              Deleted files retain their complete audit records.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setQueueOpen(true)} className={secondaryButton}>
              Message queue
            </button>
            <input
              value={zipSearch}
              onChange={(event) => setZipSearch(event.target.value)}
              className={`${fieldClass} w-56`}
              placeholder="Search ZIP code"
            />
            <select
              value={zipStatus}
              onChange={(event) => setZipStatus(event.target.value)}
              className={`${fieldClass} w-40`}
            >
              <option>All</option>
              <option>Ready</option>
              <option>Creating ZIP</option>
              <option>Queued</option>
              <option>Deleted</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-[#EDF1F5]">
          {visibleZips.map((item) => (
            <article
              key={item.code}
              className={`grid items-center gap-3 px-5 py-4 transition hover:bg-[#F8FAFC] tablet:grid-cols-[1fr_110px_170px_100px_90px_270px] ${item.deleted ? "bg-red-50/35" : ""}`}
            >
              <button
                onClick={() => openZip(item, deleteZip, updateZip)}
                className="text-left"
              >
                <span className="flex items-center gap-2">
                  <strong className="text-[13px]">{item.code}</strong>
                </span>
                <span className="mt-1 block text-[11px] text-[#8490A2]">
                  {item.photos} photos · {item.size} · created {item.createdAt}
                  {item.downloadedAt ? ` · downloaded ${item.downloadedAt}` : ""}
                  {item.deleted ? ` · file deleted ${item.deletedAt}` : ""}
                </span>
              </button>
              <button
                onClick={() => openZip(item, deleteZip, updateZip)}
                className="flex justify-center [&>span]:min-w-[110px] [&>span]:justify-center"
                title="Open ZIP generation details"
              >
                <StatusBadge label={item.deleted ? "Deleted" : item.status} />
              </button>
              <label className="block text-[9px] font-semibold uppercase tracking-wide text-[#748197]">
                Telecast date
                <input
                  type="date"
                  value={item.telecastDate}
                  disabled={item.deleted || item.telecastCompleted}
                  onChange={(event) => {
                    const telecastDate = event.target.value;
                    setZipRecords((current) => current.map((record) => record.id === item.id
                      ? { ...record, telecastDate, telecastStatus: telecastDate ? "Scheduled" : "Not telecasted" }
                      : record));
                    if (telecastDate) void updateZip({ ...item, telecastDate, telecastStatus: "Scheduled" });
                  }}
                  className="mt-1 h-9 w-full rounded-[8px] border border-[#D8E2EC] bg-white px-2 text-[11px] font-medium normal-case tracking-normal text-[#344660] outline-none focus:border-[#2488F4] disabled:cursor-not-allowed disabled:bg-[#F3F5F8] disabled:text-[#A5AFBC]"
                  aria-label={`Telecast date for ${item.code}`}
                />
                <span className="mt-1 block normal-case tracking-normal"><StatusBadge label={item.telecastStatus} /></span>
              </label>
              <button
                onClick={() => openZip(item, deleteZip, updateZip)}
                className="text-left text-[12px] text-[#66758B]"
                title="Edit expiry"
              >
                Expires: {item.expires}
              </button>
              <label
                className={`flex items-center justify-center gap-2 rounded-[8px] px-2 py-2 text-[10px] font-semibold ${!item.downloaded ? "cursor-not-allowed bg-[#F3F5F8] text-[#B1B8C3] opacity-60" : item.edited ? "cursor-pointer bg-violet-50 text-violet-700" : "cursor-pointer bg-[#F3F5F8] text-[#7A879A]"}`}
                title={
                  !item.downloaded
                    ? "Download this ZIP before marking it edited"
                    : item.editedAt
                      ? `Marked edited ${item.editedAt}`
                      : "Mark this downloaded ZIP as edited"
                }
              >
                <input
                  type="checkbox"
                  checked={item.edited}
                  onChange={() => void toggleEdited(item)}
                  disabled={!item.downloaded || editingZipId === item.id}
                  className="size-4 accent-violet-600 disabled:cursor-not-allowed"
                />
                Edited
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => void completeTelecast(item)}
                  disabled={!item.telecastDate || item.telecastCompleted || item.deleted}
                  title={!item.telecastDate ? "Schedule the telecast first" : item.telecastCompleted ? "Telecast already completed" : "Mark this scheduled telecast as completed"}
                  className="rounded-[8px] border border-violet-200 bg-violet-50 px-2 py-2 text-[10px] font-semibold text-violet-700 disabled:opacity-35"
                >
                  {item.telecastCompleted ? "Completed" : "Complete"}
                </button>
                <button
                  onClick={() => setCampaignZip(item)}
                  disabled={!item.telecastDate || !item.recipientIds.length}
                  title={!item.telecastDate ? "Set the telecast date first" : !item.recipientIds.length ? "This ZIP has no message recipients" : `Notify every participant about the ${item.telecastDate} telecast`}
                  className="grid size-9 place-items-center rounded-[9px] border border-emerald-200 bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Message participants in ${item.code}`}
                >
                  <WhatsAppIcon />
                </button>
                <button
                  onClick={() => openZip(item, deleteZip, updateZip)}
                  disabled={item.deleted}
                  className="w-[46px] rounded-[8px] border border-violet-200 bg-violet-50 px-2 py-2 text-[10px] font-semibold text-violet-700 disabled:opacity-35"
                >
                  Edit
                </button>
                <button
                  onClick={() => downloadZip(item)}
                  disabled={
                    item.deleted ||
                    item.status !== "Ready" ||
                    item.progress !== 100
                  }
                  title={
                    item.downloaded
                      ? `Downloaded ${item.downloadedAt}`
                      : item.status !== "Ready" || item.progress !== 100
                        ? `ZIP generation is ${item.progress}% complete`
                        : "Download ZIP manifest"
                  }
                  className={`w-[94px] rounded-[8px] border px-2 py-2 text-[10px] font-semibold disabled:opacity-35 ${item.downloaded ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-700"}`}
                >
                  {item.downloaded ? "✓ Downloaded" : "Download"}
                </button>
                <button
                  onClick={() => setDeleteCode(item.code)}
                  disabled={item.deleted || !item.downloaded}
                  title={!item.downloaded ? "Download this ZIP before deleting it" : "Delete ZIP archive"}
                  className="w-[58px] rounded-[8px] border border-red-200 bg-red-50 px-2 py-2 text-[10px] font-semibold text-red-700 disabled:opacity-35"
                >
                  {item.deleted ? "Deleted" : "Delete"}
                </button>
              </div>
            </article>
          ))}
          {!visibleZips.length ? (
            <div className="py-14 text-center text-[13px] text-[#8490A2]">
              No ZIP records match this filter.
            </div>
          ) : null}
        </div>
      </section>
      {campaignZip ? (
        <WhatsAppCampaignModal
          zipCode={campaignZip.code}
          telecastDate={campaignZip.telecastDate}
          members={batchSubmissions.filter((item) =>
            campaignZip.recipientIds.includes(item.id),
          )}
          onClose={() => setCampaignZip(null)}
          notify={notify}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setQueueOpen(true)}
        className="fixed bottom-5 right-5 z-[105] flex items-center gap-2 rounded-full bg-[#17243D] px-4 py-3 text-[12px] font-semibold text-white shadow-xl transition hover:bg-[#243553]"
        aria-label="Open WhatsApp message queue"
        title="Open WhatsApp message queue"
      >
        <WhatsAppIcon />
        Message queue
      </button>
      {queueOpen ? <WhatsAppQueueModal onClose={() => setQueueOpen(false)} notify={notify} initialFilter={initialOverviewView === "whatsapp-attention" ? "ATTENTION" : "ALL"} /> : null}
      {settingsOpen ? (
        <ZipCommonSettingsModal
          settings={commonSettings}
          onSave={(settings) => {
            onSettingsChange(settings);
            notify("ZIP retention settings saved.");
          }}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
      {deleteCode ? (
        <ConfirmationDialog
          title={`Delete ${deleteCode} archive?`}
          description="The downloadable file will be removed, but its ZIP details, telecast record and edit history will remain available for audit purposes."
          confirmLabel="Delete archive"
          onCancel={() => setDeleteCode("")}
          onConfirm={() => {
            deleteZip(deleteCode);
            setDeleteCode("");
          }}
        />
      ) : null}
    </section>
  );
}


type ParticipantDelivery = ParticipantRecord & {
  delivery: "Unsent" | "Sending" | "Queued" | "Error";
};

function ParticipantMessageCampaign({
  members,
  onClose,
  notify,
  defaultTemplate,
}: {
  members: ParticipantRecord[];
  onClose: () => void;
  notify: (message: string) => void;
  defaultTemplate: string;
}) {
  const [step, setStep] = useState<"Compose" | "Confirm" | "Sending">(
    "Compose",
  );
  const [template, setTemplate] = useState(defaultTemplate);
  const [deliveries, setDeliveries] = useState<ParticipantDelivery[]>(() =>
    members.map((item) => ({ ...item, delivery: "Unsent" })),
  );
  const [currentId, setCurrentId] = useState("");
  const [running, setRunning] = useState(false);
  const personalize = (item: ParticipantRecord) =>
    template
      .replaceAll("{name}", item.name)
      .replaceAll("{reference}", item.reference)
      .replaceAll("{homeTown}", item.location);
  const sent = deliveries.filter((item) => item.delivery === "Queued").length;
  const errors = deliveries.filter((item) => item.delivery === "Error").length;
  const processed = sent + errors;
  const current = deliveries.find((item) => item.reference === currentId);

  async function startSending() {
    setStep("Sending");
    setRunning(true);
    const response=await apiFetch("/api/v1/admin/kids-champ/campaigns",{method:"POST",body:JSON.stringify({channel:"WHATSAPP",messageTemplate:template,participantIds:deliveries.map((item)=>item.reference)})});
    const body=await response.json().catch(()=>null);
    if(response.ok)setDeliveries((items)=>items.map((item)=>({...item,delivery:"Queued"})));
    else {setDeliveries((items)=>items.map((item)=>({...item,delivery:"Error"})));notify(body?.message||"Campaign could not be queued.");}
    setCurrentId("");
    setRunning(false);
    if(response.ok)notify("Participant campaign queued. Delivery will begin when a messaging provider is configured.");
  }

  return (
    <div
      className="fixed inset-0 z-[115] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participant-campaign-title"
    >
      <section className="flex max-h-[92vh] w-full max-w-[850px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#E3E9F0] p-5">
          <div className="flex gap-3">
            <WhatsAppIcon />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#20A45A]">
                Participant campaign
              </p>
              <h2
                id="participant-campaign-title"
                className="mt-1 text-[22px] font-semibold"
              >
                Send a thoughtful message
              </h2>
              <p className="mt-1 text-[12px] text-[#7A879A]">
                Each participant receives a message personalized with their own
                name.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="grid size-9 place-items-center rounded-full border border-[#D7E2EE] disabled:opacity-40"
            aria-label="Close campaign"
          >
            x
          </button>
        </header>
        <div className="flex gap-2 border-b border-[#E7ECF2] px-5 py-3">
          {(["Compose", "Confirm", "Sending"] as const).map((item) => (
            <span
              key={item}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${step === item ? "bg-[#17243D] text-white" : "bg-[#F0F3F7] text-[#7A879A]"}`}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {step === "Compose" ? (
            <div>
              <label className="text-[12px] font-semibold text-[#526178]">
                Message template
                <textarea
                  value={template}
                  onChange={(event) => setTemplate(event.target.value)}
                  className="mt-2 min-h-36 w-full rounded-[12px] border border-[#D8E2EC] p-3 text-[13px] leading-6 outline-none focus:border-[#2488F4]"
                />
              </label>
              <p className="mt-2 text-[10px] text-[#8490A2]">
                Variables: {`{name}`} · {`{reference}`} · {`{homeTown}`}
              </p>
              <div className="mt-5 rounded-[13px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold text-emerald-800">
                  Example for {members[0]?.name}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-emerald-900">
                  {members[0]
                    ? personalize(members[0])
                    : "No consented participants are selected."}
                </p>
              </div>
            </div>
          ) : null}
          {step === "Confirm" ? (
            <div>
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-[15px] font-semibold text-amber-900">
                  Confirm before sending
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-amber-800">
                  You are about to send {members.length} personalized WhatsApp
                  message{members.length === 1 ? "" : "s"}. Delivery will
                  continue if an individual number fails.
                </p>
              </div>
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {members.map((item) => (
                  <article
                    key={item.reference}
                    className="rounded-[13px] border border-[#E1E7EE] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[12px]">{item.name}</strong>
                      <span className="text-[10px] text-[#8490A2]">
                        {item.phone}
                      </span>
                    </div>
                    <p className="mt-2 rounded-[9px] bg-[#F6F8FA] p-2 text-[10px] leading-5 text-[#526178]">
                      {personalize(item)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
          {step === "Sending" ? (
            <div>
              <div className="text-center">
                <span
                  className={`mx-auto grid size-16 place-items-center rounded-full ${running ? "animate-pulse bg-emerald-100" : "bg-blue-50"}`}
                >
                  <WhatsAppIcon />
                </span>
                <h3 className="mt-4 text-[19px] font-semibold">
                  {running
                    ? `Sending to ${current?.name ?? "next participant"}`
                    : "Campaign complete"}
                </h3>
                <p className="mt-2 text-[12px] text-[#7A879A]">
                  {current
                    ? personalize(current)
                    : `${sent} messages queued for delivery.`}
                </p>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#E7ECF2]">
                <div
                  className="h-full rounded-full bg-[#20B15A] transition-all"
                  style={{
                    width: `${deliveries.length ? (processed / deliveries.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Queued", sent, "bg-emerald-50 text-emerald-700"],
                  ["Errors", errors, "bg-red-50 text-red-700"],
                  [
                    "Remaining",
                    deliveries.length - processed,
                    "bg-slate-50 text-slate-700",
                  ],
                ].map(([label, value, style]) => (
                  <div
                    key={label}
                    className={`rounded-[12px] p-3 text-center ${style}`}
                  >
                    <strong className="text-[20px]">{value}</strong>
                    <span className="mt-1 block text-[10px] font-semibold uppercase">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 divide-y divide-[#EDF1F5] rounded-[13px] border border-[#E1E7EE]">
                {deliveries.map((item) => (
                  <div
                    key={item.reference}
                    className="flex items-center gap-3 px-3 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px]">{item.name}</strong>
                      <span className="text-[10px] text-[#8490A2]">
                        {personalize(item)}
                      </span>
                    </span>
                    <StatusBadge label={item.delivery} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t border-[#E3E9F0] p-4">
          <button
            onClick={() =>
              step === "Compose" ? onClose() : setStep("Compose")
            }
            disabled={running}
            className={secondaryButton}
          >
            {step === "Compose" ? "Cancel" : "Back"}
          </button>
          {step === "Compose" ? (
            <button
              onClick={() => setStep("Confirm")}
              disabled={!template.trim() || !members.length}
              className={`${primaryButton} disabled:opacity-40`}
            >
              Preview and confirm
            </button>
          ) : step === "Confirm" ? (
            <button
              onClick={() => void startSending()}
              className="h-10 rounded-[10px] bg-[#20B15A] px-4 text-[12px] font-semibold text-white"
            >
              Confirm and start sending
            </button>
          ) : !running ? (
            <button onClick={onClose} className={primaryButton}>
              Done
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-[#20A45A]">
              Please keep this window open
            </span>
          )}
        </footer>
      </section>
    </div>
  );
}

function ParticipantsWorkspace({
  privacy,
  openParticipant,
  notify,
  settings,
}: {
  privacy: boolean;
  openParticipant: (
    participant: ParticipantRecord,
    onSave: (participant: ParticipantRecord) => void,
  ) => void;
  notify: (message: string) => void;
  settings: KidsChampSettings;
}) {
  const [records, setRecords] = useState<ParticipantRecord[]>([]);
  const [duplicateGuests, setDuplicateGuests] = useState<DuplicateGuest[]>([]);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exactAge, setExactAge] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [location, setLocation] = useState("All");
  const [whatsapp, setWhatsapp] = useState("All");
  const [minSubmissions, setMinSubmissions] = useState("");
  const [dateMode, setDateMode] = useState("Any time");
  const [specificDate, setSpecificDate] = useState("2026-08-01");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-08-01");
  const [month, setMonth] = useState("2026-08");
  const [year, setYear] = useState("2026");
  const [week, setWeek] = useState("2026-W31");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaignTargets, setCampaignTargets] = useState<
    ParticipantRecord[] | null
  >(null);
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/participants")
      .then(async (response) => {
        if (!response.ok) throw new Error("Participants could not be loaded.");
        const body = await response.json() as Array<{
          id: string; name: string; age: number; type: string; location: string; phone: string;
          submissions: number; approved: number; telecasted: number; joinedAt: string; lastSubmissionAt: string; whatsappConsented:boolean;
        }>;
        setRecords(body.map((item) => ({
          reference: item.id,
          name: item.name,
          age: item.age,
          type: item.type,
          location: item.location,
          phone: item.phone,
          submissions: item.submissions,
          approved: item.approved,
          telecasted: item.telecasted,
          whatsapp: item.whatsappConsented ? "Consented" : "Not provided",
          joinedDate: item.joinedAt.slice(0, 10),
          lastSubmissionDate: item.lastSubmissionAt.slice(0, 10),
        })));
      })
      .catch((reason) => notify(reason instanceof Error ? reason.message : "Participants could not be loaded."));
  // The parent callback is intentionally excluded: this request runs once per mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/admin/kids-champ/guests/duplicates"),
      apiFetch("/api/v1/admin/kids-champ/guests/registered-matches"),
    ]).then(async ([guestResponse, registeredResponse]) => {
      const guestMatches = guestResponse.ok ? await guestResponse.json() as DuplicateGuest[] : [];
      const registeredMatches = registeredResponse.ok ? await registeredResponse.json() as DuplicateGuest[] : [];
      setDuplicateGuests([...registeredMatches, ...guestMatches]);
    })
      .catch(() => undefined);
  }, []);

  async function mergeGuestRecords(candidate: DuplicateGuest) {
    const registeredMatch = candidate.matchType === "REGISTERED_GUEST";
    const response = await apiFetch(`/api/v1/admin/kids-champ/guests/${registeredMatch ? "merge-registered" : "merge"}`, {
      method: "POST",
      body: JSON.stringify(registeredMatch
        ? { childId: candidate.firstId, guestId: candidate.secondId }
        : { targetId: candidate.firstId, sourceId: candidate.secondId }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      notify(body?.message || "Guest records could not be merged.");
      return;
    }
    setRecords((current) => current
      .filter((item) => item.reference !== candidate.secondId)
      .map((item) => item.reference === candidate.firstId
        ? { ...item, submissions: candidate.firstSubmissions + candidate.secondSubmissions }
        : item));
    setDuplicateGuests((current) => current.filter((item) =>
      ![candidate.firstId, candidate.secondId].includes(item.firstId) &&
      ![candidate.firstId, candidate.secondId].includes(item.secondId)));
    notify("Guest histories merged. All submissions were preserved.");
  }

  async function resolveGuestMatch(candidate: DuplicateGuest, action: "delete" | "ignore") {
    const registeredMatch = candidate.matchType === "REGISTERED_GUEST";
    const endpoint = action === "ignore" ? "ignore-match" : registeredMatch ? "delete-registered-duplicate" : "delete-duplicate";
    const response = await apiFetch(`/api/v1/admin/kids-champ/guests/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(action === "delete"
        ? registeredMatch ? { childId: candidate.firstId, guestId: candidate.secondId } : { keepId: candidate.firstId, duplicateId: candidate.secondId }
        : { firstId: candidate.firstId, secondId: candidate.secondId }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "The duplicate decision could not be saved."); return; }
    if (action === "delete") {
      setRecords((current) => current.filter((item) => item.reference !== candidate.secondId).map((item) => item.reference === candidate.firstId ? { ...item, submissions: candidate.firstSubmissions + candidate.secondSubmissions } : item));
    }
    setDuplicateGuests((current) => current.filter((item) => item !== candidate));
    notify(action === "delete" ? "Duplicate identity deleted; its submissions were preserved." : "This possible match will be ignored.");
  }
  const locations = [...new Set(records.map((item) => item.location))].sort();
  const visible = useMemo(
    () =>
      records.filter((item) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.reference.toLowerCase().includes(query) ||
          item.phone.toLowerCase().includes(query);
        const matchesSegment =
          segment === "All" ||
          item.type === segment ||
          (segment === "Returning" && item.submissions > 1) ||
          (segment === "Frequent" &&
            item.submissions >= settings.frequentParticipantThreshold);
        const matchesAge =
          (!exactAge || item.age === Number(exactAge)) &&
          (!ageMin || item.age >= Number(ageMin)) &&
          (!ageMax || item.age <= Number(ageMax));
        const matchesLocation =
          location === "All" || item.location === location;
        const matchesWhatsapp =
          whatsapp === "All" || item.whatsapp === whatsapp;
        const matchesSubmissions =
          !minSubmissions || item.submissions >= Number(minSubmissions);
        let matchesDate = true;
        if (dateMode === "Specific date")
          matchesDate = item.lastSubmissionDate === specificDate;
        if (dateMode === "Date range")
          matchesDate =
            item.lastSubmissionDate >= dateFrom &&
            item.lastSubmissionDate <= dateTo;
        if (dateMode === "Month")
          matchesDate = item.lastSubmissionDate.startsWith(month);
        if (dateMode === "Year")
          matchesDate = item.lastSubmissionDate.startsWith(year);
        if (dateMode === "Week" && week) {
          const [weekYear, weekNumber] = week.split("-W").map(Number);
          const fourth = new Date(Date.UTC(weekYear, 0, 4));
          const start = new Date(fourth);
          start.setUTCDate(
            fourth.getUTCDate() -
              (fourth.getUTCDay() || 7) +
              1 +
              (weekNumber - 1) * 7,
          );
          const end = new Date(start);
          end.setUTCDate(start.getUTCDate() + 6);
          const date = new Date(`${item.lastSubmissionDate}T00:00:00Z`);
          matchesDate = date >= start && date <= end;
        }
        return (
          matchesSearch &&
          matchesSegment &&
          matchesAge &&
          matchesLocation &&
          matchesWhatsapp &&
          matchesSubmissions &&
          matchesDate
        );
      }),
    [
      records,
      search,
      segment,
      exactAge,
      ageMin,
      ageMax,
      location,
      whatsapp,
      minSubmissions,
      dateMode,
      specificDate,
      dateFrom,
      dateTo,
      month,
      year,
      week,
      settings.frequentParticipantThreshold,
    ],
  );

  function toggleSelection(reference: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(reference)) next.delete(reference);
      else next.add(reference);
      return next;
    });
  }
  function selectAllVisible() {
    const allSelected =
      visible.length > 0 &&
      visible.every((item) => selected.has(item.reference));
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach((item) =>
        allSelected ? next.delete(item.reference) : next.add(item.reference),
      );
      return next;
    });
  }
  function clearFilters() {
    setExactAge("");
    setAgeMin("");
    setAgeMax("");
    setLocation("All");
    setWhatsapp("All");
    setMinSubmissions("");
    setDateMode("Any time");
    setSegment("All");
  }
  function exportVisible() {
    const headers = [
      "Reference",
      "Child",
      "Age",
      "Type",
      "Home town",
      "Phone",
      "Submissions",
      "Approved",
      "Telecasted",
      "WhatsApp",
      "Joined",
      "Last submission",
    ];
    const rows = visible.map((item) => [
      item.reference,
      item.name,
      item.age,
      item.type,
      item.location,
      item.phone,
      item.submissions,
      item.approved,
      item.telecasted,
      item.whatsapp,
      item.joinedDate,
      item.lastSubmissionDate,
    ]);
    const escapeXml = (entry: string | number) =>
      String(entry)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const xmlRows = [headers, ...rows]
      .map(
        (row, rowIndex) =>
          `<Row>${row.map((cell) => `<Cell><Data ss:Type="${rowIndex && typeof cell === "number" ? "Number" : "String"}">${escapeXml(cell)}</Data></Cell>`).join("")}</Row>`,
      )
      .join("");
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Participants"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${workbook}`], { type: "application/vnd.ms-excel" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "kids-champ-filtered-participants.xls";
    link.click();
    URL.revokeObjectURL(url);
    notify(`${visible.length} filtered participant records exported.`);
  }
  const canMessage = (item: ParticipantRecord) =>
    Boolean(item.phone.trim()) &&
    (!settings.requireWhatsAppConsent || item.whatsapp === "Consented");
  const selectedCampaignMembers = records
    .filter((item) => selected.has(item.reference) && canMessage(item))
    .slice(0, settings.campaignLimit);
  const filteredCampaignMembers = visible
    .filter(canMessage)
    .slice(0, settings.campaignLimit);
  function openSelectedCampaign() {
    if (!selectedCampaignMembers.length) {
      notify(
        "None of the selected participants have WhatsApp consent and a valid phone number.",
      );
      return;
    }
    setCampaignTargets(selectedCampaignMembers);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold">Participants</h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">
            Search, filter, inspect and manage participant records.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCampaignTargets(filteredCampaignMembers)}
            disabled={!filteredCampaignMembers.length}
            className={`${primaryButton} flex items-center gap-2 disabled:opacity-40`}
          >
            <WhatsAppIcon />
            Message filtered
          </button>
        </div>
      </div>
      <section className="rounded-[14px] border border-amber-200 bg-[#FFF9EA] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFE9AE] text-lg text-amber-700">!</span>
            <div><h3 className="text-[16px] font-semibold text-amber-950">Possible duplicate guests</h3>
            <p className="mt-1 text-[12px] text-amber-800">Review the matching reasons before merging guest histories with another guest or a registered child profile.</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-amber-800">{duplicateGuests.length} matches</span>
        </div>
        {duplicateGuests.length ? <div className="mt-4 space-y-3">{duplicateGuests.map((candidate) => (
          <article key={`${candidate.firstId}-${candidate.secondId}`} className="rounded-[14px] border border-amber-200 bg-white p-4">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#263852]">{candidate.firstName} ({candidate.firstSubmissions}) and {candidate.secondName} ({candidate.secondSubmissions})</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${candidate.matchType === "REGISTERED_GUEST" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{candidate.matchType === "REGISTERED_GUEST" ? "Registered profile + guest submission" : "Guest + guest"}</span>
                <p className="mt-1 text-[11px] text-[#738096]">{candidate.firstPhone} · {candidate.firstHometown} / {candidate.secondPhone} · {candidate.secondHometown}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{candidate.reasons.map((reason) => <span key={reason} className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-900">{reason}</span>)}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => void mergeGuestRecords(candidate)} className="rounded-[10px] bg-emerald-600 px-3 py-2.5 text-[11px] font-semibold text-white hover:bg-emerald-700">Merge</button>
                <button type="button" onClick={() => void resolveGuestMatch(candidate, "delete")} className="rounded-[10px] bg-red-600 px-3 py-2.5 text-[11px] font-semibold text-white hover:bg-red-700" title="Delete only the duplicate identity; preserve and transfer every submission">Delete duplicate</button>
                <button type="button" onClick={() => void resolveGuestMatch(candidate, "ignore")} className="rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Ignore</button>
              </div>
            </div>
          </article>
        ))}</div> : <p className="mt-4 rounded-xl bg-white p-4 text-[12px] text-[#738096]">No likely duplicate guest records were found.</p>}
      </section>
      <div className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white shadow-[0_10px_28px_rgba(30,72,123,.05)]">
        <div className="flex flex-col gap-3 border-b border-[#E5EBF2] p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <label className="relative w-full max-w-sm"><span className="pointer-events-none absolute left-3 top-2.5 text-[16px] text-[#6E83A3]">⌕</span><input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${fieldClass} pl-9`}
            placeholder="Search child, reference or phone"
          /></label>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltersOpen((value) => !value)}
              className={`${secondaryButton} ${filtersOpen ? "border-blue-300 bg-blue-50 text-blue-700" : ""}`}
            >
              Filters
            </button>
            <button onClick={exportVisible} className={secondaryButton}>
              Export filtered
            </button>
          </div>
        </div>
        {filtersOpen ? (
          <div className="grid gap-3 border-b border-[#E5EBF2] bg-[#F8FAFC] p-4 tablet:grid-cols-3 desktop:grid-cols-6">
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Exact age
              <input
                type="number"
                min="1"
                value={exactAge}
                onChange={(event) => setExactAge(event.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Age from
              <input
                type="number"
                min="1"
                value={ageMin}
                onChange={(event) => setAgeMin(event.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Age to
              <input
                type="number"
                min="1"
                value={ageMax}
                onChange={(event) => setAgeMax(event.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Home town
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              WhatsApp
              <select
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                <option>Consented</option>
                <option>Not provided</option>
                <option>Opted out</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Min. submissions
              <input
                type="number"
                min="0"
                value={minSubmissions}
                onChange={(event) => setMinSubmissions(event.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Last submission
              <select
                value={dateMode}
                onChange={(event) => setDateMode(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option>Any time</option>
                <option>Specific date</option>
                <option>Date range</option>
                <option>Week</option>
                <option>Month</option>
                <option>Year</option>
              </select>
            </label>
            {dateMode === "Specific date" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Date
                <input
                  type="date"
                  value={specificDate}
                  onChange={(event) => setSpecificDate(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Date range" ? (
              <>
                <label className="text-[10px] font-semibold uppercase text-[#748197]">
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
                <label className="text-[10px] font-semibold uppercase text-[#748197]">
                  To
                  <input
                    type="date"
                    min={dateFrom}
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className={`${fieldClass} mt-1`}
                  />
                </label>
              </>
            ) : null}
            {dateMode === "Week" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Week
                <input
                  type="week"
                  value={week}
                  onChange={(event) => setWeek(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Month" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Month
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            ) : null}
            {dateMode === "Year" ? (
              <label className="text-[10px] font-semibold uppercase text-[#748197]">
                Year
                <select
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                </select>
              </label>
            ) : null}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className={`${secondaryButton} w-full`}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2 overflow-x-auto border-b border-[#E5EBF2] px-4 py-3">
          {["All", "Registered", "Guest", "Returning", "Frequent"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setSegment(item)}
                className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold ${segment === item ? "bg-[#2488F4] text-white" : "bg-[#F1F4F7] text-[#66758B]"}`}
              >
                {item}
              </button>
            ),
          )}
        </div>
        {selected.size ? (
          <div className="flex items-center gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3">
            <strong className="text-[12px] text-blue-900">
              {selected.size} selected
            </strong>
            <button
              onClick={openSelectedCampaign}
              disabled={!selectedCampaignMembers.length}
              title={
                selectedCampaignMembers.length
                  ? `Message ${selectedCampaignMembers.length} consented participant${selectedCampaignMembers.length === 1 ? "" : "s"}`
                  : "Selected participants need WhatsApp consent and a phone number"
              }
              className="flex items-center gap-2 rounded-[8px] bg-[#20B15A] px-3 py-1.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <WhatsAppIcon />
              Send WhatsApp ({selectedCampaignMembers.length})
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[10px] font-semibold text-blue-700"
            >
              Clear selection
            </button>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="sticky top-0 bg-[#F8FAFC] text-[11px] font-semibold uppercase text-[#718096]">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      visible.length > 0 &&
                      visible.every((item) => selected.has(item.reference))
                    }
                    onChange={selectAllVisible}
                    aria-label="Select all filtered participants"
                    className="size-4 accent-[#2488F4]"
                  />
                </th>
                <th className="px-3 py-3">Reference</th>
                <th className="px-3 py-3">Child</th>
                <th className="px-3 py-3">Age / home town</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Submissions</th>
                <th className="px-3 py-3">Approved</th>
                <th className="px-3 py-3">Telecasted</th>
                <th className="px-3 py-3">WhatsApp</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const open = () =>
                  openParticipant(item, (updated) =>
                    setRecords((current) =>
                      current.map((record) =>
                        record.reference === updated.reference
                          ? updated
                          : record,
                      ),
                    ),
                  );
                return (
                  <tr
                    key={item.reference}
                    className={`border-b border-[#EDF1F5] text-[12px] last:border-0 hover:bg-[#F9FBFD] ${selected.has(item.reference) ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(item.reference)}
                        onChange={() => toggleSelection(item.reference)}
                        aria-label={`Select ${item.name}`}
                        className="size-4 accent-[#2488F4]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField
                        onOpen={open}
                        className="font-mono text-[#365A82]"
                      >
                        <PrivateValue enabled={privacy}>
                          {item.reference}
                        </PrivateValue>
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField
                        onOpen={open}
                        className="font-semibold"
                      >
                        <PrivateValue enabled={privacy}>
                          {item.name}
                        </PrivateValue>
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        {item.age} · {item.location}
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        {item.type}
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        {item.submissions}
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        {item.approved}
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        {item.telecasted}
                      </OpenSubmissionField>
                    </td>
                    <td className="px-3 py-3">
                      <OpenSubmissionField onOpen={open}>
                        <StatusBadge label={item.whatsapp} />
                      </OpenSubmissionField>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setCampaignTargets([item])}
                          disabled={!canMessage(item)}
                          title={
                            canMessage(item)
                              ? `Send WhatsApp message to ${item.name}`
                              : "WhatsApp messaging is unavailable without consent and a phone number"
                          }
                          className="grid size-9 place-items-center rounded-[9px] border border-emerald-200 bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Message ${item.name} on WhatsApp`}
                        >
                          <WhatsAppIcon />
                        </button>
                        <button
                          onClick={open}
                          className="rounded-[8px] bg-[#EDF5FF] px-3 py-2 font-semibold text-[#0877EF]"
                        >
                          View / edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length ? (
            <div className="py-14 text-center text-[13px] text-[#8490A2]">
              No participants match the selected filters.
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-[#E5EBF2] px-4 py-3">
          <p className="text-[12px] text-[#8490A2]">
            Showing all {visible.length} matching participants
          </p>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
            All data loaded
          </span>
        </div>
      </div>
      {campaignTargets ? (
        <ParticipantMessageCampaign
          members={campaignTargets}
          onClose={() => setCampaignTargets(null)}
          notify={notify}
          defaultTemplate={settings.defaultMessage}
        />
      ) : null}
    </section>
  );
}

function ParticipantDetailsEditor({
  item,
  privacy,
  onSave,
  notify,
}: {
  item: ParticipantRecord;
  privacy: boolean;
  onSave?: (participant: ParticipantRecord) => void;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  function save() {
    if (!onSave) {
      setDraft(item);
      setEditing(false);
      notify("Participant identity is read-only and was not changed.");
      return;
    }
    onSave(draft);
    setEditing(false);
  }
  return (
    <div>
      <div className="flex items-center gap-4 rounded-[16px] border border-[#DCE5EF] bg-white p-5">
        <span className="grid size-14 place-items-center rounded-full bg-blue-50 text-[15px] font-bold text-blue-700">
          <PrivateValue enabled={privacy}>
            {draft.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </PrivateValue>
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              className={fieldClass}
            />
          ) : (
            <h3 className="text-[19px] font-semibold">
              <PrivateValue enabled={privacy}>{draft.name}</PrivateValue>
            </h3>
          )}
          <p className="mt-1 font-mono text-[11px] text-[#718096]">
            <PrivateValue enabled={privacy}>{draft.reference}</PrivateValue>
          </p>
        </div>
        <StatusBadge label={draft.whatsapp} />
      </div>
      {editing ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Age
            <input
              type="number"
              value={draft.age}
              onChange={(event) =>
                setDraft({ ...draft, age: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Home town
            <input
              value={draft.location}
              onChange={(event) =>
                setDraft({ ...draft, location: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Type
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft({ ...draft, type: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            >
              <option>Registered</option>
              <option>Guest</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Phone
            <input
              value={draft.phone}
              onChange={(event) =>
                setDraft({ ...draft, phone: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            WhatsApp
            <select
              value={draft.whatsapp}
              onChange={(event) =>
                setDraft({ ...draft, whatsapp: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            >
              <option>Consented</option>
              <option>Not provided</option>
              <option>Opted out</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Joined date
            <input
              type="date"
              value={draft.joinedDate}
              onChange={(event) =>
                setDraft({ ...draft, joinedDate: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Submissions
            <input
              type="number"
              value={draft.submissions}
              onChange={(event) =>
                setDraft({ ...draft, submissions: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Approved
            <input
              type="number"
              value={draft.approved}
              onChange={(event) =>
                setDraft({ ...draft, approved: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Telecasted
            <input
              type="number"
              value={draft.telecasted}
              onChange={(event) =>
                setDraft({ ...draft, telecasted: Number(event.target.value) })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Last submission
            <input
              type="date"
              value={draft.lastSubmissionDate}
              onChange={(event) =>
                setDraft({ ...draft, lastSubmissionDate: event.target.value })
              }
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {[
            ["Age", `${draft.age} years`],
            ["Home town", draft.location],
            ["Type", draft.type],
            ["Phone", draft.phone],
            ["Submissions", draft.submissions],
            ["Approved", draft.approved],
            ["Telecasted", draft.telecasted],
            ["Joined", draft.joinedDate],
            ["Last submission", draft.lastSubmissionDate],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[11px] bg-white p-3">
              <dt className="text-[10px] font-semibold uppercase text-[#8793A5]">
                {label}
              </dt>
              <dd className="mt-1 text-[13px] font-semibold text-[#40516A]">
                <PrivateValue enabled={privacy}>{value}</PrivateValue>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {editing ? (
          <>
            <button onClick={save} className={primaryButton}>
              Save changes
            </button>
            <button
              onClick={() => {
                setDraft(item);
                setEditing(false);
              }}
              className={secondaryButton}
            >
              Cancel
            </button>
          </>
        ) : (
          <p className="col-span-2 rounded-[10px] bg-blue-50 p-3 text-[11px] leading-5 text-blue-800">Participant identity is derived from account and submission records. Use the Participants workspace to queue an audited message campaign.</p>
        )}
      </div>
    </div>
  );
}

function SubmissionDetailsEditor({
  item,
  privacy,
  onSave,
  notify,
}: {
  item: MockSubmission;
  privacy: boolean;
  onSave?: (submission: MockSubmission) => void;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const update = <K extends keyof MockSubmission>(
    key: K,
    value: MockSubmission[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  function save() {
    if (!onSave) {
      setDraft(item);
      setEditing(false);
      notify("Open the Submissions workspace to save audited changes.");
      return;
    }
    const initials = draft.childName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const updated = { ...draft, initials };
    setDraft(updated);
    onSave(updated);
    setEditing(false);
  }
  return (
    <div>
      <div
        className={`relative grid min-h-64 place-items-center overflow-hidden rounded-[16px] bg-gradient-to-br ${draft.category === "Painting" ? "from-orange-200 via-rose-200 to-violet-300" : draft.category === "Handcraft" ? "from-amber-100 via-emerald-200 to-cyan-300" : "from-blue-100 via-indigo-200 to-violet-300"}`}
      >
        <span className="absolute -right-14 -top-14 size-44 rounded-full bg-white/25" />
        <span className="absolute -bottom-20 -left-10 size-52 rotate-12 rounded-[48px] bg-white/20" />
        <span className="relative grid size-24 place-items-center rounded-full border-4 border-white/70 bg-white/45 text-[24px] font-bold text-[#263852]/70">
          <PrivateValue enabled={privacy}>{draft.initials}</PrivateValue>
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-[#40516A]">
          Full artwork preview
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          {editing ? (
            <input
              value={draft.childName}
              onChange={(event) => update("childName", event.target.value)}
              className={fieldClass}
              aria-label="Child name"
            />
          ) : (
            <h3 className="text-[19px] font-semibold">
              <PrivateValue enabled={privacy}>{draft.childName}</PrivateValue>
            </h3>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                void navigator.clipboard.writeText(draft.trackingCode);
                notify("Tracking code copied.");
              }}
              className="grid size-7 place-items-center rounded-[7px] border border-[#DCE4ED]"
            >
              ⧉
            </button>
            {editing ? (
              <input
                value={draft.trackingCode}
                onChange={(event) => update("trackingCode", event.target.value)}
                className={`${fieldClass} font-mono`}
                aria-label="Tracking code"
              />
            ) : (
              <p className="font-mono text-[12px] text-[#718096]">
                <PrivateValue enabled={privacy}>
                  {draft.trackingCode}
                </PrivateValue>
              </p>
            )}
          </div>
        </div>
        <StatusBadge label={draft.reviewStatus} />
      </div>
      {editing ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Age
            <input
              type="number"
              value={draft.age}
              onChange={(event) => update("age", Number(event.target.value))}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Home town
            <input
              value={draft.location}
              onChange={(event) => update("location", event.target.value)}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Category
            <select
              value={draft.category}
              onChange={(event) => update("category", event.target.value)}
              className={`${fieldClass} mt-1`}
            >
              <option>Drawing</option>
              <option>Painting</option>
              <option>Handcraft</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Participant
            <select
              value={draft.participantType}
              onChange={(event) =>
                update(
                  "participantType",
                  event.target.value as MockSubmission["participantType"],
                )
              }
              className={`${fieldClass} mt-1`}
            >
              <option>Registered</option>
              <option>Guest</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Reviewer
            <input
              value={draft.reviewer}
              onChange={(event) => update("reviewer", event.target.value)}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            Sent date
            <input
              type="date"
              value={draft.submittedDate}
              onChange={(event) => update("submittedDate", event.target.value)}
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>
      ) : (
        <dl className="mt-6 grid grid-cols-2 gap-4">
          {[
            ["Age", `${draft.age} years`],
            ["Home town", draft.location],
            ["Category", draft.category],
            ["Participant", draft.participantType],
            ["Approval", draft.reviewStatus],
            ["Sent", draft.submittedDate],
            ["File", draft.fileStatus],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold uppercase text-[#8793A5]">
                {label}
              </dt>
              <dd className="mt-1 text-[13px] font-semibold text-[#40516A]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {editing ? (
          <>
            <button
              onClick={save}
              className="h-11 rounded-[10px] bg-[#2488F4] text-[13px] font-semibold text-white"
            >
              Save changes
            </button>
            <button
              onClick={() => {
                setDraft(item);
                setEditing(false);
              }}
              className={secondaryButton}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="h-11 rounded-[10px] bg-[#2488F4] text-[13px] font-semibold text-white"
            >
              Edit data
            </button>
            <button
              onClick={() => {
                const updated = { ...draft, reviewStatus: "Approved" as const };
                setDraft(updated);
                onSave?.(updated);
                notify(`${draft.trackingCode} approved.`);
              }}
              className="h-11 rounded-[10px] bg-emerald-600 text-[13px] font-semibold text-white"
            >
              Approve
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="h-11 rounded-[10px] bg-red-600 text-[13px] font-semibold text-white"
            >
              Reject
            </button>
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  `Hello ${draft.childName}, this is A+ Kids Champ regarding submission ${draft.trackingCode}.`,
                );
                window.open(
                  `https://wa.me/?text=${message}`,
                  "_blank",
                  "noopener,noreferrer",
                );
                notify("WhatsApp share opened for this submission.");
              }}
              className={secondaryButton}
            >
              Send WhatsApp
            </button>
          </>
        )}
      </div>
      {rejecting ? <div className="mt-3 rounded-[12px] border border-red-200 bg-red-50 p-3"><label className="block text-[11px] font-semibold text-red-800">Reason for rejection<textarea value={rejectionReason} onChange={(event)=>setRejectionReason(event.target.value)} className={`${fieldClass} mt-1 min-h-20 bg-white`} placeholder="Explain why this submission cannot be approved"/></label><div className="mt-3 flex justify-end gap-2"><button onClick={()=>{setRejecting(false);setRejectionReason("");}} className={secondaryButton}>Cancel</button><button onClick={()=>{const updated={...draft,reviewStatus:"Rejected" as const};setDraft(updated);onSave?.(updated);setRejecting(false);notify(`${draft.trackingCode} rejected${rejectionReason.trim()?`: ${rejectionReason.trim()}`:"."}`);setRejectionReason("");}} className="h-9 rounded-[9px] bg-red-600 px-3 text-[11px] font-semibold text-white">Confirm rejection</button></div></div> : null}
    </div>
  );
}

function ZipBatchDetailsEditor({
  item,
  onSave,
  onDelete,
  close,
  notify,
}: {
  item: ZipBatch;
  onSave?: (zip: ZipBatch) => void;
  onDelete?: (code: string) => void;
  close: () => void;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [confirmDelete, setConfirmDelete] = useState(false);
  function save() {
    const telecastStatus = !draft.telecastDate
      ? "Not telecasted"
      : draft.telecastDate <= "2026-08-01"
        ? "Telecasted"
        : "Scheduled";
    const updated = {
      ...item,
      expires: draft.expires,
      telecastDate: draft.telecastDate,
      telecastStatus,
    };
    setDraft(updated);
    onSave?.(updated);
    setEditing(false);
  }
  return (
    <div>
      <div className="rounded-[16px] border border-[#DCE5EF] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[14px] font-semibold text-[#263852]">
                {draft.code}
              </p>
              {draft.edited ? (
                <span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700">
                  ✓ Edited {draft.editedAt}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12px] text-[#7A879A]">
              {draft.deleted
                ? `Archive deleted ${draft.deletedAt}; audit record retained`
                : "Kids Champ archive and telecast record"}
            </p>
          </div>
          <StatusBadge label={draft.deleted ? "Deleted" : draft.status} />
        </div>
        {editing ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
              Expires in
              <input
                value={draft.expires}
                onChange={(event) =>
                  setDraft({ ...draft, expires: event.target.value })
                }
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
              Telecast date
              <input
                type="date"
                value={draft.telecastDate}
                onChange={(event) =>
                  setDraft({ ...draft, telecastDate: event.target.value })
                }
                className={`${fieldClass} mt-1`}
              />
            </label>
            <p className="col-span-2 rounded-[10px] bg-blue-50 p-3 text-[11px] text-blue-800">
              ZIP status, progress and telecast status are automatic and cannot
              be edited manually.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Photos", draft.photos],
              ["File size", draft.size],
              ["Expires in", draft.expires],
              ["Progress", `${draft.progress}%`],
              ["Telecast", draft.telecastStatus],
              ["Telecast date", draft.telecastDate || "Not scheduled"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[11px] bg-[#F5F8FB] p-3">
                <p className="text-[10px] font-semibold uppercase text-[#8793A5]">
                  {label}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[#344660]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-[#E8EDF3]">
            <div
              className={`h-full rounded-full ${draft.status === "Ready" ? "bg-emerald-500" : "bg-[#2488F4]"}`}
              style={{ width: `${draft.progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {editing ? (
          <>
            <button onClick={save} className={primaryButton}>
              Save changes
            </button>
            <button
              onClick={() => {
                setDraft(item);
                setEditing(false);
              }}
              className={secondaryButton}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              disabled={draft.deleted}
              className={`${primaryButton} disabled:opacity-40`}
            >
              Edit expiry / date
            </button>
            <button
              onClick={() => {
                close();
                notify("Use the Download button in ZIP records to download the archive.");
              }}
              disabled={
                draft.status !== "Ready" ||
                draft.progress !== 100 ||
                draft.deleted
              }
              className={`${secondaryButton} disabled:opacity-40`}
            >
              Download
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={draft.deleted || !draft.downloaded}
              title={!draft.downloaded ? "Download this ZIP before deleting it" : "Delete ZIP archive"}
              className="h-10 rounded-[10px] border border-red-200 bg-red-50 px-4 text-[12px] font-semibold text-red-700 disabled:opacity-40"
            >
              {draft.deleted ? "Archive deleted" : "Delete archive"}
            </button>
          </>
        )}
      </div>
      {confirmDelete ? (
        <ConfirmationDialog
          title={`Delete ${draft.code} archive?`}
          description="The archive file will be removed while all ZIP, telecast and editor audit details remain available."
          confirmLabel="Delete archive"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDelete?.(draft.code);
            setConfirmDelete(false);
            close();
          }}
        />
      ) : null}
    </div>
  );
}

type SettingsSection =
  | "Categories"
  | "Submission rules"
  | "Telecast"
  | "ZIP retention"
  | "Participants"
  | "Messaging";

// Configuration is retained in the backend model for the page-specific controls.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function KidsChampSettingsPanel({
  settings,
  onSave,
  notify,
}: {
  settings: KidsChampSettings;
  onSave: (settings: KidsChampSettings) => void;
  notify: (message: string) => void;
}) {
  const [section, setSection] = useState<SettingsSection>("Categories");
  const [draft, setDraft] = useState(settings);
  const [newCategory, setNewCategory] = useState("");
  const sections: { title: SettingsSection; description: string }[] = [
    { title: "Categories", description: "Active artwork categories" },
    { title: "Submission rules", description: "Files and tracking codes" },
    { title: "Telecast", description: "Schedule defaults" },
    { title: "ZIP retention", description: "Batch and expiry rules" },
    { title: "Participants", description: "Age and activity rules" },
    { title: "Messaging", description: "Consent and campaign defaults" },
  ];
  const numberField = (
    label: string,
    value: number,
    update: (value: number) => void,
    min = 0,
  ) => (
    <label className="text-[11px] font-semibold text-[#59687E]">
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => update(Number(event.target.value))}
        className={`${fieldClass} mt-1.5`}
      />
    </label>
  );
  function save() {
    onSave(draft);
    notify("Kids Champ settings saved and applied.");
  }
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3">
        {sections.map((item) => (
          <button
            key={item.title}
            onClick={() => setSection(item.title)}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-semibold ${section === item.title ? "bg-[#17243D] text-white" : "bg-[#F0F3F7] text-[#66758B]"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-[15px] border border-[#E0E7EF] bg-white p-4">
        <h3 className="text-[16px] font-semibold">{section}</h3>
        <p className="mt-1 text-[11px] text-[#7A879A]">
          {sections.find((item) => item.title === section)?.description}
        </p>

        {section === "Categories" ? (
          <div className="mt-4 space-y-2">
            {draft.categories.map((category, index) => (
              <div
                key={`${category}-${index}`}
                className="flex items-center gap-2"
              >
                <input
                  value={category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      categories: current.categories.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    }))
                  }
                  className={fieldClass}
                  aria-label={`Category ${index + 1}`}
                />
                <button
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      categories: current.categories.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                  disabled={draft.categories.length === 1}
                  className="h-10 rounded-[9px] border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-700 disabled:opacity-35"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className={fieldClass}
                placeholder="New category"
              />
              <button
                onClick={() => {
                  const value = newCategory.trim();
                  if (
                    !value ||
                    draft.categories.some(
                      (item) => item.toLowerCase() === value.toLowerCase(),
                    )
                  )
                    return;
                  setDraft((current) => ({
                    ...current,
                    categories: [...current.categories, value],
                  }));
                  setNewCategory("");
                }}
                disabled={!newCategory.trim()}
                className={`${secondaryButton} disabled:opacity-40`}
              >
                Add
              </button>
            </div>
          </div>
        ) : null}

        {section === "Submission rules" ? (
          <div className="mt-4 grid gap-3">
            {numberField(
              "Maximum file size (MB)",
              draft.maxFileSizeMb,
              (value) => setDraft({ ...draft, maxFileSizeMb: value }),
              1,
            )}
            <label className="text-[11px] font-semibold text-[#59687E]">
              Allowed file types
              <input
                value={draft.allowedFileTypes}
                onChange={(event) =>
                  setDraft({ ...draft, allowedFileTypes: event.target.value })
                }
                className={`${fieldClass} mt-1.5`}
              />
            </label>
            <label className="flex items-center justify-between rounded-[11px] bg-[#F7F9FB] p-3 text-[12px] font-semibold">
              Generate tracking codes automatically
              <input
                type="checkbox"
                checked={draft.automaticTracking}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    automaticTracking: event.target.checked,
                  })
                }
                className="size-4 accent-[#2488F4]"
              />
            </label>
          </div>
        ) : null}

        {section === "Telecast" ? (
          <div className="mt-4 grid gap-3 grid-cols-2">
            {numberField(
              "Entries per day",
              draft.dailyTelecastLimit,
              (value) => setDraft({ ...draft, dailyTelecastLimit: value }),
              1,
            )}
            <label className="text-[11px] font-semibold text-[#59687E]">
              Default time
              <input
                type="time"
                value={draft.defaultTelecastTime}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    defaultTelecastTime: event.target.value,
                  })
                }
                className={`${fieldClass} mt-1.5`}
              />
            </label>
          </div>
        ) : null}

        {section === "ZIP retention" ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {numberField(
              "Photos / batch",
              draft.zipBatchSize,
              (value) => setDraft({ ...draft, zipBatchSize: value }),
              1,
            )}
            {numberField(
              "Expiry days",
              draft.zipExpiryDays,
              (value) => setDraft({ ...draft, zipExpiryDays: value }),
              1,
            )}
            {numberField(
              "Warning days",
              draft.zipWarningDays,
              (value) => setDraft({ ...draft, zipWarningDays: value }),
              0,
            )}
          </div>
        ) : null}

        {section === "Participants" ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {numberField(
              "Minimum age",
              draft.minimumAge,
              (value) => setDraft({ ...draft, minimumAge: value }),
              1,
            )}
            {numberField(
              "Maximum age",
              draft.maximumAge,
              (value) => setDraft({ ...draft, maximumAge: value }),
              1,
            )}
            {numberField(
              "Frequent after",
              draft.frequentParticipantThreshold,
              (value) =>
                setDraft({ ...draft, frequentParticipantThreshold: value }),
              1,
            )}
          </div>
        ) : null}

        {section === "Messaging" ? (
          <div className="mt-4 grid gap-3">
            <label className="flex items-center justify-between rounded-[11px] bg-[#F7F9FB] p-3 text-[12px] font-semibold">
              Require recorded WhatsApp consent
              <input
                type="checkbox"
                checked={draft.requireWhatsAppConsent}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    requireWhatsAppConsent: event.target.checked,
                  })
                }
                className="size-4 accent-emerald-600"
              />
            </label>
            {numberField(
              "Maximum recipients per campaign",
              draft.campaignLimit,
              (value) => setDraft({ ...draft, campaignLimit: value }),
              1,
            )}
            <label className="text-[11px] font-semibold text-[#59687E]">
              Default message
              <textarea
                value={draft.defaultMessage}
                onChange={(event) =>
                  setDraft({ ...draft, defaultMessage: event.target.value })
                }
                className="mt-1.5 min-h-28 w-full rounded-[10px] border border-[#D8E2EC] p-3 text-[12px] outline-none focus:border-[#2488F4]"
              />
            </label>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={save} className={`${primaryButton} flex-1`}>
          Save settings
        </button>
        <button
          onClick={() => setDraft(defaultKidsChampSettings)}
          className={secondaryButton}
        >
          Restore defaults
        </button>
      </div>
    </div>
  );
}

type CalendarTask = {
  id: string;
  time: string;
  title: string;
  detail: string;
  complete: boolean;
};

function CalendarDayPanel({ notify, dateLabel, onNavigate }: { notify: (message: string) => void; dateLabel: string; onNavigate?: (section: "submissions" | "zips" | "telecasts" | "tasks" | "warnings", dateLabel: string) => void }) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [daySubmissions, setDaySubmissions] = useState<AdminSubmissionResponse[]>([]);
  const [dayBatches, setDayBatches] = useState<AdminBatchResponse[]>([]);
  const [activeSection, setActiveSection] = useState<"submissions" | "zips" | "telecasts" | "warnings" | "tasks">("submissions");
  const [photoPreview, setPhotoPreview] = useState<{ id: string; url: string } | null>(null);
  const taskDate = (() => {
    const match = dateLabel.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
    if (match) {
      const month = new Date(`${match[1]} 1, 2000`).getMonth() + 1;
      return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}`;
    }
    const value = new Date(dateLabel);
    if (Number.isNaN(value.getTime())) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  })();
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/calendar/tasks").then(async (response) => {
      if (!response.ok) throw new Error("Calendar tasks could not be loaded.");
      const body = await response.json() as Array<{id:string;date:string;title:string;details?:string;completedAt?:string}>;
      setTasks(body.filter((item) => item.date === taskDate).map((item) => ({id:item.id,time:"--:--",title:item.title,detail:item.details||"No additional details",complete:Boolean(item.completedAt)})));
    }).catch((reason) => notify(reason instanceof Error ? reason.message : "Calendar tasks could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDate]);
  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/admin/kids-champ/submissions"),
      apiFetch("/api/v1/admin/kids-champ/batches"),
    ]).then(async ([submissionResponse, batchResponse]) => {
      const submissionItems = submissionResponse.ok ? await submissionResponse.json() as AdminSubmissionResponse[] : [];
      const batchItems = batchResponse.ok ? await batchResponse.json() as AdminBatchResponse[] : [];
      setDaySubmissions(submissionItems.filter((item) => item.submittedAt.slice(0, 10) === taskDate));
      setDayBatches(batchItems.filter((item) => item.createdAt.slice(0, 10) === taskDate || item.telecastDate === taskDate));
    }).catch(() => notify("Daily operations could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDate]);
  async function approveSubmission(item: AdminSubmissionResponse) {
    const response = await apiFetch("/api/v1/admin/kids-champ/submissions/approve", {
      method: "POST",
      body: JSON.stringify({ submissionIds: [item.id] }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "Approval could not be saved."); return; }
    setDaySubmissions((current) => current.map((entry) => entry.id === item.id ? { ...entry, reviewStatus: "APPROVED" } : entry));
    notify("Submission approved and ZIP processing started.");
  }
  async function previewPhoto(item: AdminSubmissionResponse) {
    if (photoPreview?.id === item.id) { setPhotoPreview(null); return; }
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/photo`);
    if (!response.ok) { notify("Photo preview could not be loaded."); return; }
    const url = URL.createObjectURL(await response.blob());
    if (photoPreview) URL.revokeObjectURL(photoPreview.url);
    setPhotoPreview({ id: item.id, url });
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
        {[
          ["Submissions", String(daySubmissions.length), "submissions"],
          ["ZIPs created", String(dayBatches.filter((item) => item.createdAt.slice(0, 10) === taskDate).length), "zips"],
          ["Telecasts", String(dayBatches.filter((item) => item.telecastDate === taskDate).length), "telecasts"],
          ["Open tasks", String(tasks.filter((item) => !item.complete).length), "tasks"],
          ["Warnings", String(dayBatches.filter((item) => item.status !== "DELETED" && item.daysRemaining <= 0).length), "warnings"],
        ].map(([label, value, action]) => (
          <button
            type="button"
            key={label}
            onClick={() => { setActiveSection(action as typeof activeSection); onNavigate?.(action as "submissions" | "zips" | "telecasts" | "tasks" | "warnings", dateLabel); }}
            className={`rounded-[16px] border p-5 text-left transition hover:border-blue-300 ${activeSection === action ? "border-blue-400 bg-blue-50" : "border-[#E0E7EF] bg-white"}`}
          >
            <p className="text-[25px] font-semibold">{value}</p>
            <p className="mt-1 text-[12px] text-[#7A879A]">{label} →</p>
          </button>
        ))}
      </div>
      {activeSection === "submissions" ? (
        <div className="mt-5 rounded-[16px] border border-[#E0E7EF] bg-white p-4">
          <h3 className="text-[15px] font-semibold">Received on this day</h3>
          <div className="mt-3 space-y-2">
            {daySubmissions.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E5EBF2] p-3">
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[13px] text-[#263650]">{item.childName}</strong>
                  <span className="text-[11px] text-[#7A879A]">{item.trackingCode} · {item.hometown} · age {item.ageAtSubmission} · {item.reviewStatus.replaceAll("_", " ")}</span>
                </div>
                <button type="button" onClick={() => void approveSubmission(item)} disabled={item.reviewStatus === "APPROVED"} className="rounded-[8px] bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40">{item.reviewStatus === "APPROVED" ? "Approved" : "Approve"}</button>
                <button type="button" onClick={() => void previewPhoto(item)} className="rounded-[8px] border border-blue-200 px-3 py-2 text-[11px] font-semibold text-blue-700">Photo</button>
                {photoPreview?.id === item.id ? <Image src={photoPreview.url} alt={`Artwork submitted by ${item.childName}`} width={1200} height={440} unoptimized className="mt-2 max-h-[440px] w-full rounded-[12px] bg-[#F2F5F8] object-contain" /> : null}
              </article>
            ))}
            {!daySubmissions.length ? <p className="py-5 text-center text-[12px] text-[#7A879A]">No records for this day.</p> : null}
          </div>
        </div>
      ) : null}
      {activeSection === "zips" || activeSection === "telecasts" || activeSection === "warnings" ? (
        <div className="mt-5 rounded-[16px] border border-[#E0E7EF] bg-white p-4">
          <h3 className="text-[15px] font-semibold">{activeSection === "zips" ? "ZIPs created" : activeSection === "telecasts" ? "Telecasts scheduled" : "Warnings and deadlines"}</h3>
          <div className="mt-3 space-y-2">
            {dayBatches.filter((item) => activeSection === "zips" ? item.createdAt.slice(0, 10) === taskDate : activeSection === "telecasts" ? item.telecastDate === taskDate : item.status !== "DELETED" && item.daysRemaining <= 0).map((item) => (
              <article key={item.id} className="rounded-[12px] border border-[#E5EBF2] p-3 text-[12px]">
                <strong className="text-[#263650]">{item.batchCode}</strong>
                <p className="mt-1 text-[#7A879A]">{item.photoCount} photos · {item.status} · {item.telecastDate ? `telecast ${item.telecastDate}` : `${item.daysRemaining} days remaining`}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-6">
        <h3 className="text-[16px] font-semibold">Automatic operations checklist</h3>
        <p className="mt-1 text-[11px] text-[#7A879A]">Work generated from this day&apos;s submissions, ZIPs and telecast schedule.</p>
        <div className="mt-3 grid gap-2 tablet:grid-cols-3">
          {[
            { label: "Approve new submissions", count: daySubmissions.filter((item) => item.reviewStatus === "SUBMITTED" || item.reviewStatus === "UNDER_REVIEW").length, section: "submissions" },
            { label: "Download ready ZIPs", count: dayBatches.filter((item) => item.createdAt.slice(0, 10) === taskDate && !item.firstDownloadedAt && item.status !== "DELETED").length, section: "zips" },
            { label: "Prepare telecasts", count: dayBatches.filter((item) => item.telecastDate === taskDate && item.status !== "DELETED").length, section: "telecasts" },
          ].map((operation) => (
            <button key={operation.label} type="button" onClick={() => setActiveSection(operation.section as typeof activeSection)} className="flex items-center justify-between rounded-[12px] border border-[#E0E7EF] bg-white p-3 text-left hover:border-blue-300">
              <span className="text-[12px] font-semibold text-[#344660]">{operation.label}</span>
              <span className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${operation.count ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>{operation.count}</span>
            </button>
          ))}
        </div>
      </div>
      {activeSection === "tasks" ? <div className="mt-5 space-y-2 rounded-[16px] border border-[#E0E7EF] bg-white p-4">
        <h3 className="text-[15px] font-semibold">Open tasks</h3>
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`flex flex-wrap items-start gap-3 rounded-[14px] border p-4 ${task.complete ? "border-emerald-200 bg-emerald-50/50" : "border-[#E0E7EF] bg-white"}`}
          >
            <input
              type="checkbox"
              checked={task.complete}
              onChange={() => { void apiFetch(`/api/v1/admin/kids-champ/calendar/tasks/${task.id}`,{method:"PATCH",body:JSON.stringify({completed:!task.complete})}).then((response)=>{if(response.ok)setTasks((current)=>current.map((item)=>item.id===task.id?{...item,complete:!item.complete}:item));else notify("Task status could not be saved.");}); }}
              className="mt-0.5 size-4 accent-emerald-600"
            />
            <span className="w-14 shrink-0 text-[12px] font-semibold text-[#0877EF]">
              {task.time}
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
            >
              <strong
                className={`block text-[13px] text-[#344660] ${task.complete ? "line-through opacity-60" : ""}`}
              >
                {task.title}
              </strong>
              <span className="mt-1 block text-[11px] text-[#7A879A]">
                {task.detail}
              </span>
            </button>
            <button
              onClick={() => { void apiFetch(`/api/v1/admin/kids-champ/calendar/tasks/${task.id}`,{method:"DELETE"}).then((response)=>{if(response.ok)setTasks((current)=>current.filter((item)=>item.id!==task.id));else notify("Task could not be deleted.");}); }}
              className="text-[11px] font-semibold text-red-600"
            >
              Delete
            </button>
          </article>
        ))}
        {!tasks.length ? <p className="py-5 text-center text-[12px] text-[#7A879A]">No open tasks for this day.</p> : null}
      </div> : null}
    </div>
  );
}

function DrawerContent({
  drawer,
  privacy,
  setWorkspace,
  close,
  notify,
}: {
  drawer: NonNullable<DrawerState>;
  privacy: boolean;
  setWorkspace: (workspace: Workspace) => void;
  close: () => void;
  notify: (message: string) => void;
}) {
  if (drawer.submission) {
    return drawer.submission.photoUrl ? (
      <div>
        <div
          className="min-h-72 rounded-[16px] bg-[#EAF1F7] bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${drawer.submission.photoUrl}")` }}
          role="img"
          aria-label={`Artwork submitted by ${drawer.submission.childName}`}
        />
        <div className="[&>div>div:first-child]:hidden">
          <SubmissionDetailsEditor
            item={drawer.submission}
            privacy={privacy}
            onSave={drawer.onSaveSubmission}
            notify={notify}
          />
        </div>
      </div>
    ) : (
      <SubmissionDetailsEditor
        item={drawer.submission}
        privacy={privacy}
        onSave={drawer.onSaveSubmission}
        notify={notify}
      />
    );
  }
  if (drawer.participant)
    return (
      <ParticipantDetailsEditor
        item={drawer.participant}
        privacy={privacy}
        onSave={drawer.onSaveParticipant}
        notify={notify}
      />
    );
  if (drawer.zipBatch) {
    return (
      <ZipBatchDetailsEditor
        item={drawer.zipBatch}
        onSave={drawer.onUpdateZip}
        onDelete={drawer.onDeleteZip}
        close={close}
        notify={notify}
      />
    );
  }
  if (drawer.kind === "calendar") return <CalendarDayPanel notify={notify} dateLabel={drawer.title} />;
  const workspace: Workspace =
    drawer.kind === "participants"
      ? "Participants"
      : drawer.kind === "telecast" || drawer.kind === "zips"
        ? "ZIP"
        : drawer.kind === "activity"
          ? "Overview"
          : "Submissions";
  const records =
    drawer.kind === "telecast"
      ? upcomingTelecasts.map((item) => ({
          title: item.episode,
          detail: `${item.date} · ${item.time} · ${item.entries} entries`,
          status: item.status,
        }))
      : drawer.kind === "zips"
        ? zipBatches.map((item) => ({
            title: item.code,
            detail: `${item.photos} photos · ${item.size} · expires ${item.expires}`,
            status: item.status,
          }))
        : drawer.kind === "participants"
          ? participants.map((item) => ({
              title: item.name,
              detail: `${item.location} · ${item.submissions} submissions`,
              status: item.whatsapp,
            }))
          : submissions.slice(0, 5).map((item) => ({
              title: item.childName,
              detail: `${item.trackingCode} · ${item.location}`,
              status: item.reviewStatus,
            }));

  return (
    <div>
      {records.length === 0 ? (
        <p className="rounded-[14px] border border-[#E0E7EF] bg-[#F8FAFC] p-4 text-[13px] leading-6 text-[#607089]">
          Live records for this area are available in the full workspace, with
          its current filters and backend data.
        </p>
      ) : null}
      <div className="space-y-3">
        {records.map((record) => (
          <button
            key={record.title}
            onClick={() => {
              setWorkspace(workspace);
              close();
            }}
            className="w-full rounded-[14px] border border-[#E0E7EF] bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[14px] font-semibold">
                  <PrivateValue enabled={privacy}>{record.title}</PrivateValue>
                </h3>
                <p className="mt-1 text-[12px] text-[#7A879A]">
                  <PrivateValue enabled={privacy}>{record.detail}</PrivateValue>
                </p>
              </div>
              <StatusBadge label={record.status} />
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setWorkspace(workspace);
          close();
        }}
        className={`${primaryButton} mt-5 w-full`}
      >
        Open full workspace
      </button>
    </div>
  );
}

type WhatsAppAdminConfig = { graphApiVersion:string;phoneNumberId:string;businessAccountId:string;tokenConfigured:boolean;maskedToken:string;lastTestStatus?:string;lastTestMessage?:string;lastTestedAt?:string };
type AccountManagementOverview={totalAccounts:number;administrators:number;activeAccounts:number;childProfiles:number};
type ManagedKidsAccount={id:string;accountType?:"REGISTERED"|"GUEST";name:string;email:string;phone:string;status:string;children:number;createdAt:string;lastLoginAt?:string};
type ManagedAdministrator={id:string;name:string;email:string;role:"ADMIN"|"SUPER_ADMIN";status:string;lastLoginAt?:string};
type AdminHistoryItem={action:string;entityType:string;entityId:string;details:string;actor:string;createdAt:string};
type WhatsAppConnectionResult={success:boolean;message:string;solutions:string[];testedAt:string};

export function AccountManagementWorkspace({notify}:{notify:(message:string)=>void}) {
  const [tab,setTab]=useState<"overview"|"accounts"|"admins"|"whatsapp"|"templates"|"history">("overview");
  const [isSuperAdmin]=useState(()=>{if(typeof window==="undefined")return false;try{const value=window.localStorage.getItem("aplus-current-user")||window.sessionStorage.getItem("aplus-current-user");const user=value?JSON.parse(value) as {roles?:string[]}:null;return Boolean(user?.roles?.includes("ROLE_SUPER_ADMIN"));}catch{return false;}});
  const [overview,setOverview]=useState<AccountManagementOverview|null>(null);
  const [accounts,setAccounts]=useState<ManagedKidsAccount[]>([]);
  const [administrators,setAdministrators]=useState<ManagedAdministrator[]>([]);
  const [history,setHistory]=useState<AdminHistoryItem[]>([]);
  const [accountSearch,setAccountSearch]=useState("");
  const [accountStatus,setAccountStatus]=useState("All");
  const [accountType,setAccountType]=useState("All");
  const [selectedAccounts,setSelectedAccounts]=useState<Set<string>>(new Set());
  const [editingAccount,setEditingAccount]=useState<ManagedKidsAccount|null>(null);
  const [accountDraft,setAccountDraft]=useState({accountHolderName:"",email:"",phoneE164:"",status:"ACTIVE"});
  const [savingAccount,setSavingAccount]=useState(false);
  const [deleteDialog,setDeleteDialog]=useState<ManagedKidsAccount|null>(null);
  const [deleteReason,setDeleteReason]=useState("");
  const [connection,setConnection]=useState<WhatsAppConnectionResult|null>(null);
  const [testingConnection,setTestingConnection]=useState(false);
  const [config,setConfig]=useState<WhatsAppAdminConfig|null>(null);
  const [draft,setDraft]=useState({graphApiVersion:"v25.0",phoneNumberId:"",businessAccountId:"",accessToken:""});
  const [testPhone,setTestPhone]=useState("0782940117");
  const [saving,setSaving]=useState(false);
  const [testing,setTesting]=useState(false);
  useEffect(()=>{apiFetch("/api/v1/admin/account-management/overview").then(async response=>{if(response.ok)setOverview(await response.json() as AccountManagementOverview);}).catch(()=>undefined);},[]);
  useEffect(()=>{const params=new URLSearchParams();if(accountSearch.trim())params.set("search",accountSearch.trim());if(accountStatus!=="All")params.set("status",accountStatus);apiFetch(`/api/v1/admin/account-management/accounts?${params}`).then(async response=>{if(response.ok){setAccounts(await response.json() as ManagedKidsAccount[]);setSelectedAccounts(new Set());}}).catch(()=>undefined);},[accountSearch,accountStatus]);
  useEffect(()=>{if(!isSuperAdmin)return;apiFetch("/api/v1/admin/account-management/administrators").then(async response=>{if(response.ok)setAdministrators(await response.json() as ManagedAdministrator[]);}).catch(()=>undefined);apiFetch("/api/v1/admin/kids-champ/admin-history").then(async response=>{if(response.ok)setHistory(await response.json() as AdminHistoryItem[]);}).catch(()=>undefined);apiFetch("/api/v1/admin/kids-champ/whatsapp/config").then(async response=>{if(!response.ok)return;const body=await response.json() as WhatsAppAdminConfig;setConfig(body);setDraft({graphApiVersion:body.graphApiVersion,phoneNumberId:body.phoneNumberId,businessAccountId:body.businessAccountId,accessToken:""});}).catch(()=>undefined);},[isSuperAdmin]);
  async function save(){setSaving(true);const response=await apiFetch("/api/v1/admin/kids-champ/whatsapp/config",{method:"PUT",body:JSON.stringify(draft)});const body=await response.json().catch(()=>null);setSaving(false);if(!response.ok){notify(body?.message||"WhatsApp configuration could not be saved.");return;}setConfig(body);setDraft(current=>({...current,accessToken:""}));notify("WhatsApp configuration saved securely.");}
  async function test(){setTesting(true);const response=await apiFetch("/api/v1/admin/kids-champ/whatsapp/test",{method:"POST",body:JSON.stringify({phone:testPhone})});const body=await response.json().catch(()=>null);setTesting(false);if(!response.ok){notify(body?.message||"Test message failed.");return;}setConfig(current=>current?{...current,lastTestStatus:body.success?"SUCCESS":"FAILED",lastTestMessage:body.message,lastTestedAt:body.testedAt}:current);notify(body.message);}
  async function testConnection(){setTestingConnection(true);const response=await apiFetch("/api/v1/admin/kids-champ/whatsapp/connection-test",{method:"POST"});const body=await response.json().catch(()=>null) as WhatsAppConnectionResult|null;setTestingConnection(false);if(!response.ok){notify((body as unknown as {message?:string})?.message||"Connection test could not be completed.");return;}setConnection(body);notify(body?.message||"Connection test completed.");}
  async function changeRole(administrator:ManagedAdministrator){const next=administrator.role==="SUPER_ADMIN"?"ROLE_ADMIN":"ROLE_SUPER_ADMIN";const response=await apiFetch(`/api/v1/admin/account-management/administrators/${administrator.id}/role`,{method:"PATCH",body:JSON.stringify({role:next})});const body=await response.json().catch(()=>null) as ManagedAdministrator|null;if(!response.ok||!body){notify((body as unknown as {message?:string})?.message||"Role could not be updated.");return;}setAdministrators(current=>current.map(item=>item.id===administrator.id?body:item));notify(`${administrator.name} is now ${body.role==="SUPER_ADMIN"?"a Super Admin":"an Admin"}.`);}
  function openAccountEditor(account:ManagedKidsAccount){setEditingAccount(account);setAccountDraft({accountHolderName:account.name,email:account.email,phoneE164:account.phone,status:account.status});}
  async function saveAccount(){if(!editingAccount)return;setSavingAccount(true);const guest=editingAccount.accountType==="GUEST";const response=await apiFetch(`/api/v1/admin/account-management/accounts/${guest?"guests/":""}${editingAccount.id}`,{method:"PATCH",body:JSON.stringify(guest?{parentName:accountDraft.accountHolderName,email:accountDraft.email,phoneE164:accountDraft.phoneE164}:accountDraft)});const body=await response.json().catch(()=>null) as ManagedKidsAccount|null;setSavingAccount(false);if(!response.ok||!body){notify((body as unknown as {message?:string})?.message||"Account could not be updated.");return;}setAccounts(current=>current.map(account=>account.id===body.id?body:account));setEditingAccount(null);notify("Account updated and recorded in Admin history.");}
  async function restoreAccount(account:ManagedKidsAccount){const guest=account.accountType==="GUEST";const response=await apiFetch(`/api/v1/admin/account-management/accounts/${guest?"guests/":""}${account.id}/restore`,{method:"POST"});const body=await response.json().catch(()=>null) as ManagedKidsAccount|null;if(!response.ok||!body){notify((body as unknown as {message?:string})?.message||"Account could not be restored.");return;}setAccounts(current=>current.map(item=>item.id===body.id?body:item));notify("Account restored to active access.");}
  async function deleteAccount(){if(!deleteDialog)return;const guest=deleteDialog.accountType==="GUEST";const response=await apiFetch(`/api/v1/admin/account-management/accounts/${guest?"guests/":""}${deleteDialog.id}`,{method:"DELETE",body:JSON.stringify({reason:deleteReason})});const body=await response.json().catch(()=>null) as ManagedKidsAccount|null;if(!response.ok||!body){notify((body as unknown as {message?:string})?.message||"Account could not be deleted.");return;}setAccounts(current=>current.map(item=>item.id===body.id?body:item));setDeleteDialog(null);setDeleteReason("");notify("Account was safely deleted and can be restored by an administrator.");}
  const visibleAccounts=accounts.filter(item=>accountType==="All"||item.accountType===accountType);
  const exportSelected=async(pdf=false)=>{const values=visibleAccounts.filter(item=>selectedAccounts.has(item.id));if(!values.length){notify("Select one or more accounts first.");return;}const rows=[["Account type","Name","Email","Phone","Status","Children"],...values.map(item=>[item.accountType||"REGISTERED",item.name,item.email||"",item.phone,item.status,String(item.children)])];if(pdf){const {jsPDF}=await import("jspdf");const doc=new jsPDF();doc.setFontSize(16);doc.text("A+ Kids selected accounts",14,16);doc.setFontSize(9);rows.forEach((row,index)=>doc.text(row.join(" | ").slice(0,180),14,28+(index*7)));doc.save("selected-kids-accounts.pdf");}else{const blob=new Blob([rows.map(row=>row.map(v=>`"${v.replaceAll('"','""')}"`).join(",")).join("\n")],{type:"text/csv"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="selected-kids-accounts.csv";link.click();URL.revokeObjectURL(link.href);}notify(`${values.length} selected account${values.length===1?"":"s"} exported.`);};
  const tabs=[{id:"overview",label:"Overview"},{id:"accounts",label:"Kids accounts"},...(isSuperAdmin?[{id:"admins",label:"Admin users"},{id:"whatsapp",label:"WhatsApp API"},{id:"templates",label:"Templates"},{id:"history",label:"Admin history"}]:[])] as Array<{id:typeof tab;label:string}>;
  return <section className="relative">
    <div className="flex flex-col gap-3 tablet:flex-row tablet:items-end tablet:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#2488F4]">Control centre</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-.03em]">Account operations</h2><p className="mt-1 text-[13px] text-[#7A879A]">Manage Kids accounts and keep operational access safe.</p></div><div className="inline-flex h-9 items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-700 tablet:self-auto"><span className="size-2 rounded-full bg-emerald-500"/>Secure access controls</div></div>
    <div className="mt-5 flex gap-1.5 overflow-x-auto rounded-[22px] border border-[#E4EBF4] bg-white/90 p-2 shadow-[0_10px_28px_rgba(36,91,160,.08)]">{tabs.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`whitespace-nowrap rounded-[14px] px-4 py-2.5 text-[12px] font-semibold transition ${tab===item.id?"bg-gradient-to-br from-[#1689F7] to-[#136FE8] text-white shadow-[0_8px_16px_rgba(31,123,241,.27)]":"text-[#526178] hover:bg-[#F2F7FF]"}`}>{item.label}</button>)}</div>
    {tab==="overview"?<div className="mt-5 grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">{[["Kids accounts",overview?.totalAccounts,"All registered family accounts","bg-blue-50 text-blue-600"],["Active accounts",overview?.activeAccounts,"Can sign in and submit","bg-emerald-50 text-emerald-600"],["Children",overview?.childProfiles,"Profiles held securely","bg-violet-50 text-violet-600"],["Administrators",overview?.administrators,"Operational team members","bg-amber-50 text-amber-600"]].map(([label,value,detail,tone])=><div key={String(label)} className="group rounded-[20px] border border-[#E2EAF4] bg-white p-5 shadow-[0_8px_22px_rgba(43,86,138,.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(43,86,138,.1)]"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-[13px] text-lg ${tone}`}>{String(label)==="Kids accounts"?"◉":String(label)==="Active accounts"?"✓":String(label)==="Children"?"♙":"⚙"}</span><span className="text-[#B5C3D6]">↗</span></div><p className="mt-5 text-[12px] font-semibold text-[#687890]">{label}</p><p className="mt-1 text-[30px] font-semibold tracking-[-.04em]">{value??"–"}</p><p className="mt-1 text-[11px] text-[#8A97A9]">{detail}</p></div>)}</div>:null}
    {tab==="accounts"?<div className="mt-5 overflow-hidden rounded-[20px] border border-[#E0E8F2] bg-white shadow-[0_10px_28px_rgba(43,86,138,.06)]"><div className="flex flex-col gap-3 border-b border-[#E9EEF5] bg-[#FBFDFF] p-4 tablet:flex-row"><input value={accountSearch} onChange={e=>setAccountSearch(e.target.value)} placeholder="Search name, email or phone" className={`${fieldClass} flex-1`}/><select value={accountType} onChange={e=>setAccountType(e.target.value)} className={fieldClass}><option>All</option><option value="REGISTERED">Registered</option><option value="GUEST">Non-registered</option></select><select value={accountStatus} onChange={e=>setAccountStatus(e.target.value)} className={fieldClass}><option>All</option>{["ACTIVE","PENDING_VERIFICATION","LOCKED","SUSPENDED","DELETION_PENDING","DELETED"].map(value=><option key={value}>{value}</option>)}</select></div><div className="flex flex-wrap items-center gap-2 border-b border-[#EDF1F6] px-4 py-3"><button onClick={()=>setSelectedAccounts(new Set(visibleAccounts.map(item=>item.id)))} className={secondaryButton}>Select all</button><button onClick={()=>setSelectedAccounts(new Set())} className={secondaryButton}>Deselect all</button><button onClick={()=>void exportSelected()} className={secondaryButton}>⇩ Export Excel</button><button onClick={()=>void exportSelected(true)} className={secondaryButton}>⇩ Export PDF</button><button onClick={()=>{const values=visibleAccounts.filter(item=>selectedAccounts.has(item.id));if(!values.length){notify("Select one or more accounts first.");return;}const message=encodeURIComponent("Hello, this is A+ Kids.");window.open(`https://wa.me/${values[0].phone.replace(/\D/g,"")}?text=${message}`,"_blank","noopener,noreferrer");notify(values.length>1?"Opened WhatsApp for the first selected recipient. Bulk queue delivery is available in Message Queue.":"WhatsApp message opened.");}} className="h-9 rounded-[9px] bg-[#18B957] px-3 text-[11px] font-semibold text-white">WhatsApp selected ({selectedAccounts.size})</button></div><div className="divide-y divide-[#EDF1F6]">{visibleAccounts.map(item=><div key={item.id} className="flex flex-col gap-3 p-4 transition hover:bg-[#F8FBFF] tablet:flex-row tablet:items-center tablet:justify-between"><div className="flex items-center gap-3"><input type="checkbox" checked={selectedAccounts.has(item.id)} onChange={()=>setSelectedAccounts(current=>{const next=new Set(current);if(next.has(item.id))next.delete(item.id);else next.add(item.id);return next;})} className="size-4 accent-[#1689F7]"/><span className="grid size-9 place-items-center rounded-full bg-[#EAF4FF] text-[12px] font-bold text-[#1C80EE]">{item.name.slice(0,2).toUpperCase()}</span><div><p className="text-[13px] font-semibold">{item.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${item.accountType==="GUEST"?"bg-amber-50 text-amber-700":"bg-blue-50 text-blue-700"}`}>{item.accountType==="GUEST"?"NON-REGISTERED":"REGISTERED"}</span></p><p className="mt-1 text-[11px] text-[#75839A]">{item.email||"No email"} · {item.phone} · {item.children} record{item.children===1?"":"s"}</p></div></div><div className="flex items-center gap-2"><StatusBadge label={item.status}/>{item.status==="DELETED"||item.status==="DELETED_GUEST"?<button onClick={()=>void restoreAccount(item)} className={secondaryButton}>Restore</button>:<><button onClick={()=>openAccountEditor(item)} className={secondaryButton}>Edit</button><button onClick={()=>setDeleteDialog(item)} className="h-9 rounded-[9px] border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-600">Delete</button></>}</div></div>)}{visibleAccounts.length===0?<p className="p-6 text-center text-[12px] text-[#7A879A]">No accounts match these filters.</p>:null}</div></div>:null}
    {tab==="admins"&&isSuperAdmin?<div className="mt-5 rounded-[18px] border border-[#E0E7EF] bg-white p-5"><h3 className="text-[16px] font-semibold">Administrator access</h3><p className="mt-1 text-[12px] text-[#7A879A]">Super Admins control credentials, admin roles and the audit trail. Admins have operational access only.</p><div className="mt-4 divide-y divide-[#EDF1F6]">{administrators.map(item=><div key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-[13px] font-semibold">{item.name}</p><p className="mt-1 text-[11px] text-[#75839A]">{item.email}</p></div><button onClick={()=>void changeRole(item)} className={secondaryButton}>{item.role==="SUPER_ADMIN"?"Super Admin":"Admin"}</button></div>)}</div></div>:null}
    {tab==="whatsapp"&&isSuperAdmin?<div className="mt-5 grid gap-5 desktop:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-[18px] border border-[#E0E7EF] bg-white p-5">
        <div className="flex items-center gap-3"><WhatsAppIcon/><div><h3 className="text-[17px] font-semibold">WhatsApp Cloud API</h3><p className="text-[11px] text-[#7A879A]">Credentials are encrypted by the backend. The token is never returned to this page.</p></div></div>
        <div className="mt-5 grid gap-4 tablet:grid-cols-2">
          <label className="text-[11px] font-semibold text-[#526178]">Graph API version<input value={draft.graphApiVersion} onChange={e=>setDraft({...draft,graphApiVersion:e.target.value})} className={`${fieldClass} mt-1`} placeholder="v23.0"/></label>
          <label className="text-[11px] font-semibold text-[#526178]">Phone Number ID<input value={draft.phoneNumberId} onChange={e=>setDraft({...draft,phoneNumberId:e.target.value})} className={`${fieldClass} mt-1`}/></label>
          <label className="text-[11px] font-semibold text-[#526178]">Business Account ID<input value={draft.businessAccountId} onChange={e=>setDraft({...draft,businessAccountId:e.target.value})} className={`${fieldClass} mt-1`}/></label>
          <label className="text-[11px] font-semibold text-[#526178]">Access token<input type="password" value={draft.accessToken} onChange={e=>setDraft({...draft,accessToken:e.target.value})} className={`${fieldClass} mt-1`} placeholder={config?.tokenConfigured?`${config.maskedToken} (leave blank to keep)`:"Paste Meta access token"}/></label>
        </div>
        <button onClick={()=>void save()} disabled={saving||!draft.phoneNumberId||!draft.businessAccountId} className={`${primaryButton} mt-5 w-full disabled:opacity-40`}>{saving?"Saving…":"Save WhatsApp account"}</button>
      </div>
      <div className="rounded-[18px] border border-[#E0E7EF] bg-white p-5">
        <h3 className="text-[17px] font-semibold">Test message delivery</h3><p className="mt-1 text-[11px] text-[#7A879A]">Sends one connection-test message through the saved Meta sender.</p>
        <button onClick={()=>void testConnection()} disabled={testingConnection||!config?.tokenConfigured} className={`${secondaryButton} mt-4 w-full disabled:opacity-40`}>{testingConnection?"Checking Meta connection…":"Test Meta connection"}</button>
        {connection?<div className={`mt-3 rounded-[12px] border p-3 text-[11px] ${connection.success?"border-emerald-200 bg-emerald-50":"border-red-200 bg-red-50"}`}><p className="font-semibold">{connection.message}</p>{connection.solutions.map(solution=><p key={solution} className="mt-1 text-[#65748A]">• {solution}</p>)}</div>:null}
        <label className="mt-5 block text-[11px] font-semibold text-[#526178]">Recipient number<input value={testPhone} onChange={e=>setTestPhone(e.target.value)} className={`${fieldClass} mt-1`} placeholder="07XXXXXXXX"/></label>
        <button onClick={()=>void test()} disabled={testing||!config?.tokenConfigured||!testPhone} className="mt-3 h-10 w-full rounded-[10px] bg-[#20B15A] text-[12px] font-semibold text-white disabled:opacity-40">{testing?"Sending…":"Send test WhatsApp message"}</button>
        <div className={`mt-5 rounded-[13px] border p-4 ${config?.lastTestStatus==="SUCCESS"?"border-emerald-200 bg-emerald-50":config?.lastTestStatus==="FAILED"?"border-red-200 bg-red-50":"border-[#E0E7EF] bg-[#F8FAFC]"}`}><p className="text-[11px] font-semibold uppercase text-[#7A879A]">Latest delivery status</p><p className="mt-2 text-[13px] font-semibold">{config?.lastTestStatus||"Not tested"}</p><p className="mt-1 text-[11px] text-[#66758B]">{config?.lastTestMessage||"Save the account, then send a test."}</p>{config?.lastTestedAt?<p className="mt-2 text-[10px] text-[#8490A2]">{new Date(config.lastTestedAt).toLocaleString()}</p>:null}</div>
      </div>
    </div>:null}
    {tab==="templates"&&isSuperAdmin?<div className="mt-5 rounded-[18px] border border-[#E0E7EF] bg-white p-5"><h3 className="text-[16px] font-semibold">WhatsApp template management</h3><p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#7A879A]">Templates are used by the message queue after Meta approves them. The next implementation slice will add template sync, approval state, language variants and variable previews here—without exposing Meta credentials to Admins.</p><div className="mt-4 grid gap-3 tablet:grid-cols-3">{["Reminder episode","Submission received","ZIP ready"].map(name=><div key={name} className="rounded-[13px] border border-[#E3EAF3] bg-[#FAFCFF] p-4"><p className="text-[12px] font-semibold">{name}</p><p className="mt-1 text-[11px] text-[#78869A]">Meta template · awaiting sync</p></div>)}</div></div>:null}
    {tab==="history"&&isSuperAdmin?<div className="mt-5 rounded-[18px] border border-[#E0E7EF] bg-white p-5"><h3 className="text-[16px] font-semibold">Admin history</h3><p className="mt-1 text-[12px] text-[#7A879A]">Append-only record of changes made by administrators.</p><div className="mt-4 space-y-3">{history.slice(0,100).map(item=><div key={`${item.createdAt}-${item.action}`} className="border-l-2 border-[#1680F7] pl-4"><p className="text-[12px] font-semibold">{item.action.replaceAll("_"," ")}</p><p className="mt-1 text-[11px] text-[#596A82]">{item.actor} · {item.details}</p><p className="mt-1 text-[10px] text-[#9AA6B7]">{new Date(item.createdAt).toLocaleString()}</p></div>)}{history.length===0?<p className="py-8 text-center text-[12px] text-[#7A879A]">No administrator changes have been recorded yet.</p>:null}</div></div>:null}
    {editingAccount?<div className="fixed inset-0 z-[140] grid place-items-center bg-[#0D1B33]/35 p-4"><div className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h3 className="text-[18px] font-semibold">Edit Kids account</h3><p className="mt-1 text-[12px] text-[#718097]">Changes are saved to the account and Admin history.</p></div><button onClick={()=>setEditingAccount(null)} className="text-lg text-[#6C7A90]">×</button></div><div className="mt-5 grid gap-4"><label className="text-[11px] font-semibold text-[#526178]">Parent or guardian name<input value={accountDraft.accountHolderName} onChange={e=>setAccountDraft({...accountDraft,accountHolderName:e.target.value})} className={`${fieldClass} mt-1`}/></label><label className="text-[11px] font-semibold text-[#526178]">Email address<input value={accountDraft.email} onChange={e=>setAccountDraft({...accountDraft,email:e.target.value})} className={`${fieldClass} mt-1`}/></label><label className="text-[11px] font-semibold text-[#526178]">Phone number<input value={accountDraft.phoneE164} onChange={e=>setAccountDraft({...accountDraft,phoneE164:e.target.value})} className={`${fieldClass} mt-1`}/></label><label className="text-[11px] font-semibold text-[#526178]">Account status<select value={accountDraft.status} onChange={e=>setAccountDraft({...accountDraft,status:e.target.value})} className={`${fieldClass} mt-1`}><option>ACTIVE</option><option>PENDING_VERIFICATION</option><option>LOCKED</option><option>SUSPENDED</option><option>DELETION_PENDING</option></select></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setEditingAccount(null)} className={secondaryButton}>Cancel</button><button onClick={()=>void saveAccount()} disabled={savingAccount||!accountDraft.accountHolderName||!accountDraft.email||!accountDraft.phoneE164} className={`${primaryButton} disabled:opacity-40`}>{savingAccount?"Saving…":"Save changes"}</button></div></div></div>:null}
    {deleteDialog?<div className="fixed inset-0 z-[145] grid place-items-center bg-[#0D1B33]/35 p-4"><div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl"><h3 className="text-[18px] font-semibold text-red-700">Delete account?</h3><p className="mt-2 text-[12px] leading-5 text-[#687890]">{deleteDialog.name} will lose access. Their account is retained securely and can be restored later; no child data is permanently erased.</p><label className="mt-4 block text-[11px] font-semibold text-[#526178]">Reason for this action<textarea value={deleteReason} onChange={e=>setDeleteReason(e.target.value)} className={`${fieldClass} mt-1 min-h-20`} placeholder="Required for the admin history"/></label><div className="mt-6 flex justify-end gap-3"><button onClick={()=>{setDeleteDialog(null);setDeleteReason("");}} className={secondaryButton}>Cancel</button><button onClick={()=>void deleteAccount()} disabled={!deleteReason.trim()} className="h-10 rounded-[10px] bg-red-600 px-4 text-[12px] font-semibold text-white disabled:opacity-40">Delete safely</button></div></div></div>:null}
  </section>;
}

export function AccountManagementAdminPage() {
  const [notice,setNotice]=useState("");
  function notify(message:string){setNotice(message);window.setTimeout(()=>setNotice(""),4000);}
  return <>
    <header className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_92%_75%,rgba(220,239,255,.78)_0_2px,transparent_3px),linear-gradient(135deg,#fff_0%,#f5faff_100%)] px-6 py-8 shadow-[0_10px_28px_rgba(43,86,138,.05)] tablet:px-8 tablet:py-10"><i className="pointer-events-none absolute left-[2%] top-[44%] text-2xl text-violet-100">✦</i><i className="pointer-events-none absolute left-[57%] top-10 text-3xl text-[#C7D2FE]">◆</i><i className="pointer-events-none absolute left-[67%] top-[58%] text-3xl text-[#F7DFA4]">✦</i><i className="pointer-events-none absolute right-[34%] top-9 size-3 rounded-full bg-[#FFC2C7]"/><div className="relative z-10 flex flex-col gap-5 tablet:flex-row tablet:items-end tablet:justify-between"><div><p className="text-[13px] font-medium text-[#2488F4]">Page manager</p><h1 className="mt-1 text-[32px] font-semibold tracking-[-.04em] text-[#132447] tablet:text-[44px]">Account Management <span className="text-[#FFB300]">✦</span></h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6E7C91]">Manage family accounts, administrator access, WhatsApp services and a complete record of changes.</p></div><div className="flex gap-3"><div className="rounded-[12px] border border-[#DDE8F5] bg-white/90 px-4 py-3 text-[12px] font-semibold text-[#40516B] shadow-sm">🔒 Protected controls</div></div></div></header>
    <div className="mt-6"><AccountManagementWorkspace notify={notify}/></div>
    {notice?<div className="fixed bottom-5 right-5 z-[130] max-w-md rounded-[12px] bg-[#17243D] px-4 py-3 text-[12px] font-semibold text-white shadow-xl">{notice}</div>:null}
    <KidsChampLoadingScreen />
  </>;
}

export default function KidsChampAdmin() {
  const [workspace, setWorkspace] = useState<Workspace>("Overview");
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [privacy, setPrivacy] = useState(false);
  const [notice, setNotice] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [settings, setSettings] = useState<KidsChampSettings>(
    defaultKidsChampSettings,
  );
  const [zipCreateRequest, setZipCreateRequest] = useState<string[]>([]);
  const [messageQueueOpen, setMessageQueueOpen] = useState(false);
  const [liveVersion, setLiveVersion] = useState(0);
  const [calendarWorkspaceFilter, setCalendarWorkspaceFilter] = useState<CalendarWorkspaceFilter | null>(null);
  const [overviewSubmissionFilter, setOverviewSubmissionFilter] = useState<OverviewSubmissionFilter>(null);
  const [overviewZipView, setOverviewZipView] = useState<OverviewZipView>("all");

  useEffect(() => {
    const controller = new AbortController();
    void apiFetch("/api/v1/admin/kids-champ/events", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          if (events.some((event) => event.includes("event:update"))) {
            setLiveVersion((current) => current + 1);
          }
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch("/api/v1/admin/kids-champ/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Kids Champ settings could not be loaded.");
        if (active) setSettings({ ...defaultKidsChampSettings, ...(await response.json()) });
      })
      .catch(() => notify("Kids Champ settings could not be loaded."));
    return () => { active = false; };
  }, [liveVersion]);

  useEffect(() => {
    const hashWorkspace = workspaces.find(
      (item) => `#${item.toLowerCase()}` === window.location.hash.toLowerCase(),
    );
    const savedWorkspace = window.localStorage.getItem(
      "aplus-kids-champ-workspace",
    ) as Workspace | null;
    const next =
      hashWorkspace ??
      (savedWorkspace && workspaces.includes(savedWorkspace)
        ? savedWorkspace
        : null);
    if (!next) return;
    const timer = window.setTimeout(() => setWorkspace(next), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveSettings(next: KidsChampSettings) {
    const response = await apiFetch("/api/v1/admin/kids-champ/settings", {
      method: "PUT",
      body: JSON.stringify(next),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "Settings could not be saved."); return; }
    setSettings({ ...defaultKidsChampSettings, ...body });
    notify("Kids Champ settings saved to the backend.");
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function openDrawer(kind: DrawerKind, title: string) {
    setDrawer({ kind, title });
  }

  function changeWorkspace(next: Workspace) {
    setCalendarWorkspaceFilter(null);
    setOverviewSubmissionFilter(null);
    setOverviewZipView("all");
    setWorkspace(next);
    window.localStorage.setItem("aplus-kids-champ-workspace", next);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${next.toLowerCase()}`,
    );
  }

  function openOverviewSubmissions(filter: OverviewSubmissionFilter) {
    setCalendarWorkspaceFilter(null);
    setOverviewSubmissionFilter(filter);
    setWorkspace("Submissions");
    window.localStorage.setItem("aplus-kids-champ-workspace", "Submissions");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#submissions`);
  }

  function openOverviewZip(view: OverviewZipView) {
    setCalendarWorkspaceFilter(null);
    setOverviewSubmissionFilter(null);
    setOverviewZipView(view);
    setWorkspace("ZIP");
    window.localStorage.setItem("aplus-kids-champ-workspace", "ZIP");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#zip`);
  }

  return (
    <>
      <header className="relative z-10 flex flex-col gap-5 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_92%_75%,rgba(220,239,255,.78)_0_2px,transparent_3px),linear-gradient(135deg,#fff_0%,#f5faff_100%)] px-6 py-8 tablet:flex-row tablet:items-end tablet:justify-between tablet:px-7 tablet:py-10">
        <i className="pointer-events-none absolute left-3 top-12 text-2xl text-violet-100">✦</i><i className="pointer-events-none absolute left-[58%] top-12 text-3xl text-[#C7D2FE]">◆</i><i className="pointer-events-none absolute left-[66%] top-[62%] text-3xl text-[#F7DFA4]">✦</i><i className="pointer-events-none absolute right-[34%] top-9 size-3 rounded-full bg-[#FFC2C7]" />
        <div className="relative z-10">
          <p className="text-[13px] font-medium text-[#2488F4]">Page manager</p>
          <h1 className="mt-1 flex items-center gap-2 text-[30px] font-semibold tracking-[-.03em] tablet:text-[38px]">
            Kids Champ <span className="text-[25px] text-[#FFB900] tablet:text-[30px]">★</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6E7C91]">
            Approve submissions, monitor automatic ZIP batches, schedule telecasts,
            and manage participant records.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          <a
            href="/kids-champ"
            target="_blank"
            className={`inline-flex items-center ${secondaryButton}`}
          >
            View public page
          </a>
          <button
            type="button"
            role="switch"
            aria-checked={privacy}
            onClick={() => setPrivacy((value) => !value)}
            className={`${secondaryButton} ${privacy ? "border-violet-200 bg-violet-50 text-violet-700" : ""}`}
          >
            Privacy {privacy ? "on" : "off"}
          </button>
        </div>
      </header>

      {notice ? (
        <div
          role="status"
          className="fixed right-5 top-20 z-[120] rounded-[12px] bg-[#17243D] px-4 py-3 text-[13px] font-medium text-white shadow-xl"
        >
          {notice}
        </div>
      ) : null}

      <nav
        className="mt-5 overflow-x-auto rounded-[28px] border border-[#E2EAF4] bg-white p-2.5 shadow-[0_12px_30px_rgba(30,72,123,.12)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Kids Champ workspaces"
      >
        <div className="flex min-w-max" role="tablist">
        {workspaces.map((item) => {
          const label = item === "ZIP" ? "ZIP & Telecast" : item === "Account & Management" ? "Management" : item;
          const active = workspace === item;
          return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => changeWorkspace(item)}
            className={`relative flex min-h-[78px] flex-1 items-center justify-center gap-3 border-r border-[#E5EBF3] px-6 text-[15px] font-bold transition last:border-r-0 tablet:min-w-[190px] ${active ? "rounded-[20px] bg-gradient-to-br from-[#299CFF] to-[#0869ED] text-white shadow-[0_10px_20px_rgba(13,118,239,.28)]" : "text-[#5D6E8C] hover:bg-[#F4F9FF] hover:text-[#0877EF]"}`}
          >
            <span className={`grid size-10 place-items-center rounded-[12px] p-1.5 ${active ? "bg-white/14 text-white" : "bg-[#F8FBFF] text-[#90ADD6]"}`}><WorkspaceTabIcon workspace={item} /></span>{label}
          </button>
        );
        })}
        </div>
      </nav>

      {privacy ? (
        <div className="mt-5 flex items-center justify-between rounded-[12px] border border-violet-200 bg-violet-50 px-4 py-3 text-[12px] text-violet-800">
          <span>
            <strong>Privacy mode:</strong> child names, tracking codes and
            participant references are masked.
          </span>
          <button onClick={() => setPrivacy(false)} className="font-semibold">
            Turn off
          </button>
        </div>
      ) : null}

      <main className="mt-6">
        {workspace === "Overview" ? (
          <Overview
            key={`overview-${liveVersion}`}
            openDrawer={openDrawer}
            openCalendar={() => setCalendarOpen(true)}
            goToWorkspace={changeWorkspace}
            openSubmissions={openOverviewSubmissions}
            openZipView={openOverviewZip}
            notify={notify}
          />
        ) : null}
        {workspace === "Submissions" ? (
          <SubmissionsWorkspace
            key={`submissions-${liveVersion}-${calendarWorkspaceFilter?.mode ?? "all"}-${calendarWorkspaceFilter?.date ?? "all"}-${overviewSubmissionFilter ?? "all"}`}
            privacy={privacy}
            openSubmission={(submission, onSaveSubmission) => {
              setDrawer({
                kind: "submissions",
                title: "Submission details",
                submission,
                onSaveSubmission,
              });
              if (submission.fileStatus === "Ready") {
                void apiFetch(`/api/v1/admin/kids-champ/submissions/${submission.id}/photo`)
                  .then(async (response) => {
                    if (!response.ok) throw new Error("Photo preview could not be loaded.");
                    const photoUrl = URL.createObjectURL(await response.blob());
                    setDrawer((current) => current?.submission?.id === submission.id
                      ? { ...current, submission: { ...current.submission, photoUrl } }
                      : current);
                  })
                  .catch(() => notify("Photo preview could not be loaded."));
              }
            }}
            notify={notify}
            initialOverviewFilter={overviewSubmissionFilter}
            calendarFilter={calendarWorkspaceFilter}
            clearCalendarFilter={() => setCalendarWorkspaceFilter(null)}
          />
        ) : null}
        {workspace === "ZIP" ? (
          <TvZipWorkspace
            key={`zips-${liveVersion}-${overviewZipView}`}
            commonSettings={{
              batchSize: settings.zipBatchSize,
              expiryDays: settings.zipExpiryDays,
              warningDays: settings.zipWarningDays,
            }}
            onSettingsChange={(next) =>
              saveSettings({
                ...settings,
                zipBatchSize: next.batchSize,
                zipExpiryDays: next.expiryDays,
                zipWarningDays: next.warningDays,
              })
            }
            createRequest={zipCreateRequest}
            onCreateRequestHandled={() => setZipCreateRequest([])}
            openZip={(zipBatch, onDeleteZip, onUpdateZip) =>
              setDrawer({
                kind: "zips",
                title: "ZIP details",
                zipBatch,
                onDeleteZip,
                onUpdateZip,
              })
            }
            notify={notify}
            initialOverviewView={overviewZipView}
          />
        ) : null}
        {workspace === "Participants" ? (
          <ParticipantsWorkspace
            key={`participants-${liveVersion}`}
            privacy={privacy}
            settings={settings}
            openParticipant={(participant, onSaveParticipant) =>
              setDrawer({
                kind: "participants",
                title: "Participant details",
                participant,
                onSaveParticipant,
              })
            }
            notify={notify}
          />
        ) : null}
        {workspace === "Account & Management" ? (
          <AccountManagementWorkspace key={`account-management-${liveVersion}`} notify={notify} />
        ) : null}
      </main>

      {calendarOpen ? (
        <CalendarModal
          key={`calendar-${liveVersion}`}
          onClose={() => setCalendarOpen(false)}
          onOpenDay={(dateLabel) => {
            setCalendarOpen(false);
            setCalendarWorkspaceFilter({ date: new Date(dateLabel).toISOString().slice(0, 10), mode: "submitted" });
            changeWorkspace("Submissions");
          }}
          onNavigate={(section, dateLabel) => {
            setCalendarOpen(false);
            if (section === "submissions") {
              setCalendarWorkspaceFilter({ date: new Date(dateLabel).toISOString().slice(0, 10), mode: "submitted" });
              changeWorkspace("Submissions");
              return;
            }
            changeWorkspace("ZIP");
            setOverviewZipView(section === "telecasts" ? "telecasted" : "all");
          }}
          notify={notify}
        />
      ) : null}
      {drawer ? (
        <SideDrawer
          key={`${drawer.kind}-${drawer.kind === "calendar" ? liveVersion : drawer.title}`}
          title={drawer.title}
          wide={drawer.kind === "calendar"}
          onBack={drawer.kind === "calendar" ? () => { setDrawer(null); setCalendarOpen(true); } : undefined}
          description="A quick view from the current workspace."
          onClose={() => setDrawer(null)}
        >
          <DrawerContent
            drawer={drawer}
            privacy={privacy}
            setWorkspace={changeWorkspace}
            close={() => setDrawer(null)}
            notify={notify}
          />
        </SideDrawer>
      ) : null}
      {!calendarOpen && !messageQueueOpen ? (
        <button
          type="button"
          onClick={() => setMessageQueueOpen(true)}
          className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-[#102A56] px-4 py-3 text-[11px] font-bold text-white shadow-[0_12px_28px_rgba(16,42,86,.32)]"
          aria-label="Open WhatsApp message queue"
        >
          <span className="grid size-6 place-items-center rounded-full bg-[#20B65B] text-[15px]">◔</span>
          Message queue
        </button>
      ) : null}
      {messageQueueOpen ? <WhatsAppQueueModal onClose={() => setMessageQueueOpen(false)} notify={notify} /> : null}
      <KidsChampLoadingScreen />
    </>
  );
}
