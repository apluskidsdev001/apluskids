import { useState } from "react";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmationPhrase?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function KidsChampConfirmationDialog({ title, description, confirmLabel, confirmationPhrase, onCancel, onConfirm }: Props) {
  const [typedPhrase,setTypedPhrase]=useState("");
  const phraseConfirmed=!confirmationPhrase||typedPhrase===confirmationPhrase;
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-[#102A56]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
    <section className="w-full max-w-md rounded-[18px] bg-white p-5 shadow-2xl">
      <h2 id="confirmation-title" className="text-[18px] font-semibold text-[#17243D]">{title}</h2>
      <p className="mt-2 text-[13px] leading-5 text-[#66758B]">{description}</p>
      {confirmationPhrase?<label className="mt-4 block text-[12px] font-semibold text-[#526178]">Type <span className="font-mono text-red-700">{confirmationPhrase}</span> to continue<input value={typedPhrase} onChange={(event)=>setTypedPhrase(event.target.value)} autoComplete="off" className="mt-2 h-10 w-full rounded-[10px] border border-[#D7E2EE] px-3 font-mono text-[12px] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" aria-label="Permanent deletion confirmation" /></label>:null}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="h-10 rounded-[10px] border border-[#D7E2EE] bg-white px-4 text-[12px] font-semibold text-[#526178] transition hover:bg-[#F4F7FA]">Cancel</button>
        <button onClick={onConfirm} disabled={!phraseConfirmed} className="h-10 rounded-[10px] bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
