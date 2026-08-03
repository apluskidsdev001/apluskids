type Props = { label: string };

export function KidsChampStatusBadge({ label }: Props) {
  const value = label.toLowerCase();
  const style =
    value.includes("approved") || value.includes("ready") || value.includes("consented") || value.includes("telecasted")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value.includes("rejected") || value.includes("failed") || value.includes("error") || value.includes("deleted") || value.includes("missing") || value.includes("opted")
        ? "border-red-200 bg-red-50 text-red-700"
        : value.includes("pending") || value.includes("review") || value.includes("creating") || value.includes("scheduled")
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}>{label}</span>;
}
