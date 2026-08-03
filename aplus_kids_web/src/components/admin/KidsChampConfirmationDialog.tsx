type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function KidsChampConfirmationDialog({ title, description, confirmLabel, onCancel, onConfirm }: Props) {
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-[#102A56]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
    <section className="w-full max-w-md rounded-[18px] bg-white p-5 shadow-2xl">
      <h2 id="confirmation-title" className="text-[18px] font-semibold text-[#17243D]">{title}</h2>
      <p className="mt-2 text-[13px] leading-5 text-[#66758B]">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="h-10 rounded-[10px] border border-[#D7E2EE] bg-white px-4 text-[12px] font-semibold text-[#526178] transition hover:bg-[#F4F7FA]">Cancel</button>
        <button onClick={onConfirm} className="h-10 rounded-[10px] bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700">{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
