"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  defaultHomeHero,
  defaultHomeLiveCard,
  defaultHomeShortcuts,
  defaultHomeSpecialEvents,
  type HomeShortcut,
  type HomeSpecialEvent,
} from "./adminData";
import {
  makeAdminId,
  publishAdminKeys,
  useAdminStorage,
} from "./useAdminStorage";

type HomeTab =
  | "Hero"
  | "Shortcuts"
  | "Live TV"
  | "Special Events"
  | "Shared Sections";
const emptyShortcut: Omit<HomeShortcut, "id"> = {
  label: "",
  description: "",
  href: "",
  icon: "",
  active: true,
};
const emptyEvent: Omit<HomeSpecialEvent, "id"> = {
  name: "",
  date: "",
  place: "",
  youtubeUrl: "",
  description: "",
  guests: [],
  contact: "",
  active: true,
};
const inputClass =
  "mt-1.5 h-11 w-full rounded-[11px] border border-[#D8E2EC] bg-white px-3 text-[14px] font-normal outline-none focus:border-[#2488F4]";
const areaClass =
  "mt-1.5 w-full rounded-[11px] border border-[#D8E2EC] bg-white p-3 text-[14px] font-normal outline-none focus:border-[#2488F4]";

export default function HomeAdmin() {
  const heroStore = useAdminStorage("aplus-admin-home-hero", defaultHomeHero);
  const shortcutStore = useAdminStorage(
    "aplus-admin-home-shortcuts",
    defaultHomeShortcuts,
  );
  const liveStore = useAdminStorage(
    "aplus-admin-home-live",
    defaultHomeLiveCard,
  );
  const eventStore = useAdminStorage(
    "aplus-admin-home-events",
    defaultHomeSpecialEvents,
  );
  const [tab, setTab] = useState<HomeTab>("Hero");
  const [notice, setNotice] = useState("");
  const [shortcutForm, setShortcutForm] = useState(emptyShortcut);
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(
    null,
  );
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [guestText, setGuestText] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [undoState, setUndoState] = useState<HomeEditorState | null>(null);
  const previousStateRef = useRef<HomeEditorState | null>(null);
  const sessionStateRef = useRef<HomeEditorState | null>(null);
  const restoringRef = useRef(false);
  const [dragItem, setDragItem] = useState<{
    kind: "shortcut" | "event";
    id: string;
  } | null>(null);
  const [dropItemId, setDropItemId] = useState<string | null>(null);

  type HomeEditorState = {
    hero: typeof heroStore.value;
    shortcuts: typeof shortcutStore.value;
    live: typeof liveStore.value;
    events: typeof eventStore.value;
  };

  useEffect(() => {
    const current: HomeEditorState = {
      hero: heroStore.value,
      shortcuts: shortcutStore.value,
      live: liveStore.value,
      events: eventStore.value,
    };
    if (previousStateRef.current && isEditing && !restoringRef.current)
      setUndoState(previousStateRef.current);
    previousStateRef.current = current;
  }, [
    eventStore.value,
    heroStore.value,
    isEditing,
    liveStore.value,
    shortcutStore.value,
  ]);

  function applyEditorState(state: HomeEditorState) {
    restoringRef.current = true;
    previousStateRef.current = state;
    heroStore.setValue(state.hero);
    shortcutStore.setValue(state.shortcuts);
    liveStore.setValue(state.live);
    eventStore.setValue(state.events);
    window.setTimeout(() => {
      restoringRef.current = false;
    }, 0);
  }

  function beginEditing() {
    const current: HomeEditorState = {
      hero: heroStore.value,
      shortcuts: shortcutStore.value,
      live: liveStore.value,
      events: eventStore.value,
    };
    restoringRef.current = true;
    sessionStateRef.current = current;
    previousStateRef.current = current;
    setUndoState(null);
    setIsEditing(true);
    window.setTimeout(() => {
      restoringRef.current = false;
    }, 0);
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function publishHome() {
    publishAdminKeys([
      {
        draft: "aplus-admin-home-hero",
        published: "aplus-published-home-hero",
      },
      {
        draft: "aplus-admin-home-shortcuts",
        published: "aplus-published-home-shortcuts",
      },
      {
        draft: "aplus-admin-home-live",
        published: "aplus-published-home-live",
      },
      {
        draft: "aplus-admin-home-events",
        published: "aplus-published-home-events",
      },
    ]);
    setUndoState(null);
    setIsEditing(false);
    notify("Home page published. Returning to view mode.");
    window.setTimeout(() => window.location.reload(), 450);
  }

  function saveShortcut() {
    if (
      !shortcutForm.label.trim() ||
      !shortcutForm.href.trim() ||
      !shortcutForm.icon.trim()
    )
      return notify("Add a label, link and icon path.");
    shortcutStore.setValue((items) =>
      editingShortcutId
        ? items.map((item) =>
            item.id === editingShortcutId ? { ...item, ...shortcutForm } : item,
          )
        : [...items, { ...shortcutForm, id: makeAdminId("shortcut") }],
    );
    setShortcutForm(emptyShortcut);
    setEditingShortcutId(null);
    notify(editingShortcutId ? "Shortcut updated." : "Shortcut added.");
  }

  function saveEvent() {
    if (
      !eventForm.name.trim() ||
      !eventForm.date.trim() ||
      !eventForm.place.trim()
    )
      return notify("Add event name, date and place.");
    const value = {
      ...eventForm,
      guests: guestText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    eventStore.setValue((items) =>
      editingEventId
        ? items.map((item) =>
            item.id === editingEventId ? { ...item, ...value } : item,
          )
        : [...items, { ...value, id: makeAdminId("event") }],
    );
    setEventForm(emptyEvent);
    setGuestText("");
    setEditingEventId(null);
    notify(editingEventId ? "Event updated." : "Event added.");
  }

  function reorderItems<T extends { id: string }>(
    items: T[],
    sourceId: string,
    targetId: string,
  ) {
    const copy = [...items];
    const sourceIndex = copy.findIndex((item) => item.id === sourceId);
    const targetIndex = copy.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
      return items;
    const [moved] = copy.splice(sourceIndex, 1);
    copy.splice(targetIndex, 0, moved);
    return copy;
  }

  function finishDrop(kind: "shortcut" | "event", targetId: string) {
    if (!dragItem || dragItem.kind !== kind) return;
    if (kind === "shortcut")
      shortcutStore.setValue((items) =>
        reorderItems(items, dragItem.id, targetId),
      );
    else
      eventStore.setValue((items) =>
        reorderItems(items, dragItem.id, targetId),
      );
    setDragItem(null);
    setDropItemId(null);
  }

  return (
    <>
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#2488F4]">Page manager</p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.03em] tablet:text-[38px]">
            Home Page
          </h1>
          <p className="mt-2 text-[14px] text-[#6E7C91]">
            Manage Home-only content and open shared Watch content from one
            workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/?adminPreview=1"
            target="_blank"
            className="inline-flex h-11 items-center rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[13px] font-medium"
          >
            Preview draft ↗
          </a>
          {!isEditing ? (
            <button
              type="button"
              onClick={beginEditing}
              className="h-11 rounded-[12px] bg-[#2488F4] px-5 text-[13px] font-medium text-white"
            >
              Edit Page
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={!undoState}
                onClick={() => {
                  if (undoState) {
                    applyEditorState(undoState);
                    setUndoState(null);
                    notify("Last change undone.");
                  }
                }}
                className="h-11 rounded-[12px] border border-[#D7E2EE] bg-white px-5 text-[13px] font-medium disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sessionStateRef.current)
                    applyEditorState(sessionStateRef.current);
                  setUndoState(null);
                  setIsEditing(false);
                  notify("Editing cancelled.");
                }}
                className="h-11 rounded-[12px] border border-[#E4C9C9] bg-white px-5 text-[13px] font-medium text-[#B34242]"
              >
                Cancel Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setUndoState(null);
                  setIsEditing(false);
                  notify("Home page draft saved locally.");
                }}
                className="h-11 rounded-[12px] bg-[#2488F4] px-5 text-[13px] font-medium text-white"
              >
                Save Draft
              </button>
            </>
          )}
          <button
            type="button"
            onClick={publishHome}
            className="h-11 rounded-[12px] bg-[#238A55] px-5 text-[13px] font-medium text-white"
          >
            Publish
          </button>
        </div>
      </div>
      {notice ? (
        <div
          role="status"
          className="fixed right-5 top-20 z-[100] rounded-[12px] bg-[#17243D] px-4 py-3 text-[13px] font-medium text-white shadow-xl"
        >
          {notice}
        </div>
      ) : null}

      <div className="mt-7 flex gap-2 overflow-x-auto border-b border-[#DCE4ED]">
        {(
          [
            "Hero",
            "Shortcuts",
            "Live TV",
            "Special Events",
            "Shared Sections",
          ] as HomeTab[]
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`shrink-0 border-b-2 px-5 py-3 text-[14px] font-medium ${tab === item ? "border-[#2488F4] text-[#0877EF]" : "border-transparent text-[#718096]"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {!isEditing ? (
        <div className="mt-5 rounded-[14px] border border-[#D8E8F7] bg-[#EDF6FF] px-4 py-3 text-[13px] text-[#55708F]">
          View mode is active. Click <strong>Edit Page</strong> to unlock Home
          content controls.
        </div>
      ) : null}

      <fieldset
        disabled={!isEditing}
        className={!isEditing ? "opacity-75" : ""}
      >
        {tab === "Hero" ? (
          <section className="mt-6 max-w-4xl rounded-[20px] border border-[#E0E7EF] bg-white p-5 tablet:p-6">
            <h2 className="text-[18px] font-semibold">Hero content</h2>
            <div className="mt-5 grid gap-4 tablet:grid-cols-2">
              {(
                [
                  "titleLineOne",
                  "titleLineTwo",
                  "titleLineThree",
                  "videoUrl",
                  "primaryLabel",
                  "primaryUrl",
                  "secondaryLabel",
                  "secondaryUrl",
                ] as const
              ).map((field) => (
                <label
                  key={field}
                  className="text-[12px] font-medium capitalize text-[#59687E]"
                >
                  {field.replace(/([A-Z])/g, " $1")}
                  <input
                    value={heroStore.value[field]}
                    onChange={(event) =>
                      heroStore.setValue({
                        ...heroStore.value,
                        [field]: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              ))}
              <label className="text-[12px] font-medium text-[#59687E] tablet:col-span-2">
                Description
                <textarea
                  rows={4}
                  value={heroStore.value.description}
                  onChange={(event) =>
                    heroStore.setValue({
                      ...heroStore.value,
                      description: event.target.value,
                    })
                  }
                  className={areaClass}
                />
              </label>
            </div>
          </section>
        ) : null}

        {tab === "Shortcuts" ? (
          <section className="mt-6 grid gap-6 desktop:grid-cols-[340px_1fr]">
            <div className="h-fit rounded-[20px] border border-[#E0E7EF] bg-white p-5">
              <h2 className="text-[18px] font-semibold">
                {editingShortcutId ? "Edit shortcut" : "Add shortcut"}
              </h2>
              {(["label", "description", "href", "icon"] as const).map(
                (field) => (
                  <label
                    key={field}
                    className="mt-4 block text-[12px] font-medium capitalize text-[#59687E]"
                  >
                    {field}
                    <input
                      value={shortcutForm[field] ?? ""}
                      onChange={(event) =>
                        setShortcutForm({
                          ...shortcutForm,
                          [field]: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                ),
              )}
              <button
                type="button"
                onClick={saveShortcut}
                className="mt-5 h-11 w-full rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white"
              >
                {editingShortcutId ? "Update shortcut" : "Add shortcut"}
              </button>
            </div>
            <div className="grid gap-3 tablet:grid-cols-2">
              {shortcutStore.value.map((item) => (
                <article
                  key={item.id}
                  data-home-drag-id={item.id}
                  draggable={isEditing}
                  onDragStart={() => {
                    setDragItem({ kind: "shortcut", id: item.id });
                    setDropItemId(item.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropItemId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    finishDrop("shortcut", item.id);
                  }}
                  onDragEnd={() => {
                    setDragItem(null);
                    setDropItemId(null);
                  }}
                  className={`rounded-[17px] border bg-white p-4 transition-colors ${dropItemId === item.id && dragItem?.id !== item.id ? "border-[#2488F4] bg-[#EDF6FF] ring-2 ring-[#2488F4]/20" : "border-[#E0E7EF]"}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      aria-label={`Drag ${item.label}`}
                      onTouchStart={() => {
                        setDragItem({ kind: "shortcut", id: item.id });
                        setDropItemId(item.id);
                      }}
                      onTouchMove={(event) => {
                        const touch = event.touches[0];
                        const target = document
                          .elementFromPoint(touch.clientX, touch.clientY)
                          ?.closest<HTMLElement>("[data-home-drag-id]")
                          ?.dataset.homeDragId;
                        if (target) setDropItemId(target);
                      }}
                      onTouchEnd={() => {
                        if (dropItemId) finishDrop("shortcut", dropItemId);
                      }}
                      className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-[9px] bg-[#F1F5F9] text-[18px] text-[#718096]"
                    >
                      ⋮⋮
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold">
                        {item.label}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#7A879A]">
                        {item.description || "No description"}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-[#9AA5B5]">
                        {item.href} · {item.icon}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShortcutId(item.id);
                        setShortcutForm({
                          label: item.label,
                          description: item.description ?? "",
                          href: item.href,
                          icon: item.icon,
                          active: item.active,
                        });
                      }}
                      className="rounded-[8px] bg-[#EDF5FF] px-3 py-2 text-[11px] text-[#0877EF]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        shortcutStore.setValue((items) =>
                          items.map((row) =>
                            row.id === item.id
                              ? { ...row, active: !row.active }
                              : row,
                          ),
                        )
                      }
                      className="rounded-[8px] bg-[#F3F5F8] px-3 py-2 text-[11px]"
                    >
                      {item.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        shortcutStore.setValue((items) =>
                          items.filter((row) => row.id !== item.id),
                        )
                      }
                      className="rounded-[8px] bg-[#FFF0F0] px-3 py-2 text-[11px] text-[#D84444]"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "Live TV" ? (
          <section className="mt-6 max-w-4xl rounded-[20px] border border-[#E0E7EF] bg-white p-5 tablet:p-6">
            <h2 className="text-[18px] font-semibold">Home live card</h2>
            <div className="mt-5 grid gap-4 tablet:grid-cols-2">
              {(
                [
                  "title",
                  "badge",
                  "nowLabel",
                  "programName",
                  "description",
                  "buttonLabel",
                  "linkUrl",
                  "videoUrl",
                  "channelLabel",
                ] as const
              ).map((field) => (
                <label
                  key={field}
                  className="text-[12px] font-medium capitalize text-[#59687E]"
                >
                  {field.replace(/([A-Z])/g, " $1")}
                  <input
                    value={liveStore.value[field]}
                    onChange={(event) =>
                      liveStore.setValue({
                        ...liveStore.value,
                        [field]: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "Special Events" ? (
          <section className="mt-6 grid gap-6 desktop:grid-cols-[380px_1fr]">
            <div className="h-fit rounded-[20px] border border-[#E0E7EF] bg-white p-5">
              <h2 className="text-[18px] font-semibold">
                {editingEventId ? "Edit event" : "Add event"}
              </h2>
              <div className="mt-4 grid gap-4">
                {(
                  ["name", "date", "place", "youtubeUrl", "contact"] as const
                ).map((field) => (
                  <label
                    key={field}
                    className="text-[12px] font-medium capitalize text-[#59687E]"
                  >
                    {field.replace(/([A-Z])/g, " $1")}
                    <input
                      value={eventForm[field]}
                      onChange={(event) =>
                        setEventForm({
                          ...eventForm,
                          [field]: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                ))}
                <label className="text-[12px] font-medium text-[#59687E]">
                  Guests (comma separated)
                  <input
                    value={guestText}
                    onChange={(event) => setGuestText(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-[12px] font-medium text-[#59687E]">
                  Description
                  <textarea
                    rows={4}
                    value={eventForm.description}
                    onChange={(event) =>
                      setEventForm({
                        ...eventForm,
                        description: event.target.value,
                      })
                    }
                    className={areaClass}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveEvent}
                className="mt-5 h-11 w-full rounded-[11px] bg-[#2488F4] text-[13px] font-medium text-white"
              >
                {editingEventId ? "Update event" : "Add event"}
              </button>
            </div>
            <div className="grid gap-3 tablet:grid-cols-2">
              {eventStore.value.map((item) => (
                <article
                  key={item.id}
                  data-home-drag-id={item.id}
                  draggable={isEditing}
                  onDragStart={() => {
                    setDragItem({ kind: "event", id: item.id });
                    setDropItemId(item.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropItemId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    finishDrop("event", item.id);
                  }}
                  onDragEnd={() => {
                    setDragItem(null);
                    setDropItemId(null);
                  }}
                  className={`rounded-[17px] border bg-white p-4 transition-colors ${dropItemId === item.id && dragItem?.id !== item.id ? "border-[#2488F4] bg-[#EDF6FF] ring-2 ring-[#2488F4]/20" : "border-[#E0E7EF]"}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      aria-label={`Drag ${item.name}`}
                      onTouchStart={() => {
                        setDragItem({ kind: "event", id: item.id });
                        setDropItemId(item.id);
                      }}
                      onTouchMove={(event) => {
                        const touch = event.touches[0];
                        const target = document
                          .elementFromPoint(touch.clientX, touch.clientY)
                          ?.closest<HTMLElement>("[data-home-drag-id]")
                          ?.dataset.homeDragId;
                        if (target) setDropItemId(target);
                      }}
                      onTouchEnd={() => {
                        if (dropItemId) finishDrop("event", dropItemId);
                      }}
                      className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-[9px] bg-[#F1F5F9] text-[18px] text-[#718096]"
                    >
                      ⋮⋮
                    </button>
                    <div>
                      <h3 className="text-[15px] font-semibold">{item.name}</h3>
                      <p className="mt-1 text-[11px] text-[#7A879A]">
                        {item.date} · {item.place}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(item.id);
                        setEventForm({
                          name: item.name,
                          date: item.date,
                          place: item.place,
                          youtubeUrl: item.youtubeUrl,
                          description: item.description,
                          guests: item.guests,
                          contact: item.contact,
                          active: item.active,
                        });
                        setGuestText(item.guests.join(", "));
                      }}
                      className="rounded-[8px] bg-[#EDF5FF] px-3 py-2 text-[11px] text-[#0877EF]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        eventStore.setValue((items) =>
                          items.map((row) =>
                            row.id === item.id
                              ? { ...row, active: !row.active }
                              : row,
                          ),
                        )
                      }
                      className="rounded-[8px] bg-[#F3F5F8] px-3 py-2 text-[11px]"
                    >
                      {item.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        eventStore.setValue((items) =>
                          items.filter((row) => row.id !== item.id),
                        )
                      }
                      className="rounded-[8px] bg-[#FFF0F0] px-3 py-2 text-[11px] text-[#D84444]"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "Shared Sections" ? (
          <section className="mt-6 grid gap-5 tablet:grid-cols-2">
            <article className="rounded-[20px] border border-[#D8E8F7] bg-[#EDF6FF] p-6">
              <h2 className="text-[19px] font-semibold text-[#173A68]">
                Home Trailers
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[#55708F]">
                Home trailers use active Trailer and Short items published from
                Watch Admin.
              </p>
              <Link
                href="/admin/watch"
                className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-[#2488F4] px-4 text-[13px] font-medium text-white"
              >
                Manage Watch videos
              </Link>
            </article>
            <article className="rounded-[20px] border border-[#E6DCF8] bg-[#F7F1FF] p-6">
              <h2 className="text-[19px] font-semibold text-[#503078]">
                Home TV Schedule
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[#725C8E]">
                Home schedule uses today&apos;s published Watch timetable and
                automatically selects the current program.
              </p>
              <Link
                href="/admin/watch"
                className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-[#8B5CF6] px-4 text-[13px] font-medium text-white"
              >
                Manage TV schedule
              </Link>
            </article>
          </section>
        ) : null}
      </fieldset>
    </>
  );
}
