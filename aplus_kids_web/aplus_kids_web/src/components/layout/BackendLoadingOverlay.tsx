"use client";

import { useEffect, useRef, useState } from "react";
import { backendActivityEvents } from "@/utils/backendActivity";

const messages = [
  "Getting your information...",
  "Sending data securely...",
  "Almost there...",
  "Just a moment...",
];

export default function BackendLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const requests = useRef(0);
  const showTimer = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      requests.current += 1;
      if (requests.current === 1) {
        showTimer.current = window.setTimeout(() => setVisible(true), 180);
      }
    };
    const end = () => {
      requests.current = Math.max(0, requests.current - 1);
      if (requests.current === 0) {
        if (showTimer.current !== null) window.clearTimeout(showTimer.current);
        showTimer.current = null;
        setVisible(false);
        setMessageIndex(0);
      }
    };
    window.addEventListener(backendActivityEvents.start, start);
    window.addEventListener(backendActivityEvents.end, end);
    return () => {
      window.removeEventListener(backendActivityEvents.start, start);
      window.removeEventListener(backendActivityEvents.end, end);
      if (showTimer.current !== null) window.clearTimeout(showTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % messages.length);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/25 px-5 backdrop-blur-sm" role="status" aria-live="polite" aria-label="Loading">
      <div className="w-full max-w-xs rounded-[24px] border border-white/70 bg-white p-7 text-center shadow-[0_24px_80px_rgba(30,41,59,0.24)]">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f5f0ff]">
          <span className="size-9 animate-spin rounded-full border-4 border-[#ddd2ff] border-t-[#7047e8]" aria-hidden="true" />
        </div>
        <p className="mt-5 text-lg font-semibold text-[#142b53]">{messages[messageIndex]}</p>
        <p className="mt-2 text-sm text-slate-500">Please keep this page open.</p>
        <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full w-1/2 animate-[loading-slide_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#7047e8] to-[#f62983]" />
        </div>
      </div>
    </div>
  );
}
