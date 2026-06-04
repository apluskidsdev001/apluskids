"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { sitePath } from "@/utils/sitePath";

type Language = "english" | "sinhala" | "tamil";
type DetailId = "fullName" | "age" | "city" | "phoneOne" | "phoneTwo";
type Details = Record<DetailId, string>;
type PaymentMode = "slip" | "online" | "";

const phoneNumber = "0768212266";
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 1. Text bank - future Sinhala/Tamil/English content updates can start here.
const copy = {
  english: {
    languageLabel: "English",
    title: "Birthday Wishes Chat",
    subtitle: "A Plus Kids chat flow",
    introTitle: "Introduction",
    introText:
      "Welcome to A Plus Kids Birthday Wishes. This chat helps parents send birthday details step by step. First read the introduction, choose the birthday date, add child details, upload a photo, then select a payment option. A real database and payment API can be connected later.",
    introHelp:
      "Later you can replace this text with your full introduction. This popup is prepared for long text and supports scrolling.",
    readIntro: "Tap to read full introduction",
    chooseDate: "Please choose birthday date",
    confirmDate: "Confirm Date",
    resetDate: "Reset Date",
    enterDetails: "Enter your details",
    messagePrompt:
      "Type your birthday message and upload a picture. We will use this for the birthday wish.",
    pictureReply: "We upload your picture.",
    paymentTitle: "Choose payment option",
    addSlip: "Add Slip",
    addSlipHelp: "Upload your payment slip from gallery.",
    paymentOnline: "Payment Online",
    paymentOnlineHelp: "PayHere API will connect later.",
    payhereSoon: "PayHere button coming soon",
    submitAll: "Submit All",
    sureTitle: "Are your details correct?",
    sureHelp: "Please check everything before the final summary.",
    back: "Back",
    iamSure: "OK, I am sure",
    summaryTitle: "Check Summary",
    edit: "Edit",
    finalSubmit: "Final Submit",
    thanks:
      "Thank you. Your birthday wish request is ready. We will connect database and payment API later.",
    typeHere: "Type here",
    enter: "Enter",
    menuDelete: "Delete all",
    menuRefresh: "Refresh",
    menuDownload: "Download summary PDF",
    disabledDownload: "Available after final submit",
    imageSelected: "Image selected",
    slipUploaded: "Slip uploaded",
    notUploaded: "Not uploaded",
    selectedDate: "Birthday date",
  },
  sinhala: {
    languageLabel: "සිංහල",
    title: "උපන්දින සුබ පැතුම් චැට්",
    subtitle: "A Plus Kids chat flow එක",
    introTitle: "හැඳින්වීම",
    introText:
      "A Plus Kids උපන්දින සුබ පැතුම් සේවාවට සාදරයෙන් පිළිගන්නවා. මේ chat එකෙන් දෙමාපියන්ට පියවරෙන් පියවර උපන්දින විස්තර යවන්න පුළුවන්. මුලින් හැඳින්වීම කියවලා, උපන්දින දිනය තෝරලා, දරුවාගේ විස්තර සහ පින්තූරය upload කරලා, payment option එක තෝරන්න.",
    introHelp:
      "පසුව ඔබගේ දිග හැඳින්වීම මේ තැනට replace කරන්න පුළුවන්. දිග text සඳහා මේ popup එක scroll වෙන්න සකස් කරලා තියෙනවා.",
    readIntro: "සම්පූර්ණ හැඳින්වීම බලන්න",
    chooseDate: "කරුණාකර උපන්දින දිනය තෝරන්න",
    confirmDate: "දිනය confirm කරන්න",
    resetDate: "දිනය reset කරන්න",
    enterDetails: "ඔබගේ විස්තර ඇතුළත් කරන්න",
    messagePrompt:
      "උපන්දින message එක type කරලා පින්තූරයක් upload කරන්න. birthday wish එකට ඒවා භාවිතා කරනවා.",
    pictureReply: "අපි ඔබගේ පින්තූරය upload කළා.",
    paymentTitle: "Payment option එක තෝරන්න",
    addSlip: "Slip එක add කරන්න",
    addSlipHelp: "Gallery එකෙන් payment slip එක upload කරන්න.",
    paymentOnline: "Online payment",
    paymentOnlineHelp: "PayHere API එක පසුව connect කරනවා.",
    payhereSoon: "PayHere button එක ඉදිරියේදී",
    submitAll: "සියල්ල submit කරන්න",
    sureTitle: "ඔබගේ සියලු විස්තර නිවැරදිද?",
    sureHelp: "Final summary එකට පෙර කරුණාකර සියල්ල check කරන්න.",
    back: "Back",
    iamSure: "ඔව්, මට විශ්වාසයි",
    summaryTitle: "Summary එක check කරන්න",
    edit: "Edit",
    finalSubmit: "Final Submit",
    thanks:
      "ස්තුතියි. ඔබගේ birthday wish request එක ready. Database සහ payment API එක පසුව connect කරනවා.",
    typeHere: "මෙතැන type කරන්න",
    enter: "Enter",
    menuDelete: "සියල්ල delete කරන්න",
    menuRefresh: "Refresh",
    menuDownload: "Summary PDF download",
    disabledDownload: "Final submit පස්සේ active වෙනවා",
    imageSelected: "තෝරාගත් පින්තූරය",
    slipUploaded: "Upload කළ slip එක",
    notUploaded: "Upload කර නැහැ",
    selectedDate: "උපන්දින දිනය",
  },
  tamil: {
    languageLabel: "தமிழ்",
    title: "பிறந்தநாள் வாழ்த்து Chat",
    subtitle: "A Plus Kids chat flow",
    introTitle: "அறிமுகம்",
    introText:
      "A Plus Kids Birthday Wishes சேவைக்கு வரவேற்கிறோம். இந்த chat மூலம் பெற்றோர் படிப்படியாக பிறந்தநாள் விவரங்களை அனுப்பலாம். முதலில் அறிமுகத்தை படிக்கவும், பிறந்தநாள் தேதியை தேர்வு செய்யவும், குழந்தையின் விவரங்களையும் படத்தையும் upload செய்யவும், பின்னர் payment option தேர்வு செய்யவும்.",
    introHelp:
      "பின்னர் உங்கள் முழு அறிமுக text இங்கே மாற்றலாம். நீளமான text க்காக இந்த popup scroll ஆகும்.",
    readIntro: "முழு அறிமுகத்தை பார்க்க",
    chooseDate: "பிறந்தநாள் தேதியை தேர்வு செய்யவும்",
    confirmDate: "தேதியை confirm செய்யவும்",
    resetDate: "தேதியை reset செய்யவும்",
    enterDetails: "உங்கள் விவரங்களை உள்ளிடவும்",
    messagePrompt:
      "Birthday message type செய்து ஒரு படத்தை upload செய்யவும். birthday wish க்காக அதைப் பயன்படுத்துவோம்.",
    pictureReply: "உங்கள் படத்தை upload செய்தோம்.",
    paymentTitle: "Payment option தேர்வு செய்யவும்",
    addSlip: "Slip add செய்யவும்",
    addSlipHelp: "Gallery இலிருந்து payment slip upload செய்யவும்.",
    paymentOnline: "Payment Online",
    paymentOnlineHelp: "PayHere API பின்னர் connect செய்யப்படும்.",
    payhereSoon: "PayHere button விரைவில்",
    submitAll: "Submit All",
    sureTitle: "உங்கள் விவரங்கள் சரியா?",
    sureHelp: "Final summary க்கு முன் அனைத்தையும் check செய்யவும்.",
    back: "Back",
    iamSure: "OK, உறுதி",
    summaryTitle: "Summary check செய்யவும்",
    edit: "Edit",
    finalSubmit: "Final Submit",
    thanks:
      "நன்றி. உங்கள் birthday wish request ready. Database மற்றும் payment API பின்னர் connect செய்யப்படும்.",
    typeHere: "இங்கே type செய்யவும்",
    enter: "Enter",
    menuDelete: "Delete all",
    menuRefresh: "Refresh",
    menuDownload: "Summary PDF download",
    disabledDownload: "Final submit பிறகு மட்டும்",
    imageSelected: "தேர்ந்தெடுத்த படம்",
    slipUploaded: "Upload செய்த slip",
    notUploaded: "Upload செய்யவில்லை",
    selectedDate: "Birthday date",
  },
};

