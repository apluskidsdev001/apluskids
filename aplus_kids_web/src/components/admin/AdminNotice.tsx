"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AdminNoticeTone = "error" | "success" | "warning" | "info";

export type AdminNoticeModel = {
  tone: AdminNoticeTone;
  title: string;
  message: string;
  priority: number;
  createdAt: number;
};

type OperationFinishedDetail = {
  success?: boolean;
  path?: string;
  status?: number;
  message?: string;
};

const strongFailurePattern = /\b(could not|cannot|can't|unable|unavailable|failed|failure|error|exception|unexpected|denied|forbidden|unauthori[sz]ed|expired|not found|not registered|missing|timed out|timeout|offline|disconnected|conflict|invalid|duplicate|constraint|bad request|http\s*\d{3}|sql|network|fetch)\b|already\s+(?:exists|in|assigned|used|linked)|no changes were applied/i;
const successPattern = /\b(saved|updated|added|published|queued|scheduled|restored|synchronized|completed|opened|copied|removed|deleted|finished|refreshed|created|downloaded|sent|changed|verified|connected|recorded|accepted|ignored)\b/i;
const warningPattern = /^(add|choose|select|enter|provide|confirm|review|use|open|complete|check)\b|\b(required|must be|before saving|before downloading|first)\b|^only\b/i;

export function getAdminFriendlyErrorMessage(message?: unknown, context = "") {
  const original = typeof message === "string" ? message.trim() : "";
  const value = `${context} ${original}`.toLowerCase();

  if (/session|sign.?in|login|unauthori[sz]ed|forbidden|permission|access denied/.test(value)) {
    return "Your admin session or permissions could not be confirmed. Sign in again, then retry the action.";
  }
  if (/\/batches\/[^/]+\/edited|edited status|marking it edited/.test(value)) {
    return "The edited status could not be saved. The checkbox was returned to its previous value. Please try again.";
  }
  if (/\/batches\/[^/]+\/download|download.*zip|zip.*download/.test(value)) {
    return "The ZIP could not be downloaded. Confirm that the archive is still available, then try again.";
  }
  if (/\/batches\/selected|manual zip|selected zip/.test(value)) {
    return "The selected photos could not be added to a ZIP. No submission records were changed. Review the selection and try again.";
  }
  if (/\/batches\/[^/]+\/schedule|telecast date|telecast schedule/.test(value)) {
    return "The telecast date could not be saved. The previous schedule is still active.";
  }
  if (/\/settings|zip retention|batch size|configuration|preference/.test(value)) {
    return "The settings could not be saved. Your previous settings are still active.";
  }
  if (/network|fetch|api|database|backend|server|service|timeout|timed out|http\s*\d{3}/.test(value)) {
    return "The service is temporarily unavailable. Check your connection and try again shortly.";
  }
  if (/zip|batch|archive/.test(value)) {
    return "The ZIP action could not be completed. Existing ZIP records were not changed. Please try again.";
  }
  if (/whatsapp|message|campaign|template|recipient|delivery/.test(value)) {
    return "The messaging action could not be completed. Check the recipient details and try again.";
  }
  if (/account-management|account|administrator|role/.test(value)) {
    return "The account action could not be completed. No account details were changed. Please try again.";
  }
  if (/submission|approval|review/.test(value)) {
    return "The submission action could not be completed. The current submission details were kept unchanged.";
  }
  if (/participant|guest|duplicate|merge/.test(value)) {
    return "The participant action could not be completed. The current participant records were kept unchanged.";
  }
  if (/calendar|telecast|schedule|task/.test(value)) {
    return "The schedule action could not be completed. Review the selected date and try again.";
  }
  if (/photo|file|preview|download|upload|media/.test(value)) {
    return "The file action could not be completed. Check that the file is available, then try again.";
  }
  if (/load|overview|growth|records|information|data/.test(value)) {
    return "This information is temporarily unavailable. Refresh the page or try again shortly.";
  }
  return "We could not complete this action. No changes were made. Please review your selections and try again.";
}

function buildAdminNotice(rawMessage: unknown, context = ""): AdminNoticeModel {
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
  const createdAt = Date.now();
  if (context) {
    return {
      tone: "error",
      title: "Action could not be completed",
      message: getAdminFriendlyErrorMessage(message, context),
      priority: 2,
      createdAt,
    };
  }
  const hasFailure = strongFailurePattern.test(message);

  if (!hasFailure && successPattern.test(message)) {
    return { tone: "success", title: "Action completed", message, priority: 1, createdAt };
  }
  if (!hasFailure && warningPattern.test(message)) {
    return { tone: "warning", title: "Action needed", message, priority: 1, createdAt };
  }
  if (!hasFailure && message) {
    return { tone: "info", title: "Admin update", message, priority: 1, createdAt };
  }

  const contextual = Boolean(context || /zip|batch|archive|whatsapp|message|campaign|template|recipient|delivery|account|administrator|role|submission|approval|review|participant|guest|calendar|telecast|schedule|task|settings|configuration|photo|file|preview|download|upload/.test(message.toLowerCase()));
  return {
    tone: "error",
    title: "Action could not be completed",
    message: getAdminFriendlyErrorMessage(message, context),
    priority: contextual ? 2 : 1,
    createdAt,
  };
}

export function useAdminNotice() {
  const [notice, setNotice] = useState<AdminNoticeModel | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const dismissNotice = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setNotice(null);
  }, []);

  const notify = useCallback((message: string) => {
    const next = buildAdminNotice(message);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setNotice((current) => {
      if (current?.tone === "error" && next.tone === "error" && current.priority > next.priority && next.createdAt - current.createdAt < 1500) return current;
      return next;
    });
    if (next.tone !== "error") {
      timerRef.current = window.setTimeout(() => setNotice(null), next.tone === "warning" ? 6500 : 4200);
    }
  }, []);

  useEffect(() => {
    const handleOperationFinished = (event: Event) => {
      const detail = (event as CustomEvent<OperationFinishedDetail>).detail;
      if (detail?.success === false) {
        const next = buildAdminNotice(detail.message || "The request could not be completed.", detail.path ?? "");
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
        setNotice(next);
      }
    };
    window.addEventListener("aplus-operation-finished", handleOperationFinished);
    return () => {
      window.removeEventListener("aplus-operation-finished", handleOperationFinished);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { notice, notify, dismissNotice };
}

export function AdminNotice({ notice, onDismiss }: { notice: AdminNoticeModel | null; onDismiss: () => void }) {
  if (!notice) return null;

  const presentation = notice.tone === "error"
    ? { icon: "!", border: "border-red-200", iconStyle: "bg-red-500 text-white", title: "text-red-950", button: "border-red-200 bg-red-50 text-red-700" }
    : notice.tone === "success"
      ? { icon: "✓", border: "border-emerald-200", iconStyle: "bg-emerald-500 text-white", title: "text-emerald-950", button: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : notice.tone === "warning"
        ? { icon: "!", border: "border-amber-200", iconStyle: "bg-amber-400 text-amber-950", title: "text-amber-950", button: "border-amber-200 bg-amber-50 text-amber-800" }
        : { icon: "i", border: "border-blue-200", iconStyle: "bg-blue-500 text-white", title: "text-blue-950", button: "border-blue-200 bg-blue-50 text-blue-700" };

  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      aria-live={notice.tone === "error" ? "assertive" : "polite"}
      className={`fixed inset-x-4 top-20 z-[320] rounded-[16px] border bg-white p-4 shadow-[0_18px_50px_rgba(23,42,75,.2)] tablet:left-auto tablet:right-5 tablet:w-full tablet:max-w-md ${presentation.border}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-bold ${presentation.iconStyle}`} aria-hidden="true">{presentation.icon}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-semibold ${presentation.title}`}>{notice.title}</p>
          <p className="mt-1 text-[12px] leading-5 text-[#617087]">{notice.message}</p>
        </div>
      </div>
      <button type="button" onClick={onDismiss} className={`mt-3 h-9 w-full rounded-[9px] border text-[12px] font-semibold tablet:ml-auto tablet:block tablet:w-auto tablet:px-4 ${presentation.button}`}>
        Dismiss
      </button>
    </div>
  );
}
