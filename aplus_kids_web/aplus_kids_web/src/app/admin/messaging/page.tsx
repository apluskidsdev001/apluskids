"use client";

import { AdminNotice, useAdminNotice } from "@/components/admin/AdminNotice";
import MessagingCenterWorkspace from "@/components/admin/MessagingCenterWorkspace";

export default function AdminMessagingPage(){
  const {notice,notify,dismissNotice}=useAdminNotice();
  return <>
    <header className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_92%_75%,rgba(220,239,255,.78)_0_2px,transparent_3px),linear-gradient(135deg,#fff_0%,#f5faff_100%)] px-5 py-7 shadow-[0_10px_28px_rgba(43,86,138,.05)] tablet:rounded-[28px] tablet:px-8 tablet:py-10">
      <span className="pointer-events-none absolute left-[3%] top-[44%] text-2xl text-violet-100" aria-hidden="true">✦</span><span className="pointer-events-none absolute right-[28%] top-8 size-3 rounded-full bg-[#B9F1D8]" aria-hidden="true"/>
      <div className="relative z-10 flex flex-col gap-5 tablet:flex-row tablet:items-end tablet:justify-between"><div><p className="text-[12px] font-medium text-[#2488F4] tablet:text-[13px]">Communication manager</p><h1 className="mt-1 text-[29px] font-semibold tracking-[-.04em] text-[#132447] tablet:text-[40px] desktop:text-[44px]">Messaging Center <span className="text-[#FFB300]" aria-hidden="true">✦</span></h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6E7C91] tablet:text-[14px]">Connect a Meta account, synchronize approved templates, send consented campaigns and monitor every delivery.</p></div><div className="w-fit rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-semibold text-emerald-800 tablet:text-[12px]">Protected messaging controls</div></div>
    </header>
    <MessagingCenterWorkspace notify={notify}/>
    <AdminNotice notice={notice} onDismiss={dismissNotice}/>
  </>;
}