const detailFields: Array<{ id: DetailId; label: Record<Language, string>; type: string }> = [
  { id: "fullName", label: { english: "Full name", sinhala: "සම්පූර්ණ නම", tamil: "முழுப் பெயர்" }, type: "text" },
  { id: "age", label: { english: "Age", sinhala: "වයස", tamil: "வயது" }, type: "number" },
  { id: "city", label: { english: "City", sinhala: "නගරය", tamil: "நகரம்" }, type: "text" },
  { id: "phoneOne", label: { english: "Phone number 1", sinhala: "දුරකථන අංක 1", tamil: "Phone number 1" }, type: "tel" },
  { id: "phoneTwo", label: { english: "Phone number 2", sinhala: "දුරකථන අංක 2", tamil: "Phone number 2" }, type: "tel" },
];

function buildCalendarDays() {
  return Array.from({ length: 30 }, (_, index) => String(index + 1));
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-start gap-3">
      <Image
        src={sitePath("/images/birthday/chatbot.png")}
        alt="A Plus Kids chat helper"
        width={48}
        height={48}
        className="mt-1 h-10 w-10 shrink-0 rounded-full object-contain sm:h-12 sm:w-12"
      />
      <div className="min-w-0 max-w-[calc(100vw-112px)] flex-1 break-words rounded-[18px] rounded-tl-[4px] bg-white/96 px-4 py-3 text-[14px] font-medium leading-[1.6] text-[#18345F] shadow-[0_8px_22px_rgba(7,27,99,0.08)] sm:max-w-[780px] sm:px-5 sm:text-[16px]">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="min-w-0 max-w-[calc(100vw-48px)] break-words rounded-[18px] rounded-tr-[4px] bg-[#DDF4FF] px-4 py-3 text-[14px] font-medium leading-[1.6] text-[#071B63] shadow-[0_8px_22px_rgba(7,27,99,0.06)] sm:max-w-[780px] sm:px-5 sm:text-[16px]">
        {children}
      </div>
    </div>
  );
}

