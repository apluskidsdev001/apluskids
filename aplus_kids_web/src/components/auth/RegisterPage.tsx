"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { sitePath } from "@/utils/sitePath";
import { backendFetch } from "@/utils/backendActivity";

type ChildDetails = {
  formId: string;
  name: string;
  birthday: string;
  gender: string;
  country: string;
  province: string;
  hometown: string;
  addressLine1: string;
  addressLine2: string;
};

function createEmptyChild(): ChildDetails {
  return {
    formId: Math.random().toString(36).slice(2),
    name: "",
    birthday: "",
    gender: "",
    country: "Sri Lanka",
    province: "",
    hometown: "",
    addressLine1: "",
    addressLine2: "",
  };
}

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white/95 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10";

export const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const countryCodeOverrides: Record<string, string> = {
  "Ivory Coast": "CI",
  "Laos": "LA",
  "North Korea": "KP",
  "Palestine": "PS",
  "Russia": "RU",
  "South Korea": "KR",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tanzania": "TZ",
  "Vatican City": "VA",
  "Vietnam": "VN",
};

export function getCountryCode(countryName: string) {
  if (countryCodeOverrides[countryName]) return countryCodeOverrides[countryName];
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      if (displayNames.of(code) === countryName) return code;
    }
  }

  return "";
}

