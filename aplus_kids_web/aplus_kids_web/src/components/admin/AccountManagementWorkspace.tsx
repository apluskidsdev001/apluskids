"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { acceptAdministratorInvitation, apiFetch, resendAdministratorInvitation, validateAdministratorInvitation } from "@/utils/auth";

type Notify = (message: string) => void;
type Overview = { totalAccounts:number; administrators:number; activeAccounts:number; childProfiles:number };
type Account = { id:string; accountType?:"REGISTERED"|"GUEST"; name:string; email?:string; phone:string; status:string; children:number; createdAt:string; lastLoginAt?:string };
type AdminRole = "ADMIN"|"SUPER_ADMIN";
type AdminStatus = "PENDING_VERIFICATION"|"ACTIVE"|"SUSPENDED"|"CANCELLED"|"REMOVED";
type Administrator = { id:string; name:string; email:string; phone:string; role:AdminRole; status:AdminStatus; emailVerifiedAt?:string; invitedAt:string; activatedAt?:string; lastLoginAt?:string; invitedBy:string; inviteReason?:string; suspensionReason?:string; removedAt?:string; removalReason?:string };
type AdminSummary = { total:number; active:number; pendingVerification:number; suspended:number; removed:number; superAdmins:number };
type HistoryItem = { action:string; entityType:string; entityId:string; details:string; actor:string; createdAt:string };
type Tab = "overview"|"accounts"|"admins"|"history";
type ExportFormat = "pdf"|"excel";
type InviteStep = "details"|"code"|"password"|"success";
type ApiFieldError = { field?:string; code?:string; message?:string };
type ApiErrorPayload = { code?:string; message?:string; fieldErrors?:ApiFieldError[]; requestId?:string };
type DataResult<T> = { ok:true; value:T } | { ok:false; error:string };
type PermanentDeletionConfirmation = { confirmationId:string; targetCount:number; emailMasked:string; expiresAt:string };
type PermanentDeletionResult = { deletedAccounts:number; deletedSubmissions:number; deletedChildProfiles:number; deletedGuestChildProfiles:number; invalidatedZipArchives:number };

const CACHE_KEY = "aplus-account-management-cache-v2";
const CACHE_TTL = 120_000;
const field = "min-h-11 w-full rounded-xl border border-[#D9E4F1] bg-white px-3 text-[12px] text-[#263A58] outline-none transition focus:border-[#2188F4] focus:ring-4 focus:ring-blue-100";
const secondary = "min-h-10 rounded-xl border border-[#D7E4F2] bg-white px-4 text-[11px] font-semibold text-[#405675] transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45";
const primary = "min-h-10 rounded-xl bg-gradient-to-r from-[#087DF3] to-[#2A98F7] px-4 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(26,128,239,.25)] disabled:cursor-not-allowed disabled:opacity-45";

const ACCOUNT_ERROR_MESSAGES:Record<string,string> = {
  REFRESH_TOKEN_REQUIRED:"Your session expired. Sign in again to continue. No changes were made.",
  INVALID_REFRESH_TOKEN:"Your session expired. Sign in again to continue. No changes were made.",
  ACCOUNT_UNAVAILABLE:"This account is not currently available. Contact a Super Admin if you believe this is incorrect.",
  ADMIN_NAME_INVALID:"Enter the administrator's full name using 2 to 120 characters.",
  INVALID_PHONE:"Enter a valid phone number, such as 0771234567 or +94771234567.",
  ADMIN_CONTACT_EXISTS:"The email address and phone number belong to different accounts. Use details belonging to the same person.",
  ADMIN_EMAIL_EXISTS:"This email address already belongs to another account. Enter a different email address.",
  EMAIL_EXISTS:"This email address already belongs to another account. Enter a different email address.",
  ADMIN_PHONE_EXISTS:"This phone number already belongs to another account. Enter a different phone number.",
  PHONE_EXISTS:"This phone number already belongs to another account. Enter a different phone number.",
  REASON_REQUIRED:"Explain why this administrator action is needed.",
  INVALID_VERIFICATION_CODE:"That verification code is incorrect or expired. Check the code or request a new one.",
  VERIFICATION_TEMPORARILY_LOCKED:"Verification is temporarily locked. Wait 15 minutes or request a new code.",
  VERIFICATION_RESEND_TOO_SOON:"Please wait one minute before requesting another verification code.",
  INVITATION_NOT_PENDING:"This invitation was already completed or cancelled. Refresh the administrator list.",
  PASSWORD_INVALID:"Use a password containing 8 to 128 characters.",
  PASSWORDS_DO_NOT_MATCH:"The passwords do not match. Re-enter both passwords.",
  SELF_DEMOTION:"You cannot demote your own Super Admin account. Ask another Super Admin to change your role.",
  SELF_SUSPENSION:"You cannot suspend your own administrator account. Ask another Super Admin to manage your access.",
  SELF_REMOVAL:"You cannot remove your own administrator account. Ask another Super Admin to manage your access.",
  LAST_SUPER_ADMIN:"Create or promote another Super Admin before changing this account.",
  ADMIN_NOT_EDITABLE:"This administrator can no longer be edited. Refresh the administrator list.",
  ADMIN_NOT_ACTIVE:"This administrator is no longer active. Refresh the administrator list before trying again.",
  ADMIN_NOT_SUSPENDED:"This administrator is no longer suspended. Refresh the administrator list before trying again.",
  ADMIN_NOT_REMOVABLE:"This administrator's status changed and the account cannot currently be removed. Refresh the administrator list.",
  ADMINISTRATOR_NOT_FOUND:"This administrator no longer exists or was changed by another Super Admin.",
  ADMIN_ROLE_UNAVAILABLE:"Administrator roles are not configured correctly. Ask the system administrator to check the database roles.",
  USER_NOT_FOUND:"This account no longer exists or was changed by another administrator.",
  GUEST_NOT_FOUND:"This guest account no longer exists or was changed by another administrator.",
  GUEST_DELETED:"Restore this guest account before editing it.",
  SUPER_ADMIN_REQUIRED:"Only a Super Admin can permanently delete selected accounts.",
  SUPER_ADMIN_VERIFICATION_REQUIRED:"Use an active Super Admin account with a verified email address to permanently delete accounts.",
  PERMANENT_DELETION_SELECTION_INVALID:"Select between 1 and 100 Kids or guest accounts, with no duplicates.",
  ADMIN_ACCOUNT_PERMANENT_DELETION_FORBIDDEN:"Administrator accounts cannot be permanently deleted from Kids accounts.",
  PERMANENT_DELETION_CODE_RESEND_TOO_SOON:"Please wait one minute before requesting another deletion code.",
  PERMANENT_DELETION_CODE_INVALID:"That deletion code is incorrect, expired, or was replaced. Check the email or request a new code.",
  PERMANENT_DELETION_CODE_LOCKED:"Too many incorrect codes were entered. Wait 15 minutes before requesting a new code.",
  PERMANENT_DELETION_CONFIRMATION_REQUIRED:"Type PERMANENT DELETE and enter the six-digit email code to continue.",
  PERMANENT_DELETION_CONFIRMATION_NOT_FOUND:"This deletion confirmation no longer exists. Request a new code.",
  PERMANENT_DELETION_CONFIRMATION_FORBIDDEN:"This deletion confirmation belongs to a different Super Admin.",
  PERMANENT_DELETION_CONFIRMATION_INVALID:"The deletion confirmation is invalid. Request a new code.",
  INVALID_REQUEST_BODY:"Some submitted information has an unsupported value. Review the fields and try again.",
};

