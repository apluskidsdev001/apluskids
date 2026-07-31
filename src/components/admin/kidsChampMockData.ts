export type DashboardMetric = {
  label: string;
  value: string;
  change?: string;
  direction?: "up" | "down" | "neutral";
  tone: "blue" | "amber" | "green" | "red" | "violet" | "slate";
  section: string;
  tab?: string;
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  count: number;
  severity: "critical" | "warning" | "info";
  section: string;
  tab?: string;
};

export type MockSubmission = {
  id: string;
  trackingCode: string;
  childName: string;
  initials: string;
  age: number;
  location: string;
  category: string;
  participantType: "Guest" | "Registered";
  reviewStatus: "New" | "Pending review" | "Under review" | "Approved" | "Rejected";
  tvStatus: "Not selected" | "Selected" | "Scheduled" | "Telecasted";
  fileStatus: "Ready" | "Missing" | "Processing failed";
  reviewer: string;
  submittedAt: string;
  submittedDate: string;
  photoUrl?: string;
  photoFile?: File;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "blue" | "green" | "amber" | "red" | "violet";
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Total submissions", value: "1,248", change: "+12.4%", direction: "up", tone: "blue", section: "submissions", tab: "all" },
  { label: "New today", value: "38", change: "+8 today", direction: "up", tone: "violet", section: "submissions", tab: "new" },
  { label: "Pending reviews", value: "86", change: "14 overdue", direction: "down", tone: "amber", section: "reviews", tab: "unassigned" },
  { label: "Approved", value: "742", change: "59.5% rate", direction: "neutral", tone: "green", section: "submissions", tab: "approved" },
  { label: "Selected for TV", value: "78", change: "12 unscheduled", direction: "neutral", tone: "violet", section: "telecast", tab: "selected" },
  { label: "Telecasted", value: "42", change: "+6 this month", direction: "up", tone: "blue", section: "telecast", tab: "telecasted" },
  { label: "Unique participants", value: "903", change: "186 returning", direction: "up", tone: "slate", section: "database", tab: "all" },
  { label: "ZIPs ready", value: "4", change: "2 expire soon", direction: "down", tone: "amber", section: "zips", tab: "ready" },
  { label: "Failed messages", value: "18", change: "11 retryable", direction: "down", tone: "red", section: "database", tab: "whatsapp" },
];

export const attentionItems: AttentionItem[] = [
  { id: "attention-1", title: "Reviews waiting over 48 hours", detail: "Oldest submission has waited 3 days, 7 hours", count: 14, severity: "critical", section: "reviews", tab: "unassigned" },
  { id: "attention-2", title: "Selected entries need telecast dates", detail: "Assign a date before the next production meeting", count: 12, severity: "warning", section: "telecast", tab: "awaiting" },
  { id: "attention-3", title: "ZIP batches expire within two days", detail: "Two ready batches have not been downloaded", count: 2, severity: "warning", section: "zips", tab: "expiring" },
  { id: "attention-4", title: "WhatsApp messages ready for retry", detail: "Temporary provider failures are now eligible", count: 11, severity: "info", section: "database", tab: "whatsapp" },
];

export const submissions: MockSubmission[] = [
  { id: "sub-001", trackingCode: "KC-2026-004821", childName: "Nethuli Perera", initials: "NP", age: 9, location: "Colombo", category: "Drawing", participantType: "Registered", reviewStatus: "New", tvStatus: "Not selected", fileStatus: "Ready", reviewer: "Unassigned", submittedAt: "Today, 10:42 AM", submittedDate: "2026-08-01" },
  { id: "sub-002", trackingCode: "KC-2026-004820", childName: "Kavindu Silva", initials: "KS", age: 7, location: "Gampaha", category: "Handcraft", participantType: "Guest", reviewStatus: "Pending review", tvStatus: "Not selected", fileStatus: "Ready", reviewer: "Dinithi S.", submittedAt: "Today, 10:18 AM", submittedDate: "2026-08-01" },
  { id: "sub-003", trackingCode: "KC-2026-004819", childName: "Aaradhya Fernando", initials: "AF", age: 11, location: "Kandy", category: "Drawing", participantType: "Registered", reviewStatus: "Under review", tvStatus: "Selected", fileStatus: "Ready", reviewer: "Malith J.", submittedAt: "Today, 9:51 AM", submittedDate: "2026-08-01" },
  { id: "sub-004", trackingCode: "KC-2026-004818", childName: "Tharushi Jayasinghe", initials: "TJ", age: 8, location: "Galle", category: "Painting", participantType: "Guest", reviewStatus: "Approved", tvStatus: "Scheduled", fileStatus: "Ready", reviewer: "Dinithi S.", submittedAt: "Today, 9:26 AM", submittedDate: "2026-08-01" },
  { id: "sub-005", trackingCode: "KC-2026-004817", childName: "Yenuli Abeysekara", initials: "YA", age: 6, location: "Kurunegala", category: "Handcraft", participantType: "Registered", reviewStatus: "Pending review", tvStatus: "Not selected", fileStatus: "Missing", reviewer: "Unassigned", submittedAt: "Today, 8:47 AM", submittedDate: "2026-08-01" },
  { id: "sub-006", trackingCode: "KC-2026-004816", childName: "Senuka Dissanayake", initials: "SD", age: 12, location: "Matara", category: "Drawing", participantType: "Guest", reviewStatus: "Rejected", tvStatus: "Not selected", fileStatus: "Processing failed", reviewer: "Malith J.", submittedAt: "Yesterday, 5:32 PM", submittedDate: "2026-07-31" },
];

