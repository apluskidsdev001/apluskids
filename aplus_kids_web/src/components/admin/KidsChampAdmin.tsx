"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/utils/auth";
type MockSubmission = {
  id: string; participantId: string; phone: string; trackingCode: string; childName: string; initials: string; age: number; location: string; category: string;
  participantType: "Guest" | "Registered"; reviewStatus: "New" | "Pending review" | "Under review" | "Approved" | "Rejected";
  tvStatus: "Not selected" | "Selected" | "Scheduled" | "Telecasted"; fileStatus: "Ready" | "Missing" | "Processing failed";
  reviewer: string; submittedAt: string; submittedDate: string; reviewedDate?: string; previewed: boolean; photoUrl?: string; photoFile?: File;
};
const submissions: MockSubmission[] = [];
const upcomingTelecasts: Array<{episode:string;date:string;time:string;entries:number;status:string}> = [];

type Workspace = "Overview" | "Submissions" | "ZIP" | "Participants" | "Account & Management";

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
  };
}

type AdminBatchResponse = {
  id: string;
  batchCode: string;
  status: "READY" | "DOWNLOADED" | "DELETED";
  photoCount: number;
  firstDownloadedAt?: string;
  daysRemaining: number;
  telecastDate?: string;
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
    telecastStatus: item.telecastDate ? "Scheduled" : "Not telecasted",
    telecastDate: item.telecastDate || "",
    recipientIds: item.submissionIds || [],
    edited: false,
    editedAt: "",
    deleted: item.status === "DELETED",
    deletedAt: item.deletedAt ? item.deletedAt.slice(0, 10) : "",
    downloaded: Boolean(item.firstDownloadedAt),
    downloadedAt: item.firstDownloadedAt ? item.firstDownloadedAt.slice(0, 10) : "",
    createdAt: item.createdAt.slice(0, 10),
  };
}
type ZipBatch = { id?: string; code:string;photos:number;size:string;status:string;expires:string;progress:number;telecastStatus:string;telecastDate:string;recipientIds:string[];edited:boolean;editedAt:string;deleted:boolean;deletedAt:string;downloaded:boolean;downloadedAt:string;createdAt:string };
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
  | "settings"
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
  "Account & Management",
];

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

