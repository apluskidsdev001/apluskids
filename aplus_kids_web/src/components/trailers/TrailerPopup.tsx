"use client";

import Image from "next/image";
import { sitePath } from "@/utils/sitePath";
import { getYouTubeEmbedUrl } from "./youtube";

type TrailerPopupProps = {
  title: string;
  youtubeUrl: string;
  onClose: () => void;
};

export default function TrailerPopup({
  title,
  youtubeUrl,
  onClose,
}: TrailerPopupProps) {
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#fffff]/82 px-5 backdrop-blur-2xl">
      <div className="w-full max-w-5xl rounded-[30px] bg-[#3b4b86] p-7 shadow-[0_28px_90px_rgba(7,27,99,0.38)]">
        <div className="overflow-hidden rounded-[28px] bg-[#24a9f3] shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex h-[76px] items-center justify-between gap-4 rounded-t-[28px] bg-white px-9">
            <Image
              src={sitePath("/icons/taskbar/logo.png")}
              alt="A Plus Kids"
              width={116}
              height={58}
              className="h-[58px] w-[116px] object-contain"
              priority
            />
            <div className="flex items-center gap-5">
              <h3 className="max-w-[520px] truncate text-[22px] font-bold text-[#071B63]">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close trailer"
                className="grid h-12 w-12 place-items-center rounded-full bg-[#edf6ff] text-[28px] font-bold leading-none text-[#071B63] transition-colors hover:bg-[#dff0ff]"
              >
                x
              </button>
            </div>
          </div>
          <div className="aspect-video bg-black">
            {embedUrl ? (
              <iframe
                title={title}
                src={embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
