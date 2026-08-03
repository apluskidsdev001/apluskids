"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { defaultCategories, defaultVideos, defaultWeeklySchedule, scheduleDayNames, type AdminVideo, type ScheduleDayName } from "./adminData";
import { makeAdminId, publishAdminKeys, useAdminStorage } from "./useAdminStorage";

type WatchCopy = { pageTitle: string; pageDescription: string; programsTitle: string; trailersTitle: string; categoriesTitle: string };
type EditorTab = "Videos" | "Categories" | "TV Schedule" | "Titles";

const defaultCopy: WatchCopy = {
  pageTitle: "Watch A Plus Kids TV",
  pageDescription: "Sinhala stories, learning clips, shorts and TV moments for little viewers.",
  programsTitle: "Program Listing",
  trailersTitle: "Trailers / Shorts",
  categoriesTitle: "Categories",
};

const emptyVideo: Omit<AdminVideo, "id"> = { title: "", youtubeUrl: "", type: "Program", category: "Stories", active: true };

function getVideoId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? "";
}

export default function WatchAdmin() {
  const categoriesStore = useAdminStorage("aplus-admin-watch-categories", defaultCategories);
  const videosStore = useAdminStorage("aplus-admin-watch-videos", defaultVideos);
  const copyStore = useAdminStorage("aplus-admin-watch-copy", defaultCopy);
  const scheduleStore = useAdminStorage("aplus-admin-watch-schedule", defaultWeeklySchedule);
  const [tab, setTab] = useState<EditorTab>("Videos");
  const [videoForm, setVideoForm] = useState(emptyVideo);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("✨");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"All" | AdminVideo["type"]>("All");
  const [notice, setNotice] = useState("");
  const [activeScheduleDay, setActiveScheduleDay] = useState<ScheduleDayName>("Monday");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [copyTarget, setCopyTarget] = useState<ScheduleDayName>("Tuesday");

  const filteredVideos = useMemo(
    () => videosStore.value.filter((video) => filterType === "All" || video.type === filterType),
    [filterType, videosStore.value],
  );

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function saveVideo() {
    if (!videoForm.title.trim() || !getVideoId(videoForm.youtubeUrl)) {
      notify("Add a title and a valid YouTube URL.");
      return;
    }

    if (editingVideoId) {
      videosStore.setValue((items) => items.map((item) => item.id === editingVideoId ? { ...item, ...videoForm } : item));
      notify("Video updated.");
    } else {
      videosStore.setValue((items) => [{ ...videoForm, id: makeAdminId("video") }, ...items]);
      notify("Video added to the admin playlist.");
    }
    setVideoForm(emptyVideo);
    setEditingVideoId(null);
  }

  function editVideo(video: AdminVideo) {
    setEditingVideoId(video.id);
    setVideoForm({ title: video.title, youtubeUrl: video.youtubeUrl, type: video.type, category: video.category, active: video.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveCategory() {
    if (!categoryName.trim()) return;
    if (editingCategoryId) {
      const oldName = categoriesStore.value.find((item) => item.id === editingCategoryId)?.name;
      categoriesStore.setValue((items) => items.map((item) => item.id === editingCategoryId ? { ...item, name: categoryName.trim(), icon: categoryIcon } : item));
      if (oldName) videosStore.setValue((items) => items.map((item) => item.category === oldName ? { ...item, category: categoryName.trim() } : item));
      notify("Category updated.");
    } else {
      categoriesStore.setValue((items) => [...items, { id: makeAdminId("category"), name: categoryName.trim(), icon: categoryIcon, active: true }]);
      notify("Category added.");
    }
    setCategoryName("");
    setCategoryIcon("✨");
    setEditingCategoryId(null);
  }

  function saveScheduleEntry() {
    if (!scheduleTime.trim() || !scheduleTitle.trim()) {
      notify("Add both time and program title.");
      return;
    }
    scheduleStore.setValue((week) => ({
      ...week,
      [activeScheduleDay]: editingScheduleId
        ? week[activeScheduleDay].map((entry) => entry.id === editingScheduleId ? { ...entry, time: scheduleTime.trim(), title: scheduleTitle.trim() } : entry)
        : [...week[activeScheduleDay], { id: makeAdminId("slot"), time: scheduleTime.trim(), title: scheduleTitle.trim() }],
    }));
    notify(editingScheduleId ? "Schedule entry updated." : "Schedule entry added.");
    setScheduleTime("");
    setScheduleTitle("");
    setEditingScheduleId(null);
  }

  function moveScheduleEntry(index: number, direction: -1 | 1) {
    scheduleStore.setValue((week) => {
      const rows = [...week[activeScheduleDay]];
      const target = index + direction;
      if (target < 0 || target >= rows.length) return week;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...week, [activeScheduleDay]: rows };
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2488F4]">Page manager</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] tablet:text-[38px]">Watch Page</h1>
          <p className="mt-2 text-[14px] font-normal text-[#6E7C91]">Add, edit, remove and organise Watch page content drafts.</p>
        </div>
        <div className="flex gap-2">
          <a href="/watch?adminPreview=1" target="_blank" className="inline-flex h-11 items-center rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[13px] font-medium">Preview draft ↗</a>
          <button type="button" onClick={() => notify("Draft saved locally. Public website was not changed.")} className="h-11 rounded-[12px] bg-[#2488F4] px-5 text-[13px] font-medium text-white">Save draft</button>
          <button type="button" onClick={() => { publishAdminKeys([{ draft: "aplus-admin-watch-categories", published: "aplus-published-watch-categories" }, { draft: "aplus-admin-watch-videos", published: "aplus-published-watch-videos" }, { draft: "aplus-admin-watch-copy", published: "aplus-published-watch-copy" }, { draft: "aplus-admin-watch-schedule", published: "aplus-published-watch-schedule" }]); notify("Watch page published in this browser."); }} className="h-11 rounded-[12px] bg-[#238A55] px-5 text-[13px] font-medium text-white">Publish</button>
        </div>
      </div>

      {notice ? <div role="status" className="fixed right-5 top-20 z-[100] rounded-[12px] bg-[#17243D] px-4 py-3 text-[13px] font-medium text-white shadow-xl">{notice}</div> : null}

      <div className="mt-7 flex gap-2 overflow-x-auto border-b border-[#DCE4ED]">
        {(["Videos", "Categories", "TV Schedule", "Titles"] as EditorTab[]).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-5 py-3 text-[14px] font-medium ${tab === item ? "border-[#2488F4] text-[#0877EF]" : "border-transparent text-[#718096]"}`}>{item}</button>
        ))}
      </div>

      {tab === "Videos" ? (
        <section className="mt-6 grid gap-6 desktop:grid-cols-[360px_1fr]">
          <div className="h-fit rounded-[20px] border border-[#E0E7EF] bg-white p-5 shadow-sm">
            <h2 className="text-[18px] font-semibold">{editingVideoId ? "Edit video" : "Add video"}</h2>
            <div className="mt-5 space-y-4">
              <label className="block text-[12px] font-medium text-[#59687E]">Video title<input value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal outline-none focus:border-[#2488F4]" placeholder="Enter a clear title" /></label>
              <label className="block text-[12px] font-medium text-[#59687E]">YouTube URL<input value={videoForm.youtubeUrl} onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal outline-none focus:border-[#2488F4]" placeholder="https://youtube.com/watch?v=..." /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[12px] font-medium text-[#59687E]">Type<select value={videoForm.type} onChange={(e) => setVideoForm({ ...videoForm, type: e.target.value as AdminVideo["type"] })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] bg-white px-3 text-[13px] font-normal"><option>Program</option><option>Trailer</option><option>Short</option></select></label>
                <label className="block text-[12px] font-medium text-[#59687E]">Category<select value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] bg-white px-3 text-[13px] font-normal">{categoriesStore.value.map((category) => <option key={category.id}>{category.name}</option>)}</select></label>
              </div>
              <label className="flex items-center gap-3 text-[13px] font-normal text-[#526178]"><input type="checkbox" checked={videoForm.active} onChange={(e) => setVideoForm({ ...videoForm, active: e.target.checked })} className="h-4 w-4" />Active in playlist</label>
              {getVideoId(videoForm.youtubeUrl) ? <div className="relative aspect-video overflow-hidden rounded-[13px] bg-[#EAF0F6]"><Image src={`https://i.ytimg.com/vi/${getVideoId(videoForm.youtubeUrl)}/hqdefault.jpg`} alt="Video thumbnail preview" fill className="object-cover" /></div> : null}
              <div className="flex gap-2"><button type="button" onClick={saveVideo} className="h-11 flex-1 rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white">{editingVideoId ? "Update video" : "Add video"}</button>{editingVideoId ? <button type="button" onClick={() => { setEditingVideoId(null); setVideoForm(emptyVideo); }} className="h-11 rounded-[11px] border border-[#D8E2EC] px-4 text-[13px] font-medium">Cancel</button> : null}</div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[18px] font-semibold">Playlist <span className="font-normal text-[#8793A5]">({filteredVideos.length})</span></h2><div className="flex gap-1.5">{(["All", "Program", "Trailer", "Short"] as const).map((type) => <button key={type} type="button" onClick={() => setFilterType(type)} className={`rounded-full px-3 py-2 text-[12px] font-medium ${filterType === type ? "bg-[#2488F4] text-white" : "bg-white text-[#66758B]"}`}>{type}</button>)}</div></div>
            <div className="mt-4 grid gap-4 tablet:grid-cols-2 monitor:grid-cols-3">
              {filteredVideos.map((video) => {
                const videoId = getVideoId(video.youtubeUrl);
                return <article key={video.id} className="overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white shadow-sm"><div className="relative aspect-video bg-[#EAF0F6]">{videoId ? <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" fill className="object-cover" /> : null}<span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-[#0877EF]">{video.type}</span></div><div className="p-4"><h3 className="line-clamp-2 min-h-[42px] text-[15px] font-semibold leading-5">{video.title}</h3><div className="mt-3 flex items-center justify-between gap-2"><span className="rounded-full bg-[#F0F4F8] px-2.5 py-1 text-[10px] font-medium text-[#627087]">{video.category}</span><span className={`text-[10px] font-medium ${video.active ? "text-[#238A55]" : "text-[#A16A00]"}`}>{video.active ? "Active" : "Hidden"}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => editVideo(video)} className="h-9 rounded-[9px] bg-[#EDF5FF] text-[12px] font-medium text-[#0877EF]">Edit</button><button type="button" onClick={() => videosStore.setValue((items) => items.map((item) => item.id === video.id ? { ...item, active: !item.active } : item))} className="h-9 rounded-[9px] bg-[#F3F5F8] text-[12px] font-medium">{video.active ? "Hide" : "Show"}</button><button type="button" onClick={() => { if (window.confirm(`Remove ${video.title}?`)) videosStore.setValue((items) => items.filter((item) => item.id !== video.id)); }} className="h-9 rounded-[9px] bg-[#FFF0F0] text-[12px] font-medium text-[#D84444]">Remove</button></div></div></article>;
              })}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "Categories" ? (
        <section className="mt-6 grid gap-6 desktop:grid-cols-[340px_1fr]">
          <div className="h-fit rounded-[20px] border border-[#E0E7EF] bg-white p-5"><h2 className="text-[18px] font-semibold">{editingCategoryId ? "Edit category" : "Add category"}</h2><label className="mt-5 block text-[12px] font-medium text-[#59687E]">Category name<input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" /></label><label className="mt-4 block text-[12px] font-medium text-[#59687E]">Icon or emoji<input value={categoryIcon} onChange={(e) => setCategoryIcon(e.target.value)} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[18px] font-normal" /></label><button type="button" onClick={saveCategory} className="mt-5 h-11 w-full rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white">{editingCategoryId ? "Update category" : "Add category"}</button></div>
          <div className="grid gap-3 tablet:grid-cols-2 monitor:grid-cols-3">{categoriesStore.value.map((category) => <article key={category.id} className="rounded-[17px] border border-[#E0E7EF] bg-white p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#F0F6FC] text-[22px]">{category.icon}</span><div className="min-w-0"><h3 className="truncate text-[15px] font-semibold">{category.name}</h3><p className="text-[11px] font-normal text-[#8793A5]">{videosStore.value.filter((video) => video.category === category.name).length} videos</p></div></div><div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => { setEditingCategoryId(category.id); setCategoryName(category.name); setCategoryIcon(category.icon); }} className="h-9 rounded-[9px] bg-[#EDF5FF] text-[12px] font-medium text-[#0877EF]">Edit</button><button type="button" onClick={() => categoriesStore.setValue((items) => items.map((item) => item.id === category.id ? { ...item, active: !item.active } : item))} className="h-9 rounded-[9px] bg-[#F3F5F8] text-[12px] font-medium">{category.active ? "Hide" : "Show"}</button><button type="button" onClick={() => { if (window.confirm(`Remove ${category.name}?`)) categoriesStore.setValue((items) => items.filter((item) => item.id !== category.id)); }} className="h-9 rounded-[9px] bg-[#FFF0F0] text-[12px] font-medium text-[#D84444]">Remove</button></div></article>)}</div>
        </section>
      ) : null}

      {tab === "TV Schedule" ? (
        <section className="mt-6">
          <div className="flex gap-1.5 overflow-x-auto border-b border-[#DCE4ED] pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {scheduleDayNames.map((day) => (
              <button key={day} type="button" onClick={() => { setActiveScheduleDay(day); setCopyTarget(scheduleDayNames.find((item) => item !== day) ?? "Monday"); setEditingScheduleId(null); setScheduleTime(""); setScheduleTitle(""); }} className={`shrink-0 rounded-t-[12px] border border-b-0 px-4 py-3 text-[13px] font-medium ${activeScheduleDay === day ? "border-[#2488F4] bg-[#2488F4] text-white" : "border-[#DCE4ED] bg-white text-[#68778D]"}`}>{day}</button>
            ))}
          </div>

          <div className="mt-5 grid gap-6 desktop:grid-cols-[350px_1fr]">
            <div className="h-fit space-y-5">
              <div className="rounded-[20px] border border-[#E0E7EF] bg-white p-5 shadow-sm">
                <h2 className="text-[18px] font-semibold">{editingScheduleId ? "Edit program slot" : "Add program slot"}</h2>
                <p className="mt-1 text-[12px] font-normal text-[#8490A2]">Editing {activeScheduleDay}</p>
                <label className="mt-5 block text-[12px] font-medium text-[#59687E]">Time<input value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" placeholder="06.00" /></label>
                <label className="mt-4 block text-[12px] font-medium text-[#59687E]">Program title<input value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" placeholder="Program name" /></label>
                <div className="mt-5 flex gap-2"><button type="button" onClick={saveScheduleEntry} className="h-11 flex-1 rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white">{editingScheduleId ? "Update slot" : "Add slot"}</button>{editingScheduleId ? <button type="button" onClick={() => { setEditingScheduleId(null); setScheduleTime(""); setScheduleTitle(""); }} className="h-11 rounded-[11px] border border-[#D8E2EC] px-4 text-[13px] font-medium">Cancel</button> : null}</div>
              </div>

              <div className="rounded-[20px] border border-[#E0E7EF] bg-white p-5 shadow-sm">
                <h2 className="text-[16px] font-semibold">Copy day schedule</h2>
                <p className="mt-1 text-[12px] font-normal leading-5 text-[#8490A2]">Replace another day with the current {activeScheduleDay} schedule.</p>
                <select value={copyTarget} onChange={(e) => setCopyTarget(e.target.value as ScheduleDayName)} className="mt-4 h-11 w-full rounded-[11px] border border-[#D8E2EC] bg-white px-3 text-[13px] font-normal">{scheduleDayNames.filter((day) => day !== activeScheduleDay).map((day) => <option key={day}>{day}</option>)}</select>
                <button type="button" onClick={() => { scheduleStore.setValue((week) => ({ ...week, [copyTarget]: week[activeScheduleDay].map((entry) => ({ ...entry, id: makeAdminId("slot") })) })); notify(`${activeScheduleDay} copied to ${copyTarget}.`); }} className="mt-3 h-10 w-full rounded-[10px] bg-[#EEF5FC] text-[12px] font-medium text-[#0877EF]">Copy to {copyTarget}</button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-[18px] font-semibold">{activeScheduleDay} schedule</h2><p className="mt-1 text-[12px] font-normal text-[#8490A2]">{scheduleStore.value[activeScheduleDay].length} program slots · displayed in this order</p></div><button type="button" onClick={() => { if (window.confirm(`Reset ${activeScheduleDay} schedule?`)) scheduleStore.setValue((week) => ({ ...week, [activeScheduleDay]: defaultWeeklySchedule[activeScheduleDay] })); }} className="text-[12px] font-medium text-[#D45B5B]">Reset day</button></div>
              <div className="mt-4 overflow-hidden rounded-[18px] border border-[#E0E7EF] bg-white shadow-sm">
                {scheduleStore.value[activeScheduleDay].map((entry, index) => (
                  <div key={entry.id} className={`grid grid-cols-[70px_1fr_auto] items-center gap-3 px-4 py-3 tablet:grid-cols-[100px_1fr_auto] tablet:px-5 ${index < scheduleStore.value[activeScheduleDay].length - 1 ? "border-b border-[#E7EDF3]" : ""}`}>
                    <span className="text-[13px] font-semibold text-[#0877EF]">{entry.time}</span>
                    <span className="min-w-0 truncate text-[14px] font-normal text-[#263852]">{entry.title}</span>
                    <div className="flex gap-1"><button type="button" onClick={() => moveScheduleEntry(index, -1)} disabled={index === 0} aria-label="Move up" className="grid h-8 w-8 place-items-center rounded-[8px] bg-[#F1F4F7] text-[12px] disabled:opacity-30">↑</button><button type="button" onClick={() => moveScheduleEntry(index, 1)} disabled={index === scheduleStore.value[activeScheduleDay].length - 1} aria-label="Move down" className="grid h-8 w-8 place-items-center rounded-[8px] bg-[#F1F4F7] text-[12px] disabled:opacity-30">↓</button><button type="button" onClick={() => { setEditingScheduleId(entry.id); setScheduleTime(entry.time); setScheduleTitle(entry.title); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-8 rounded-[8px] bg-[#EDF5FF] px-2.5 text-[11px] font-medium text-[#0877EF]">Edit</button><button type="button" onClick={() => { if (window.confirm(`Remove ${entry.title}?`)) scheduleStore.setValue((week) => ({ ...week, [activeScheduleDay]: week[activeScheduleDay].filter((item) => item.id !== entry.id) })); }} className="h-8 rounded-[8px] bg-[#FFF0F0] px-2.5 text-[11px] font-medium text-[#D84444]">Remove</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "Titles" ? (
        <section className="mt-6 max-w-3xl rounded-[20px] border border-[#E0E7EF] bg-white p-5 tablet:p-6"><h2 className="text-[18px] font-semibold">Watch page titles</h2><p className="mt-1 text-[13px] font-normal text-[#7A879A]">Edit important headings and introduction text without changing the public page yet.</p><div className="mt-6 grid gap-4 tablet:grid-cols-2">{(["pageTitle", "programsTitle", "trailersTitle", "categoriesTitle"] as const).map((field) => <label key={field} className="block text-[12px] font-medium capitalize text-[#59687E]">{field.replace(/([A-Z])/g, " $1")}<input value={copyStore.value[field]} onChange={(e) => copyStore.setValue({ ...copyStore.value, [field]: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" /></label>)}<label className="block text-[12px] font-medium text-[#59687E] tablet:col-span-2">Page description<textarea value={copyStore.value.pageDescription} onChange={(e) => copyStore.setValue({ ...copyStore.value, pageDescription: e.target.value })} rows={4} className="mt-1.5 w-full rounded-[11px] border border-[#D8E2EC] p-3 text-[14px] font-normal" /></label></div><button type="button" onClick={() => notify("Watch page title draft updated.")} className="mt-5 h-11 rounded-[11px] bg-[#2488F4] px-5 text-[13px] font-medium text-white">Update title draft</button></section>
      ) : null}
    </>
  );
}
