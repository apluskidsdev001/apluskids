"use client";

import Image from "next/image";
import { useState } from "react";
import { sitePath } from "@/utils/sitePath";

type ChildDetails = {
  name: string;
  birthday: string;
  gender: string;
  favourite: string;
};

const emptyChild = (): ChildDetails => ({
  name: "",
  birthday: "",
  gender: "",
  favourite: "",
});

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10";

export default function RegisterPage() {
  const [childCount, setChildCount] = useState(1);
  const [activeChild, setActiveChild] = useState(0);
  const [children, setChildren] = useState<ChildDetails[]>([emptyChild()]);
  const [complete, setComplete] = useState(false);

  function changeChildCount(nextCount: number) {
    setChildCount(nextCount);
    setChildren((current) =>
      Array.from({ length: nextCount }, (_, index) => current[index] ?? emptyChild())
    );
    setActiveChild((current) => Math.min(current, nextCount - 1));
  }

  function updateChild(field: keyof ChildDetails, value: string) {
    setChildren((current) =>
      current.map((child, index) =>
        index === activeChild ? { ...child, [field]: value } : child
      )
    );
  }

  const currentChild = children[activeChild];

  return (
    <main
      className="relative -mb-24 min-h-screen overflow-hidden bg-[#6bc6f7] bg-cover bg-center bg-no-repeat px-3 py-5 tablet:px-6 tablet:py-8 laptop:mb-0 laptop:px-10 desktop:py-10 monitor:px-16"
      style={{
        backgroundImage: `url("${sitePath("/images/login/Gemini_Generated_Image_p1rgy1p1rgy1p1rg 1.png")}")`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(37,150,238,0.06),rgba(255,255,255,0.03))]" />

      <section className="relative mx-auto w-full max-w-[720px] rounded-[26px] bg-white/96 p-5 shadow-[0_28px_80px_rgba(14,72,135,0.22)] backdrop-blur-sm tablet:rounded-[36px] tablet:p-8 laptop:max-w-[800px] laptop:p-10 monitor:max-w-[880px]">
        <a href={sitePath("/")} aria-label="Go to A Plus Kids home" className="mx-auto block w-fit">
          <Image
            src={sitePath("/icons/taskbar/logo.png")}
            alt="A Plus Kids"
            width={120}
            height={60}
            priority
            className="h-14 w-auto object-contain tablet:h-16"
          />
        </a>

        <div className="mt-3 text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 tablet:text-3xl">
            Create your family account
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Join A Plus Kids and create a safe profile for each of your children.
          </p>
        </div>

        <form
          className="mt-7 space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            setComplete(true);
          }}
        >
          <fieldset>
            <legend className="flex items-center gap-2 text-base font-semibold text-[#142b53]">
              <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-sm">👤</span>
              Parent information
            </legend>
            <div className="mt-4 grid gap-4 tablet:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Parent name
                <input required name="parentName" autoComplete="name" placeholder="Enter parent or guardian name" className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Email address
                <input required type="email" name="email" autoComplete="email" placeholder="parent@example.com" className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Phone number
                <input required type="tel" name="phone" autoComplete="tel" placeholder="07X XXX XXXX" className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Number of children
                <select value={childCount} onChange={(event) => changeChildCount(Number(event.target.value))} className={inputClass}>
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "child" : "children"}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Password
                <input required minLength={8} type="password" name="password" autoComplete="new-password" placeholder="Minimum 8 characters" className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Confirm password
                <input required minLength={8} type="password" name="confirmPassword" autoComplete="new-password" placeholder="Enter password again" className={inputClass} />
              </label>
            </div>
          </fieldset>

          <fieldset className="border-t border-slate-100 pt-6">
            <legend className="flex items-center gap-2 text-base font-semibold text-[#142b53]">
              <span className="grid size-8 place-items-center rounded-full bg-pink-50 text-sm">⭐</span>
              Children&apos;s details
            </legend>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Children">
              {children.map((child, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={activeChild === index}
                  onClick={() => setActiveChild(index)}
                  className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium transition ${
                    activeChild === index
                      ? "bg-[#3182f6] text-white shadow-lg shadow-blue-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  Child {index + 1}
                  {child.name ? <span className="ml-1 hidden tablet:inline">· {child.name}</span> : null}
                </button>
              ))}
            </div>

            <div
              key={activeChild}
              role="tabpanel"
              className="mt-3 grid gap-4 rounded-[18px] border border-blue-100 bg-[#f8fbff] p-4 tablet:grid-cols-2 tablet:p-5"
            >
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Child&apos;s full name
                <input required value={currentChild.name} onChange={(event) => updateChild("name", event.target.value)} placeholder={`Child ${activeChild + 1} name`} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Date of birth
                <input required type="date" value={currentChild.birthday} onChange={(event) => updateChild("birthday", event.target.value)} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Gender
                <select required value={currentChild.gender} onChange={(event) => updateChild("gender", event.target.value)} className={inputClass}>
                  <option value="">Choose an option</option>
                  <option>Girl</option>
                  <option>Boy</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Favourite activity
                <select value={currentChild.favourite} onChange={(event) => updateChild("favourite", event.target.value)} className={inputClass}>
                  <option value="">Choose an activity</option>
                  <option>Stories</option>
                  <option>Education</option>
                  <option>Songs & Rhymes</option>
                  <option>Art & Craft</option>
                  <option>Kids Champ</option>
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              You selected {childCount} {childCount === 1 ? "child" : "children"}. Complete every child tab before creating the account.
            </p>
          </fieldset>

          <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
            <input required type="checkbox" className="mt-0.5 size-4 accent-[#3182f6]" />
            <span>I confirm that I am the parent or legal guardian and agree to the Terms of Use and Privacy Policy.</span>
          </label>

          <button type="submit" className="min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] px-5 text-base font-medium text-white shadow-lg shadow-blue-200 transition hover:brightness-105">
            Create account
          </button>
          {complete ? (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
              Registration form is ready. Account creation will work after the backend is connected.
            </p>
          ) : null}
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a href={sitePath("/login/")} className="font-medium text-[#1670ef] hover:underline">Log in</a>
        </p>
      </section>
    </main>
  );
}
