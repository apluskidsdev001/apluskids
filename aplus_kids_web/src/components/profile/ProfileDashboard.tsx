"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { sitePath } from "@/utils/sitePath";
import { apiFetch, logout, reauthenticate } from "@/utils/auth";

type ChildProfile = {
  publicId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "GIRL" | "BOY" | "PREFER_NOT_TO_SAY";
  countryCode: string;
  province: string;
  hometown: string;
  address: string | null;
};

type AccountProfile = {
  publicId: string;
  accountHolderName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  children: ChildProfile[];
};

type Section =
  | "Dashboard"
  | "Edit Profile"
  | "Notifications"
  | "Settings";

const menuItems: { label: Section; icon: string }[] = [
  { label: "Dashboard", icon: "/icons/profile-menu/dashboard.png" },
  { label: "Edit Profile", icon: "/icons/profile-menu/edit-profile.png" },
  { label: "Notifications", icon: "/icons/profile-menu/notifications.png" },
  { label: "Settings", icon: "/icons/profile-menu/settings.png" },
];

const dashboardSections = [
  { title: "Upcoming events", description: "Upcoming A Plus Kids events will appear here.", icon: "📅" },
  { title: "Videos and links", description: "Recommended videos and useful links will appear here.", icon: "▶" },
];

type ChampUpdate = { id: string; childId?: string; childName: string; trackingCode: string; reviewStatus: string; telecastStatus: string; telecastDate?: string; rejectionReason?: string };
type ClaimableHistory = { id: string; parentName: string; maskedPhone: string; submissionCount: number; firstSubmittedAt: string; lastSubmittedAt: string };

