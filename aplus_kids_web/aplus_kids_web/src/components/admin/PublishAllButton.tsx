"use client";

import { useState } from "react";
import { publishAdminKeys } from "./useAdminStorage";

export default function PublishAllButton() {
  const [published, setPublished] = useState(false);

  function publishAll() {
    publishAdminKeys([
      { draft: "aplus-admin-home-hero", published: "aplus-published-home-hero" },
      { draft: "aplus-admin-home-shortcuts", published: "aplus-published-home-shortcuts" },
      { draft: "aplus-admin-home-live", published: "aplus-published-home-live" },
      { draft: "aplus-admin-home-events", published: "aplus-published-home-events" },
      { draft: "aplus-admin-watch-categories", published: "aplus-published-watch-categories" },
      { draft: "aplus-admin-watch-videos", published: "aplus-published-watch-videos" },
      { draft: "aplus-admin-watch-copy", published: "aplus-published-watch-copy" },
      { draft: "aplus-admin-watch-schedule", published: "aplus-published-watch-schedule" },
      { draft: "aplus-admin-kids-zone-content", published: "aplus-published-kids-zone-content" },
      { draft: "aplus-admin-footer-content", published: "aplus-published-footer-content" },
    ]);
    setPublished(true);
    window.setTimeout(() => setPublished(false), 2400);
  }

  return (
    <button type="button" onClick={publishAll} className="inline-flex h-11 items-center rounded-[12px] bg-[#238A55] px-5 text-[14px] font-medium text-white shadow-sm">
      {published ? "Published successfully" : "Publish all drafts"}
    </button>
  );
}
