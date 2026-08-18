"use client";

import { useState } from "react";
import { WhatsAppComposePanel, WhatsAppMessagingWorkspace, WhatsAppTemplatesPanel } from "./KidsChampWhatsAppMessaging";
import WhatsAppAdminSettingsPanel from "./WhatsAppAdminSettingsPanel";

type MessagingTab="whatsapp"|"templates"|"send"|"delivery";
type Notify=(message:string)=>void;

function MessagingTabIcon({tab}:{tab:MessagingTab}){
  const shared={fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(tab==="whatsapp")return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M25.5 23.5A12 12 0 1 0 9 26.2L4.5 28l1.6-4.6" {...shared}/><path d="M12 10.5c.8 4.4 3.2 6.8 7.6 7.7l2-2.2 3 1.4c-.4 3-2.2 4.3-5 4.1-6.3-.7-10-4.5-10.7-10.7-.2-2.8 1.2-4.5 4.1-5l1.4 3z" {...shared}/></svg>;
  if(tab==="templates")return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h13l4 4v20H8zM21 4v5h4M12 14h9M12 19h9M12 24h6" {...shared}/></svg>;
  if(tab==="send")return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4 15 23-9-8 21-5-9zM14 18 27 6" {...shared}/></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 26h22M8 23V13h4v10M14 23V7h4v16M20 23V10h4v13" {...shared}/></svg>;
}

export default function MessagingCenterWorkspace({notify}:{notify:Notify}){
  const [tab,setTab]=useState<MessagingTab>("whatsapp");
  const items:Array<{id:MessagingTab;label:string;detail:string}>=[
    {id:"whatsapp",label:"WhatsApp API",detail:"Secure connection settings"},
    {id:"templates",label:"Message templates",detail:"Approved Meta templates"},
    {id:"send",label:"Send messages",detail:"Recipients and personalized values"},
    {id:"delivery",label:"Delivery",detail:"Campaign status and retries"},
  ];

  return <section className="mt-6">
    <nav className="overflow-x-auto rounded-[28px] border border-[#E2EAF4] bg-white p-2.5 shadow-[0_12px_30px_rgba(30,72,123,.12)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Messaging Center sections">
      <div className="flex min-w-max" role="tablist">{items.map(item=>{const active=tab===item.id;return <button type="button" role="tab" key={item.id} aria-selected={active} aria-current={active?"page":undefined} onClick={()=>setTab(item.id)} className={`relative flex min-h-[78px] min-w-[230px] flex-1 items-center justify-center gap-3 border-r border-[#E5EBF3] px-5 text-[13px] font-bold transition last:border-r-0 tablet:min-w-[280px] tablet:px-7 tablet:text-[15px] ${active?"rounded-[20px] bg-gradient-to-br from-[#299CFF] to-[#0869ED] text-white shadow-[0_10px_20px_rgba(13,118,239,.28)]":"text-[#5D6E8C] hover:bg-[#F4F9FF] hover:text-[#0877EF]"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-[12px] p-1.5 ${active?"bg-white/14 text-white":"bg-[#F8FBFF] text-[#90ADD6]"}`}><MessagingTabIcon tab={item.id}/></span><span className="text-left"><span className="block whitespace-nowrap">{item.label}</span><span className={`mt-1 block whitespace-nowrap text-[9px] font-medium tablet:text-[10px] ${active?"text-white/75":"text-[#8795A8]"}`}>{item.detail}</span></span></button>})}</div>
    </nav>
    {tab==="whatsapp"?<WhatsAppAdminSettingsPanel notify={notify}/>:null}
    {tab==="templates"?<WhatsAppTemplatesPanel notify={notify}/>:null}
    {tab==="send"?<WhatsAppComposePanel notify={notify}/>:null}
    {tab==="delivery"?<div className="mt-5"><WhatsAppMessagingWorkspace notify={notify}/></div>:null}
  </section>;
}