function Dashboard({ child }: { child: ChildProfile }) {
  const [champUpdates, setChampUpdates] = useState<ChampUpdate[]>([]);
  const [claimable, setClaimable] = useState<ClaimableHistory[]>([]);
  const [claiming, setClaiming] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  useEffect(() => {
    apiFetch("/api/v1/kids-champ/my-submissions").then(async (response) => {
      if (response.ok) {
        const items = await response.json() as ChampUpdate[];
        setChampUpdates(items.filter((item) => item.childId === child.publicId));
      }
    }).catch(() => undefined);
    apiFetch("/api/v1/kids-champ/claimable-history").then(async (response) => {
      if (response.ok) setClaimable(await response.json());
    }).catch(() => undefined);
  }, [child.publicId]);

  async function claimHistory(history: ClaimableHistory) {
    setClaiming(history.id);
    setClaimMessage("");
    const response = await apiFetch("/api/v1/kids-champ/claim-history", {
      method: "POST",
      body: JSON.stringify({ guestId: history.id, childId: child.publicId }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      const claimed = body as ChampUpdate[];
      setChampUpdates((current) => [...claimed, ...current]);
      setClaimable((current) => current.filter((item) => item.id !== history.id));
      setClaimMessage(`${claimed.length} previous submission${claimed.length === 1 ? "" : "s"} added to ${child.fullName}.`);
    } else {
      setClaimMessage(body?.message || "The previous submission history could not be claimed.");
    }
    setClaiming("");
  }
  return (
    <>
      <section className="relative isolate grid overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_14px_42px_rgba(55,71,120,0.08)] tablet:min-h-[190px] tablet:grid-cols-[1.08fr_0.92fr] desktop:min-h-[200px] monitor:min-h-[220px]">
        <div className="relative z-10 flex min-h-[178px] flex-col justify-center bg-[linear-gradient(112deg,#f0f4ff_0%,#f7f9ff_72%,#ffffff_100%)] px-5 py-7 tablet:min-h-0 tablet:px-7 desktop:px-9 monitor:px-11">
          <span className="mb-3 w-fit rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#7047e8] shadow-sm">
            My dashboard
          </span>
          <p className="text-[clamp(1.75rem,3.2vw,2.8rem)] font-semibold leading-tight tracking-[-0.025em] text-slate-950">
            Hello {child.fullName}! <span aria-hidden="true">👋</span>
          </p>
          <p className="mt-3 max-w-[430px] text-sm leading-6 text-slate-500 tablet:text-base tablet:leading-7">
            This dashboard belongs to {child.fullName}. New updates will appear here when available.
          </p>
        </div>

        <div className="relative min-h-[165px] overflow-hidden bg-white px-3 tablet:min-h-full tablet:px-0">
          <div className="pointer-events-none absolute -left-10 top-0 z-10 hidden h-full w-24 bg-gradient-to-r from-white/0 to-white tablet:block" />
          <div className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full bg-[#e6f3ff]/70 blur-3xl tablet:size-56" />
          <Image
            src={sitePath("/images/profile/Hero.png")}
            alt="Colourful toys, a teddy bear and a friendly dinosaur"
            width={407}
            height={150}
            priority
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 48vw, 620px"
            className="relative z-0 h-full w-full object-contain object-center tablet:absolute tablet:bottom-0 tablet:right-2 tablet:object-right-center desktop:right-5 monitor:right-8"
          />
        </div>
      </section>

      <section className="profile-panel mt-5">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-xl" aria-hidden="true">🏆</span><div><h2 className="text-lg font-semibold text-[#142b53]">Kids Champ</h2><p className="text-xs text-slate-500">Submission and telecast updates</p></div></div>
        <div className="mt-4 grid gap-3 tablet:grid-cols-2">
          {champUpdates.length ? champUpdates.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex justify-between gap-3"><p className="text-sm font-semibold text-slate-800">{item.childName}</p><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{item.reviewStatus.replaceAll("_", " ")}</span></div>
            <p className="mt-2 text-xs text-slate-500">{item.trackingCode}</p><p className="mt-2 text-xs font-medium text-slate-700">{item.telecastDate ? `Telecast: ${item.telecastDate}` : item.telecastStatus.replaceAll("_", " ")}</p>
            {item.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{item.rejectionReason}</p>}
          </article>) : <div className="tablet:col-span-2 grid min-h-24 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center"><p className="text-sm text-slate-500">No Kids Champ updates yet.</p></div>}
        </div>
        {claimable.length ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <h3 className="text-sm font-semibold text-amber-950">Previous guest submissions found</h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">These records match your verified account. Claim them only if they belong to {child.fullName}.</p>
          <div className="mt-3 space-y-2">{claimable.map((history) => <div key={history.id} className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white p-3 tablet:flex-row tablet:items-center">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{history.submissionCount} submission{history.submissionCount === 1 ? "" : "s"} from {history.parentName}</p><p className="mt-1 text-xs text-slate-500">Contact {history.maskedPhone} · last submitted {new Date(history.lastSubmittedAt).toLocaleDateString()}</p></div>
            <button disabled={Boolean(claiming)} type="button" onClick={() => void claimHistory(history)} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{claiming === history.id ? "Claiming…" : `Add to ${child.fullName}`}</button>
          </div>)}</div>
        </div> : null}
        {claimMessage ? <p role="status" className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{claimMessage}</p> : null}
      </section>

      <section className="mt-5 grid gap-4 tablet:grid-cols-2">
        {dashboardSections.map((section) => (
          <article key={section.title} className="profile-panel min-h-48">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#f5f1ff] text-xl" aria-hidden="true">{section.icon}</span>
              <h2 className="text-lg font-semibold text-[#142b53]">{section.title}</h2>
            </div>
            <div className="mt-5 grid min-h-24 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
              <div><p className="text-sm font-medium text-slate-600">No updates yet</p><p className="mt-1 text-xs leading-5 text-slate-400">{section.description}</p></div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function SectionHero({ title, subtitle, image, alt }: { title: string; subtitle: string; image: string; alt: string }) {
  return (
    <section className="grid min-h-[150px] overflow-hidden rounded-[22px] border border-white bg-[linear-gradient(110deg,#f5f7ff,#fff)] shadow-[0_14px_42px_rgba(55,71,120,0.07)] tablet:grid-cols-[1fr_390px]">
      <div className="flex flex-col justify-center px-5 py-7 tablet:px-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
      <div className="relative hidden min-h-[150px] tablet:block">
        <Image src={sitePath(image)} alt={alt} fill sizes="390px" className="object-contain object-right-center" />
      </div>
    </section>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-[#7146e8] focus:ring-4 focus:ring-[#7146e8]/10";

function FormGroup({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <legend className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="grid size-8 place-items-center rounded-full text-sm text-white" style={{ backgroundColor: color }}>{icon}</span>
        {title}
      </legend>
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">{children}</div>
    </fieldset>
  );
}

function ProfileForm({ profile, selectedChild, onProfileChange }: { profile: AccountProfile; selectedChild: ChildProfile; onProfileChange: (profile: AccountProfile) => void }) {
  const [name, setName] = useState(profile.accountHolderName);
  const [phone, setPhone] = useState(profile.phone);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [removingChildId, setRemovingChildId] = useState("");
  const [childDeleteCode, setChildDeleteCode] = useState("");
  const [childDeleteError, setChildDeleteError] = useState("");
  const [childCodeWait, setChildCodeWait] = useState(0);

  useEffect(() => {
    if (childCodeWait <= 0) return;
    const timer = window.setInterval(() => setChildCodeWait((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [childCodeWait]);

  async function saveParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const response = await apiFetch("/api/v1/profile", {
      method: "PATCH",
      body: JSON.stringify({ accountHolderName: name, phone }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      const updatedProfile = body as AccountProfile;
      onProfileChange(updatedProfile);
      for (const storage of [window.localStorage, window.sessionStorage]) {
        const rawUser = storage.getItem("aplus-current-user");
        if (!rawUser) continue;
        try {
          storage.setItem("aplus-current-user", JSON.stringify({ ...JSON.parse(rawUser), accountHolderName: updatedProfile.accountHolderName }));
        } catch {
          storage.removeItem("aplus-current-user");
        }
      }
      window.dispatchEvent(new Event("aplus:user-updated"));
      setStatus("Great! Your parent account details were saved successfully.");
    } else {
      setStatus(body?.message || "Could not save profile details.");
    }
    setSaving(false);
  }

  async function saveChild(event: FormEvent<HTMLFormElement>, childId?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setStatus("");
    const payload = {
      fullName: form.get("fullName"),
      dateOfBirth: form.get("dateOfBirth"),
      gender: form.get("gender"),
      countryCode: form.get("countryCode"),
      province: form.get("province"),
      hometown: form.get("hometown"),
      address: form.get("address") || null,
    };
    const response = await apiFetch(
      childId ? `/api/v1/profile/children/${childId}` : "/api/v1/profile/children",
      { method: childId ? "PATCH" : "POST", body: JSON.stringify(payload) },
    );
    const body = await response.json().catch(() => null);
    if (response.ok) {
      const updated = childId
        ? profile.children.map((child) => child.publicId === childId ? body as ChildProfile : child)
        : [...profile.children, body as ChildProfile];
      onProfileChange({ ...profile, children: updated });
      setShowAddChild(false);
      setStatus(childId ? "Wonderful! The child profile was updated successfully." : "Welcome! The new child profile was added successfully.");
    } else {
      setStatus(body?.message || "Could not save the child profile.");
    }
    setSaving(false);
  }

  async function requestChildDeleteCode(childId: string) {
    setChildDeleteError("");
    const response = await apiFetch("/api/v1/profile/security-code", {
      method: "POST",
      body: JSON.stringify({ purpose: "DELETE_CHILD" }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setRemovingChildId(childId);
      setChildDeleteCode("");
      setChildCodeWait(60);
    } else {
      setChildDeleteError(body?.message || "Could not send the verification code.");
    }
  }

  async function removeChild(childId: string) {
    setSaving(true);
    setChildDeleteError("");
    const response = await apiFetch(`/api/v1/profile/children/${childId}`, {
      method: "DELETE",
      body: JSON.stringify({ code: childDeleteCode }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      onProfileChange({ ...profile, children: profile.children.filter((child) => child.publicId !== childId) });
      setRemovingChildId("");
      setChildDeleteCode("");
      setStatus("Done! The child profile was removed successfully.");
    } else {
      setChildDeleteError(body?.message || "Could not remove the child profile.");
    }
    setSaving(false);
  }

  return (
    <>
      <SectionHero
        title={`${selectedChild.fullName}'s profile`}
        subtitle={`Manage ${selectedChild.fullName}'s details and the other children connected to this parent account.`}
        image="/images/profile/Hero1.png"
        alt="A teddy bear and friendly dinosaur with colourful toys"
      />
      <div className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1fr)_250px] monitor:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-5">
          <form className="profile-panel space-y-6" onSubmit={saveParent}>
          <FormGroup title="Personal Information" icon="●" color="#7047e8">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Email address<input readOnly value={profile.email} className={`${fieldClass} bg-slate-100`} /></label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">Phone number<input required value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} /></label>
            <div className="flex items-end"><span className={`rounded-full px-3 py-2 text-xs font-medium ${profile.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{profile.emailVerified ? "Email verified" : "Email verification pending"}</span></div>
          </FormGroup>
            <button disabled={saving} type="submit" className="rounded-xl bg-[#f62983] px-6 py-3 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving..." : "Save account details"}</button>
          </form>

          {profile.children.map((child, index) => (
            <form key={child.publicId} onSubmit={(event) => saveChild(event, child.publicId)} className="profile-panel">
              <h2 className="text-lg font-semibold text-slate-900">Child profile {index + 1}</h2>
              <div className="mt-4 grid gap-4 tablet:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Full name<input required name="fullName" defaultValue={child.fullName} className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Date of birth<input required name="dateOfBirth" type="date" defaultValue={child.dateOfBirth} className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Gender<select required name="gender" defaultValue={child.gender} className={fieldClass}><option value="GIRL">Girl</option><option value="BOY">Boy</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Country code<input required name="countryCode" maxLength={2} defaultValue={child.countryCode} className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Province<input required name="province" defaultValue={child.province} className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Hometown<input required name="hometown" defaultValue={child.hometown} className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Address <span className="font-normal text-slate-400">(optional)</span><input name="address" defaultValue={child.address || ""} className={fieldClass} /></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={saving} type="submit" className="rounded-xl border border-[#d8ccff] px-5 py-2.5 text-sm font-medium text-[#7047e8] disabled:opacity-60">Save child profile</button>
                {profile.children.length > 1 && <button disabled={saving} type="button" onClick={() => requestChildDeleteCode(child.publicId)} className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600">Remove child</button>}
              </div>
              {removingChildId === child.publicId && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/60 p-4">
                  <p className="text-sm font-medium text-slate-800">A 6-digit code was sent to {profile.email}.</p>
                  <p className="mt-1 text-xs text-slate-500">Enter it below to permanently remove {child.fullName}&apos;s profile.</p>
                  <input aria-label="Child removal verification code" inputMode="numeric" maxLength={6} value={childDeleteCode} onChange={(event) => setChildDeleteCode(event.target.value.replace(/\D/g, ""))} className={`${fieldClass} mt-3 max-w-xs tracking-[0.35em]`} />
                  {childDeleteError && <p role="alert" className="mt-2 text-sm text-red-700">{childDeleteError}</p>}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" disabled={saving || childDeleteCode.length !== 6} onClick={() => removeChild(child.publicId)} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">Remove permanently</button>
                    <button type="button" disabled={childCodeWait > 0} onClick={() => requestChildDeleteCode(child.publicId)} className="rounded-xl border px-5 py-2.5 text-sm disabled:opacity-50">{childCodeWait > 0 ? `Resend in ${childCodeWait}s` : "Resend code"}</button>
                    <button type="button" onClick={() => { setRemovingChildId(""); setChildDeleteError(""); }} className="px-3 text-sm text-slate-600">Cancel</button>
                  </div>
                </div>
              )}
            </form>
          ))}

          {showAddChild ? (
            <form onSubmit={(event) => saveChild(event)} className="profile-panel">
              <h2 className="text-lg font-semibold text-slate-900">Add another child</h2>
              <div className="mt-4 grid gap-4 tablet:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Full name<input required name="fullName" className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Date of birth<input required name="dateOfBirth" type="date" className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Gender<select required name="gender" className={fieldClass}><option value="GIRL">Girl</option><option value="BOY">Boy</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Country code<input required name="countryCode" maxLength={2} defaultValue="LK" className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Province<input required name="province" className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600">Hometown<input required name="hometown" className={fieldClass} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Address <span className="font-normal text-slate-400">(optional)</span><input name="address" className={fieldClass} /></label>
              </div>
              <div className="mt-4 flex gap-3"><button disabled={saving} className="rounded-xl bg-[#7047e8] px-5 py-2.5 text-sm font-medium text-white">Add child</button><button type="button" onClick={() => setShowAddChild(false)} className="rounded-xl border px-5 py-2.5 text-sm">Cancel</button></div>
            </form>
          ) : (
            <button type="button" onClick={() => setShowAddChild(true)} className="w-full rounded-xl border-2 border-dashed border-[#d8ccff] bg-white px-5 py-4 text-sm font-medium text-[#7047e8]">+ Add another child profile</button>
          )}
          {status && <p role="status" className="rounded-xl bg-blue-50 p-3 text-center text-sm text-blue-700">{status}</p>}
        </section>

        <aside className="profile-panel h-fit">
          <h2 className="text-lg font-semibold text-slate-900">Family account</h2>
          <div className="mx-auto mt-5 grid size-28 place-items-center rounded-full bg-[conic-gradient(#7047e8_0_75%,#eee9ff_75%)]">
            <div className="grid size-[86px] place-items-center rounded-full bg-white text-2xl font-semibold text-[#7047e8]">{profile.children.length}</div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">{profile.children.length === 1 ? "Child profile" : "Child profiles"}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Manage every child from this one parent account.</p>
          <Image src={sitePath("/images/profile/ChatGPT Image May 21, 2026, 09_58_18 AM 1.png")} alt="Dinosaur holding a birthday gift" width={200} height={150} className="mx-auto mt-5 h-32 w-auto object-contain" />
        </aside>

      </div>
    </>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-[#3182f6]" : "bg-slate-300"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} /></button>;
}

type AccountNotification = {
  publicId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

function NotificationsPanel({ onUnreadCountChange }: { onUnreadCountChange: (count: number) => void }) {
  const [notifications, setNotifications] = useState<AccountNotification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/v1/profile/notifications").then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!active) return;
      if (response.ok) {
        const items = body as AccountNotification[];
        setNotifications(items);
        onUnreadCountChange(items.filter((item) => !item.read).length);
      }
      else setError(body?.message || "Could not load notifications.");
    }).catch(() => {
      if (active) setError("Could not connect to the notification service.");
    });
    return () => { active = false; };
  }, [onUnreadCountChange]);

  async function markRead(notification: AccountNotification) {
    if (notification.read) return;
    const response = await apiFetch(`/api/v1/profile/notifications/${notification.publicId}/read`, { method: "PATCH" });
    if (response.ok) {
      const updated = notifications?.map((item) => item.publicId === notification.publicId ? { ...item, read: true } : item) || [];
      setNotifications(updated);
      onUnreadCountChange(updated.filter((item) => !item.read).length);
    }
  }

  const iconFor = (type: string) => {
    if (type === "PASSWORD_CHANGED") return "🔒";
    if (type === "CHILD_ADDED") return "⭐";
    if (type === "CHILD_REMOVED") return "−";
    if (type === "CHILD_UPDATED") return "✏️";
    return "✓";
  };

  return (
    <>
      <SectionHero title="My Notifications" subtitle="Account and child-profile changes from the last 30 days." image="/images/profile/ChatGPT Image May 21, 2026, 12_27_21 PM 1.png" alt="Purple notification bell with an envelope and teddy bear" />
      <section className="profile-panel mt-5 min-h-[360px]">
        {error ? <div className="grid min-h-[300px] place-items-center text-center"><div><div className="text-3xl">!</div><p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p></div></div> : notifications === null ? <div className="grid min-h-[300px] place-items-center"><p className="text-sm text-slate-500">Getting your notifications...</p></div> : notifications.length === 0 ? (
          <div className="grid min-h-[300px] place-items-center text-center"><div><div className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-3xl" aria-hidden="true">🔔</div><h2 className="mt-5 text-xl font-semibold text-slate-900">No notifications</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your recent account updates will appear here.</p></div></div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button key={notification.publicId} type="button" onClick={() => markRead(notification)} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left ${notification.read ? "border-slate-100 bg-white" : "border-blue-100 bg-blue-50/60"}`}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">{iconFor(notification.type)}</span>
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><strong className="text-base font-semibold text-[#142b53]">{notification.title}</strong><time className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time></span><span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>{!notification.read && <span className="mt-2 inline-block text-xs font-semibold text-[#3182f6]">New · Click to mark as read</span>}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function SettingsPanel({ email, onAccountDeleted }: { email: string; onAccountDeleted: () => void }) {
  const [settings, setSettings] = useState([true, true, true, false]);
  const [preferenceStatus, setPreferenceStatus] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordStatusError, setPasswordStatusError] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordCodeWait, setPasswordCodeWait] = useState(0);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, next: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (passwordCodeWait <= 0) return;
    const timer = window.setInterval(() => setPasswordCodeWait((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [passwordCodeWait]);

  async function requestPasswordCode() {
    setPasswordBusy(true);
    setPasswordStatus("");
    setPasswordStatusError(false);
    const response = await apiFetch("/api/v1/profile/security-code", {
      method: "POST",
      body: JSON.stringify({ purpose: "CHANGE_PASSWORD" }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setPasswordCodeWait(60);
      setPasswordStatus("Great! A verification code was sent to your registered email.");
    } else {
      setPasswordStatus(body?.message || "Could not send the verification code.");
      setPasswordStatusError(true);
    }
    setPasswordBusy(false);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (passwordForm.currentPassword.length === 0) clientErrors.currentPassword = "Enter your current password.";
    if (passwordForm.newPassword.length < 8) clientErrors.newPassword = "Use at least 8 characters.";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) clientErrors.confirmPassword = "The new passwords do not match.";
    if (!/^\d{6}$/.test(passwordForm.code)) clientErrors.code = "Enter the 6-digit email verification code.";
    setPasswordErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setPasswordStatus("Please correct the highlighted information and try again.");
      setPasswordStatusError(true);
      return;
    }
    setPasswordBusy(true);
    setPasswordStatus("");
    setPasswordStatusError(false);
    const response = await apiFetch("/api/v1/profile/password", {
      method: "PATCH",
      body: JSON.stringify(passwordForm),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      const stayedSignedIn = await reauthenticate(email, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
      setPasswordErrors({});
      setPasswordCodeWait(0);
      setPasswordStatus("");
      if (stayedSignedIn) {
        setPasswordChanged(true);
      } else {
        onAccountDeleted();
      }
      return;
    }
    const message = body?.message || "Could not change the password.";
    if (body?.code === "INVALID_PASSWORD" || message.toLowerCase().includes("current password")) {
      setPasswordErrors({ currentPassword: message });
    } else if (body?.code === "PASSWORDS_DO_NOT_MATCH" || message.toLowerCase().includes("do not match")) {
      setPasswordErrors({ newPassword: message, confirmPassword: message });
    } else if (body?.code === "INVALID_SECURITY_CODE" || message.toLowerCase().includes("verification code")) {
      setPasswordErrors({ code: message });
    }
    setPasswordStatus(message);
    setPasswordStatusError(true);
    setPasswordBusy(false);
  }

  function updatePasswordField(field: keyof typeof passwordForm, value: string) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const passwordFieldClass = (field: string) =>
    `${fieldClass} pr-12 ${passwordErrors[field] ? "border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-red-100" : ""}`;

  function changePreference(index: number, title: string) {
    setSettings((items) => items.map((value, itemIndex) => itemIndex === index ? !value : value));
    setPreferenceStatus(`Great choice! Your ${title.toLowerCase()} preference was updated.`);
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError("");
    setDeleting(true);
    try {
      const response = await apiFetch("/api/v1/profile", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The account could not be deleted.");
      await logout();
      onAccountDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "The account could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SectionHero title="Settings" subtitle="Manage your account security, notifications and communication preferences." image="/images/profile/ChatGPT Image May 21, 2026, 01_12_37 PM 1.png" alt="Friendly dinosaur beside a purple settings gear" />
      <div className="mt-5 grid gap-5 desktop:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-5">
          <section className="profile-panel">
            <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-full bg-pink-50 text-xl">🛡️</span><div><h2 className="text-lg font-semibold text-slate-900">Security</h2><p className="text-sm text-slate-500">Keep your account secure by updating your password.</p></div></div>
            <div className="mt-5 rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-4"><span className="grid size-10 place-items-center rounded-xl bg-pink-50">🔒</span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-800">Change password</h3><p className="text-xs text-slate-500">Requires your current password and an email verification code.</p></div><button type="button" onClick={() => setShowChangePassword((value) => !value)} className="rounded-lg border border-pink-300 px-5 py-2 text-xs font-medium text-[#f62983]">{showChangePassword ? "Cancel" : "Change"}</button></div>
              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 tablet:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">Current password<div className="relative"><input required type={passwordVisibility.current ? "text" : "password"} autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField("currentPassword", event.target.value)} aria-invalid={Boolean(passwordErrors.currentPassword)} className={passwordFieldClass("currentPassword")} /><button type="button" onClick={() => setPasswordVisibility((value) => ({ ...value, current: !value.current }))} aria-label={passwordVisibility.current ? "Hide current password" : "Show current password"} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-lg text-slate-500 hover:bg-blue-50">{passwordVisibility.current ? "🙈" : "👁"}</button></div>{passwordErrors.currentPassword && <span className="text-xs font-medium text-red-600">{passwordErrors.currentPassword}</span>}</label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">New password<div className="relative"><input required minLength={8} type={passwordVisibility.next ? "text" : "password"} autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField("newPassword", event.target.value)} aria-invalid={Boolean(passwordErrors.newPassword)} className={passwordFieldClass("newPassword")} /><button type="button" onClick={() => setPasswordVisibility((value) => ({ ...value, next: !value.next }))} aria-label={passwordVisibility.next ? "Hide new password" : "Show new password"} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-lg text-slate-500 hover:bg-blue-50">{passwordVisibility.next ? "🙈" : "👁"}</button></div>{passwordErrors.newPassword && <span className="text-xs font-medium text-red-600">{passwordErrors.newPassword}</span>}</label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">Confirm new password<div className="relative"><input required minLength={8} type={passwordVisibility.confirm ? "text" : "password"} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField("confirmPassword", event.target.value)} aria-invalid={Boolean(passwordErrors.confirmPassword)} className={passwordFieldClass("confirmPassword")} /><button type="button" onClick={() => setPasswordVisibility((value) => ({ ...value, confirm: !value.confirm }))} aria-label={passwordVisibility.confirm ? "Hide confirmation password" : "Show confirmation password"} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-lg text-slate-500 hover:bg-blue-50">{passwordVisibility.confirm ? "🙈" : "👁"}</button></div>{passwordErrors.confirmPassword && <span className="text-xs font-medium text-red-600">{passwordErrors.confirmPassword}</span>}</label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">Email verification code<input required inputMode="numeric" maxLength={6} value={passwordForm.code} onChange={(event) => updatePasswordField("code", event.target.value.replace(/\D/g, ""))} aria-invalid={Boolean(passwordErrors.code)} className={`${passwordFieldClass("code")} tracking-[0.3em]`} />{passwordErrors.code && <span className="text-xs font-medium text-red-600">{passwordErrors.code}</span>}</label>
                  <div className="flex flex-wrap items-center gap-3 tablet:col-span-2">
                    <button type="button" disabled={passwordBusy || passwordCodeWait > 0} onClick={requestPasswordCode} className="rounded-xl border border-[#d8ccff] px-5 py-2.5 text-sm font-medium text-[#7047e8] disabled:opacity-50">{passwordCodeWait > 0 ? `Resend in ${passwordCodeWait}s` : "Send code"}</button>
                    <button type="submit" disabled={passwordBusy || passwordForm.code.length !== 6} className="rounded-xl bg-[#f62983] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{passwordBusy ? "Please wait..." : "Change password"}</button>
                  </div>
                  {passwordStatus && <p role={passwordStatusError ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium tablet:col-span-2 ${passwordStatusError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{passwordStatusError ? "Please check: " : "✓ "}{passwordStatus}</p>}
                </form>
              )}
            </div>
          </section>
          <section className="profile-panel">
            <div className="flex gap-3"><span className="grid size-11 place-items-center rounded-full bg-blue-50 text-xl">🔔</span><div><h2 className="text-lg font-semibold text-slate-900">Notification preferences</h2><p className="text-sm text-slate-500">Choose which notifications you want to receive.</p></div></div>
            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {[["Orders & deliveries", "Order and delivery updates", "🛍️"], ["Birthday requests", "Birthday request news", "🎂"], ["Kids Champ updates", "Activities and results", "🏆"], ["Promotions & offers", "Offers and exciting promotions", "🏷️"]].map(([title, subtitle, icon], index) => <div key={title} className="flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#faf6ff]">{icon}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-slate-800">{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div><Toggle label={title} enabled={settings[index]} onChange={() => changePreference(index, title)} /></div>)}
            </div>
            {preferenceStatus && <p role="status" className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">✓ {preferenceStatus}</p>}
          </section>
          <section className="profile-panel border border-red-100">
            <div className="flex gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-red-50 text-xl" aria-hidden="true">!</span>
              <div>
                <h2 className="text-lg font-semibold text-red-700">Delete account</h2>
                <p className="text-sm leading-6 text-slate-500">Permanently remove the parent account and every child profile connected to it.</p>
              </div>
            </div>
            {!showDeleteAccount ? (
              <button type="button" onClick={() => setShowDeleteAccount(true)} className="mt-5 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50">
                Delete account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="mt-5 rounded-xl border border-red-200 bg-red-50/50 p-4">
                <label className="grid gap-2 text-sm font-medium text-slate-800">
                  Enter the parent account password to confirm
                  <input type="password" required autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="h-12 rounded-xl border border-red-200 bg-white px-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
                </label>
                <p className="mt-3 text-xs leading-5 text-red-700">This cannot be undone. All child profiles will also be permanently removed.</p>
                {deleteError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{deleteError}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="submit" disabled={deleting || !deletePassword} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {deleting ? "Deleting..." : "Delete permanently"}
                  </button>
                  <button type="button" disabled={deleting} onClick={() => { setShowDeleteAccount(false); setDeletePassword(""); setDeleteError(""); }} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
        <aside className="profile-panel h-fit">
          <h2 className="text-base font-semibold text-slate-900">🎧 Need help?</h2>
          <div className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">{["Help centre", "Contact support", "Terms & conditions", "Privacy policy"].map((item) => <a key={item} href={item === "Contact support" ? "mailto:apluskidstvinfo@gmail.com" : "#"} className="flex justify-between py-3 hover:text-[#7047e8]"><span>{item}</span><span>›</span></a>)}</div>
          <Image src={sitePath("/images/profile/ChatGPT Image May 20, 2026, 05_49_37 PM 1.png")} alt="A Plus Kids support dinosaur" width={149} height={156} className="mx-auto mt-5 h-32 w-auto object-contain" />
        </aside>
      </div>
      {passwordChanged && (
        <div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/30 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="password-success-title">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-7 text-center shadow-[0_24px_80px_rgba(30,41,59,0.25)]">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
            <h2 id="password-success-title" className="mt-5 text-2xl font-bold text-[#142b53]">Password updated!</h2>
            <p className="mt-2 text-base text-slate-600">Your new password is ready.</p>
            <button type="button" onClick={() => { setPasswordChanged(false); setShowChangePassword(false); }} className="mt-6 w-full rounded-xl bg-[#3182f6] px-5 py-3 text-base font-semibold text-white">Done</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfileDashboard({ modal = false }: { modal?: boolean }) {
  const [activeSection, setActiveSection] = useState<Section>("Dashboard");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetch("/api/v1/profile").then(async (response) => {
      if (!active) return;
      if (response.status === 401 || response.status === 403) {
        window.location.replace(sitePath("/login/"));
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setLoadError(body?.message || "Could not load your profile.");
        return;
      }
      const loadedProfile = await response.json() as AccountProfile;
      setProfile(loadedProfile);
      setSelectedChildId((current) => current || loadedProfile.children[0]?.publicId || "");
      apiFetch("/api/v1/profile/notifications").then(async (notificationResponse) => {
        if (!active || !notificationResponse.ok) return;
        const items = await notificationResponse.json() as AccountNotification[];
        setUnreadNotifications(items.filter((item) => !item.read).length);
      }).catch(() => undefined);
    }).catch(() => {
      if (active) setLoadError("Unable to connect to the profile server.");
    });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    window.location.replace(sitePath("/login/"));
  }

  if (loadError) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-lg"><h1 className="text-xl font-semibold text-slate-900">Profile unavailable</h1><p className="mt-2 text-sm text-slate-600">{loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-[#7047e8] px-5 py-3 text-sm font-medium text-white">Try again</button></div></main>;
  }

  if (!profile) {
    return <main className="grid min-h-screen place-items-center bg-slate-50"><p role="status" className="text-sm font-medium text-slate-600">Loading your family profile...</p></main>;
  }

  const selectedChild = profile.children.find((child) => child.publicId === selectedChildId) || profile.children[0];
  if (!selectedChild) {
    return <main className="grid min-h-screen place-items-center bg-slate-50"><p className="text-sm text-slate-600">No child profile is connected to this account.</p></main>;
  }

  return (
    <main className={`profile-page bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_48%,#f7f8fc_100%)] px-4 pb-16 tablet:px-6 laptop:px-8 desktop:px-10 monitor:px-12 ${modal ? "min-h-full pt-6 laptop:pt-8" : "min-h-screen pt-[104px] laptop:pt-[136px]"}`}>
      <div className="mx-auto grid max-w-[1680px] gap-5 laptop:grid-cols-[250px_minmax(0,1fr)] desktop:grid-cols-[280px_minmax(0,1fr)] monitor:grid-cols-[300px_minmax(0,1fr)] monitor:gap-8">
        <aside className={`rounded-[24px] border border-slate-100 bg-white p-3 shadow-[0_18px_50px_rgba(55,71,120,0.08)] laptop:sticky laptop:h-fit laptop:p-4 ${modal ? "laptop:top-4" : "laptop:top-[126px]"}`}>
          <div className="rounded-[18px] bg-[linear-gradient(135deg,#f7f4ff,#f2f9ff)] px-3 py-4 laptop:px-4 laptop:py-5">
            <div className="flex items-center gap-3">
              <Image
                src={sitePath("/images/profile/Profile pic.png")}
                alt=""
                width={84}
                height={84}
                className="size-14 rounded-full tablet:size-16"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight text-slate-900 tablet:text-lg">{selectedChild.fullName}</p>
                <p className="mt-1 truncate text-[10px] leading-5 text-slate-500">Child ID: {selectedChild.publicId}</p>
              </div>
            </div>
            {profile.children.length > 1 ? (
              <label className="mt-4 grid gap-1.5 text-xs font-medium text-slate-600">
                Switch child
                <select value={selectedChild.publicId} onChange={(event) => setSelectedChildId(event.target.value)} className="h-11 rounded-xl border border-[#d8ccff] bg-white px-3 text-sm font-medium text-[#7047e8] outline-none">
                  {profile.children.map((child) => <option key={child.publicId} value={child.publicId}>{child.fullName}</option>)}
                </select>
              </label>
            ) : (
              <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-center text-xs font-medium text-[#7047e8]">1 child profile</p>
            )}
          </div>

          <nav aria-label="Profile navigation" className="mt-2 flex gap-2 overflow-x-auto pb-2 laptop:grid laptop:overflow-visible">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveSection(item.label)}
                className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm transition tablet:text-base laptop:w-full ${
                  activeSection === item.label
                    ? "bg-[#fff0f6] font-medium text-[#d92d70]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                aria-current={activeSection === item.label ? "page" : undefined}
              >
                <Image src={sitePath(item.icon)} alt="" width={24} height={24} className="size-5 shrink-0 object-contain" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Notifications" && unreadNotifications > 0 && (
                  <span className="grid min-w-6 place-items-center rounded-full bg-[#3182f6] px-1.5 py-0.5 text-xs font-bold leading-5 text-white" aria-label={`${unreadNotifications} unread notifications`}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 tablet:text-base laptop:w-full"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <Image src={sitePath("/icons/profile-menu/logout.png")} alt="" width={24} height={24} className="size-5 shrink-0 object-contain" aria-hidden="true" />
              Logout
            </button>
          </nav>

          <div className="relative mt-5 hidden min-h-[154px] overflow-hidden rounded-[18px] border border-slate-200 bg-gradient-to-br from-white to-[#f6f2ff] p-4 laptop:block">
            <Image
              src={sitePath("/images/profile/ChatGPT Image May 20, 2026, 05_49_37 PM 1.png")}
              alt="Friendly A Plus Kids support dinosaur"
              width={149}
              height={156}
              className="absolute -bottom-1 -left-5 h-28 w-auto"
            />
            <div className="ml-[82px]">
              <h2 className="text-base font-semibold text-slate-900">Need help?</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">We are here for you.</p>
              <a href="mailto:apluskidstvinfo@gmail.com" className="mt-4 inline-flex rounded-lg bg-[#7146e8] px-3 py-2 text-[11px] font-medium text-white hover:bg-[#5f36d4]">
                Contact support
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {activeSection === "Dashboard" && <Dashboard child={selectedChild} />}
          {activeSection === "Edit Profile" && <ProfileForm profile={profile} selectedChild={selectedChild} onProfileChange={setProfile} />}
          {activeSection === "Notifications" && <NotificationsPanel onUnreadCountChange={setUnreadNotifications} />}
          {activeSection === "Settings" && <SettingsPanel email={profile.email} onAccountDeleted={() => window.location.replace(sitePath("/login/"))} />}
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/35 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="w-full max-w-sm rounded-[26px] border border-white/70 bg-white p-7 text-center shadow-[0_28px_90px_rgba(30,41,59,0.28)]">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f3eeff] text-3xl" aria-hidden="true">👋</div>
            <h2 id="logout-confirm-title" className="mt-5 text-2xl font-bold text-[#142b53]">Leaving already?</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">Are you sure you want to log out of {selectedChild.fullName}&apos;s family profile?</p>
            <div className="mt-7 grid gap-3 tablet:grid-cols-2">
              <button type="button" disabled={loggingOut} onClick={() => setShowLogoutConfirm(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700">
                Stay here
              </button>
              <button type="button" disabled={loggingOut} onClick={handleLogout} className="rounded-xl bg-[#7047e8] px-5 py-3 text-base font-semibold text-white disabled:opacity-60">
                {loggingOut ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