export const growthPoints = [
  { label: "Jul 25", impressions: 820, submissions: 24, participants: 18 },
  { label: "Jul 26", impressions: 1010, submissions: 31, participants: 23 },
  { label: "Jul 27", impressions: 940, submissions: 28, participants: 25 },
  { label: "Jul 28", impressions: 1260, submissions: 39, participants: 30 },
  { label: "Jul 29", impressions: 1180, submissions: 36, participants: 27 },
  { label: "Jul 30", impressions: 1490, submissions: 44, participants: 34 },
  { label: "Jul 31", impressions: 1370, submissions: 38, participants: 31 },
];

export const recentActivity: ActivityItem[] = [
  { id: "activity-1", title: "Submission approved", detail: "Dinithi approved KC-2026-004795", time: "8 min ago", tone: "green" },
  { id: "activity-2", title: "Telecast scheduled", detail: "8 entries added to episode KC-EP-087", time: "23 min ago", tone: "violet" },
  { id: "activity-3", title: "ZIP batch ready", detail: "KC-ZIP-2026-071 is ready to download", time: "41 min ago", tone: "blue" },
  { id: "activity-4", title: "File processing failed", detail: "Thumbnail could not be generated for one photo", time: "1 hr ago", tone: "red" },
];

export const upcomingTelecasts = [
  { episode: "KC-EP-087", date: "Aug 03", time: "10:00 AM", entries: 8, status: "Ready" },
  { episode: "KC-EP-088", date: "Aug 05", time: "3:00 PM", entries: 6, status: "Needs review" },
  { episode: "KC-EP-089", date: "Aug 08", time: "7:00 PM", entries: 10, status: "Draft" },
];

export const zipBatches = [
  { code: "KC-ZIP-2026-071", photos: 120, size: "486 MB", status: "Ready", expires: "2 days", progress: 100, telecastStatus: "Telecasted", telecastDate: "2026-07-28", recipientIds: ["sub-001", "sub-002", "sub-003", "sub-004", "sub-005", "sub-006"], edited: false, editedAt: "", deleted: false, deletedAt: "", downloaded: false, downloadedAt: "" },
  { code: "KC-ZIP-2026-072", photos: 120, size: "--", status: "Creating ZIP", expires: "14 days", progress: 68, telecastStatus: "Scheduled", telecastDate: "2026-08-05", recipientIds: ["sub-001", "sub-002", "sub-003", "sub-004"], edited: false, editedAt: "", deleted: false, deletedAt: "", downloaded: false, downloadedAt: "" },
  { code: "KC-ZIP-2026-073", photos: 84, size: "--", status: "Queued", expires: "14 days", progress: 0, telecastStatus: "Not telecasted", telecastDate: "", recipientIds: ["sub-004", "sub-005", "sub-006"], edited: false, editedAt: "", deleted: false, deletedAt: "", downloaded: false, downloadedAt: "" },
];

export const participants = [
  { reference: "KCP-001492", name: "Nethuli Perera", age: 9, type: "Registered", location: "Colombo", phone: "+94 77 2400000", submissions: 6, approved: 5, telecasted: 2, whatsapp: "Consented", joinedDate: "2026-02-14", lastSubmissionDate: "2026-08-01" },
  { reference: "KCP-001491", name: "Kavindu Silva", age: 7, type: "Guest", location: "Gampaha", phone: "+94 77 2413791", submissions: 1, approved: 0, telecasted: 0, whatsapp: "Consented", joinedDate: "2026-07-20", lastSubmissionDate: "2026-08-01" },
  { reference: "KCP-001488", name: "Aaradhya Fernando", age: 11, type: "Registered", location: "Kandy", phone: "Not provided", submissions: 4, approved: 4, telecasted: 1, whatsapp: "Not provided", joinedDate: "2025-11-03", lastSubmissionDate: "2026-08-01" },
  { reference: "KCP-001472", name: "Tharushi Jayasinghe", age: 8, type: "Guest", location: "Galle", phone: "+94 77 2441373", submissions: 3, approved: 2, telecasted: 1, whatsapp: "Opted out", joinedDate: "2026-04-22", lastSubmissionDate: "2026-08-01" },
];