function validEmail(value:string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function validPhone(value:string) {
  let compact=value.trim().replace(/[\s()\-]/g,"");
  if(compact.startsWith("00"))compact=`+${compact.slice(2)}`;
  if(compact.startsWith("0"))compact=`+94${compact.slice(1)}`;
  if(!compact.startsWith("+"))compact=`+94${compact}`;
  return /^\+[1-9]\d{7,14}$/.test(compact);
}
function fieldValidationMessage(fieldError?:ApiFieldError) {
  switch(fieldError?.field) {
    case "name": return "Enter the administrator's full name using 2 to 120 characters.";
    case "email": return "Enter a valid email address, such as name@example.com.";
    case "phone": return "Enter a valid phone number, such as 0771234567 or +94771234567.";
    case "reason": return "Enter a reason using no more than 600 characters.";
    case "code": return "Enter the complete six-digit verification code.";
    case "password": return "Use a password containing 8 to 128 characters.";
    case "confirmPassword": return "Re-enter the password to confirm it.";
    case "role": return "Choose Admin or Super Admin access.";
    default: return "Review the highlighted information and try again.";
  }
}
function accountApiErrorMessage(payload:ApiErrorPayload|null,status:number,action:string) {
  const code=payload?.code?.toUpperCase();
  if(code&&ACCOUNT_ERROR_MESSAGES[code])return ACCOUNT_ERROR_MESSAGES[code];
  if(code==="VALIDATION_FAILED")return fieldValidationMessage(payload?.fieldErrors?.[0]);
  if(status===401)return "Your session expired. Sign in again to continue. No changes were made.";
  if(status===403)return "Your administrator permissions could not be confirmed. Sign in again or ask a Super Admin to review your access.";
  if(status===404)return `The ${action} record could not be found. Refresh the page and try again.`;
  if(status===409)return payload?.message||`The ${action} could not be completed because the record changed. Refresh the page and try again.`;
  if(status===429)return payload?.message||"Too many requests were made. Wait a moment and try again.";
  if(status>=500){const reference=payload?.requestId?` Support reference: ${payload.requestId}.`:"";return `The server could not complete the ${action}. No changes were confirmed.${reference}`;}
  if(payload?.message&&!/^(some information needs to be corrected|the request could not be completed)\.?$/i.test(payload.message))return payload.message;
  return `The ${action} could not be completed. No changes were confirmed. Please try again.`;
}
function accountReasonMessage(reason:unknown,action:string) {
  const message=reason instanceof Error?reason.message.trim():"";
  if(/network|failed to fetch|load failed|timeout|timed out|connection|cors/i.test(message))return "We cannot connect to the A Plus Kids server. Confirm that the backend is running, then try again.";
  return message||`The ${action} could not be completed. No changes were confirmed. Please try again.`;
}
async function responseErrorMessage(response:Response,action:string) {
  const payload=await response.clone().json().catch(()=>null) as ApiErrorPayload|null;
  return accountApiErrorMessage(payload,response.status,action);
}
async function requiredJson<T>(response:Response,action:string) {
  if(!response.ok)throw new Error(await responseErrorMessage(response,action));
  const body=await response.json().catch(()=>null) as T|null;
  if(body===null)throw new Error(`The server returned an incomplete ${action} response. Refresh the page and try again.`);
  return body;
}
async function loadData<T>(path:string,label:string):Promise<DataResult<T>> {
  try {
    const response=await apiFetch(path);
    if(!response.ok)return {ok:false,error:`${label}: ${await responseErrorMessage(response,label.toLowerCase())}`};
    const value=await response.json().catch(()=>null) as T|null;
    return value===null?{ok:false,error:`${label}: The server returned incomplete information. Try again.`}:{ok:true,value};
  } catch(reason) { return {ok:false,error:`${label}: ${accountReasonMessage(reason,label.toLowerCase())}`}; }
}

function readCurrentUser() {
  if (typeof window === "undefined") return { id:"", superAdmin:false };
  try {
    const raw = window.localStorage.getItem("aplus-current-user") || window.sessionStorage.getItem("aplus-current-user");
    const value = raw ? JSON.parse(raw) as { publicId?:string; roles?:string[] } : {};
    return { id:value.publicId||"", superAdmin:Boolean(value.roles?.includes("ROLE_SUPER_ADMIN")) };
  } catch { return { id:"", superAdmin:false }; }
}

function statusLabel(value:string) { return value.replaceAll("_"," ").toLowerCase().replace(/(^|\s)\S/g,letter=>letter.toUpperCase()); }
function dateLabel(value?:string) { return value ? new Date(value).toLocaleString("en-LK",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Colombo"}) : "Never"; }
function escapeXml(value:unknown) { return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;"); }
function downloadBlob(blob:Blob,name:string) { const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=name; link.click(); window.setTimeout(()=>URL.revokeObjectURL(url),500); }
function readCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as {savedAt:number;overview:Overview;accounts:Account[];admins:Administrator[];adminSummary:AdminSummary;history:HistoryItem[]};
    return Date.now() - value.savedAt < CACHE_TTL ? value : null;
  } catch { return null; }
}

function StatusPill({value}:{value:string}) {
  const tone = value.includes("ACTIVE")||value==="GUEST" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : value.includes("PENDING") ? "border-amber-200 bg-amber-50 text-amber-700" : value.includes("SUSPENDED")||value.includes("DELETED")||value.includes("CANCELLED")||value.includes("REMOVED") ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${tone}`}>{statusLabel(value)}</span>;
}

function MetricCard({label,value,detail,active,onClick,tone="blue"}:{label:string;value:number|string;detail:string;active?:boolean;onClick?:()=>void;tone?:"blue"|"green"|"amber"|"violet"|"red"}) {
  const activeTone = {blue:"from-[#087EF4] to-[#349BF4]",green:"from-[#059669] to-[#34B98B]",amber:"from-[#D97706] to-[#F4A62A]",violet:"from-[#7457E8] to-[#9B7AF4]",red:"from-[#D9465F] to-[#F06F7D]"}[tone];
  return <button type="button" onClick={onClick} className={`min-h-[132px] rounded-[18px] border p-4 text-left transition tablet:p-5 ${active?`border-transparent bg-gradient-to-br ${activeTone} text-white shadow-[0_14px_28px_rgba(25,112,215,.22)]`:`border-[#DDE7F2] bg-white text-[#263A58] hover:-translate-y-0.5 hover:shadow-lg`}`}>
    <span className={`text-[11px] font-bold ${active?"text-white":"text-[#526681]"}`}>{label}</span>
    <strong className="mt-2 block text-[28px] leading-none tracking-[-.04em] laptop:text-[32px]">{value}</strong>
    <span className={`mt-3 block text-[10px] leading-4 ${active?"text-white/80":"text-[#8492A5]"}`}>{detail}</span>
  </button>;
}

function AccountTabIcon({tab}:{tab:Tab}){
  const shared={fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(tab==="overview")return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="4" width="9" height="9" rx="2" {...shared}/><rect x="19" y="4" width="9" height="9" rx="2" {...shared}/><rect x="4" y="19" width="9" height="9" rx="2" {...shared}/><rect x="19" y="19" width="9" height="9" rx="2" {...shared}/></svg>;
  if(tab==="accounts")return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="11" r="4" {...shared}/><path d="M4.5 26c.7-4.8 3.6-7.3 7.5-7.3s6.8 2.5 7.5 7.3M22 8a3.7 3.7 0 0 1 0 7.2M22.5 19c2.8.6 4.5 2.8 5 6.3" {...shared}/></svg>;
  if(tab==="admins")return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="4.5" {...shared}/><path d="M7 27c.8-5.4 4.1-8.3 9-8.3s8.2 2.9 9 8.3M23 5.5l2 1 2-1v5c0 2-2 3.5-2 3.5s-2-1.5-2-3.5z" {...shared}/></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5h16v23H8zM12 11h8M12 16h8M12 21h5" {...shared}/><path d="m5 8 3-3 3 3" {...shared}/></svg>;
}

export default function AccountManagementWorkspace({notify}:{notify:Notify}) {
  const [currentUser] = useState(() => readCurrentUser());
  const [cached] = useState(() => readCache());
  const [tab,setTab]=useState<Tab>("overview");
  const [overview,setOverview]=useState<Overview|null>(() => cached?.overview ?? null);
  const [accounts,setAccounts]=useState<Account[]>(() => cached?.accounts ?? []);
  const [admins,setAdmins]=useState<Administrator[]>(() => cached?.admins ?? []);
  const [adminSummary,setAdminSummary]=useState<AdminSummary|null>(() => cached?.adminSummary ?? null);
  const [history,setHistory]=useState<HistoryItem[]>(() => cached?.history ?? []);
  const [loading,setLoading]=useState(() => !cached);
  const [refreshing,setRefreshing]=useState(false);
  const [loadError,setLoadError]=useState("");
  const [search,setSearch]=useState("");
  const deferredSearch=useDeferredValue(search);
  const [accountType,setAccountType]=useState("ALL");
  const [accountStatus,setAccountStatus]=useState("ALL");
  const [accountAvailability,setAccountAvailability]=useState<"ALL"|"ACTIVE"|"ATTENTION">("ALL");
  const [minChildren,setMinChildren]=useState("");
  const [accountPage,setAccountPage]=useState(1);
  const [accountPageSize,setAccountPageSize]=useState(25);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [permanentDeletionOpen,setPermanentDeletionOpen]=useState(false);
  const [permanentDeletionStep,setPermanentDeletionStep]=useState<"confirm"|"code">("confirm");
  const [permanentDeletionConfirmation,setPermanentDeletionConfirmation]=useState<PermanentDeletionConfirmation|null>(null);
  const [permanentDeletionCode,setPermanentDeletionCode]=useState("");
  const [permanentDeletionPhrase,setPermanentDeletionPhrase]=useState("");
  const [permanentDeletionFeedback,setPermanentDeletionFeedback]=useState<{tone:"error"|"success";message:string}|null>(null);
  const [permanentDeletionExpiresSeconds,setPermanentDeletionExpiresSeconds]=useState(0);
  const [permanentDeletionResendSeconds,setPermanentDeletionResendSeconds]=useState(0);
  const [adminSearch,setAdminSearch]=useState("");
  const deferredAdminSearch=useDeferredValue(adminSearch);
  const [adminStatus,setAdminStatus]=useState<"ALL"|AdminStatus>("ALL");
  const [adminRole,setAdminRole]=useState<"ALL"|AdminRole>("ALL");
  const [switching,startTransition]=useTransition();
  const [editing,setEditing]=useState<Account|null>(null);
  const [accountDraft,setAccountDraft]=useState({accountHolderName:"",email:"",phoneE164:"",status:"ACTIVE"});
  const [deleting,setDeleting]=useState<Account|null>(null);
  const [exportOpen,setExportOpen]=useState(false);
  const [inviteOpen,setInviteOpen]=useState(false);
  const [inviteDraft,setInviteDraft]=useState({name:"",email:"",phone:"",role:"ADMIN" as AdminRole,reason:""});
  const [inviteStep,setInviteStep]=useState<InviteStep>("details");
  const [pendingInvitation,setPendingInvitation]=useState<Administrator|null>(null);
  const [inviteCode,setInviteCode]=useState("");
  const [invitePassword,setInvitePassword]=useState("");
  const [inviteConfirmPassword,setInviteConfirmPassword]=useState("");
  const [inviteExpiresSeconds,setInviteExpiresSeconds]=useState(0);
  const [inviteResendSeconds,setInviteResendSeconds]=useState(0);
  const [inviteFeedback,setInviteFeedback]=useState<{tone:"error"|"success";message:string}|null>(null);
  const [adminEditor,setAdminEditor]=useState<Administrator|null>(null);
  const [adminDraft,setAdminDraft]=useState({name:"",phone:""});
  const [adminAction,setAdminAction]=useState<{admin:Administrator;type:"suspend"|"restore"|"cancel"|"remove"|"sessions"|"role"}|null>(null);
  const [actionReason,setActionReason]=useState("");
  const [nextRole,setNextRole]=useState<AdminRole>("ADMIN");
  const [busy,setBusy]=useState(false);

  function cacheData(next:{overview:Overview|null;accounts:Account[];admins:Administrator[];adminSummary:AdminSummary|null;history:HistoryItem[]}) {
    try { window.sessionStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),...next})); } catch { /* storage may be unavailable */ }
  }
  async function loadAll(background=false) {
    if (background) setRefreshing(true); else setLoading(true);
    setLoadError("");
    try {
      const [overviewResult,accountsResult]=await Promise.all([
        loadData<Overview>("/api/v1/admin/account-management/overview","Account summary"),
        loadData<Account[]>("/api/v1/admin/account-management/accounts","Family accounts"),
      ]);
      const adminResults=currentUser.superAdmin?await Promise.all([
        loadData<Administrator[]>("/api/v1/admin/administrator-management","Administrator list"),
        loadData<AdminSummary>("/api/v1/admin/administrator-management/summary","Administrator summary"),
        loadData<HistoryItem[]>("/api/v1/admin/kids-champ/admin-history","Admin history"),
      ]):null;
      const nextOverview=overviewResult.ok?overviewResult.value:overview;
      const nextAccounts=accountsResult.ok?accountsResult.value:accounts;
      const nextAdmins=adminResults?.[0].ok?adminResults[0].value:admins;
      const nextSummary=adminResults?.[1].ok?adminResults[1].value:adminSummary;
      const nextHistory=adminResults?.[2].ok?adminResults[2].value:history;
      if(overviewResult.ok)setOverview(overviewResult.value);
      if(accountsResult.ok)setAccounts(accountsResult.value);
      if(adminResults?.[0].ok)setAdmins(adminResults[0].value);
      if(adminResults?.[1].ok)setAdminSummary(adminResults[1].value);
      if(adminResults?.[2].ok)setHistory(adminResults[2].value);
      const failures=[overviewResult,accountsResult,...(adminResults??[])].filter((result):result is {ok:false;error:string}=>!result.ok).map(result=>result.error);
      const failureMessages=failures.map(error=>error.slice(error.indexOf(": ")+2));
      const distinctFailureMessages=[...new Set(failureMessages)];
      setLoadError(distinctFailureMessages.length===1?distinctFailureMessages[0]:failures.join(" "));
      if(overviewResult.ok||accountsResult.ok||adminResults?.some(result=>result.ok))cacheData({overview:nextOverview,accounts:nextAccounts,admins:nextAdmins,adminSummary:nextSummary,history:nextHistory});
    } catch(reason) { setLoadError(accountReasonMessage(reason,"account information")); }
    finally { setLoading(false);setRefreshing(false); }
  }
  useEffect(()=>{
    const initialLoad = window.setTimeout(() => void loadAll(Boolean(cached)), 0);
    const onUpdate=(event:Event)=>{const path=(event as CustomEvent<{path?:string}>).detail?.path||"";if(path.includes("account-management")||path.includes("administrator-management"))void loadAll(true);};
    window.addEventListener("aplus-data-updated",onUpdate);return()=>{window.clearTimeout(initialLoad);window.removeEventListener("aplus-data-updated",onUpdate);};
  // Initial cache hydration only. Mutations refresh through the scoped event listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(!inviteOpen||inviteStep==="details"||inviteStep==="success")return;
    const timer=window.setInterval(()=>{
      setInviteExpiresSeconds(value=>Math.max(0,value-1));
      setInviteResendSeconds(value=>Math.max(0,value-1));
    },1000);
    return()=>window.clearInterval(timer);
  },[inviteOpen,inviteStep]);
  useEffect(()=>{
    if(!permanentDeletionOpen||permanentDeletionStep!=="code")return;
    const timer=window.setInterval(()=>{
      setPermanentDeletionExpiresSeconds(value=>Math.max(0,value-1));
      setPermanentDeletionResendSeconds(value=>Math.max(0,value-1));
    },1000);
    return()=>window.clearInterval(timer);
  },[permanentDeletionOpen,permanentDeletionStep]);

  const filteredAccounts=useMemo(()=>{const query=deferredSearch.trim().toLowerCase();const minimum=Number(minChildren)||0;return accounts.filter(item=>(accountType==="ALL"||item.accountType===accountType)&&(accountStatus==="ALL"||item.status===accountStatus)&&(accountAvailability==="ALL"||(accountAvailability==="ACTIVE"?["ACTIVE","GUEST"].includes(item.status):!["ACTIVE","GUEST"].includes(item.status)))&&item.children>=minimum&&(!query||item.name.toLowerCase().includes(query)||(item.email||"").toLowerCase().includes(query)||item.phone.includes(query)||item.id.toLowerCase().includes(query)));},[accounts,deferredSearch,accountType,accountStatus,accountAvailability,minChildren]);
  const accountTotals=useMemo(()=>({registered:accounts.filter(item=>item.accountType!=="GUEST").length,guest:accounts.filter(item=>item.accountType==="GUEST").length,active:accounts.filter(item=>["ACTIVE","GUEST"].includes(item.status)).length,attention:accounts.filter(item=>!["ACTIVE","GUEST"].includes(item.status)).length}),[accounts]);
  const totalPages=Math.max(1,Math.ceil(filteredAccounts.length/accountPageSize));
  const safeAccountPage=Math.min(accountPage,totalPages);
  const pageAccounts=filteredAccounts.slice((safeAccountPage-1)*accountPageSize,safeAccountPage*accountPageSize);
  const selectedAccounts=useMemo(()=>accounts.filter(item=>selected.has(item.id)),[accounts,selected]);
  const filteredAdmins=useMemo(()=>{const query=deferredAdminSearch.trim().toLowerCase();return admins.filter(item=>(adminStatus==="ALL"||item.status===adminStatus)&&(adminRole==="ALL"||item.role===adminRole)&&(!query||item.name.toLowerCase().includes(query)||item.email.toLowerCase().includes(query)||item.phone.includes(query)));},[admins,deferredAdminSearch,adminStatus,adminRole]);
  const overviewCounts=useMemo(()=>({
    registered:accounts.filter(item=>item.accountType!=="GUEST").length,
    guests:accounts.filter(item=>item.accountType==="GUEST").length,
    active:accounts.filter(item=>["ACTIVE","GUEST"].includes(item.status)).length,
    restricted:accounts.filter(item=>!["ACTIVE","GUEST"].includes(item.status)).length,
  }),[accounts]);
  const attentionItems=useMemo(()=>[
    {label:"Family accounts needing review",value:overviewCounts.restricted,detail:"Pending, locked, suspended or scheduled for removal",target:"accounts" as Tab},
    {label:"Administrator invitations awaiting verification",value:adminSummary?.pendingVerification??0,detail:"Codes were sent but account setup is incomplete",target:"admins" as Tab},
    {label:"Suspended administrator accounts",value:adminSummary?.suspended??0,detail:"Access remains blocked until a Super Admin restores it",target:"admins" as Tab},
    {label:"Removed administrator records",value:adminSummary?.removed??0,detail:"Access is revoked while the audit record is retained",target:"admins" as Tab},
  ],[overviewCounts.restricted,adminSummary]);
  const attentionTotal=attentionItems.reduce((total,item)=>total+item.value,0);

  function chooseTab(value:Tab){startTransition(()=>setTab(value));}
  function openEditor(account:Account){setEditing(account);setAccountDraft({accountHolderName:account.name,email:account.email||"",phoneE164:account.phone,status:account.status});}
  async function saveAccount(){
    if(!editing)return;
    const name=accountDraft.accountHolderName.trim(),email=accountDraft.email.trim(),phone=accountDraft.phoneE164.trim();
    if(name.length<2||name.length>120){notify("Enter the parent or guardian's full name using 2 to 120 characters.");return;}
    if(!validEmail(email)){notify("Enter a valid email address, such as name@example.com.");return;}
    if(!validPhone(phone)){notify("Enter a valid phone number, such as 0771234567 or +94771234567.");return;}
    setBusy(true);
    try{
      const guest=editing.accountType==="GUEST";
      const response=await apiFetch(`/api/v1/admin/account-management/accounts/${guest?"guests/":""}${editing.id}`,{method:"PATCH",body:JSON.stringify(guest?{parentName:name,email,phoneE164:phone}:{...accountDraft,accountHolderName:name,email,phoneE164:phone}),notifyDataUpdated:false});
      const body=await requiredJson<Account>(response,"account update");
      setAccounts(current=>current.map(item=>item.id===body.id?body:item));setEditing(null);notify("Account details were updated and recorded in Admin history.");
    }catch(reason){notify(accountReasonMessage(reason,"account update"));}finally{setBusy(false);}
  }
  async function deleteOrRestore(account:Account,restore=false){
    setBusy(true);
    try{
      const guest=account.accountType==="GUEST";
      const path=`/api/v1/admin/account-management/accounts/${guest?"guests/":""}${account.id}${restore?"/restore":""}`;
      const response=await apiFetch(path,{method:restore?"POST":"DELETE",body:restore?undefined:JSON.stringify({reason:actionReason}),notifyDataUpdated:false});
      const body=await requiredJson<Account>(response,restore?"account restore":"account removal");
      setAccounts(current=>current.map(item=>item.id===body.id?body:item));setDeleting(null);setActionReason("");notify(restore?"Account restored to active access.":"Account safely removed. Its retained record can be restored.");
    }catch(reason){notify(accountReasonMessage(reason,restore?"account restore":"account removal"));}finally{setBusy(false);}
  }
  function resetPermanentDeletion(close=true){
    if(close)setPermanentDeletionOpen(false);
    setPermanentDeletionStep("confirm");setPermanentDeletionConfirmation(null);setPermanentDeletionCode("");setPermanentDeletionPhrase("");
    setPermanentDeletionFeedback(null);setPermanentDeletionExpiresSeconds(0);setPermanentDeletionResendSeconds(0);
  }
  function openPermanentDeletion(){
    if(!selectedAccounts.length){notify("Select at least one Kids or guest account first.");return;}
    resetPermanentDeletion(false);setPermanentDeletionOpen(true);
  }
  function permanentDeletionTimeLabel(){const minutes=Math.floor(permanentDeletionExpiresSeconds/60);const seconds=permanentDeletionExpiresSeconds%60;return `${minutes}:${String(seconds).padStart(2,"0")}`;}
  async function requestPermanentDeletionCode(){
    if(!selectedAccounts.length)return;
    setBusy(true);setPermanentDeletionFeedback(null);
    try{
      const targets=selectedAccounts.map(item=>({accountType:item.accountType||"REGISTERED",id:item.id}));
      const response=await apiFetch("/api/v1/admin/account-management/permanent-deletion/request",{method:"POST",body:JSON.stringify(targets),notifyDataUpdated:false});
      const body=await requiredJson<PermanentDeletionConfirmation>(response,"permanent deletion code request");
      const seconds=Math.max(0,Math.ceil((new Date(body.expiresAt).getTime()-Date.now())/1000));
      setPermanentDeletionConfirmation(body);setPermanentDeletionCode("");setPermanentDeletionExpiresSeconds(seconds);setPermanentDeletionResendSeconds(60);setPermanentDeletionStep("code");
      setPermanentDeletionFeedback({tone:"success",message:`A six-digit deletion code was sent to ${body.emailMasked}.`});
    }catch(reason){setPermanentDeletionFeedback({tone:"error",message:accountReasonMessage(reason,"permanent deletion code request")});}
    finally{setBusy(false);}
  }
  async function confirmPermanentDeletion(){
    if(!permanentDeletionConfirmation||permanentDeletionCode.length!==6)return;
    setBusy(true);setPermanentDeletionFeedback(null);
    try{
      const response=await apiFetch("/api/v1/admin/account-management/permanent-deletion/confirm",{method:"POST",body:JSON.stringify({confirmationId:permanentDeletionConfirmation.confirmationId,code:permanentDeletionCode,confirmationPhrase:permanentDeletionPhrase}),notifyDataUpdated:false});
      const body=await requiredJson<PermanentDeletionResult>(response,"permanent account deletion");
      setSelected(new Set());resetPermanentDeletion(true);await loadAll(true);
      const zipNotice=body.invalidatedZipArchives?` ${body.invalidatedZipArchives} ZIP archive${body.invalidatedZipArchives===1?" was":"s were"} invalidated to remove deleted data.`:"";
      notify(`${body.deletedAccounts} account${body.deletedAccounts===1?" was":"s were"} permanently deleted, including ${body.deletedSubmissions} submission${body.deletedSubmissions===1?"":"s"}.${zipNotice}`);
    }catch(reason){setPermanentDeletionCode("");setPermanentDeletionFeedback({tone:"error",message:accountReasonMessage(reason,"permanent account deletion")});}
    finally{setBusy(false);}
  }

  function resetInviteWizard(close=true){
    if(close)setInviteOpen(false);
    setInviteStep("details");setPendingInvitation(null);setInviteCode("");setInvitePassword("");setInviteConfirmPassword("");
    setInviteExpiresSeconds(0);setInviteResendSeconds(0);setInviteFeedback(null);
    if(close)setInviteDraft({name:"",email:"",phone:"",role:"ADMIN",reason:""});
  }
  function openInviteWizard(){resetInviteWizard(false);setInviteDraft({name:"",email:"",phone:"",role:"ADMIN",reason:""});setInviteOpen(true);}
  function inviteTimeLabel(){const minutes=Math.floor(inviteExpiresSeconds/60);const seconds=inviteExpiresSeconds%60;return `${minutes}:${String(seconds).padStart(2,"0")}`;}
  async function inviteAdmin(){
    const name=inviteDraft.name.trim(),email=inviteDraft.email.trim(),phone=inviteDraft.phone.trim(),reasonText=inviteDraft.reason.trim();
    if(name.length<2||name.length>120){setInviteFeedback({tone:"error",message:"Enter the administrator's full name using 2 to 120 characters."});return;}
    if(!validEmail(email)){setInviteFeedback({tone:"error",message:"Enter a valid email address, such as name@example.com."});return;}
    if(!validPhone(phone)){setInviteFeedback({tone:"error",message:"Enter a valid phone number, such as 0771234567 or +94771234567."});return;}
    if(!reasonText||reasonText.length>600){setInviteFeedback({tone:"error",message:"Enter a reason using no more than 600 characters."});return;}
    setBusy(true);setInviteFeedback(null);
    try{
      const response=await apiFetch("/api/v1/admin/administrator-management/invitations",{method:"POST",body:JSON.stringify({...inviteDraft,name,email,phone,reason:reasonText}),notifyDataUpdated:false});
      const body=await requiredJson<Administrator>(response,"administrator invitation");
      setPendingInvitation(body);setInviteCode("");setInviteExpiresSeconds(600);setInviteResendSeconds(60);setInviteStep("code");
      setInviteFeedback({tone:"success",message:`A six-digit verification code was sent to ${body.email}. Enter it below to continue.`});
    }catch(reason){setInviteFeedback({tone:"error",message:accountReasonMessage(reason,"administrator invitation")});}
    finally{setBusy(false);}
  }
  async function verifyInviteCode(){
    if(!pendingInvitation||inviteCode.length!==6)return;
    setBusy(true);setInviteFeedback(null);
    try{
      await validateAdministratorInvitation(pendingInvitation.email,inviteCode);
      setInviteStep("password");setInviteFeedback({tone:"success",message:"Email verified. The invited administrator can now create a private password."});
    }catch(reason){setInviteCode("");setInviteFeedback({tone:"error",message:accountReasonMessage(reason,"verification code check")});}
    finally{setBusy(false);}
  }
  async function completeInvitation(){
    if(!pendingInvitation)return;
    if(invitePassword.length<8||invitePassword.length>128){setInviteFeedback({tone:"error",message:"Use a password containing 8 to 128 characters."});return;}
    if(invitePassword!==inviteConfirmPassword){setInviteFeedback({tone:"error",message:"The passwords do not match."});return;}
    setBusy(true);setInviteFeedback(null);
    try{
      await acceptAdministratorInvitation(pendingInvitation.email,inviteCode,invitePassword,inviteConfirmPassword);
      setInvitePassword("");setInviteConfirmPassword("");setInviteStep("success");
      setInviteFeedback({tone:"success",message:"Email verification and administrator account creation were completed successfully."});
      await loadAll(true);
    }catch(reason){setInviteFeedback({tone:"error",message:accountReasonMessage(reason,"administrator account activation")});}
    finally{setBusy(false);}
  }
  async function resendWizardCode(){
    if(!pendingInvitation||inviteResendSeconds>0)return;
    setBusy(true);setInviteFeedback(null);
    try{
      await resendAdministratorInvitation(pendingInvitation.email);
      setInviteCode("");setInviteStep("code");setInviteExpiresSeconds(600);setInviteResendSeconds(60);
      setInviteFeedback({tone:"success",message:"A new code was sent. The previous code can no longer be used."});
    }catch(reason){setInviteFeedback({tone:"error",message:accountReasonMessage(reason,"invitation resend")});}
    finally{setBusy(false);}
  }
  async function cancelWizardInvitation(changeEmail=false){
    if(!pendingInvitation){resetInviteWizard(!changeEmail);if(changeEmail)setInviteDraft(current=>({...current,email:""}));return;}
    setBusy(true);setInviteFeedback(null);
    try{
      const response=await apiFetch(`/api/v1/admin/administrator-management/${pendingInvitation.id}/cancel`,{method:"POST",body:JSON.stringify({reason:changeEmail?"Invitation cancelled because the email address is being changed.":"Invitation cancelled before verification was completed."}),notifyDataUpdated:false});
      if(!response.ok)throw new Error(await responseErrorMessage(response,"invitation cancellation"));
      if(changeEmail){const current=inviteDraft;resetInviteWizard(false);setInviteDraft({...current,email:""});setInviteOpen(true);setInviteFeedback({tone:"success",message:"The previous code was cancelled. Enter the new email address and send another code."});}
      else resetInviteWizard(true);
      await loadAll(true);
    }catch(reason){setInviteFeedback({tone:"error",message:accountReasonMessage(reason,"invitation cancellation")});}
    finally{setBusy(false);}
  }
  async function saveAdmin(){
    if(!adminEditor)return;
    const name=adminDraft.name.trim(),phone=adminDraft.phone.trim();
    if(name.length<2||name.length>120){notify("Enter the administrator's full name using 2 to 120 characters.");return;}
    if(!validPhone(phone)){notify("Enter a valid phone number, such as 0771234567 or +94771234567.");return;}
    setBusy(true);
    try{const response=await apiFetch(`/api/v1/admin/administrator-management/${adminEditor.id}`,{method:"PATCH",body:JSON.stringify({name,phone}),notifyDataUpdated:false});const body=await requiredJson<Administrator>(response,"administrator update");setAdmins(current=>current.map(item=>item.id===body.id?body:item));setAdminEditor(null);notify("Administrator details updated. The verified email address was unchanged.");}catch(reason){notify(accountReasonMessage(reason,"administrator update"));}finally{setBusy(false);}
  }
  async function runAdminAction(){
    if(!adminAction)return;
    setBusy(true);
    try{
      const {admin,type}=adminAction;const path=type==="role"?`${admin.id}/role`:`${admin.id}/${type==="sessions"?"revoke-sessions":type}`;
      const response=await apiFetch(`/api/v1/admin/administrator-management/${path}`,{method:type==="role"?"PATCH":"POST",body:JSON.stringify(type==="role"?{role:nextRole,reason:actionReason}:{reason:actionReason}),notifyDataUpdated:false});
      if(!response.ok)throw new Error(await responseErrorMessage(response,"administrator access change"));
      if(type!=="sessions"){const body=await requiredJson<Administrator>(response,"administrator access change");setAdmins(current=>current.map(item=>item.id===body.id?body:item));}
      setAdminAction(null);setActionReason("");notify(type==="suspend"?"Administrator access suspended and sessions revoked.":type==="restore"?"Administrator access restored.":type==="cancel"?"Pending invitation cancelled.":type==="remove"?"Administrator removed. Roles and sessions were revoked while the audit record was retained.":type==="sessions"?"All sessions revoked. The administrator must log in again.":"Administrator role changed; existing sessions were revoked.");void loadAll(true);
    }catch(reason){notify(accountReasonMessage(reason,"administrator access change"));}finally{setBusy(false);}
  }
  async function resendInvite(admin:Administrator){setBusy(true);try{const response=await apiFetch("/api/v1/admin-invitations/resend",{method:"POST",body:JSON.stringify({email:admin.email}),notifyDataUpdated:false});if(!response.ok)throw new Error(await responseErrorMessage(response,"invitation resend"));notify("A new verification code was sent to the invited email address.");}catch(reason){notify(accountReasonMessage(reason,"invitation resend"));}finally{setBusy(false);}}

  function exportRows(){const chosen=selected.size?filteredAccounts.filter(item=>selected.has(item.id)):filteredAccounts;return chosen.map(item=>[item.id,item.accountType||"REGISTERED",item.name,item.email||"",item.phone,statusLabel(item.status),item.children,dateLabel(item.createdAt),dateLabel(item.lastLoginAt)]);}
  async function exportAccounts(format:ExportFormat){const rows=exportRows();if(!rows.length){notify("There are no matching accounts to export.");return;}setBusy(true);try{const headers=["Reference","Type","Name","Email","Phone","Status","Children / records","Created","Last login"];
    if(format==="excel"){const styles=`<Styles><Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10"/></Style><Style ss:ID="Title"><Font ss:Bold="1" ss:Size="18" ss:Color="#12315B"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F82ED" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Meta"><Font ss:Color="#5E7089"/></Style><Style ss:ID="Row"><Interior ss:Color="#F6FAFF" ss:Pattern="Solid"/></Style></Styles>`;const cols=[170,90,150,190,110,120,95,145,145].map(width=>`<Column ss:Width="${width}"/>`).join("");const cell=(value:unknown,style="")=>`<Cell${style?` ss:StyleID="${style}"`:""}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;const data=rows.map((row,index)=>`<Row${index%2?` ss:StyleID="Row"`:""}>${row.map(value=>cell(value)).join("")}</Row>`).join("");const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel">${styles}<Worksheet ss:Name="Accounts"><Table>${cols}<Row ss:Height="32"><Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">A+ Kids Account Management Report</Data></Cell></Row><Row><Cell ss:MergeAcross="8" ss:StyleID="Meta"><Data ss:Type="String">Generated ${escapeXml(dateLabel(new Date().toISOString()))} · ${rows.length} records · ${escapeXml(selected.size?"Selected accounts":"Current filtered results")}</Data></Cell></Row><Row ss:Height="8"/> <Row>${headers.map(value=>cell(value,"Header")).join("")}</Row>${data}</Table><AutoFilter x:Range="R4C1:R${rows.length+4}C9"/></Worksheet></Workbook>`;downloadBlob(new Blob([`\uFEFF${xml}`],{type:"application/vnd.ms-excel"}),"aplus-account-management.xls");}
    else {const {jsPDF}=await import("jspdf");const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});const widths=[42,22,36,49,29,28,19,33,33];const rowHeight=7;const drawHeader=()=>{doc.setFillColor(31,130,237);doc.rect(10,25,277,rowHeight,"F");doc.setTextColor(255,255,255);doc.setFontSize(7);let x=10;headers.forEach((header,index)=>{doc.text(header,x+1.5,29.5,{maxWidth:widths[index]-3});x+=widths[index];});doc.setTextColor(30,49,77);};doc.setFontSize(18);doc.setTextColor(18,49,91);doc.text("A+ Kids Account Management Report",10,12);doc.setFontSize(8);doc.setTextColor(86,107,136);doc.text(`${rows.length} records · ${selected.size?"Selected accounts":"Current filtered results"} · ${dateLabel(new Date().toISOString())}`,10,18);drawHeader();let y=32;rows.forEach((row,index)=>{if(y+rowHeight>198){doc.addPage();drawHeader();y=32;}if(index%2===0){doc.setFillColor(246,250,255);doc.rect(10,y,277,rowHeight,"F");}doc.setFontSize(6.5);let x=10;row.forEach((value,column)=>{doc.text(String(value).slice(0,column===0?28:40),x+1.5,y+4.5,{maxWidth:widths[column]-3});x+=widths[column];});y+=rowHeight;});doc.save("aplus-account-management.pdf");}
    setExportOpen(false);notify(`${rows.length} account record${rows.length===1?"":"s"} exported as ${format==="pdf"?"PDF":"Excel"}.`);}catch{notify("The export could not be created. Please try again.");}finally{setBusy(false);}}

  const tabs:Array<{id:Tab;label:string;description:string;value:string}>=[
      {id:"overview",label:"Overview",description:"Operations at a glance",value:String(accounts.length)},
      {id:"accounts",label:"Kids accounts",description:"Families and guests",value:String(accounts.length)},
      ...(currentUser.superAdmin?[
        {id:"admins" as Tab,label:"Admin users",description:"Roles and invitations",value:String(adminSummary?.total??admins.length)},
        {id:"history" as Tab,label:"Admin history",description:"Account audit trail",value:String(history.length)},
      ]:[]),
  ];
  const serviceStatus=loadError?"Service needs attention":"Database connected";
  const serviceTone=loadError?"border-red-200 bg-red-50 text-red-700":"border-emerald-200 bg-emerald-50 text-emerald-700";
  if(loading)return <div className="mt-6 grid min-h-[360px] place-items-center rounded-[24px] border border-[#DFE9F4] bg-white"><div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500"/><p className="mt-4 text-sm font-semibold text-[#415674]">Loading account management…</p><p className="mt-1 text-xs text-[#8291A6]">Preparing cached records and secure permissions.</p></div></div>;
  return <section className="relative mt-6">
    <div className="flex flex-col gap-4 laptop:flex-row laptop:items-end laptop:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#2188F4]">Account control centre</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-.035em] text-[#152947] tablet:text-[28px] desktop:text-[32px]">People, access and accountability</h2><p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#73829A] tablet:text-[13px]">Manage family records and verified administrator access from one audited workspace.</p></div><div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-2 text-[10px] font-bold ${serviceTone}`}>● {serviceStatus}</span><button type="button" onClick={()=>void loadAll(true)} disabled={refreshing} className={secondary}>{refreshing?"Refreshing…":"Refresh"}</button></div></div>
    {loadError?<div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 tablet:flex-row tablet:items-center tablet:justify-between"><span>{loadError}</span><button onClick={()=>void loadAll()} className={secondary}>Try again</button></div>:null}
    <nav className="mt-5 overflow-x-auto rounded-[28px] border border-[#E2EAF4] bg-white p-2.5 shadow-[0_12px_30px_rgba(30,72,123,.12)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Account management sections"><div className="flex min-w-max" role="tablist">{tabs.map(item=>{const active=tab===item.id;return <button type="button" role="tab" key={item.id} onClick={()=>chooseTab(item.id)} aria-selected={active} aria-current={active?"page":undefined} className={`relative flex min-h-[78px] min-w-[174px] flex-1 items-center justify-center gap-3 border-r border-[#E5EBF3] px-4 text-[13px] font-bold transition last:border-r-0 tablet:min-w-[190px] tablet:px-6 tablet:text-[15px] ${active?"rounded-[20px] bg-gradient-to-br from-[#299CFF] to-[#0869ED] text-white shadow-[0_10px_20px_rgba(13,118,239,.28)]":"text-[#5D6E8C] hover:bg-[#F4F9FF] hover:text-[#0877EF]"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-[12px] p-1.5 ${active?"bg-white/14 text-white":"bg-[#F8FBFF] text-[#90ADD6]"}`}><AccountTabIcon tab={item.id}/></span><span className="text-left"><span className="block whitespace-nowrap">{item.label}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${active?"bg-white/18 text-white":"bg-blue-50 text-blue-700"}`}>{item.value}</span></span></button>})}</div></nav>
    {switching?<div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700"><span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"/>Preparing this section…</div>:null}

    {tab==="overview"?<div className="mt-5 space-y-4">
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-6"><MetricCard label="Total accounts" value={accounts.length} detail="Registered families and guest contacts" active tone="blue" onClick={()=>chooseTab("accounts")}/><MetricCard label="Active accounts" value={overview?.activeAccounts??overviewCounts.active} detail="Accounts currently able to use the service" tone="green"/><MetricCard label="Child profiles" value={overview?.childProfiles??0} detail="Protected child records linked to families" tone="violet"/><MetricCard label="Admin users" value={adminSummary?.total??overview?.administrators??0} detail="Verified, invited and retained admin records" tone="amber" onClick={currentUser.superAdmin?()=>chooseTab("admins"):undefined}/><MetricCard label="Pending invites" value={adminSummary?.pendingVerification??0} detail="Waiting for email verification and setup" tone="amber" onClick={currentUser.superAdmin?()=>chooseTab("admins"):undefined}/><MetricCard label="Needs attention" value={attentionTotal} detail="Access and verification items to review" tone="red"/></div>
      <div className="grid gap-4 laptop:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 shadow-[0_10px_28px_rgba(31,83,139,.05)] tablet:p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-[17px] font-semibold text-[#203653]">Needs attention</h3><p className="mt-1 text-xs leading-5 text-[#7B899C]">Review incomplete verification, restricted access and retained records.</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${attentionTotal?"bg-red-50 text-red-700":"bg-emerald-50 text-emerald-700"}`}>{attentionTotal?`${attentionTotal} open`:`All clear`}</span></div><div className="mt-5 grid gap-3 tablet:grid-cols-2">{attentionItems.map(item=><button type="button" key={item.label} onClick={()=>chooseTab(item.target)} disabled={!currentUser.superAdmin&&item.target==="admins"} className="rounded-2xl border border-[#E4EBF3] bg-[#FBFDFF] p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-default disabled:hover:border-[#E4EBF3] disabled:hover:bg-[#FBFDFF]"><span className={`text-xl font-semibold ${item.value?"text-[#D44A5D]":"text-[#1A9A70]"}`}>{item.value}</span><strong className="mt-2 block text-[11px] leading-4 text-[#344B69]">{item.label}</strong><span className="mt-1 block text-[9px] leading-4 text-[#8795A8]">{item.detail}</span></button>)}</div></section>
        <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 shadow-[0_10px_28px_rgba(31,83,139,.05)] tablet:p-6"><h3 className="text-[17px] font-semibold text-[#203653]">Quick actions</h3><p className="mt-1 text-xs leading-5 text-[#7B899C]">Go directly to common account operations.</p><div className="mt-5 grid gap-2"><button type="button" className={`${primary} w-full text-left`} onClick={()=>chooseTab("accounts")}>Find or edit a Kids account</button>{currentUser.superAdmin?<button type="button" className={secondary} onClick={()=>{chooseTab("admins");openInviteWizard();}}>Invite a verified administrator</button>:null}</div></section>
      </div>
      <div className="grid gap-4 laptop:grid-cols-2">
        <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 tablet:p-6"><div className="flex items-center justify-between gap-3"><div><h3 className="text-[17px] font-semibold text-[#203653]">Account distribution</h3><p className="mt-1 text-xs text-[#7B899C]">A clear view of who is using the service.</p></div><button type="button" className={secondary} onClick={()=>chooseTab("accounts")}>View accounts</button></div><div className="mt-5 grid grid-cols-2 gap-3"><SummaryTile label="Registered" value={overviewCounts.registered} total={accounts.length}/><SummaryTile label="Guest" value={overviewCounts.guests} total={accounts.length}/><SummaryTile label="Active" value={overviewCounts.active} total={accounts.length}/><SummaryTile label="Restricted" value={overviewCounts.restricted} total={accounts.length}/></div></section>
        <section className="rounded-[22px] border border-[#DDE7F2] bg-white p-5 tablet:p-6"><div className="flex items-center justify-between gap-3"><div><h3 className="text-[17px] font-semibold text-[#203653]">Recent administrator activity</h3><p className="mt-1 text-xs text-[#7B899C]">The latest recorded access and account changes.</p></div>{currentUser.superAdmin?<button type="button" className={secondary} onClick={()=>chooseTab("history")}>View history</button>:null}</div>{currentUser.superAdmin&&history.length?<div className="mt-4 divide-y divide-[#EDF2F7]">{history.slice(0,5).map((item,index)=><div key={`${item.createdAt}-${index}`} className="grid gap-1 py-3 tablet:grid-cols-[130px_1fr]"><span className="text-[9px] font-bold uppercase tracking-wide text-blue-700">{statusLabel(item.action)}</span><div><p className="text-[10px] leading-4 text-[#465B77]">{item.details}</p><p className="mt-1 text-[9px] text-[#8996A8]">{item.actor} · {dateLabel(item.createdAt)}</p></div></div>)}</div>:<div className="mt-5 rounded-2xl bg-[#F7FAFD] p-6 text-center text-xs leading-5 text-[#7D8BA0]">{currentUser.superAdmin?"No administrator activity has been recorded yet.":"Administrator history is available to Super Admins."}</div>}</section>
      </div>
    </div>:null}

    {tab==="accounts"?<div className="mt-5 overflow-hidden rounded-[22px] border border-[#DDE7F2] bg-white shadow-[0_10px_30px_rgba(31,83,139,.06)]">
      <div className="grid gap-3 border-b border-[#E8EEF5] bg-[#FBFDFF] p-4 tablet:grid-cols-2 laptop:grid-cols-[2fr_1fr_1fr_1fr_auto] laptop:p-5 desktop:gap-4"><input value={search} onChange={event=>{setSearch(event.target.value);setAccountPage(1);}} className={field} placeholder="Search name, email, phone or reference"/><select value={accountType} onChange={event=>{setAccountType(event.target.value);setAccountAvailability("ALL");setAccountPage(1);}} className={field}><option value="ALL">All account types</option><option value="REGISTERED">Registered</option><option value="GUEST">Non-registered</option></select><select value={accountStatus} onChange={event=>{setAccountStatus(event.target.value);setAccountAvailability("ALL");setAccountPage(1);}} className={field}><option value="ALL">All statuses</option>{[...new Set(accounts.map(item=>item.status))].sort().map(value=><option key={value}>{value}</option>)}</select><input type="number" min="0" value={minChildren} onChange={event=>{setMinChildren(event.target.value);setAccountPage(1);}} className={field} placeholder="Min. children / records"/><button type="button" onClick={()=>{setSearch("");setAccountType("ALL");setAccountStatus("ALL");setAccountAvailability("ALL");setMinChildren("");setAccountPage(1);}} className={secondary}>Clear filters</button></div>
      <div className="grid gap-3 border-b border-[#E8EEF5] p-4 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-5"><MetricCard label={search||accountType!=="ALL"||accountStatus!=="ALL"||accountAvailability!=="ALL"||minChildren?"Showing now":"All accounts"} value={search||accountType!=="ALL"||accountStatus!=="ALL"||accountAvailability!=="ALL"||minChildren?filteredAccounts.length:accounts.length} detail={`${accounts.length} total account records`} active tone="blue" onClick={()=>{setAccountType("ALL");setAccountStatus("ALL");setAccountAvailability("ALL");setAccountPage(1);}}/><MetricCard label="Registered" value={accountTotals.registered} detail="All registered accounts" onClick={()=>{setAccountType("REGISTERED");setAccountStatus("ALL");setAccountAvailability("ALL");setAccountPage(1);}}/><MetricCard label="Non-registered" value={accountTotals.guest} detail="All guest account records" onClick={()=>{setAccountType("GUEST");setAccountStatus("ALL");setAccountAvailability("ALL");setAccountPage(1);}}/><MetricCard label="Active" value={accountTotals.active} detail="All available accounts" tone="green" onClick={()=>{setAccountType("ALL");setAccountStatus("ALL");setAccountAvailability("ACTIVE");setAccountPage(1);}}/><MetricCard label="Needs attention" value={accountTotals.attention} detail="All pending, suspended or removed" tone="red" onClick={()=>{setAccountType("ALL");setAccountStatus("ALL");setAccountAvailability("ATTENTION");setAccountPage(1);}}/></div>
      <div className="flex flex-col gap-3 border-b border-[#E8EEF5] px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between"><div className="flex flex-wrap gap-2"><button className={secondary} onClick={()=>setSelected(new Set(pageAccounts.map(item=>item.id)))}>Select page</button><button className={secondary} onClick={()=>setSelected(new Set())}>Clear selection</button><span className="self-center text-[11px] text-[#74839A]">{selected.size} selected</span></div><div className="flex flex-wrap gap-2"><button className={primary} onClick={()=>setExportOpen(true)}>Export {selected.size?"selected":"filtered"}</button>{currentUser.superAdmin?<button type="button" disabled={!selectedAccounts.length} onClick={openPermanentDeletion} className="min-h-10 rounded-xl bg-red-600 px-4 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,.2)] disabled:cursor-not-allowed disabled:opacity-40">Permanently delete selected</button>:null}</div></div>
      <div className="laptop:hidden">{pageAccounts.map(item=><article key={item.id} className="border-b border-[#EDF2F7] p-4"><div className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 accent-blue-600" checked={selected.has(item.id)} onChange={()=>setSelected(current=>{const next=new Set(current);if(next.has(item.id))next.delete(item.id);else next.add(item.id);return next;})}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-[13px] text-[#203653]">{item.name}</strong><StatusPill value={item.status}/></div><p className="mt-1 break-all text-[11px] text-[#718199]">{item.email||"No email"} - {item.phone}</p><p className="mt-2 text-[10px] text-[#8A97A8]">{item.accountType==="GUEST"?"Guest":"Registered"} - {item.children} child / submission record{item.children===1?"":"s"}</p><div className="mt-3 flex flex-wrap gap-2"><button className={secondary} onClick={()=>openEditor(item)}>Edit</button>{item.status.includes("DELETED")?<button className={secondary} onClick={()=>void deleteOrRestore(item,true)}>Restore</button>:<button className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-700" onClick={()=>{setDeleting(item);setActionReason("");}}>Remove</button>}</div></div></div></article>)}</div>
      <div className="hidden overflow-x-auto laptop:block"><table className="w-full min-w-[1050px] border-collapse text-left"><thead className="bg-[#F6F9FD] text-[10px] uppercase tracking-wide text-[#6E7F97]"><tr><th className="p-4">Select</th><th className="p-4">Account</th><th className="p-4">Contact</th><th className="p-4">Type</th><th className="p-4">Records</th><th className="p-4">Status</th><th className="p-4">Last login</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{pageAccounts.map(item=><tr key={item.id} className="border-t border-[#EDF2F7] text-[11px] hover:bg-blue-50/40"><td className="p-4"><input type="checkbox" className="size-4 accent-blue-600" checked={selected.has(item.id)} onChange={()=>setSelected(current=>{const next=new Set(current);if(next.has(item.id))next.delete(item.id);else next.add(item.id);return next;})}/></td><td className="p-4"><strong className="block text-[12px] text-[#233956]">{item.name}</strong><span className="mt-1 block max-w-44 truncate text-[#8794A7]">{item.id}</span></td><td className="p-4"><span className="block">{item.email||"No email"}</span><span className="mt-1 block text-[#8794A7]">{item.phone}</span></td><td className="p-4">{item.accountType==="GUEST"?"Guest":"Registered"}</td><td className="p-4">{item.children}</td><td className="p-4"><StatusPill value={item.status}/></td><td className="p-4 text-[#66778F]">{dateLabel(item.lastLoginAt)}</td><td className="p-4"><div className="flex justify-end gap-2"><button className={secondary} onClick={()=>openEditor(item)}>Edit</button>{item.status.includes("DELETED")?<button className={secondary} onClick={()=>void deleteOrRestore(item,true)}>Restore</button>:<button className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-700" onClick={()=>{setDeleting(item);setActionReason("");}}>Remove</button>}</div></td></tr>)}</tbody></table></div>
      {!pageAccounts.length?<p className="p-10 text-center text-sm text-[#7D8BA0]">No account records match these filters.</p>:null}
      <div className="flex flex-col gap-3 border-t border-[#E8EEF5] p-4 tablet:flex-row tablet:items-center tablet:justify-between"><p className="text-[11px] text-[#74839A]">Showing {pageAccounts.length?((safeAccountPage-1)*accountPageSize)+1:0}-{Math.min(safeAccountPage*accountPageSize,filteredAccounts.length)} of {filteredAccounts.length}</p><div className="flex items-center gap-2"><select value={accountPageSize} onChange={event=>{setAccountPageSize(Number(event.target.value));setAccountPage(1);}} className={`${field} w-auto`}><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select><button className={secondary} disabled={safeAccountPage<=1} onClick={()=>setAccountPage(value=>Math.max(1,value-1))}>Previous</button><span className="text-[11px] font-semibold">{safeAccountPage} / {totalPages}</span><button className={secondary} disabled={safeAccountPage>=totalPages} onClick={()=>setAccountPage(value=>Math.min(totalPages,value+1))}>Next</button></div></div>
    </div>:null}

    {tab==="admins"&&currentUser.superAdmin?<div className="mt-5">
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-5 monitor:grid-cols-6"><MetricCard label="All administrators" value={adminSummary?.total??admins.length} detail="All retained administrator records" active tone="blue" onClick={()=>setAdminStatus("ALL")}/><MetricCard label="Active" value={adminSummary?.active??0} detail="Verified team members" tone="green" onClick={()=>setAdminStatus("ACTIVE")}/><MetricCard label="Pending verification" value={adminSummary?.pendingVerification??0} detail="No access until verified" tone="amber" onClick={()=>setAdminStatus("PENDING_VERIFICATION")}/><MetricCard label="Suspended" value={adminSummary?.suspended??0} detail="Temporarily disabled access" tone="red" onClick={()=>setAdminStatus("SUSPENDED")}/><MetricCard label="Removed" value={adminSummary?.removed??0} detail="Access permanently removed" tone="red" onClick={()=>setAdminStatus("REMOVED")}/><MetricCard label="Super Admins" value={adminSummary?.superAdmins??0} detail="Protected active Super Admins" tone="violet" onClick={()=>setAdminRole("SUPER_ADMIN")}/></div>
      <div className="mt-4 overflow-hidden rounded-[22px] border border-[#DDE7F2] bg-white shadow-[0_10px_30px_rgba(31,83,139,.06)]"><div className="grid gap-3 border-b border-[#E8EEF5] bg-[#FBFDFF] p-4 tablet:grid-cols-2 laptop:grid-cols-[2fr_1fr_1fr_auto]"><input value={adminSearch} onChange={event=>setAdminSearch(event.target.value)} className={field} placeholder="Search administrator name, email or phone"/><select value={adminStatus} onChange={event=>setAdminStatus(event.target.value as typeof adminStatus)} className={field}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="PENDING_VERIFICATION">Pending verification</option><option value="SUSPENDED">Suspended</option><option value="CANCELLED">Cancelled</option><option value="REMOVED">Removed</option></select><select value={adminRole} onChange={event=>setAdminRole(event.target.value as typeof adminRole)} className={field}><option value="ALL">All roles</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select><button className={primary} onClick={openInviteWizard}>+ Invite administrator</button></div>
        <div className="divide-y divide-[#EDF2F7]">{filteredAdmins.map(admin=><article key={admin.id} className="grid gap-4 p-4 tablet:p-5 laptop:grid-cols-[minmax(220px,1.3fr)_minmax(190px,1fr)_auto] laptop:items-center"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{admin.name.slice(0,2).toUpperCase()}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-[13px] text-[#203653]">{admin.name}</strong><StatusPill value={admin.status}/>{admin.id===currentUser.id?<span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">YOU</span>:null}</div><p className="mt-1 break-all text-[11px] text-[#718199]">{admin.email} · {admin.phone}</p><p className="mt-2 text-[10px] text-[#8996A8]">Invited by {admin.invitedBy} · {dateLabel(admin.invitedAt)}</p></div></div><div><p className="text-[11px] font-bold text-[#435A78]">{admin.role==="SUPER_ADMIN"?"Super Admin":"Admin"}</p><p className="mt-1 text-[10px] text-[#8996A8]">Email {admin.emailVerifiedAt?`verified ${dateLabel(admin.emailVerifiedAt)}`:"awaiting verification"}</p><p className="mt-1 text-[10px] text-[#8996A8]">Last login: {dateLabel(admin.lastLoginAt)}</p>{admin.status==="REMOVED"?<p className="mt-2 text-[10px] leading-4 text-red-700">Removed {dateLabel(admin.removedAt)}{admin.removalReason?` · ${admin.removalReason}`:""}</p>:null}</div><div className="flex flex-wrap gap-2 laptop:justify-end">{!["CANCELLED","REMOVED"].includes(admin.status)?<button className={secondary} onClick={()=>{setAdminEditor(admin);setAdminDraft({name:admin.name,phone:admin.phone});}}>Edit</button>:null}{admin.status==="PENDING_VERIFICATION"?<><button className={secondary} disabled={busy} onClick={()=>void resendInvite(admin)}>Resend code</button><button className={secondary} onClick={()=>{setAdminAction({admin,type:"cancel"});setActionReason("");}}>Cancel invite</button></>:admin.status==="ACTIVE"?<><button className={secondary} onClick={()=>{setAdminAction({admin,type:"role"});setNextRole(admin.role==="ADMIN"?"SUPER_ADMIN":"ADMIN");setActionReason("");}}>Change role</button><button className={secondary} onClick={()=>{setAdminAction({admin,type:"sessions"});setActionReason("");}}>Revoke sessions</button><button disabled={admin.id===currentUser.id} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-700 disabled:opacity-40" onClick={()=>{setAdminAction({admin,type:"suspend"});setActionReason("");}}>Suspend</button><button disabled={admin.id===currentUser.id} className="min-h-10 rounded-xl bg-red-600 px-4 text-[11px] font-bold text-white disabled:opacity-40" onClick={()=>{setAdminAction({admin,type:"remove"});setActionReason("");}}>Remove</button></>:admin.status==="SUSPENDED"?<><button className={primary} onClick={()=>{setAdminAction({admin,type:"restore"});setActionReason("");}}>Restore access</button><button className="min-h-10 rounded-xl bg-red-600 px-4 text-[11px] font-bold text-white" onClick={()=>{setAdminAction({admin,type:"remove"});setActionReason("");}}>Remove</button></>:null}</div></article>)}{!filteredAdmins.length?<p className="p-10 text-center text-sm text-[#7D8BA0]">No administrators match these filters.</p>:null}</div></div>
    </div>:null}

    {tab==="history"&&currentUser.superAdmin?<div className="mt-5 overflow-hidden rounded-[22px] border border-[#DDE7F2] bg-white"><div className="border-b border-[#E8EEF5] p-5"><h3 className="text-lg font-semibold text-[#203653]">Administrator audit history</h3><p className="mt-1 text-xs text-[#7B899C]">A retained timeline of account and permission changes.</p></div><div className="max-h-[680px] divide-y divide-[#EDF2F7] overflow-y-auto">{history.slice(0,250).map((item,index)=><article key={`${item.createdAt}-${item.action}-${index}`} className="grid gap-2 p-4 tablet:grid-cols-[180px_1fr] tablet:p-5"><div><p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">{statusLabel(item.action)}</p><p className="mt-1 text-[10px] text-[#8996A8]">{dateLabel(item.createdAt)}</p></div><div><p className="text-[12px] leading-5 text-[#405573]">{item.details}</p><p className="mt-1 text-[10px] text-[#8996A8]">By {item.actor} · {statusLabel(item.entityType)}</p></div></article>)}{!history.length?<p className="p-10 text-center text-sm text-[#7D8BA0]">No administrator actions have been recorded.</p>:null}</div></div>:null}

    {editing?<Modal title="Edit Kids account" description="Changes are saved to the account and audit history." onClose={()=>setEditing(null)}><div className="grid gap-4"><Label text="Parent or guardian name"><input className={field} maxLength={120} value={accountDraft.accountHolderName} onChange={event=>setAccountDraft({...accountDraft,accountHolderName:event.target.value})}/></Label><Label text="Email address"><input type="email" className={field} maxLength={254} value={accountDraft.email} onChange={event=>setAccountDraft({...accountDraft,email:event.target.value})}/></Label><Label text="Phone number"><input className={field} maxLength={30} value={accountDraft.phoneE164} onChange={event=>setAccountDraft({...accountDraft,phoneE164:event.target.value})}/></Label>{editing.accountType!=="GUEST"?<Label text="Account status"><select className={field} value={accountDraft.status} onChange={event=>setAccountDraft({...accountDraft,status:event.target.value})}>{["ACTIVE","PENDING_VERIFICATION","LOCKED","SUSPENDED","DELETION_PENDING"].map(value=><option key={value}>{value}</option>)}</select></Label>:null}</div><ModalActions onCancel={()=>setEditing(null)} onConfirm={()=>void saveAccount()} busy={busy} label="Save changes" disabled={!accountDraft.accountHolderName||!accountDraft.email||!accountDraft.phoneE164}/></Modal>:null}
    {permanentDeletionOpen?<Modal title="Permanently delete selected accounts" description={`${selectedAccounts.length} selected account${selectedAccounts.length===1?"":"s"} and all account-owned child, submission and photo data will be removed. This cannot be undone.`} onClose={()=>resetPermanentDeletion(true)}>
      {permanentDeletionStep==="confirm"?<>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-800"><strong className="block text-sm">This is irreversible.</strong><span className="mt-1 block">The selected Kids or guest account records, child profiles, submissions, photos and related contact data will be permanently removed. Any ZIP containing selected data is invalidated to protect privacy. Administrator accounts, roles and settings are not affected.</span></div>
        <div className="mt-4 max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[#536781]">{selectedAccounts.map(account=><p key={account.id} className="py-1"><strong>{account.name}</strong> <span className="text-[#8190A4]">· {account.accountType==="GUEST"?"Guest":"Kids account"}</span></p>)}</div>
        <div className="mt-4"><Label text='Type “PERMANENT DELETE” to confirm'><input autoFocus className={field} maxLength={16} value={permanentDeletionPhrase} onChange={event=>setPermanentDeletionPhrase(event.target.value.toUpperCase())} placeholder="PERMANENT DELETE"/></Label></div>
        {permanentDeletionFeedback?<InviteFeedback value={permanentDeletionFeedback}/>:null}
        <ModalActions danger onCancel={()=>resetPermanentDeletion(true)} onConfirm={()=>void requestPermanentDeletionCode()} busy={busy} label="Send verification code" disabled={permanentDeletionPhrase!=="PERMANENT DELETE"}/>
      </>:null}
      {permanentDeletionStep==="code"&&permanentDeletionConfirmation?<>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><p className="text-[11px] font-bold text-blue-900">Deletion code sent to</p><p className="mt-1 text-xs text-blue-700">{permanentDeletionConfirmation.emailMasked}</p><p className={`mt-2 text-[11px] font-semibold ${permanentDeletionExpiresSeconds>0?"text-blue-700":"text-red-700"}`}>{permanentDeletionExpiresSeconds>0?`Expires in ${permanentDeletionTimeLabel()}`:"This code has expired. Request a new code."}</p></div>
        <div className="mx-auto mt-5 max-w-sm"><Label text="Six-digit verification code"><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${field} min-h-14 text-center text-xl font-bold tracking-[.35em]`} value={permanentDeletionCode} onChange={event=>{setPermanentDeletionCode(event.target.value.replace(/\D/g,"").slice(0,6));setPermanentDeletionFeedback(null);}} onKeyDown={event=>{if(event.key==="Enter"&&permanentDeletionCode.length===6&&permanentDeletionExpiresSeconds>0)void confirmPermanentDeletion();}} placeholder="000000"/></Label></div>
        {permanentDeletionFeedback?<InviteFeedback value={permanentDeletionFeedback}/>:null}
        <button type="button" onClick={()=>void confirmPermanentDeletion()} disabled={busy||permanentDeletionCode.length!==6||permanentDeletionExpiresSeconds<=0} className="mt-5 min-h-12 w-full rounded-xl bg-red-600 px-5 text-[12px] font-bold text-white disabled:opacity-40">{busy?"Permanently deleting…":"Verify code and permanently delete"}</button>
        <div className="mt-3 grid gap-2 tablet:grid-cols-2"><button type="button" onClick={()=>void requestPermanentDeletionCode()} disabled={busy||permanentDeletionResendSeconds>0} className={secondary}>{permanentDeletionResendSeconds>0?`Resend in ${permanentDeletionResendSeconds}s`:"Resend code"}</button><button type="button" onClick={()=>resetPermanentDeletion(true)} disabled={busy} className={secondary}>Cancel</button></div>
      </>:null}
    </Modal>:null}
    {deleting?<Modal title="Remove account safely" description={`${deleting.name} will lose access. Child and submission records are retained and the account can be restored.`} onClose={()=>setDeleting(null)}><Reason value={actionReason} onChange={setActionReason}/><ModalActions danger onCancel={()=>setDeleting(null)} onConfirm={()=>void deleteOrRestore(deleting)} busy={busy} label="Remove access" disabled={!actionReason.trim()}/></Modal>:null}
    {exportOpen?<Modal title="Export account records" description={`${selected.size||filteredAccounts.length} record${(selected.size||filteredAccounts.length)===1?"":"s"} will be exported using the current selection and filters.`} onClose={()=>setExportOpen(false)}><div className="grid gap-3 tablet:grid-cols-2"><button onClick={()=>void exportAccounts("pdf")} className="rounded-2xl border border-red-200 bg-red-50 p-5 text-left transition hover:-translate-y-0.5"><span className="text-2xl">PDF</span><strong className="mt-3 block text-sm text-red-900">Printable PDF report</strong><span className="mt-1 block text-xs leading-5 text-red-700">Light table, repeated headers and readable multi-page layout.</span></button><button onClick={()=>void exportAccounts("excel")} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left transition hover:-translate-y-0.5"><span className="text-2xl">XLS</span><strong className="mt-3 block text-sm text-emerald-900">Structured Excel sheet</strong><span className="mt-1 block text-xs leading-5 text-emerald-700">Styled headings, column widths, alternating rows and filters.</span></button></div></Modal>:null}
    {inviteOpen?<Modal title={inviteStep==="success"?"Administrator created":"Invite an administrator"} description={inviteStep==="details"?"Send a code-only email, verify the address and finish the secure account setup.":inviteStep==="code"?"Enter the six-digit code from the invited email. No administrator access exists yet.":inviteStep==="password"?"The email code is correct. The invited person must now create a private password.":"The verified administrator account is ready to use."} onClose={()=>{if(inviteStep==="details"||inviteStep==="success")resetInviteWizard(true);else void cancelWizardInvitation(false);}}>
      <div className="mx-auto flex max-w-md items-center" aria-label={`Invitation step ${inviteStep==="details"?1:inviteStep==="code"?2:inviteStep==="password"?3:4} of 4`}>
        {[1,2,3,4].map((step,index)=>{const current=inviteStep==="details"?1:inviteStep==="code"?2:inviteStep==="password"?3:4;return <div key={step} className={`flex items-center ${index<3?"flex-1":""}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold tablet:size-9 ${step<=current?"bg-blue-600 text-white":"bg-slate-100 text-slate-500"}`}>{step<current?"✓":step}</span>{index<3?<span className={`h-1 flex-1 ${step<current?"bg-blue-600":"bg-slate-100"}`}/>:null}</div>;})}
      </div>
      {inviteStep==="details"?<>
        <div className="mt-6 grid gap-4 tablet:grid-cols-2"><Label text="Full name"><input className={field} maxLength={120} value={inviteDraft.name} onChange={event=>{setInviteDraft({...inviteDraft,name:event.target.value});setInviteFeedback(null);}}/></Label><Label text="Work email"><input type="email" className={field} maxLength={254} value={inviteDraft.email} onChange={event=>{setInviteDraft({...inviteDraft,email:event.target.value});setInviteFeedback(null);}}/></Label><Label text="Phone number"><input className={field} maxLength={30} placeholder="07XXXXXXXX" value={inviteDraft.phone} onChange={event=>{setInviteDraft({...inviteDraft,phone:event.target.value});setInviteFeedback(null);}}/></Label><Label text="Access role"><select className={field} value={inviteDraft.role} onChange={event=>setInviteDraft({...inviteDraft,role:event.target.value as AdminRole})}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></Label><div className="tablet:col-span-2"><Label text="Why is this administrator access needed?"><textarea className={`${field} min-h-24 py-3`} maxLength={600} value={inviteDraft.reason} onChange={event=>{setInviteDraft({...inviteDraft,reason:event.target.value});setInviteFeedback(null);}}/></Label></div></div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">The code expires after 10 minutes. Sending it creates only a disabled pending invitation—no role, login or Admin Panel access is granted.</div>
        {inviteFeedback?<InviteFeedback value={inviteFeedback}/>:null}
        <ModalActions onCancel={()=>resetInviteWizard(true)} onConfirm={()=>void inviteAdmin()} busy={busy} label="Send verification code" disabled={!inviteDraft.name||!inviteDraft.email||!inviteDraft.phone||!inviteDraft.reason.trim()}/>
      </>:null}
      {inviteStep==="code"&&pendingInvitation?<div className="mt-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><p className="text-[11px] font-bold text-blue-900">Code sent to</p><p className="mt-1 break-all text-xs text-blue-700">{pendingInvitation.email}</p><p className={`mt-2 text-[11px] font-semibold ${inviteExpiresSeconds>0?"text-blue-700":"text-red-700"}`}>{inviteExpiresSeconds>0?`Expires in ${inviteTimeLabel()}`:"This code has expired. Request a new code."}</p></div>
        <div className="mx-auto mt-5 max-w-sm"><Label text="Six-digit verification code"><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${field} min-h-14 text-center text-xl font-bold tracking-[.35em]`} value={inviteCode} onChange={event=>{setInviteCode(event.target.value.replace(/\D/g,"").slice(0,6));setInviteFeedback(null);}} onKeyDown={event=>{if(event.key==="Enter"&&inviteCode.length===6&&inviteExpiresSeconds>0)void verifyInviteCode();}} placeholder="000000"/></Label></div>
        {inviteFeedback?<InviteFeedback value={inviteFeedback}/>:null}
        <button type="button" onClick={()=>void verifyInviteCode()} disabled={busy||inviteCode.length!==6||inviteExpiresSeconds<=0} className={`${primary} mt-5 min-h-12 w-full`}>{busy?"Checking code…":"Verify code"}</button>
        <div className="mt-3 grid gap-2 tablet:grid-cols-3 laptop:gap-3"><button type="button" onClick={()=>void resendWizardCode()} disabled={busy||inviteResendSeconds>0} className={secondary}>{inviteResendSeconds>0?`Resend in ${inviteResendSeconds}s`:"Resend code"}</button><button type="button" onClick={()=>void cancelWizardInvitation(true)} disabled={busy} className={secondary}>Change email</button><button type="button" onClick={()=>void cancelWizardInvitation(false)} disabled={busy} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-700 disabled:opacity-45">Exit and cancel</button></div>
      </div>:null}
      {inviteStep==="password"&&pendingInvitation?<div className="mt-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><p className="text-[11px] font-bold text-emerald-800">Email code confirmed</p><p className="mt-1 break-all text-xs text-emerald-700">{pendingInvitation.email}</p></div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">The invited person should enter this password privately. The Super Admin should not create, copy or retain it.</p>
        <div className="mt-4 grid gap-4 tablet:grid-cols-2"><Label text="New password"><input type="password" autoComplete="new-password" className={field} minLength={8} maxLength={128} value={invitePassword} onChange={event=>{setInvitePassword(event.target.value);setInviteFeedback(null);}}/></Label><Label text="Confirm password"><input type="password" autoComplete="new-password" className={field} minLength={8} maxLength={128} value={inviteConfirmPassword} onChange={event=>{setInviteConfirmPassword(event.target.value);setInviteFeedback(null);}} onKeyDown={event=>{if(event.key==="Enter"&&invitePassword.length>=8&&inviteConfirmPassword)void completeInvitation();}}/></Label></div>
        {inviteFeedback?<InviteFeedback value={inviteFeedback}/>:null}
        <button type="button" onClick={()=>void completeInvitation()} disabled={busy||invitePassword.length<8||!inviteConfirmPassword} className={`${primary} mt-5 min-h-12 w-full`}>{busy?"Creating administrator…":"Create administrator account"}</button>
        <div className="mt-3 grid gap-2 tablet:grid-cols-2"><button type="button" onClick={()=>{setInviteStep("code");setInvitePassword("");setInviteConfirmPassword("");setInviteFeedback(null);}} disabled={busy} className={secondary}>Change code</button><button type="button" onClick={()=>void cancelWizardInvitation(false)} disabled={busy} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-[11px] font-semibold text-red-700 disabled:opacity-45">Exit and cancel</button></div>
      </div>:null}
      {inviteStep==="success"&&pendingInvitation?<div className="mt-7 text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">✓</div><h4 className="mt-5 text-lg font-semibold text-[#203653]">{pendingInvitation.name} is now an administrator</h4><p className="mt-2 break-all text-xs text-[#74839A]">{pendingInvitation.email} · {pendingInvitation.role==="SUPER_ADMIN"?"Super Admin":"Admin"}</p>{inviteFeedback?<InviteFeedback value={inviteFeedback}/>:null}<button type="button" onClick={()=>resetInviteWizard(true)} className={`${primary} mt-6 min-h-12 w-full`}>Done</button></div>:null}
    </Modal>:null}
    {adminEditor?<Modal title="Edit administrator" description="The verified email is locked. Invite the person again to use a different administrator email." onClose={()=>setAdminEditor(null)}><div className="grid gap-4"><Label text="Full name"><input className={field} maxLength={120} value={adminDraft.name} onChange={event=>setAdminDraft({...adminDraft,name:event.target.value})}/></Label><Label text="Verified email"><input className={`${field} bg-slate-50`} value={adminEditor.email} disabled/></Label><Label text="Phone number"><input className={field} maxLength={30} value={adminDraft.phone} onChange={event=>setAdminDraft({...adminDraft,phone:event.target.value})}/></Label></div><ModalActions onCancel={()=>setAdminEditor(null)} onConfirm={()=>void saveAdmin()} busy={busy} label="Save administrator" disabled={!adminDraft.name||!adminDraft.phone}/></Modal>:null}
    {adminAction?<Modal title={adminAction.type==="role"?"Change administrator role":adminAction.type==="sessions"?"Revoke all sessions":adminAction.type==="cancel"?"Cancel invitation":adminAction.type==="remove"?"Remove administrator":adminAction.type==="restore"?"Restore administrator access":"Suspend administrator access"} description={`${adminAction.admin.name} · ${adminAction.admin.email}`} onClose={()=>setAdminAction(null)}>{adminAction.type==="role"?<Label text="New role"><select className={field} value={nextRole} onChange={event=>setNextRole(event.target.value as AdminRole)}><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></Label>:null}<div className="mt-4"><Reason value={actionReason} onChange={setActionReason}/></div><p className={`mt-3 rounded-xl p-3 text-xs leading-5 ${adminAction.type==="remove"?"border border-red-200 bg-red-50 text-red-800":"bg-blue-50 text-blue-800"}`}>{adminAction.type==="remove"?"This permanently removes administrator access and revokes every session. The identity and reason remain in audit history.":adminAction.type==="suspend"||adminAction.type==="role"||adminAction.type==="sessions"?"Existing sessions will be revoked. The administrator must log in again with current access.":"This action is retained in Admin history."}</p><ModalActions danger={["suspend","cancel","remove","sessions"].includes(adminAction.type)} onCancel={()=>setAdminAction(null)} onConfirm={()=>void runAdminAction()} busy={busy} label={adminAction.type==="role"?"Change role":adminAction.type==="restore"?"Restore access":adminAction.type==="sessions"?"Revoke sessions":adminAction.type==="cancel"?"Cancel invitation":adminAction.type==="remove"?"Remove administrator":"Suspend access"} disabled={!actionReason.trim()}/></Modal>:null}
  </section>;
}

function SummaryTile({label,value,total}:{label:string;value:number;total:number}){const percentage=total?Math.round(value/total*100):0;return <div className="rounded-2xl border border-[#E3EAF3] bg-[#FAFCFF] p-4"><div className="flex items-end justify-between gap-2"><span className="text-[10px] font-bold text-[#526681]">{label}</span><span className="text-[9px] text-[#8996A8]">{percentage}%</span></div><strong className="mt-2 block text-2xl text-[#203653]">{value}</strong><span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-blue-100"><span className="block h-full rounded-full bg-[#258DF2]" style={{width:`${percentage}%`}}/></span></div>}
function Modal({title,description,onClose,children}:{title:string;description:string;onClose:()=>void;children:ReactNode}){return <div className="fixed inset-0 z-[220] grid place-items-center overflow-y-auto bg-[#0B1930]/45 p-3 backdrop-blur-[2px] tablet:p-6" role="dialog" aria-modal="true"><div className="my-5 w-full max-w-lg rounded-[22px] bg-white p-5 shadow-2xl tablet:max-w-xl tablet:rounded-[28px] tablet:p-7 laptop:max-w-2xl laptop:p-8 desktop:max-w-[720px] monitor:max-w-[760px]"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold tracking-[-.02em] text-[#203653]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#75849A]">{description}</p></div><button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg text-slate-600" aria-label="Close">×</button></div><div className="mt-6">{children}</div></div></div>}
function Label({text,children}:{text:string;children:ReactNode}){return <label className="grid gap-1.5 text-[11px] font-bold text-[#536781]">{text}{children}</label>}
function InviteFeedback({value}:{value:{tone:"error"|"success";message:string}}){return <p role={value.tone==="error"?"alert":"status"} className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-5 ${value.tone==="error"?"border-red-200 bg-red-50 text-red-700":"border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{value.message}</p>}
function Reason({value,onChange}:{value:string;onChange:(value:string)=>void}){return <Label text="Reason for this action"><textarea value={value} onChange={event=>onChange(event.target.value)} className={`${field} min-h-24 py-3`} maxLength={600} placeholder="Required for the administrator audit history"/></Label>}
function ModalActions({onCancel,onConfirm,busy,label,disabled,danger=false}:{onCancel:()=>void;onConfirm:()=>void;busy:boolean;label:string;disabled?:boolean;danger?:boolean}){return <div className="mt-6 flex flex-col-reverse gap-3 tablet:flex-row tablet:justify-end"><button type="button" onClick={onCancel} className={secondary}>Cancel</button><button type="button" onClick={onConfirm} disabled={busy||disabled} className={danger?"min-h-10 rounded-xl bg-red-600 px-5 text-[11px] font-bold text-white disabled:opacity-40":primary}>{busy?"Saving…":label}</button></div>}
