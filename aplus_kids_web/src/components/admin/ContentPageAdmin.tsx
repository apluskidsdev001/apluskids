"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentItem } from "./adminData";
import { makeAdminId, publishAdminKeys, useAdminStorage } from "./useAdminStorage";

const emptyItem: Omit<ContentItem, "id"> = {
  section: "",
  title: "",
  description: "",
  linkLabel: "",
  linkUrl: "",
  active: true,
};

export default function ContentPageAdmin({
  pageName,
  description,
  storageKey,
  defaultItems,
  previewUrl,
  publishedKey,
}: {
  pageName: string;
  description: string;
  storageKey: string;
  defaultItems: ContentItem[];
  previewUrl: string;
  publishedKey: string;
}) {
  const store = useAdminStorage(storageKey, defaultItems);
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [undoState, setUndoState] = useState<ContentItem[] | null>(null);
  const previousStateRef = useRef<ContentItem[] | null>(null);
  const sessionStateRef = useRef<ContentItem[] | null>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    if (previousStateRef.current && isEditing && !restoringRef.current) setUndoState(previousStateRef.current);
    previousStateRef.current = store.value;
  }, [isEditing, store.value]);

  function applyEditorState(state: ContentItem[]) {
    restoringRef.current = true;
    previousStateRef.current = state;
    store.setValue(state);
    window.setTimeout(() => { restoringRef.current = false; }, 0);
  }

  function beginEditing() {
    restoringRef.current = true;
    sessionStateRef.current = store.value;
    previousStateRef.current = store.value;
    setUndoState(null);
    setIsEditing(true);
    window.setTimeout(() => { restoringRef.current = false; }, 0);
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function publishPage() {
    publishAdminKeys([{ draft: storageKey, published: publishedKey }]);
    setUndoState(null);
    setIsEditing(false);
    notify(`${pageName} published. Returning to view mode.`);
    window.setTimeout(() => window.location.reload(), 450);
  }

  function saveItem() {
    if (!form.section.trim() || !form.title.trim()) {
      notify("Section and title are required.");
      return;
    }

    if (editingId) {
      store.setValue((items) => items.map((item) => item.id === editingId ? { ...item, ...form } : item));
      notify("Content updated.");
    } else {
      store.setValue((items) => [...items, { ...form, id: makeAdminId("content") }]);
      notify("New content block added.");
    }
    setEditingId(null);
    setForm(emptyItem);
  }

  function editItem(item: ContentItem) {
    setEditingId(item.id);
    setForm({ section: item.section, title: item.title, description: item.description, linkLabel: item.linkLabel, linkUrl: item.linkUrl, active: item.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2488F4]">Page manager</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] tablet:text-[38px]">{pageName}</h1>
          <p className="mt-2 max-w-2xl text-[14px] font-normal leading-6 text-[#6E7C91]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${previewUrl}${previewUrl.includes("?") ? "&" : "?"}adminPreview=1`} target="_blank" className="inline-flex h-11 items-center rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[13px] font-medium">Preview draft ↗</a>
          {!isEditing ? <button type="button" onClick={beginEditing} className="h-11 rounded-[12px] bg-[#2488F4] px-5 text-[13px] font-medium text-white">Edit Page</button> : <><button type="button" disabled={!undoState} onClick={() => { if (undoState) { applyEditorState(undoState); setUndoState(null); notify("Last change undone."); } }} className="h-11 rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[13px] font-medium disabled:opacity-40">Undo</button><button type="button" onClick={() => { if (sessionStateRef.current) applyEditorState(sessionStateRef.current); setUndoState(null); setIsEditing(false); notify("Editing cancelled."); }} className="h-11 rounded-[12px] border border-[#E4C9C9] bg-white px-5 text-[13px] font-medium text-[#B34242]">Cancel Editing</button><button type="button" onClick={() => { setUndoState(null); setIsEditing(false); notify("Draft saved locally. Public website was not changed."); }} className="h-11 rounded-[12px] bg-[#2488F4] px-5 text-[13px] font-medium text-white">Save Draft</button></>}
          <button type="button" onClick={publishPage} className="h-11 rounded-[12px] bg-[#238A55] px-5 text-[13px] font-medium text-white">Publish</button>
        </div>
      </div>

      {notice ? <div role="status" className="fixed right-5 top-20 z-[100] rounded-[12px] bg-[#17243D] px-4 py-3 text-[13px] font-medium text-white shadow-xl">{notice}</div> : null}

      {!isEditing ? <div className="mt-6 rounded-[14px] border border-[#D8E8F7] bg-[#EDF6FF] px-4 py-3 text-[13px] text-[#55708F]">View mode is active. Click <strong>Edit Page</strong> to unlock content controls.</div> : null}

      <fieldset disabled={!isEditing} className={!isEditing ? "opacity-75" : ""}>
      <section className="mt-7 grid gap-6 desktop:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-[20px] border border-[#E0E7EF] bg-white p-5 shadow-sm">
          <h2 className="text-[18px] font-semibold">{editingId ? "Edit content" : "Add content"}</h2>
          <p className="mt-1 text-[12px] font-normal text-[#8490A2]">Titles and links are saved as admin drafts.</p>
          <div className="mt-5 space-y-4">
            <label className="block text-[12px] font-medium text-[#59687E]">Section<input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" placeholder="Hero, Contact, Events..." /></label>
            <label className="block text-[12px] font-medium text-[#59687E]">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[14px] font-normal" placeholder="Visible title" /></label>
            <label className="block text-[12px] font-medium text-[#59687E]">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-1.5 w-full rounded-[11px] border border-[#D8E2EC] p-3 text-[14px] font-normal" placeholder="Short, useful description" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-medium text-[#59687E]">Button label<input value={form.linkLabel} onChange={(e) => setForm({ ...form, linkLabel: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[13px] font-normal" /></label>
              <label className="block text-[12px] font-medium text-[#59687E]">Button URL<input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] px-3 text-[13px] font-normal" /></label>
            </div>
            <label className="flex items-center gap-3 text-[13px] font-normal text-[#526178]"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />Active content block</label>
            <div className="flex gap-2"><button type="button" onClick={saveItem} className="h-11 flex-1 rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white">{editingId ? "Update content" : "Add content"}</button>{editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyItem); }} className="h-11 rounded-[11px] border border-[#D8E2EC] px-4 text-[13px] font-medium">Cancel</button> : null}</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3"><h2 className="text-[18px] font-semibold">Content blocks <span className="font-normal text-[#8793A5]">({store.value.length})</span></h2><button type="button" onClick={() => { if (window.confirm("Reset all admin drafts for this page?")) store.reset(); }} className="text-[12px] font-medium text-[#D45B5B]">Reset drafts</button></div>
          <div className="mt-4 space-y-3">
            {store.value.map((item) => (
              <article key={item.id} className="rounded-[18px] border border-[#E0E7EF] bg-white p-4 shadow-sm tablet:p-5">
                <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#EDF5FF] px-2.5 py-1 text-[10px] font-medium text-[#0877EF]">{item.section}</span><span className={`text-[10px] font-medium ${item.active ? "text-[#238A55]" : "text-[#A16A00]"}`}>{item.active ? "Active" : "Hidden"}</span></div>
                    <h3 className="mt-3 text-[17px] font-semibold text-[#17243D]">{item.title}</h3>
                    <p className="mt-1.5 max-w-3xl text-[13px] font-normal leading-6 text-[#6D7A8E]">{item.description || "No description"}</p>
                    {item.linkLabel || item.linkUrl ? <p className="mt-2 truncate text-[11px] font-normal text-[#8793A5]">{item.linkLabel || "Link"}: {item.linkUrl || "No URL"}</p> : null}
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-2 tablet:w-[230px]"><button type="button" onClick={() => editItem(item)} className="h-9 rounded-[9px] bg-[#EDF5FF] text-[12px] font-medium text-[#0877EF]">Edit</button><button type="button" onClick={() => store.setValue((items) => items.map((entry) => entry.id === item.id ? { ...entry, active: !entry.active } : entry))} className="h-9 rounded-[9px] bg-[#F3F5F8] text-[12px] font-medium">{item.active ? "Hide" : "Show"}</button><button type="button" onClick={() => { if (window.confirm(`Remove ${item.title}?`)) store.setValue((items) => items.filter((entry) => entry.id !== item.id)); }} className="h-9 rounded-[9px] bg-[#FFF0F0] text-[12px] font-medium text-[#D84444]">Remove</button></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      </fieldset>
    </>
  );
}