function CountryCombobox({ value, onChange }: { value: string; onChange: (country: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCountries = countries.filter((country) =>
    country.toLocaleLowerCase().includes(normalizedQuery)
  );

  function selectCountry(country: string) {
    onChange(country);
    setQuery(country);
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setQuery(value);
          setOpen(false);
        }
      }}
    >
      <input
        required
        role="combobox"
        aria-label="Country"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="country-options"
        aria-activedescendant={open && filteredCountries[activeIndex] ? `country-${activeIndex}` : undefined}
        autoComplete="country-name"
        value={query}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(0);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, filteredCountries.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && filteredCountries[activeIndex]) {
            event.preventDefault();
            selectCountry(filteredCountries[activeIndex]);
          } else if (event.key === "Escape") {
            setQuery(value);
            setOpen(false);
          }
        }}
        placeholder="Search for a country"
        className={`${inputClass} pr-11`}
      />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute right-4 top-3.5 size-5 text-slate-400" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4 4" />
      </svg>
      {open && (
        <div id="country-options" role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filteredCountries.length ? filteredCountries.map((country, index) => (
            <button
              key={country}
              id={`country-${index}`}
              type="button"
              role="option"
              aria-selected={country === value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectCountry(country)}
              className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm ${
                index === activeIndex ? "bg-blue-50 text-[#1266ed]" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {country}
              {country === value && <span className="ml-auto font-bold" aria-hidden="true">✓</span>}
            </button>
          )) : (
            <p className="px-3 py-4 text-center text-sm text-slate-500">No country found</p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionIcon({ type }: { type: "parent" | "child" }) {
  return (
    <span className={`grid size-9 place-items-center rounded-full ${type === "parent" ? "bg-blue-50 text-[#3182f6]" : "bg-pink-50 text-[#ed3f83]"}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
        {type === "parent" ? (
          <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>
        ) : (
          <><path d="m12 3 2.2 4.45 4.91.71-3.55 3.46.84 4.88L12 14.19 7.6 16.5l.84-4.88L4.9 8.16l4.9-.71L12 3Z" /></>
        )}
      </svg>
    </span>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
      {crossed ? (
        <><path d="M3 3l18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9 5.5 9 8a10.7 10.7 0 0 1-2.1 3.3M6.2 6.2C4.2 7.6 3 10 3 12c0 2.5 3.5 8 9 8 1 0 1.9-.2 2.7-.5" /></>
      ) : (
        <><path d="M3 12c0-2.5 3.5-8 9-8s9 5.5 9 8-3.5 8-9 8-9-5.5-9-8Z" /><circle cx="12" cy="12" r="2.5" /></>
      )}
    </svg>
  );
}

function ChildFields({
  child,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  child: ChildDetails;
  index: number;
  canRemove: boolean;
  onChange: (field: keyof ChildDetails, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] p-4 tablet:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#142b53]">Child profile {index + 1}</h3>
        {canRemove && <button type="button" onClick={onRemove} className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>}
      </div>
      <div className="grid gap-4 tablet:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Child&apos;s full name<input required value={child.name} onChange={(event) => onChange("name", event.target.value)} autoComplete="off" placeholder="Child's name" className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Date of birth<input required type="date" max={new Date().toISOString().split("T")[0]} value={child.birthday} onChange={(event) => onChange("birthday", event.target.value)} className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Gender<select required value={child.gender} onChange={(event) => onChange("gender", event.target.value)} className={inputClass}><option value="">Choose an option</option><option value="GIRL">Girl</option><option value="BOY">Boy</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option></select></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Country<CountryCombobox value={child.country} onChange={(country) => onChange("country", country)} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Province<input required value={child.province} onChange={(event) => onChange("province", event.target.value)} autoComplete="address-level1" placeholder="Enter province or state" className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600">Hometown<input required value={child.hometown} onChange={(event) => onChange("hometown", event.target.value)} autoComplete="address-level2" placeholder="Enter town or city" className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Address line 1 <span className="font-normal text-slate-400">(optional)</span><input maxLength={150} value={child.addressLine1} onChange={(event) => onChange("addressLine1", event.target.value)} autoComplete="address-line1" placeholder="House number and street" className={inputClass} /></label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-600 tablet:col-span-2">Address line 2 <span className="font-normal text-slate-400">(optional)</span><input maxLength={140} value={child.addressLine2} onChange={(event) => onChange("addressLine2", event.target.value)} autoComplete="address-line2" placeholder="Apartment, unit, landmark, etc." className={inputClass} /></label>
      </div>
    </div>
  );
}

export default function RegisterPage({ embedded = false, onLogin }: { embedded?: boolean; onLogin?: () => void }) {
  const [children, setChildren] = useState<ChildDetails[]>([createEmptyChild()]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  function updateChild(index: number, field: keyof ChildDetails, value: string) {
    setChildren((current) => current.map((child, childIndex) =>
      childIndex === index ? { ...child, [field]: value } : child
    ));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (form.get("password") !== form.get("confirmPassword")) {
      setPasswordError("Passwords do not match. Please check both fields.");
      setStatus(null);
      return;
    }

    const childrenWithCodes = children.map((child) => ({ child, countryCode: getCountryCode(child.country) }));
    if (childrenWithCodes.some(({ countryCode }) => !countryCode)) {
      setStatus({ type: "error", message: "Please choose a valid country from the list." });
      return;
    }

    setPasswordError("");
    setStatus(null);
    setIsSubmitting(true);

    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");

    try {
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountHolderName: form.get("parentName"),
          email: form.get("email"),
          phone: form.get("phone"),
          password: form.get("password"),
          confirmPassword: form.get("confirmPassword"),
          children: childrenWithCodes.map(({ child, countryCode }) => {
            const address = [child.addressLine1.trim(), child.addressLine2.trim()].filter(Boolean).join(", ");
            return {
              fullName: child.name,
              dateOfBirth: child.birthday,
              gender: child.gender,
              countryCode,
              province: child.province,
              hometown: child.hometown,
              address: address || null,
            };
          }),
          consent: {
            parentGuardianConfirmed: true,
            termsAccepted: true,
            termsVersion: "2026-01",
            privacyAccepted: true,
            privacyVersion: "2026-01",
          },
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string; fieldErrors?: Array<{ message?: string }> }
        | null;

      if (!response.ok) {
        const fieldMessage = result?.fieldErrors?.find((item) => item.message)?.message;
        throw new Error(fieldMessage || result?.message || "Account creation failed. Please try again.");
      }

      const email = String(form.get("email") || "").trim();
      formElement.reset();
      setChildren([createEmptyChild()]);
      setRegisteredEmail(email);
      setSecondsRemaining(60);
      setStatus({ type: "success", message: "We sent a six-digit verification code to your email." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
    try {
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: verificationCode }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "The verification code is incorrect or expired.");
      setVerified(true);
      setSecondsRemaining(0);
      setStatus({ type: "success", message: "Email verified successfully. Your account is ready." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Email verification failed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    setIsSubmitting(true);
    setStatus(null);
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
    try {
      const response = await backendFetch(`${apiBaseUrl}/api/v1/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || "Could not resend the verification code.");
      setVerificationCode("");
      setSecondsRemaining(60);
      setStatus({ type: "success", message: "A new verification code was sent." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Could not resend the verification code." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={embedded ? "relative min-h-full bg-white px-3 py-5 tablet:px-6" : "relative -mb-24 min-h-screen overflow-hidden bg-[#6bc6f7] px-3 pb-28 pt-28 tablet:px-6 laptop:mb-0 laptop:px-10 laptop:pb-12 laptop:pt-32 monitor:px-16"}>
      {!embedded && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(37,150,238,0.16),rgba(255,255,255,0.12))]" />}

      <section className="relative mx-auto w-full max-w-[720px] rounded-[26px] bg-white/96 p-5 [font-family:Arial,Helvetica,sans-serif] shadow-[0_28px_80px_rgba(14,72,135,0.22)] backdrop-blur-sm tablet:rounded-[36px] tablet:p-8 laptop:max-w-[800px] laptop:p-10">
        <a href={sitePath("/")} aria-label="Go to A Plus Kids home" className="mx-auto block w-fit">
          <Image src={sitePath("/icons/taskbar/logo.png")} alt="A Plus Kids" width={600} height={600} priority className="h-28 w-64 object-cover object-center tablet:h-32 tablet:w-72" />
        </a>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 tablet:text-3xl">Create your account</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Join A Plus Kids and create a safe profile for your child.</p>
          <p className="mt-1 text-xs text-slate-400">You can add more child profiles after creating your account.</p>
        </div>

        {registeredEmail ? (
          <div className="mt-7">
            <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] p-5 text-center tablet:p-7">
              <div className={`mx-auto grid size-16 place-items-center rounded-full text-2xl font-bold ${verified ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#1670ef]"}`}>{verified ? "✓" : "@"}</div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">{verified ? "Account verified" : "Verify your email"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{verified ? "You can now log in to your family account." : <>Enter the six-digit code sent to <strong className="break-all text-slate-800">{registeredEmail}</strong>.</>}</p>

              {!verified && (
                <form onSubmit={verifyCode} className="mx-auto mt-5 max-w-sm">
                  <label className="sr-only" htmlFor="verification-code">Six-digit verification code</label>
                  <input id="verification-code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-16 w-full rounded-xl border border-blue-200 bg-white text-center text-2xl font-bold tracking-[0.45em] text-slate-900 outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-blue-100" />
                  <button disabled={isSubmitting || verificationCode.length !== 6} className="mt-4 min-h-12 w-full rounded-xl bg-[#1670ef] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55">{isSubmitting ? "Verifying..." : "Verify email"}</button>
                </form>
              )}

              {!verified && <div className="mt-4 text-sm text-slate-500">{secondsRemaining > 0 ? <p>Resend available in <strong className="text-slate-700">0:{String(secondsRemaining).padStart(2, "0")}</strong></p> : <button disabled={isSubmitting} type="button" onClick={resendCode} className="font-bold text-[#1670ef] hover:underline">Resend verification code</button>}</div>}
              {verified && (embedded ? <button type="button" onClick={onLogin} className="mt-5 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[#1670ef] font-bold text-white">Continue to login</button> : <a href={sitePath("/login/")} className="mt-5 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[#1670ef] font-bold text-white">Continue to login</a>)}
            </div>
            {status && <p role={status.type === "error" ? "alert" : "status"} aria-live="polite" className={`mt-4 rounded-xl p-3 text-center text-sm font-medium ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status.message}</p>}
          </div>
        ) : (
        <form
          className="mt-7 space-y-7"
          onSubmit={handleSubmit}
        >
          <fieldset>
            <legend className="flex items-center gap-2 text-base font-bold text-[#142b53]"><SectionIcon type="parent" />Parent information</legend>
            <div className="mt-4 grid gap-4 tablet:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">Parent name<input required name="parentName" autoComplete="name" placeholder="Enter parent or guardian name" className={inputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">Email address<input required type="email" name="email" autoComplete="email" inputMode="email" placeholder="parent@example.com" className={inputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">Phone number<input required type="tel" name="phone" autoComplete="tel" inputMode="tel" pattern="[0-9 +()-]{7,15}" placeholder="07X XXX XXXX" className={inputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Password
                <span className="relative">
                  <input required minLength={8} type={showPasswords ? "text" : "password"} name="password" autoComplete="new-password" placeholder="Minimum 8 characters" className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPasswords((visible) => !visible)} aria-label={showPasswords ? "Hide passwords" : "Show passwords"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><EyeIcon crossed={showPasswords} /></button>
                </span>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Confirm password
                <input required minLength={8} type={showPasswords ? "text" : "password"} name="confirmPassword" autoComplete="new-password" placeholder="Enter password again" aria-describedby={passwordError ? "password-error" : undefined} className={inputClass} />
              </label>
            </div>
            {passwordError && <p id="password-error" role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{passwordError}</p>}
            <p className="mt-3 text-xs text-slate-500">Use at least 8 characters. A mix of letters, numbers, and symbols is recommended.</p>
          </fieldset>

          <fieldset className="border-t border-slate-100 pt-6">
            <legend className="flex items-center gap-2 text-base font-bold text-[#142b53]"><SectionIcon type="child" />Children&apos;s details</legend>
            <div className="mt-4 space-y-4">
              {children.map((child, index) => (
                <ChildFields
                  key={child.formId}
                  child={child}
                  index={index}
                  canRemove={children.length > 1}
                  onChange={(field, value) => updateChild(index, field, value)}
                  onRemove={() => setChildren((current) => current.filter((_, childIndex) => childIndex !== index))}
                />
              ))}
              {children.length < 10 && (
                <button type="button" onClick={() => setChildren((current) => [...current, createEmptyChild()])} className="min-h-14 w-full rounded-xl border-2 border-dashed border-[#cbbcff] bg-white text-sm font-bold text-[#7047e8] transition hover:bg-[#f8f6ff]">+ Add another child</button>
              )}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
            <input required type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#3182f6]" />
            <span>I confirm that I am the parent or legal guardian and agree to the <a href="#" className="font-medium text-[#1670ef] hover:underline">Terms of Use</a> and <a href="#" className="font-medium text-[#1670ef] hover:underline">Privacy Policy</a>.</span>
          </label>

          <button disabled={isSubmitting} type="submit" className="min-h-13 w-full rounded-xl bg-[linear-gradient(180deg,#4394ff,#1266ed)] px-5 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-65">{isSubmitting ? "Creating account..." : "Create account"}</button>
          {status && <p role={status.type === "error" ? "alert" : "status"} aria-live="polite" className={`rounded-xl p-3 text-center text-sm font-medium ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status.message}</p>}
        </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">Already have an account?{" "}{embedded ? <button type="button" onClick={onLogin} className="font-medium text-[#1670ef] hover:underline">Log in</button> : <a href={sitePath("/login/")} className="font-medium text-[#1670ef] hover:underline">Log in</a>}</p>
      </section>
    </main>
  );
}