export default function Birthday() {
  // 2. Main chat flow state - keep this block simple for future flow updates.
  const [language, setLanguage] = useState<Language>("english");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [confirmedDate, setConfirmedDate] = useState("");
  const [details, setDetails] = useState<Details>({
    fullName: "",
    age: "",
    city: "",
    phoneOne: "",
    phoneTwo: "",
  });
  const [chatText, setChatText] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("");
  const [slipName, setSlipName] = useState("");
  const [sureModalOpen, setSureModalOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  // 3. Hidden upload inputs - plus/photo and payment slip use the browser file picker.
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const calendarDays = useMemo(() => buildCalendarDays(), []);
  const t = copy[language];

  const detailsComplete = detailFields.every((field) => details[field.id].trim());
  const canSendMessage = Boolean(confirmedDate) && detailsComplete;
  const canShowPayment = canSendMessage && messageSent;

  useEffect(() => {
    document.body.classList.toggle("birthday-chat-nav-hidden", navHidden);

    return () => {
      document.body.classList.remove("birthday-chat-nav-hidden");
    };
  }, [navHidden]);

  function handleChatScroll() {
    const scrollTop = chatBodyRef.current?.scrollTop ?? 0;
    setNavHidden(scrollTop > 24);
  }

  function updateDetail(id: DetailId, value: string) {
    setDetails((current) => ({ ...current, [id]: value }));
  }

  function resetFlow() {
    setSelectedDay("");
    setConfirmedDate("");
    setDetails({
      fullName: "",
      age: "",
      city: "",
      phoneOne: "",
      phoneTwo: "",
    });
    setChatText("");
    setPhotoName("");
    setMessageSent(false);
    setPaymentMode("");
    setSlipName("");
    setSureModalOpen(false);
    setSummaryOpen(false);
    setFinalSubmitted(false);
  }

  function confirmDate() {
    if (!selectedDay) {
      return;
    }

    setConfirmedDate(`June ${selectedDay}, 2026`);
  }

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
    }
  }

  function handleSlipUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSlipName(file.name);
    }
  }

  function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSendMessage || (!chatText.trim() && !photoName)) {
      return;
    }

    setMessageSent(true);
  }

  function downloadSummaryPdf() {
    if (!finalSubmitted) {
      return;
    }

    const summaryWindow = window.open("", "_blank", "width=820,height=900");
    if (!summaryWindow) {
      return;
    }

    summaryWindow.document.write(`
      <html>
        <head>
          <title>A Plus Kids Birthday Summary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #071B63; }
            h1 { color: #13A8DF; }
            p { font-size: 16px; line-height: 1.6; }
            strong { color: #F04B23; }
          </style>
        </head>
        <body>
          <h1>A Plus Kids Birthday Summary</h1>
          <p><strong>${t.selectedDate}:</strong> ${confirmedDate}</p>
          <p><strong>${detailFields[0].label[language]}:</strong> ${details.fullName}</p>
          <p><strong>${detailFields[1].label[language]}:</strong> ${details.age}</p>
          <p><strong>${detailFields[2].label[language]}:</strong> ${details.city}</p>
          <p><strong>${detailFields[3].label[language]}:</strong> ${details.phoneOne}</p>
          <p><strong>${detailFields[4].label[language]}:</strong> ${details.phoneTwo}</p>
          <p><strong>Birthday image:</strong> ${photoName || t.notUploaded}</p>
          <p><strong>Payment slip:</strong> ${slipName || t.notUploaded}</p>
        </body>
      </html>
    `);
    summaryWindow.document.close();
    summaryWindow.focus();
    summaryWindow.print();
  }

  return (
    <main
      className={`flex overflow-hidden bg-[#F5FBFF] px-3 pb-3 transition-[height,padding] duration-300 sm:px-5 laptop:h-screen laptop:px-8 laptop:pb-6 ${
        navHidden
          ? "h-screen pt-3 laptop:pt-3"
          : "h-[calc(100vh-6rem)] pt-[88px] sm:pt-[104px] laptop:pt-[142px]"
      }`}
    >
      <section className="mx-auto flex min-h-0 w-full min-w-0 max-w-[1320px] flex-1 flex-col overflow-hidden rounded-[24px] border-2 border-[#8EDDF7] bg-white shadow-[0_28px_80px_rgba(7,27,99,0.18),0_0_0_8px_rgba(174,232,250,0.28)] sm:rounded-[32px]">
        {/* 4. Sticky chat header - never scrolls away, like WhatsApp. */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden bg-[#AEE8FA] px-3 py-3 text-[#071B63] sm:gap-3 sm:px-6 sm:py-4">
          <Image
            src={sitePath("/images/birthday/chatbot.png")}
            alt="A Plus Kids birthday chat"
            width={56}
            height={56}
            className="h-10 w-10 rounded-full bg-white object-contain p-1 sm:h-12 sm:w-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[18px] font-bold sm:text-[26px]">
              {t.title}
            </h1>
            <p className="truncate text-[11px] font-medium text-[#29406F] sm:text-[14px]">
              {t.subtitle}
            </p>
          </div>

          <a
            href={`tel:${phoneNumber}`}
            aria-label="Voice call"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/82 shadow-[inset_0_0_0_1px_rgba(7,27,99,0.06)] sm:h-11 sm:w-11"
          >
            <Image
              src={sitePath("/images/footer/call.png")}
              alt=""
              width={28}
              height={28}
              className="h-5 w-5 object-contain sm:h-6 sm:w-6"
            />
          </a>

          <div className="relative">
            <button
              type="button"
              aria-label="Open chat menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/82 text-[20px] font-bold leading-none text-[#071B63] shadow-[inset_0_0_0_1px_rgba(7,27,99,0.06)] sm:h-11 sm:w-11 sm:text-[24px]"
            >
              ...
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-13 z-20 w-[230px] overflow-hidden rounded-[16px] border border-[#D7ECFA] bg-white p-2 text-[#071B63] shadow-[0_18px_44px_rgba(7,27,99,0.18)]">
                <button
                  type="button"
                  onClick={() => {
                    resetFlow();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-[12px] px-3 py-3 text-left text-[14px] font-semibold hover:bg-[#F1F8FF]"
                >
                  {t.menuDelete}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="block w-full rounded-[12px] px-3 py-3 text-left text-[14px] font-semibold hover:bg-[#F1F8FF]"
                >
                  {t.menuRefresh}
                </button>
                <button
                  type="button"
                  disabled={!finalSubmitted}
                  onClick={downloadSummaryPdf}
                  className="block w-full rounded-[12px] px-3 py-3 text-left text-[14px] font-semibold hover:bg-[#F1F8FF] disabled:cursor-not-allowed disabled:text-[#9AA9BA]"
                >
                  {t.menuDownload}
                  {!finalSubmitted ? (
                    <span className="mt-1 block text-[11px] font-medium">
                      {t.disabledDownload}
                    </span>
                  ) : null}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* 5. Inner chat scroll area - page header/input stay fixed, only messages scroll. */}
        <div
          ref={chatBodyRef}
          onScroll={handleChatScroll}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#DDF4FF] bg-cover bg-center px-3 py-5 sm:px-5 sm:py-7 md:px-8"
          style={{
            backgroundImage: `linear-gradient(rgba(229,247,255,0.18), rgba(229,247,255,0.24)), url(${sitePath("/images/birthday/wback.png")})`,
          }}
        >
          <div className="space-y-5">
            {/* 6. Language selector appears before introduction. */}
            <BotBubble>
              <div>
                <p className="mb-3 text-[14px] font-bold uppercase tracking-[0.1em] text-[#13A8DF]">
                  Language
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(copy) as Language[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLanguage(item)}
                      className={`min-h-11 rounded-full px-4 text-[14px] font-bold transition-colors ${
                        language === item
                          ? "bg-[#13A8DF] text-white"
                          : "bg-[#F1F8FF] text-[#071B63] hover:bg-[#DDF4FF]"
                      }`}
                    >
                      {copy[item].languageLabel}
                    </button>
                  ))}
                </div>
              </div>
            </BotBubble>

            {/* 7. Introduction tab - full text opens in scrollable fullscreen popup. */}
            <BotBubble>
              <button
                type="button"
                onClick={() => setIntroOpen(true)}
                className="block w-full text-left"
              >
                <span className="block text-[13px] font-bold uppercase tracking-[0.1em] text-[#F04B23]">
                  {t.introTitle}
                </span>
                <span className="mt-2 line-clamp-3 block">{t.introText}</span>
                <span className="mt-3 inline-flex rounded-full bg-[#EAF5FF] px-4 py-2 text-[13px] font-semibold text-[#0877EF]">
                  {t.readIntro}
                </span>
              </button>
            </BotBubble>

            {/* 8. Calendar appears before details. Details stay hidden until date confirmation. */}
            <BotBubble>
              <div>
                <p className="text-[16px] font-semibold text-[#071B63]">
                  {t.chooseDate}
                </p>
                <div className="mt-4 max-w-[460px] rounded-[14px] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(7,27,99,0.08)] sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[18px] font-bold uppercase tracking-[0.14em] text-black sm:text-[22px]">
                      June
                    </span>
                    <span className="text-[18px] font-bold tracking-[0.14em] text-black sm:text-[22px]">
                      2026
                    </span>
                  </div>
                  <div className="grid grid-cols-7 overflow-hidden rounded-[8px] border border-[#C4D7E5]">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="bg-[#F2FAFF] px-1 py-1.5 text-center text-[9px] font-bold uppercase text-[#58718D] sm:text-[11px]"
                      >
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`h-8 border-t border-[#C4D7E5] text-[12px] font-semibold transition-colors sm:h-10 sm:text-[14px] ${
                          selectedDay === day
                            ? "bg-[#13A8DF] text-white"
                            : "bg-white text-[#071B63] hover:bg-[#EAF5FF]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={confirmDate}
                    className="min-h-12 rounded-full bg-[#13A8DF] px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#0877EF]"
                  >
                    {t.confirmDate}
                  </button>
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="min-h-12 rounded-full bg-white px-5 text-[15px] font-bold text-[#0877EF] transition-colors hover:bg-[#EAF5FF]"
                  >
                    {t.resetDate}
                  </button>
                </div>
              </div>
            </BotBubble>

            {confirmedDate ? <UserBubble>{confirmedDate}</UserBubble> : null}

            {/* 9. Details section - only visible after date confirmation. */}
            {confirmedDate ? (
              <BotBubble>
                <div>
                  <p className="text-[16px] font-semibold text-[#071B63]">
                    {t.enterDetails}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {detailFields.map((field) => (
                      <label key={field.id} className="block">
                        <span className="mb-1 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#58718D]">
                          {field.label[language]}
                        </span>
                        <input
                          type={field.type}
                          inputMode={field.type === "number" ? "numeric" : undefined}
                          value={details[field.id]}
                          onChange={(event) => updateDetail(field.id, event.target.value)}
                          className="h-12 w-full rounded-[10px] border border-[#CFE5F4] bg-white px-4 text-[15px] font-medium text-[#071B63] outline-none transition-colors focus:border-[#13A8DF]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </BotBubble>
            ) : null}

            {/* 10. Message and upload step - no custom keyboard, device keyboard only. */}
            {canSendMessage ? (
              <BotBubble>
                <p>{t.messagePrompt}</p>
              </BotBubble>
            ) : null}

            {messageSent ? (
              <>
                <UserBubble>
                  {chatText ? <p>{chatText}</p> : null}
                  {photoName ? (
                    <p className="mt-2 text-[13px] font-semibold">
                      {t.imageSelected}: {photoName}
                    </p>
                  ) : null}
                </UserBubble>
                <BotBubble>{t.pictureReply}</BotBubble>
              </>
            ) : null}

            {/* 11. Payment cards - slip flow can submit, online button waits for PayHere. */}
            {canShowPayment ? (
              <BotBubble>
                <div>
                  <p className="text-[16px] font-semibold text-[#071B63]">
                    {t.paymentTitle}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode("slip");
                        slipInputRef.current?.click();
                      }}
                      className={`rounded-[14px] border p-5 text-left transition-colors ${
                        paymentMode === "slip"
                          ? "border-[#13A8DF] bg-[#EAF5FF]"
                          : "border-[#D7ECFA] bg-white hover:bg-[#F6FBFF]"
                      }`}
                    >
                      <span className="block text-[18px] font-bold text-[#071B63]">
                        {t.addSlip}
                      </span>
                      <span className="mt-2 block text-[13px] text-[#58718D]">
                        {t.addSlipHelp}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("online")}
                      className={`rounded-[14px] border p-5 text-left transition-colors ${
                        paymentMode === "online"
                          ? "border-[#F04B23] bg-[#FFF4EC]"
                          : "border-[#D7ECFA] bg-white hover:bg-[#F6FBFF]"
                      }`}
                    >
                      <span className="block text-[18px] font-bold text-[#071B63]">
                        {t.paymentOnline}
                      </span>
                      <span className="mt-2 block text-[13px] text-[#58718D]">
                        {t.paymentOnlineHelp}
                      </span>
                    </button>
                  </div>

                  {paymentMode === "online" ? (
                    <button
                      type="button"
                      disabled
                      className="mt-4 min-h-11 rounded-full bg-[#D8EAF8] px-5 text-[14px] font-bold text-[#58718D]"
                    >
                      {t.payhereSoon}
                    </button>
                  ) : null}

                  {paymentMode === "slip" && slipName ? (
                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-[#0877EF]">
                        {t.slipUploaded}: {slipName}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSureModalOpen(true)}
                        className="mt-3 min-h-11 rounded-full bg-[#13A8DF] px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#0877EF]"
                      >
                        {t.submitAll}
                      </button>
                    </div>
                  ) : null}
                </div>
              </BotBubble>
            ) : null}

            {finalSubmitted ? <BotBubble>{t.thanks}</BotBubble> : null}
          </div>
        </div>

        {/* 12. Sticky bottom input - always visible, disabled until the correct step. */}
        <form
          onSubmit={handleMessageSubmit}
          className="flex shrink-0 items-center gap-2 border-t border-[#BFE9FA] bg-white/94 p-3"
        >
          <button
            type="button"
            disabled={!canSendMessage}
            onClick={() => photoInputRef.current?.click()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EAF5FF] text-[28px] font-light leading-none text-[#0877EF] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Upload birthday image"
          >
            +
          </button>
          <input
            value={chatText}
            disabled={!canSendMessage}
            onChange={(event) => {
              setChatText(event.target.value);
              setMessageSent(false);
            }}
            placeholder={t.typeHere}
            className="min-w-0 flex-1 rounded-full bg-[#F1F8FF] px-4 py-3 text-[15px] font-medium text-[#071B63] outline-none placeholder:text-[#8193A8] disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={!canSendMessage}
            className="h-11 shrink-0 rounded-full bg-[#13A8DF] px-5 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#B8DCEF]"
          >
            {t.enter}
          </button>
        </form>
      </section>

      {/* 13. Hidden file inputs. */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={slipInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleSlipUpload}
      />

      {/* 14. Fullscreen introduction popup with scroll. */}
      {introOpen ? (
        <div className="fixed inset-0 z-[80] bg-[#071B63]/70 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-full max-w-[860px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between border-b border-[#D7ECFA] px-5 py-4">
              <h2 className="text-[20px] font-bold text-[#071B63]">
                {t.introTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIntroOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#F1F8FF] text-[22px] font-bold text-[#071B63]"
              >
                x
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6 text-[16px] font-medium leading-[1.9] text-[#29406F] sm:px-8 sm:text-[18px]">
              <p>{t.introText}</p>
              <p className="mt-5">{t.introHelp}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 15. First confirmation popup before summary. */}
      {sureModalOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071B63]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <h2 className="text-[22px] font-bold text-[#071B63]">
              {t.sureTitle}
            </h2>
            <p className="mt-3 text-[15px] font-medium text-[#58718D]">
              {t.sureHelp}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSureModalOpen(false)}
                className="min-h-11 rounded-full bg-[#F1F8FF] px-5 text-[14px] font-bold text-[#071B63]"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSureModalOpen(false);
                  setSummaryOpen(true);
                }}
                className="min-h-11 rounded-full bg-[#13A8DF] px-5 text-[14px] font-bold text-white"
              >
                {t.iamSure}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 16. Summary popup - final submit visible only here. */}
      {summaryOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071B63]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[20px] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
            <h2 className="text-center text-[22px] font-bold text-[#071B63]">
              {t.summaryTitle}
            </h2>
            <div className="mt-5 space-y-2 text-[14px] font-medium text-[#29406F] sm:text-[15px]">
              <p><strong>{t.selectedDate}:</strong> {confirmedDate}</p>
              {detailFields.map((field) => (
                <p key={field.id}>
                  <strong>{field.label[language]}:</strong> {details[field.id]}
                </p>
              ))}
              <p><strong>Birthday image:</strong> {photoName || t.notUploaded}</p>
              <p><strong>Payment slip:</strong> {slipName || t.notUploaded}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="min-h-11 rounded-full bg-[#F1F8FF] px-5 text-[14px] font-bold text-[#071B63]"
              >
                {t.edit}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSummaryOpen(false);
                  setFinalSubmitted(true);
                }}
                className="min-h-11 rounded-full bg-[#13A8DF] px-5 text-[14px] font-bold text-white"
              >
                {t.finalSubmit}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        body.birthday-chat-nav-hidden header.fixed,
        body.birthday-chat-nav-hidden nav.fixed {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-120%);
          transition:
            opacity 240ms ease,
            transform 300ms ease;
        }
      `}</style>
    </main>
  );
}