function StatusBadge({ label }: { label: string }) {
  const value = label.toLowerCase();
  const style =
    value.includes("approved") ||
    value.includes("ready") ||
    value.includes("consented") ||
    value.includes("telecasted")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value.includes("rejected") ||
          value.includes("failed") ||
          value.includes("error") ||
          value.includes("deleted") ||
          value.includes("missing") ||
          value.includes("opted")
        ? "border-red-200 bg-red-50 text-red-700"
        : value.includes("pending") ||
            value.includes("review") ||
            value.includes("creating") ||
            value.includes("scheduled")
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

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

type GrowthMetric = "impressions" | "submissions" | "participants";
type GrowthPoint = {
  label: string;
  impressions: number;
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
          aria-label="Growth comparison for impressions, submissions and participants"
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
      setPoints(body.map((item)=>({label:new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"}),impressions:0,submissions:item.submissions,participants:item.participants})));
    }).catch((reason)=>notify(reason instanceof Error?reason.message:"Growth data could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <section className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white">
        <div className="flex w-full items-start justify-between gap-4 border-b border-[#E7ECF2] p-5 text-left tablet:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#2488F4]">
              Impressions and growth
            </p>
            <h2 className="mt-1 text-[21px] font-semibold">
              Combined performance
            </h2>
            <p className="mt-1 text-[12px] text-[#8490A2]">
              Compare performance over any reporting period.
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
  const dayStatus = !metrics
    ? "inactive"
    : metrics.warnings > 0
      ? "warning"
      : metrics.telecasts > 0 || metrics.zips > 0
        ? "healthy"
        : "normal";
  const dayStyle =
    dayStatus === "warning"
      ? "border-red-300 bg-red-50 hover:border-red-400"
      : dayStatus === "healthy"
        ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400"
        : dayStatus === "normal"
          ? "border-transparent bg-white hover:border-[#CBD5E1]"
          : "border-transparent bg-white";
  const counters = metrics
    ? [
        {
          label: "Submissions",
          value: metrics.submissions,
          style: "bg-[#2488F4] text-white",
        },
        {
          label: "Reviews",
          value: metrics.reviews,
          style: "bg-[#7B8797] text-white",
        },
        {
          label: "Telecasts",
          value: metrics.telecasts,
          style: "bg-violet-500 text-white",
        },
        {
          label: "ZIPs",
          value: metrics.zips,
          style: "bg-emerald-500 text-white",
        },
        {
          label: "Warnings",
          value: metrics.warnings,
          style: metrics.warnings
            ? "bg-red-500 text-white"
            : "bg-red-50 text-red-500",
        },
      ]
    : [];

  return (
    <button
      type="button"
      disabled={!current}
      onClick={onOpen}
      aria-label={`${dateLabel}, ${dayStatus} status`}
      className={`group relative min-h-[88px] overflow-hidden rounded-[16px] border p-2 transition tablet:min-h-[112px] ${dayStyle} ${current ? "hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default"} ${selected ? "ring-2 ring-inset ring-[#F26B4D]" : ""}`}
    >
      <span
        className={`mx-auto grid size-10 place-items-center rounded-full text-[19px] font-bold ${selected ? "bg-[#F26B4D] text-white" : current ? "text-[#3F4A59]" : "text-[#D2D4D8]"}`}
      >
        {String(day).padStart(2, "0")}
      </span>
      {metrics ? (
        <span className="absolute inset-x-2 bottom-2 grid grid-cols-5 gap-1">
          {counters.map((counter) => (
            <span
              key={counter.label}
              aria-label={`${counter.value} ${counter.label.toLowerCase()}`}
              className={`grid h-5 place-items-center rounded-[5px] text-[9px] font-bold ${counter.style}`}
            >
              {counter.value}
            </span>
          ))}
        </span>
      ) : null}
      {metrics ? (
        <span className="pointer-events-none absolute inset-1 z-20 rounded-[14px] bg-[#17243D]/96 p-2.5 text-left text-white opacity-0 shadow-lg transition-opacity duration-150 delay-0 group-hover:opacity-100 group-hover:delay-[400ms]">
          <span className="block text-center text-[11px] font-bold text-white/65">
            {dateLabel}
          </span>
          <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {counters.map((counter) => (
              <span
                key={counter.label}
                className="flex items-center justify-between gap-2 text-[9px]"
              >
                <span className="text-white/70">{counter.label}</span>
                <strong className="text-[10px] text-white">
                  {counter.value}
                </strong>
              </span>
            ))}
          </span>
          <span className="mt-2 block text-center text-[8px] font-medium text-[#7DC4FF]">
            Click for the full day
          </span>
        </span>
      ) : null}
    </button>
  );
}

function OverviewCalendar({
  openDay,
}: {
  openDay: (dateLabel: string) => void;
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
  const [displayMonth, setDisplayMonth] = useState(6);
  const [displayYear, setDisplayYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(31);
  const [manualDate, setManualDate] = useState("2026-07-31");
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

  function goToDate() {
    const [year, month, day] = manualDate.split("-").map(Number);
    if (!year || !month || !day) return;
    setDisplayYear(year);
    setDisplayMonth(month - 1);
    setSelectedDay(day);
    setView("Month");
  }

  return (
    <section
      className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white"
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
          <div className="inline-flex w-fit rounded-[10px] bg-[#F3F4F6] p-1">
            {(["Year", "Month", "Week"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`h-8 rounded-[8px] px-3 text-[11px] font-semibold ${view === item ? "bg-[#F26B4D] text-white shadow-sm" : "text-[#7B8491]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[#87909C]">View:</span>
          <select
            value={displayMonth}
            onChange={(event) => {
              setDisplayMonth(Number(event.target.value));
              setView("Month");
            }}
            className="h-9 rounded-[8px] border-0 bg-[#F3F4F6] px-3 text-[11px] font-semibold text-[#596473] outline-none"
          >
            {monthNames.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={displayYear}
            onChange={(event) => setDisplayYear(Number(event.target.value))}
            className="h-9 rounded-[8px] border-0 bg-[#F3F4F6] px-3 text-[11px] font-semibold text-[#596473] outline-none"
          >
            {[2024, 2025, 2026, 2027, 2028].map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
          <span className="ml-auto text-[11px] font-medium text-[#87909C]">
            Go to date:
          </span>
          <input
            type="date"
            value={manualDate}
            onChange={(event) => setManualDate(event.target.value)}
            className="h-9 rounded-[8px] border border-[#E0E3E7] bg-white px-3 text-[11px] font-semibold text-[#596473] outline-none focus:border-[#F26B4D]"
          />
          <button
            onClick={goToDate}
            className="h-9 rounded-[8px] bg-[#F26B4D] px-4 text-[11px] font-bold text-white"
          >
            Go
          </button>
        </div>
      </div>

      <div className="bg-[#E9EAED] p-2 tablet:p-3">
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
                      onOpen={() => {
                        setSelectedDay(cell.day);
                        openDay(dateLabel);
                      }}
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
                const metrics = metricsForDay(date.getDate());
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
                    onOpen={() => openDay(label)}
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
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-[11px] text-[#6E7C91] tablet:px-5">
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-[#2488F4]" />
          Submissions
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-[#7B8797]" />
          Reviews
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
        <span className="ml-auto border-l border-[#DDE3EA] pl-4">
          <i className="mr-1.5 inline-block size-2 rounded-full bg-white ring-1 ring-[#CBD5E1]" />
          Normal day
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-200 ring-1 ring-emerald-400" />
          Healthy operation
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2 rounded-full bg-red-200 ring-1 ring-red-400" />
          Needs attention
        </span>
      </div>
    </section>
  );
}

function CalendarModal({
  onClose,
  onOpenDay,
}: {
  onClose: () => void;
  onOpenDay: (dateLabel: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#102A56]/45 p-3 backdrop-blur-[2px] tablet:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Operations calendar"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_28px_90px_rgba(16,42,86,.28)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#F26B4D]">
              Kids Champ
            </p>
            <h2 className="mt-1 text-[20px] font-semibold text-[#17243D]">
              Calendar and daily operations
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full border border-[#D7E2EE] text-[18px] text-[#66758B]"
            aria-label="Close calendar"
          >
            x
          </button>
        </div>
        <div className="overflow-y-auto bg-[#F5F7FA] p-3 tablet:p-5">
          <OverviewCalendar openDay={onOpenDay} />
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
  notify,
}: {
  openDrawer: (kind: DrawerKind, title: string) => void;
  openCalendar: () => void;
  notify: (message: string) => void;
}) {
  const [metrics, setMetrics] = useState({ totalSubmissions: 0, newToday: 0, pendingReviews: 0, approved: 0, selectedForTv: 0, telecasted: 0, uniqueParticipants: 0, activeBatches: 0 });
  const [liveActivity, setLiveActivity] = useState<Array<{id:string;title:string;detail:string;time:string;tone:"blue"|"green"|"red"|"violet";category:string}>>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState("All");
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/overview")
      .then(async (response) => {
        if (!response.ok) throw new Error("Overview metrics could not be loaded.");
        setMetrics(await response.json());
      })
      .catch((reason) => notify(reason instanceof Error ? reason.message : "Overview metrics could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    apiFetch("/api/v1/admin/kids-champ/activity").then(async (response) => {
      if (!response.ok) return;
      const body=await response.json() as Array<{action:string;entityType:string;entityId:string;details?:string;actor:string;createdAt:string}>;
      const category=(type:string)=>type === "SUBMISSION" ? "Submissions" : type === "BATCH" ? "ZIP" : type === "GUEST" || type === "CHILD_PROFILE" ? "Participants" : type === "CALENDAR_TASK" ? "Calendar" : type === "SETTINGS" ? "Settings" : type === "CAMPAIGN" ? "Campaigns" : "Overview";
      setLiveActivity(body.map((item)=>({id:`${item.entityId}-${item.createdAt}`,title:item.action.replaceAll("_"," ").toLowerCase(),detail:`${item.actor}${item.details?` · ${item.details}`:""}`,time:new Date(item.createdAt).toLocaleString(),tone:"blue",category:category(item.entityType)})));
    }).catch(()=>undefined);
  }, []);
  const liveAttention = [
    {id:"pending",title:"Submissions waiting for review",detail:"Open the review queue",count:metrics.pendingReviews,severity:metrics.pendingReviews?"warning":"info",section:"reviews"},
    {id:"production",title:"Approved entries awaiting production",detail:"Select approved entries for a ZIP",count:Math.max(0,metrics.approved-metrics.selectedForTv-metrics.telecasted),severity:"info",section:"telecast"},
  ];
  const priorities = [
    {
      label: "Operations calendar",
      value: String(new Date().getDate()).padStart(2, "0"),
      detail: "Open daily submissions, reviews and tasks",
      tone: "coral",
      status: "normal",
      kind: "calendar" as DrawerKind,
      calendar: true,
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
      label: "Pending reviews",
      value: String(metrics.pendingReviews),
      detail: "Waiting for an admin decision",
      tone: "red",
      status: "warning",
      kind: "reviews" as DrawerKind,
      calendar: false,
    },
    {
      label: "Awaiting schedule",
      value: String(metrics.selectedForTv),
      detail: "Selected for television",
      tone: "violet",
      status: "normal",
      kind: "telecast" as DrawerKind,
      calendar: false,
    },
    {
      label: "Failed operations",
      value: "0",
      detail: "No recorded backend failures",
      tone: "red",
      status: "warning",
      kind: "attention" as DrawerKind,
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
      label: "ZIPs ready",
      value: String(metrics.activeBatches),
      detail: "Active database batches",
      status: "warning",
      kind: "zips" as DrawerKind,
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
  const activityCategories = ["All", "Overview", "Submissions", "ZIP", "Participants", "Calendar", "Settings", "Campaigns"];
  const filteredActivity = activityFilter === "All" ? liveActivity : liveActivity.filter((item) => item.category === activityFilter);

  return (
    <div className="space-y-7">
      <section aria-labelledby="priority-heading">
        <div className="mb-4">
          <h2 id="priority-heading" className="text-[20px] font-semibold">
            Today&apos;s priorities
          </h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">
            Start with the work that needs attention now.
          </p>
        </div>
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-5">
          {priorities.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                item.calendar
                  ? openCalendar()
                  : openDrawer(item.kind, item.label)
              }
              className={`group rounded-[18px] border p-5 text-left transition hover:-translate-y-0.5 ${statusCard[item.status]}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid size-9 place-items-center rounded-[11px] text-[12px] font-bold ${tone[item.tone]}`}
                >
                  {item.calendar ? "TD" : item.label.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[#A2ADBA] group-hover:text-[#0877EF]">
                  -&gt;
                </span>
              </div>
              <p className="mt-5 text-[30px] font-semibold tracking-[-.04em]">
                {item.value}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#354963]">
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
        <h2 className="mb-4 text-[18px] font-semibold">Programme summary</h2>
        <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
          {secondary.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openDrawer(item.kind, item.label)}
              className={`rounded-[15px] border px-4 py-4 text-left transition hover:-translate-y-0.5 ${statusCard[item.status]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[23px] font-semibold tracking-[-.03em]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-[#43556D]">
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${item.status === "warning" ? "font-medium text-red-700" : item.status === "success" ? "font-medium text-emerald-700" : "text-[#8793A5]"}`}
                  >
                    {item.detail}
                  </p>
                </div>
                <span className="text-[#A2ADBA]">-&gt;</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 desktop:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[18px] border border-[#E0E7EF] bg-white p-5 tablet:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold">Needs attention</h2>
              <p className="mt-1 text-[12px] text-[#8490A2]">
                Prioritised by urgency and age.
              </p>
            </div>
            <button
              onClick={() => openDrawer("attention", "Needs attention")}
              className="text-[12px] font-semibold text-[#0877EF]"
            >
              View all
            </button>
          </div>
          <div className="mt-5 divide-y divide-[#EDF1F5]">
            {liveAttention.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  openDrawer(
                    item.section === "reviews"
                      ? "reviews"
                      : item.section === "telecast"
                        ? "telecast"
                        : item.section === "zips"
                          ? "zips"
                          : "attention",
                    item.title,
                  )
                }
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ${item.severity === "critical" ? "bg-red-500" : item.severity === "warning" ? "bg-amber-500" : "bg-blue-500"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#344660]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#8793A5]">
                    {item.detail}
                  </span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F3F6F9] text-[11px] font-bold">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#E0E7EF] bg-white p-5 tablet:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold">Recent activity</h2>
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
          <div className="mt-5 space-y-4">
            {liveActivity.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDrawer("activity", item.title)}
                className="flex w-full gap-3 text-left"
              >
                <span
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.tone === "green" ? "bg-emerald-500" : item.tone === "red" ? "bg-red-500" : item.tone === "violet" ? "bg-violet-500" : "bg-blue-500"}`}
                />
                <span>
                  <span className="block text-[13px] font-semibold text-[#344660]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#8793A5]">
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
  previewed,
  onSelect,
  onPreview,
  onOpen,
  notify,
}: {
  item: MockSubmission;
  privacy: boolean;
  selected: boolean;
  previewed: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onOpen: () => void;
  notify: (message: string) => void;
}) {
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
          <StatusBadge label={item.reviewStatus} />
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          <StatusBadge label={item.tvStatus} />
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3">
        <OpenSubmissionField onOpen={onOpen}>
          <span className="block">{item.submittedDate}</span>
          <span className="text-[10px] text-[#8793A5]">{item.submittedAt}</span>
        </OpenSubmissionField>
      </td>
      <td className="px-3 py-3 text-center">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-[10px] font-semibold text-[#66758B] hover:bg-emerald-50 hover:text-emerald-700">
          <input
            type="checkbox"
            checked={previewed}
            onChange={onPreview}
            aria-label={`Mark ${item.childName} artwork previewed`}
            className="size-4 accent-emerald-600"
          />
          {previewed ? "Yes" : "No"}
        </label>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onOpen}
          className="rounded-[8px] bg-[#EDF5FF] px-3 py-2 font-semibold text-[#0877EF] hover:bg-[#2488F4] hover:text-white"
        >
          View / edit
        </button>
      </td>
    </tr>
  );
}

function ReviewFocus({
  privacy,
  onBack,
  notify,
  items,
  onUpdate,
}: {
  privacy: boolean;
  onBack: () => void;
  notify: (message: string) => void;
  items: MockSubmission[];
  onUpdate: (submission: MockSubmission) => void;
}) {
  const queue = items.filter(
    (item) =>
      item.reviewStatus !== "Approved" && item.reviewStatus !== "Rejected",
  );
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const item = queue[Math.min(index, Math.max(queue.length - 1, 0))];
  function move(direction: number) {
    if (!queue.length) return;
    setIndex((current) => (current + direction + queue.length) % queue.length);
    setZoom(1);
    setRotation(0);
    setNote("");
  }
  function setDecision(reviewStatus: MockSubmission["reviewStatus"]) {
    if (!item) return;
    onUpdate({ ...item, reviewStatus });
    notify(
      `${item.trackingCode} marked ${reviewStatus.toLowerCase()}.${note.trim() ? " Internal note saved." : ""}`,
    );
    if (queue.length > 1) move(1);
  }
  if (!item)
    return (
      <section className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-[20px] font-semibold text-emerald-900">
          Review queue complete
        </h2>
        <p className="mt-2 text-[13px] text-emerald-700">
          There are no pending submissions in the current queue.
        </p>
        <button onClick={onBack} className={`${primaryButton} mt-5`}>
          Back to submissions
        </button>
      </section>
    );
  return (
    <section>
      <button
        onClick={onBack}
        className="mb-5 text-[13px] font-semibold text-[#0877EF]"
      >
        &lt;- Back to submissions
      </button>
      <div className="grid gap-5 desktop:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5EBF2] px-5 py-4">
            <div>
              <h2 className="text-[18px] font-semibold">Photo review</h2>
              <p className="mt-1 text-[12px] text-[#8490A2]">
                {index + 1} of {queue.length} review submissions
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => move(-1)} className={secondaryButton}>
                Previous
              </button>
              <button onClick={() => move(1)} className={secondaryButton}>
                Next
              </button>
            </div>
          </div>
          <div className="grid min-h-[470px] place-items-center bg-[#EAF1F7] p-8">
            <div className="grid aspect-[4/3] w-full max-w-[680px] place-items-center overflow-hidden rounded-[14px] bg-white">
              <div className="text-center">
                <span
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-[22px] font-bold text-blue-700 transition-transform"
                >
                  <PrivateValue enabled={privacy}>{item.initials}</PrivateValue>
                </span>
                <p className="mt-4 text-[14px] font-semibold text-[#526178]">
                  Submission photo preview
                </p>
                <p className="mt-1 text-[12px] text-[#8793A5]">
                  Original photo will load from file storage.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-[#E5EBF2] px-5 py-4">
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setZoom((value) => (value >= 1.75 ? 1 : value + 0.25))
                }
                className={secondaryButton}
              >
                Zoom {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setRotation((value) => (value + 90) % 360)}
                className={secondaryButton}
              >
                Rotate
              </button>
            </div>
            <StatusBadge label="File ready" />
          </div>
        </div>
        <aside className="rounded-[18px] border border-[#E0E7EF] bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[12px] bg-blue-50 text-[12px] font-bold text-blue-700">
              <PrivateValue enabled={privacy}>{item.initials}</PrivateValue>
            </span>
            <div>
              <h2 className="text-[17px] font-semibold">
                <PrivateValue enabled={privacy}>{item.childName}</PrivateValue>
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-[#8490A2]">
                <PrivateValue enabled={privacy}>
                  {item.trackingCode}
                </PrivateValue>
              </p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            {[
              ["Age", `${item.age} years`],
              ["Location", item.location],
              ["Category", item.category],
              ["Participant", item.participantType],
              ["Submitted", item.submittedAt],
              ["Reviewer", item.reviewer],
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
          <label className="mt-6 block text-[12px] font-semibold text-[#59687E]">
            Internal note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[11px] border border-[#D8E2EC] p-3 text-[13px] outline-none focus:border-[#2488F4]"
              placeholder="Add a note for the audit record"
            />
          </label>
          {assigning ? (
            <label className="mt-3 block text-[12px] font-semibold text-[#59687E]">
              Assign reviewer
              <select
                value={item.reviewer}
                onChange={(event) => {
                  onUpdate({ ...item, reviewer: event.target.value });
                  setAssigning(false);
                  notify(
                    `${item.trackingCode} assigned to ${event.target.value}.`,
                  );
                }}
                className={`${fieldClass} mt-2`}
              >
                <option>Unassigned</option>
                <option>Dinithi S.</option>
                <option>Malith J.</option>
                <option>Amara D.</option>
              </select>
            </label>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setDecision("Approved")}
              className="h-11 rounded-[10px] bg-emerald-600 text-[13px] font-semibold text-white"
            >
              Approve
            </button>
            <button
              onClick={() => setDecision("Rejected")}
              className="h-11 rounded-[10px] bg-red-600 text-[13px] font-semibold text-white"
            >
              Reject
            </button>
            <button onClick={() => move(1)} className={secondaryButton}>
              Skip
            </button>
            <button
              onClick={() => setAssigning((value) => !value)}
              className={secondaryButton}
            >
              Assign
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[125] grid place-items-center bg-[#102A56]/45 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      onMouseDown={onCancel}
    >
      <section
        className="w-full max-w-[460px] rounded-[20px] bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="grid size-12 place-items-center rounded-full bg-red-50 text-[22px] font-bold text-red-600">
          !
        </span>
        <h2 id="confirmation-title" className="mt-4 text-[21px] font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-[#6E7C91]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-[10px] bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}


function SubmissionsWorkspace({
  privacy,
  reviewing,
  setReviewing,
  openSubmission,
  notify,
  createZipFromSelection,
  calendarFilter,
  clearCalendarFilter,
}: {
  privacy: boolean;
  reviewing: boolean;
  setReviewing: (value: boolean) => void;
  openSubmission: (
    item: MockSubmission,
    onSave: (submission: MockSubmission) => void,
  ) => void;
  notify: (message: string) => void;
  createZipFromSelection: (submissionIds: string[]) => void;
  calendarFilter: CalendarWorkspaceFilter | null;
  clearCalendarFilter: () => void;
}) {
  const [records, setRecords] = useState<MockSubmission[]>([]);
  const [backendState, setBackendState] = useState<"loading" | "live" | "error">("loading");
  const [reviewFilter, setReviewFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exactAge, setExactAge] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [tvFilter, setTvFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateMode, setDateMode] = useState(calendarFilter ? "Specific date" : "Any time");
  const [specificDate, setSpecificDate] = useState(calendarFilter?.date ?? "2026-08-01");
  const [dateFrom, setDateFrom] = useState("2026-07-25");
  const [dateTo, setDateTo] = useState("2026-08-01");
  const [month, setMonth] = useState("2026-08");
  const [year, setYear] = useState("2026");
  const [week, setWeek] = useState("2026-W31");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewed, setPreviewed] = useState<Set<string>>(new Set());
  const [autoPreview, setAutoPreview] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/v1/admin/kids-champ/submissions")
      .then(async (response) => {
        if (!response.ok) throw new Error("Backend submissions are unavailable.");
        const body = (await response.json()) as AdminSubmissionResponse[];
        if (!cancelled) {
          setRecords(body.map(toMockSubmission));
          setPreviewed(new Set(body.filter((item) => item.previewed).map((item) => item.id)));
          setBackendState("live");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecords([]);
          setBackendState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSubmission(updated: MockSubmission) {
    const current = records.find((item) => item.id === updated.id);
    if (!current || backendState !== "live") {
      notify("Submission changes cannot be saved while the backend is unavailable.");
      return;
    }
    try {
      let saved: AdminSubmissionResponse | null = null;
      if (current.reviewStatus !== updated.reviewStatus) {
        const status = updated.reviewStatus === "Approved"
          ? "APPROVED"
          : updated.reviewStatus === "Rejected"
            ? "REJECTED"
            : "UNDER_REVIEW";
        const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${updated.id}/review`, {
          method: "PATCH",
          body: JSON.stringify({ status, reason: status === "REJECTED" ? "Not approved during administrator review." : null }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "The review update could not be saved.");
        saved = body as AdminSubmissionResponse;
      }
      if (current.category !== updated.category || current.tvStatus !== updated.tvStatus) {
        const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${updated.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            category: updated.category,
            selectedForTv: updated.tvStatus === "Selected",
          }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message || "The submission update could not be saved.");
        saved = body as AdminSubmissionResponse;
      }
      setRecords((items) => items.map((item) => item.id === updated.id ? (saved ? toMockSubmission(saved) : updated) : item));
      notify("Submission changes saved to the backend.");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "The review update could not be saved.");
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
        const matchesReview =
          reviewFilter === "All" ||
          (reviewFilter === "Not approved"
            ? item.reviewStatus !== "Approved"
            : item.reviewStatus === reviewFilter);
        const matchesAge =
          (!exactAge || item.age === Number(exactAge)) &&
          (!ageMin || item.age >= Number(ageMin)) &&
          (!ageMax || item.age <= Number(ageMax));
        const matchesTv = tvFilter === "All" || item.tvStatus === tvFilter;
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
          matchesReview &&
          matchesAge &&
          matchesTv &&
          matchesLocation &&
          matchesDate
        );
      }),
    [
      records,
      search,
      reviewFilter,
      exactAge,
      ageMin,
      ageMax,
      tvFilter,
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
  if (reviewing)
    return (
      <ReviewFocus
        privacy={privacy}
        onBack={() => setReviewing(false)}
        notify={notify}
        items={records}
        onUpdate={(updated) => void saveSubmission(updated)}
      />
    );

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

  async function savePreview(id: string, value: boolean) {
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${id}/preview`, {
      method: "PATCH",
      body: JSON.stringify({ previewed: value }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || "Preview status could not be saved.");
    setPreviewed((current) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function togglePreview(id: string) {
    void savePreview(id, !previewed.has(id)).catch((reason) =>
      notify(reason instanceof Error ? reason.message : "Preview status could not be saved."),
    );
  }

  function toggleAutoPreview() {
    const next = !autoPreview;
    setAutoPreview(next);
    const targets = records.filter((item) => previewed.has(item.id) !== next);
    void Promise.all(targets.map((item) => savePreview(item.id, next))).catch((reason) =>
      notify(reason instanceof Error ? reason.message : "Preview statuses could not be saved."),
    );
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
    setPreviewed(
      (current) => new Set([...current].filter((id) => !selected.has(id))),
    );
    notify(
      `${deletedIds.size} submission${deletedIds.size === 1 ? "" : "s"} deleted from the database.`,
    );
    setSelected(new Set());
  }

  async function approveSelected() {
    if (!selected.size) return;
    if (backendState !== "live") {
      notify("Submissions cannot be approved while the backend is unavailable.");
      return;
    }
    const ids = [...selected];
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await apiFetch(
          `/api/v1/admin/kids-champ/submissions/${id}/review`,
          { method: "PATCH", body: JSON.stringify({ status: "APPROVED", reason: null }) },
        );
        const body = await response.json().catch(() => null);
        return { id, response, body };
      }),
    );
    const approved = results.filter(({ response }) => response.ok);
    const approvedById = new Map(
      approved.map(({ id, body }) => [id, toMockSubmission(body as AdminSubmissionResponse)]),
    );
    setRecords((current) =>
      current.map((item) => approvedById.get(item.id) ?? item),
    );
    const failed = results.length - approved.length;
    notify(
      failed
        ? `${approved.length} approved; ${failed} could not be approved.`
        : `${approved.length} submission${approved.length === 1 ? "" : "s"} approved.`,
    );
    setSelected(new Set());
  }

  function exportVisible() {
    const headers = [
      "Child",
      "Tracking code",
      "Age",
      "Home town",
      "Category",
      "Review",
      "TV status",
      "Reviewer",
      "Submitted date",
      "Previewed",
    ];
    const rows = visible.map((item) => [
      item.childName,
      item.trackingCode,
      item.age,
      item.location,
      item.category,
      item.reviewStatus,
      item.tvStatus,
      item.reviewer,
      item.submittedDate,
      previewed.has(item.id) ? "Yes" : "No",
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
    <section>
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold">Submission workspace</h2>
          <p className="mt-1 text-[13px] text-[#7A879A]">
            Search, preview, edit and manage every Kids Champ entry on one page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={!selected.size}
            className="h-10 rounded-[10px] border border-red-200 bg-red-50 px-4 text-[12px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
          <button onClick={() => setReviewing(true)} className={primaryButton}>
            Start reviewing
          </button>
        </div>
      </div>
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
      <div className="mt-6 rounded-[18px] border border-[#E0E7EF] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E5EBF2] p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <label className="relative w-full max-w-sm">
            <span className="sr-only">Search submissions</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={fieldClass}
              placeholder="Search name or tracking code"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-800">
              <input
                type="checkbox"
                checked={autoPreview}
                onChange={toggleAutoPreview}
                className="size-4 accent-emerald-600"
              />
              Automatically preview all
            </label>
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
                placeholder="Any"
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
                placeholder="Min"
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
                placeholder="Max"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Review
              <select
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                <option>New</option>
                <option>Pending review</option>
                <option>Under review</option>
                <option>Approved</option>
                <option>Not approved</option>
                <option>Rejected</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              TV status
              <select
                value={tvFilter}
                onChange={(event) => setTvFilter(event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option>All</option>
                <option>Not selected</option>
                <option>Selected</option>
                <option>Scheduled</option>
                <option>Telecasted</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase text-[#748197]">
              Home town
              <select
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
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
                onClick={() => {
                  setExactAge("");
                  setAgeMin("");
                  setAgeMax("");
                  setReviewFilter("All");
                  setTvFilter("All");
                  setLocationFilter("All");
                  setDateMode("Any time");
                }}
                className={`${secondaryButton} w-full`}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2 overflow-x-auto border-b border-[#E5EBF2] px-4 py-3">
          {[
            "All",
            "New",
            "Pending review",
            "Under review",
            "Approved",
            "Not approved",
            "Rejected",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setReviewFilter(item)}
              className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold ${reviewFilter === item ? "bg-[#2488F4] text-white" : "bg-[#F1F4F7] text-[#66758B]"}`}
            >
              {item}
            </button>
          ))}
        </div>
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
              onClick={() => createZipFromSelection([...selected])}
              className="h-9 rounded-[9px] bg-violet-600 px-3 text-[11px] font-semibold text-white"
            >
              Create ZIP
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
          <table className="w-full min-w-[1370px] text-left">
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
                <th className="px-3 py-3">Review</th>
                <th className="px-3 py-3">TV status</th>
                <th className="px-3 py-3">Sent</th>
                <th className="px-3 py-3 text-center">Previewed</th>
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
                  previewed={previewed.has(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                  onPreview={() => togglePreview(item.id)}
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
            Showing all {visible.length} matching records on this page
          </p>
          <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${backendState === "live" ? "bg-emerald-50 text-emerald-700" : backendState === "loading" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
            {backendState === "live" ? "Live backend data" : backendState === "loading" ? "Loading backend data" : "Backend unavailable"}
          </span>
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

type CampaignStatus = "Unsent" | "Sending" | "Queued" | "Error";
type CampaignRecipient = {
  id: string;
  participantId: string;
  name: string;
  phone: string;
  trackingCode: string;
  status: CampaignStatus;
  attempts: number;
  selected: boolean;
};

function WhatsAppIcon() {
  return (
    <span
      className="grid size-7 place-items-center rounded-full bg-[#20D467] text-white shadow-sm"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
        <path d="M8.7 8.2c.4 2.7 2.5 4.8 5.2 5.2l1.2-1.2c.3-.3.7-.4 1.1-.2l2 .8" />
      </svg>
    </span>
  );
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
  const [language, setLanguage] = useState<"English" | "Sinhala">("English");
  const [message, setMessage] = useState(englishTemplate);
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
  const personalize = (recipient: CampaignRecipient) =>
    message
      .replaceAll("{name}", recipient.name)
      .replaceAll("{trackingCode}", recipient.trackingCode)
      .replaceAll("{telecastDate}", telecastDate || "the date to be announced");
  const counts = recipients.reduce(
    (result, item) => ({ ...result, [item.status]: result[item.status] + 1 }),
    { Queued: 0, Error: 0, Unsent: 0, Sending: 0 } as Record<
      CampaignStatus,
      number
    >,
  );
  const completed = counts.Queued + counts.Error;
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
        body: JSON.stringify({ channel: "WHATSAPP", messageTemplate: personalize(recipient), participantIds: [recipient.participantId] }),
      });
      return { id: recipient.id, ok: response.ok, message: response.ok ? undefined : ((await response.json().catch(() => null)) as { message?: string } | null)?.message };
    }));
    const resultById = new Map(results.map((result) => [result.id, result]));
    setRecipients((current) => current.map((item) => {
      const result = resultById.get(item.id);
      return result ? { ...item, status: result.ok ? "Queued" : "Error", attempts: item.attempts + 1, selected: !result.ok } : item;
    }));
    setSending(false);
    const failed = results.filter((result) => !result.ok);
    notify(failed.length ? `${results.length - failed.length} messages queued; ${failed.length} could not be queued${failed[0].message ? `: ${failed[0].message}` : "."}` : `${results.length} personalized WhatsApp messages queued for delivery.`);
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
              <div className="grid grid-cols-4 gap-3">
                {[
                  ["Queued", counts.Queued, "text-emerald-700 bg-emerald-50"],
                  ["Errors", counts.Error, "text-red-700 bg-red-50"],
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
                {(["All", "Queued", "Error", "Unsent"] as const).map((item) => (
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
                onClick={() =>
                  void startSending(
                    recipients
                      .filter((item) => item.status === "Error")
                      .map((item) => item.id),
                  )
                }
                disabled={sending || !counts.Error}
                className="h-10 rounded-[10px] border border-red-200 bg-red-50 px-4 text-[12px] font-semibold text-red-700 disabled:opacity-40"
              >
                Retry all errors
              </button>
              <button
                onClick={() =>
                  void startSending(
                    recipients
                      .filter(
                        (item) =>
                          item.selected &&
                          (item.status === "Error" || item.status === "Unsent"),
                      )
                      .map((item) => item.id),
                  )
                }
                disabled={
                  sending ||
                  !recipients.some(
                    (item) =>
                      item.selected &&
                      (item.status === "Error" || item.status === "Unsent"),
                  )
                }
                className={`${primaryButton} disabled:opacity-40`}
              >
                Retry selected
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
}) {
  const [zipRecords, setZipRecords] = useState<ZipBatch[]>([]);
  const [zipSearch, setZipSearch] = useState("");
  const [zipStatus, setZipStatus] = useState("All");
  const [campaignZip, setCampaignZip] = useState<ZipBatch | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [batchSubmissions, setBatchSubmissions] = useState<MockSubmission[]>([]);
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
    apiFetch("/api/v1/admin/kids-champ/submissions").then(async(response)=>{if(response.ok)setBatchSubmissions(((await response.json()) as AdminSubmissionResponse[]).map(toMockSubmission));}).catch(()=>undefined);
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
      (zipStatus === "All" ||
        (zipStatus === "Deleted"
          ? item.deleted
          : !item.deleted && item.status === zipStatus)),
  );
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
  function toggleEdited(code: string) {
    setZipRecords((current) =>
      current.map((item) =>
        item.code === code && item.downloaded
          ? {
              ...item,
              edited: !item.edited,
              editedAt: !item.edited ? "2026-08-01" : "",
            }
          : item,
      ),
    );
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
    <section>
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
        className="mt-6 flex w-full items-center justify-between rounded-[16px] border border-[#DCE5EF] bg-white p-5 text-left transition hover:border-[#BFDDFB] hover:shadow-sm"
      >
        <span>
          <strong className="text-[14px] text-[#263852]">ZIP retention</strong>
          <span className="mt-1 block text-[11px] text-[#7A879A]">
            Batch size, default expiry and warning periods.
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-700">
            {commonSettings.batchSize} photos / batch
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-700">
            {commonSettings.expiryDays}-day expiry
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700">
            Warn {commonSettings.warningDays} days before
          </span>
          <span className="ml-2 text-[#9AA5B5]">-&gt;</span>
        </span>
      </button>
      <section className="mt-6 overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E5EBF2] p-5 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <h3 className="text-[18px] font-semibold">ZIP records</h3>
            <p className="mt-1 text-[12px] text-[#8490A2]">
              Deleted files retain their complete audit records.
            </p>
          </div>
          <div className="flex gap-2">
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
                  disabled={item.deleted}
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
                  disabled={!item.downloaded}
                  onChange={() => toggleEdited(item.code)}
                  className="size-4 accent-violet-600 disabled:cursor-not-allowed"
                />
                Edited
              </label>
              <div className="flex items-center justify-end gap-2">
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
    <section>
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
      <section className="mt-6 rounded-[18px] border border-amber-200 bg-amber-50/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-amber-950">Possible duplicate guests</h3>
            <p className="mt-1 text-[12px] text-amber-800">Review the matching reasons before merging guest histories with another guest or a registered child profile.</p>
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
      <div className="mt-6 overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E5EBF2] p-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${fieldClass} max-w-sm`}
            placeholder="Search child, reference or phone"
          />
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
            Review
            <select
              value={draft.reviewStatus}
              onChange={(event) =>
                update(
                  "reviewStatus",
                  event.target.value as MockSubmission["reviewStatus"],
                )
              }
              className={`${fieldClass} mt-1`}
            >
              <option>New</option>
              <option>Pending review</option>
              <option>Under review</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase text-[#8793A5]">
            TV status
            <select
              value={draft.tvStatus}
              onChange={(event) =>
                update(
                  "tvStatus",
                  event.target.value as MockSubmission["tvStatus"],
                )
              }
              className={`${fieldClass} mt-1`}
            >
              <option>Not selected</option>
              <option>Selected</option>
              <option>Scheduled</option>
              <option>Telecasted</option>
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
            ["Reviewer", draft.reviewer],
            ["TV status", draft.tvStatus],
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
              onClick={() => {
                const reason = window.prompt("Reason for rejection");
                if (reason === null) return;
                const updated = { ...draft, reviewStatus: "Rejected" as const };
                setDraft(updated);
                onSave?.(updated);
                notify(
                  `${draft.trackingCode} rejected${reason.trim() ? `: ${reason.trim()}` : "."}`,
                );
              }}
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

function CalendarDayPanel({ notify, dateLabel }: { notify: (message: string) => void; dateLabel: string }) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [adding, setAdding] = useState(false);
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [daySubmissions, setDaySubmissions] = useState<AdminSubmissionResponse[]>([]);
  const [dayReviews, setDayReviews] = useState<AdminSubmissionResponse[]>([]);
  const [dayBatches, setDayBatches] = useState<AdminBatchResponse[]>([]);
  const [activeSection, setActiveSection] = useState<"submissions" | "reviews" | "zips" | "telecasts" | "warnings" | "tasks">("submissions");
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
      setDayReviews(submissionItems.filter((item) => item.reviewedAt?.slice(0, 10) === taskDate));
      setDayBatches(batchItems.filter((item) => item.createdAt.slice(0, 10) === taskDate || item.telecastDate === taskDate));
    }).catch(() => notify("Daily operations could not be loaded."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskDate]);
  async function reviewSubmission(item: AdminSubmissionResponse, status: "APPROVED" | "REJECTED") {
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason: status === "REJECTED" ? "Not approved during administrator review." : null }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) { notify(body?.message || "Review could not be saved."); return; }
    const saved = body as AdminSubmissionResponse;
    setDaySubmissions((current) => current.map((entry) => entry.id === saved.id ? saved : entry));
    setDayReviews((current) => current.some((entry) => entry.id === saved.id)
      ? current.map((entry) => entry.id === saved.id ? saved : entry)
      : [...current, saved]);
    notify(status === "APPROVED" ? "Submission approved." : "Submission rejected.");
  }
  async function previewPhoto(item: AdminSubmissionResponse) {
    if (photoPreview?.id === item.id) { setPhotoPreview(null); return; }
    const response = await apiFetch(`/api/v1/admin/kids-champ/submissions/${item.id}/photo`);
    if (!response.ok) { notify("Photo preview could not be loaded."); return; }
    const url = URL.createObjectURL(await response.blob());
    if (photoPreview) URL.revokeObjectURL(photoPreview.url);
    setPhotoPreview({ id: item.id, url });
  }
  async function addTask() {
    if (!title.trim()) return;
    const response=await apiFetch("/api/v1/admin/kids-champ/calendar/tasks",{method:"POST",body:JSON.stringify({date:taskDate,title:`${time} · ${title.trim()}`,details:detail.trim()||null})});
    const body=await response.json().catch(()=>null);if(!response.ok){notify(body?.message||"Calendar task could not be added.");return;}
    setTasks((current)=>[...current,{id:body.id,time,title:title.trim(),detail:detail.trim()||"No additional details",complete:false}].sort((a,b)=>a.time.localeCompare(b.time)));
    setTitle("");
    setDetail("");
    setAdding(false);
    notify("Calendar task added.");
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
        {[
          ["Submissions", String(daySubmissions.length), "submissions"],
          ["Reviewed", String(dayReviews.length), "reviews"],
          ["ZIPs created", String(dayBatches.filter((item) => item.createdAt.slice(0, 10) === taskDate).length), "zips"],
          ["Telecasts", String(dayBatches.filter((item) => item.telecastDate === taskDate).length), "telecasts"],
          ["Open tasks", String(tasks.filter((item) => !item.complete).length), "tasks"],
          ["Warnings", String(dayBatches.filter((item) => item.status !== "DELETED" && item.daysRemaining <= 0).length), "warnings"],
        ].map(([label, value, action]) => (
          <button
            type="button"
            key={label}
            onClick={() => setActiveSection(action as typeof activeSection)}
            className={`rounded-[16px] border p-5 text-left transition hover:border-blue-300 ${activeSection === action ? "border-blue-400 bg-blue-50" : "border-[#E0E7EF] bg-white"}`}
          >
            <p className="text-[25px] font-semibold">{value}</p>
            <p className="mt-1 text-[12px] text-[#7A879A]">{label} →</p>
          </button>
        ))}
      </div>
      {activeSection === "submissions" || activeSection === "reviews" ? (
        <div className="mt-5 rounded-[16px] border border-[#E0E7EF] bg-white p-4">
          <h3 className="text-[15px] font-semibold">{activeSection === "reviews" ? "Reviewed on this day" : "Received on this day"}</h3>
          <div className="mt-3 space-y-2">
            {(activeSection === "reviews" ? dayReviews : daySubmissions).map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E5EBF2] p-3">
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[13px] text-[#263650]">{item.childName}</strong>
                  <span className="text-[11px] text-[#7A879A]">{item.trackingCode} · {item.hometown} · age {item.ageAtSubmission} · {item.reviewStatus.replaceAll("_", " ")}</span>
                </div>
                <button type="button" onClick={() => void reviewSubmission(item, "APPROVED")} className="rounded-[8px] bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white">Approve</button>
                <button type="button" onClick={() => void reviewSubmission(item, "REJECTED")} className="rounded-[8px] bg-red-600 px-3 py-2 text-[11px] font-semibold text-white">Reject</button>
                <button type="button" onClick={() => void previewPhoto(item)} className="rounded-[8px] border border-blue-200 px-3 py-2 text-[11px] font-semibold text-blue-700">Photo</button>
                {photoPreview?.id === item.id ? <img src={photoPreview.url} alt={`Artwork submitted by ${item.childName}`} className="mt-2 max-h-[440px] w-full rounded-[12px] bg-[#F2F5F8] object-contain" /> : null}
              </article>
            ))}
            {!(activeSection === "reviews" ? dayReviews : daySubmissions).length ? <p className="py-5 text-center text-[12px] text-[#7A879A]">No records for this day.</p> : null}
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
            { label: "Review new submissions", count: daySubmissions.filter((item) => item.reviewStatus === "SUBMITTED" || item.reviewStatus === "UNDER_REVIEW").length, section: "submissions" },
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
      <div id="calendar-day-schedule" className="mt-7 flex items-center justify-between scroll-mt-5">
        <h3 className="text-[16px] font-semibold">Day schedule</h3>
        <button
          onClick={() => setAdding((value) => !value)}
          className="text-[11px] font-semibold text-[#0877EF]"
        >
          {adding ? "Cancel" : "+ Add task"}
        </button>
      </div>
      {adding ? (
        <div className="mt-3 rounded-[14px] border border-blue-200 bg-blue-50/50 p-3">
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={fieldClass}
            />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
              placeholder="Task title"
            />
          </div>
          <input
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            className={`${fieldClass} mt-2`}
            placeholder="Details"
          />
          <button
            onClick={addTask}
            disabled={!title.trim()}
            className={`${primaryButton} mt-2 w-full disabled:opacity-40`}
          >
            Save task
          </button>
        </div>
      ) : null}
      <div className="mt-3 space-y-3">
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`flex items-start gap-3 rounded-[14px] border p-4 ${task.complete ? "border-emerald-200 bg-emerald-50/50" : "border-[#E0E7EF] bg-white"}`}
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
      </div>
      <button
        onClick={() => setAdding(true)}
        className={`${primaryButton} mt-5 w-full`}
      >
        Add task for this day
      </button>
    </div>
  );
}

function DrawerContent({
  drawer,
  privacy,
  setWorkspace,
  close,
  notify,
  settings,
  onSaveSettings,
}: {
  drawer: NonNullable<DrawerState>;
  privacy: boolean;
  setWorkspace: (workspace: Workspace) => void;
  close: () => void;
  notify: (message: string) => void;
  settings: KidsChampSettings;
  onSaveSettings: (settings: KidsChampSettings) => void;
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
  if (drawer.kind === "settings")
    return (
      <KidsChampSettingsPanel
        settings={settings}
        onSave={onSaveSettings}
        notify={notify}
      />
    );

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

export function AccountManagementWorkspace({notify}:{notify:(message:string)=>void}) {
  const [config,setConfig]=useState<WhatsAppAdminConfig|null>(null);
  const [draft,setDraft]=useState({graphApiVersion:"v25.0",phoneNumberId:"",businessAccountId:"",accessToken:""});
  const [testPhone,setTestPhone]=useState("0782940117");
  const [saving,setSaving]=useState(false);
  const [testing,setTesting]=useState(false);
  useEffect(()=>{apiFetch("/api/v1/admin/kids-champ/whatsapp/config").then(async response=>{if(!response.ok)throw new Error("WhatsApp configuration could not be loaded.");const body=await response.json() as WhatsAppAdminConfig;setConfig(body);setDraft({graphApiVersion:body.graphApiVersion,phoneNumberId:body.phoneNumberId,businessAccountId:body.businessAccountId,accessToken:""});}).catch(reason=>notify(reason instanceof Error?reason.message:"WhatsApp configuration could not be loaded."));},[notify]);
  async function save(){setSaving(true);const response=await apiFetch("/api/v1/admin/kids-champ/whatsapp/config",{method:"PUT",body:JSON.stringify(draft)});const body=await response.json().catch(()=>null);setSaving(false);if(!response.ok){notify(body?.message||"WhatsApp configuration could not be saved.");return;}setConfig(body);setDraft(current=>({...current,accessToken:""}));notify("WhatsApp configuration saved securely.");}
  async function test(){setTesting(true);const response=await apiFetch("/api/v1/admin/kids-champ/whatsapp/test",{method:"POST",body:JSON.stringify({phone:testPhone})});const body=await response.json().catch(()=>null);setTesting(false);if(!response.ok){notify(body?.message||"Test message failed.");return;}setConfig(current=>current?{...current,lastTestStatus:body.success?"SUCCESS":"FAILED",lastTestMessage:body.message,lastTestedAt:body.testedAt}:current);notify(body.message);}
  return <section>
    <div><h2 className="text-[22px] font-semibold">Account &amp; Management</h2><p className="mt-1 text-[13px] text-[#7A879A]">Manage external accounts and verify message delivery.</p></div>
    <div className="mt-6 grid gap-5 desktop:grid-cols-[1.2fr_.8fr]">
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
        <label className="mt-5 block text-[11px] font-semibold text-[#526178]">Recipient number<input value={testPhone} onChange={e=>setTestPhone(e.target.value)} className={`${fieldClass} mt-1`} placeholder="07XXXXXXXX"/></label>
        <button onClick={()=>void test()} disabled={testing||!config?.tokenConfigured||!testPhone} className="mt-3 h-10 w-full rounded-[10px] bg-[#20B15A] text-[12px] font-semibold text-white disabled:opacity-40">{testing?"Sending…":"Send test WhatsApp message"}</button>
        <div className={`mt-5 rounded-[13px] border p-4 ${config?.lastTestStatus==="SUCCESS"?"border-emerald-200 bg-emerald-50":config?.lastTestStatus==="FAILED"?"border-red-200 bg-red-50":"border-[#E0E7EF] bg-[#F8FAFC]"}`}><p className="text-[11px] font-semibold uppercase text-[#7A879A]">Latest delivery status</p><p className="mt-2 text-[13px] font-semibold">{config?.lastTestStatus||"Not tested"}</p><p className="mt-1 text-[11px] text-[#66758B]">{config?.lastTestMessage||"Save the account, then send a test."}</p>{config?.lastTestedAt?<p className="mt-2 text-[10px] text-[#8490A2]">{new Date(config.lastTestedAt).toLocaleString()}</p>:null}</div>
      </div>
    </div>
  </section>;
}

export function AccountManagementAdminPage() {
  const [notice,setNotice]=useState("");
  function notify(message:string){setNotice(message);window.setTimeout(()=>setNotice(""),4000);}
  return <>
    <header><p className="text-[13px] font-medium text-[#2488F4]">System management</p><h1 className="mt-1 text-[30px] font-semibold tracking-[-.03em] tablet:text-[38px]">Account &amp; Management</h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6E7C91]">Manage external service accounts, credentials and delivery tests.</p></header>
    <div className="mt-7"><AccountManagementWorkspace notify={notify}/></div>
    {notice?<div className="fixed bottom-5 right-5 z-[130] max-w-md rounded-[12px] bg-[#17243D] px-4 py-3 text-[12px] font-semibold text-white shadow-xl">{notice}</div>:null}
  </>;
}

export default function KidsChampAdmin() {
  const [workspace, setWorkspace] = useState<Workspace>("Overview");
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [privacy, setPrivacy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [notice, setNotice] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [settings, setSettings] = useState<KidsChampSettings>(
    defaultKidsChampSettings,
  );
  const [zipCreateRequest, setZipCreateRequest] = useState<string[]>([]);
  const [liveVersion, setLiveVersion] = useState(0);
  const [calendarWorkspaceFilter, setCalendarWorkspaceFilter] = useState<CalendarWorkspaceFilter | null>(null);

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
    setWorkspace(next);
    setReviewing(false);
    window.localStorage.setItem("aplus-kids-champ-workspace", next);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${next.toLowerCase()}`,
    );
  }

  return (
    <>
      <header className="flex flex-col gap-5 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2488F4]">Page manager</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-.03em] tablet:text-[38px]">
            Kids Champ
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6E7C91]">
            Manage submissions, television selection, photo batches, participant
            records and performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/kids-champ"
            target="_blank"
            className={`inline-flex items-center ${secondaryButton}`}
          >
            View public page
          </a>
          <button
            onClick={() =>
              setDrawer({ kind: "settings", title: "Kids Champ settings" })
            }
            className={secondaryButton}
          >
            Settings
          </button>
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
        className="mt-7 flex gap-2 overflow-x-auto border-b border-[#DCE4ED]"
        aria-label="Kids Champ workspaces"
      >
        {workspaces.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => changeWorkspace(item)}
            className={`shrink-0 border-b-2 px-5 py-3 text-[14px] font-medium ${workspace === item ? "border-[#2488F4] text-[#0877EF]" : "border-transparent text-[#718096]"}`}
          >
            {item}
          </button>
        ))}
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
            notify={notify}
          />
        ) : null}
        {workspace === "Submissions" ? (
          <SubmissionsWorkspace
            key={`submissions-${liveVersion}-${calendarWorkspaceFilter?.mode ?? "all"}-${calendarWorkspaceFilter?.date ?? "all"}`}
            privacy={privacy}
            reviewing={reviewing}
            setReviewing={setReviewing}
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
            calendarFilter={calendarWorkspaceFilter}
            clearCalendarFilter={() => setCalendarWorkspaceFilter(null)}
            createZipFromSelection={(submissionIds) => {
              setZipCreateRequest(submissionIds);
              changeWorkspace("ZIP");
            }}
          />
        ) : null}
        {workspace === "ZIP" ? (
          <TvZipWorkspace
            key={`zips-${liveVersion}`}
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
            setDrawer({ kind: "calendar", title: dateLabel });
          }}
        />
      ) : null}
      {drawer ? (
        <SideDrawer
          key={`${drawer.kind}-${drawer.kind === "calendar" ? liveVersion : drawer.title}`}
          title={drawer.title}
          wide={drawer.kind === "calendar"}
          onBack={drawer.kind === "calendar" ? () => { setDrawer(null); setCalendarOpen(true); } : undefined}
          description={
            drawer.kind === "settings"
              ? "Configuration is grouped here so it does not compete with daily work."
              : "A quick view from the current workspace."
          }
          onClose={() => setDrawer(null)}
        >
          <DrawerContent
            drawer={drawer}
            privacy={privacy}
            setWorkspace={changeWorkspace}
            close={() => setDrawer(null)}
            notify={notify}
            settings={settings}
            onSaveSettings={saveSettings}
          />
        </SideDrawer>
      ) : null}
    </>
  );
}
