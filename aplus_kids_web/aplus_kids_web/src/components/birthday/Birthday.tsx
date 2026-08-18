"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { jsPDF } from "jspdf";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Language = "english" | "sinhala" | "tamil";
type DetailId = "fullName" | "age" | "city" | "phoneOne" | "phoneTwo";
type PaymentMode = "slip" | "online" | "";

type Details = Record<DetailId, string>;
type DetailErrors = Partial<Record<DetailId, string>>;

type PreviewFile = {
  id: string;
  name: string;
  url: string;
};

type SelectedBirthdayDate = {
  day: number;
  month: number;
  year: number;
  key: string;
  label: string;
};

const emptyDetails: Details = {
  fullName: "",
  age: "",
  city: "",
  phoneOne: "",
  phoneTwo: "",
};

const callNumber = "0768212266";
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Easy text update area for future content changes.
const copy = {
  english: {
    langLabel: "English",
    chatName: "A Plus Kids Birthday Chat",
    introTitle: "Introduction",
    intro:
      "Welcome to A Plus Kids Birthday Wishes. This chat helps parents send birthday details step by step. First read the introduction, choose the birthday date, add child details, upload photos, then select a payment option.",
    introButton: "Tap to read full introduction",
    dateAsk: "Please choose birthday date",
    confirmDate: "Confirm Date",
    resetDate: "Reset Date",
    dateSelected: "Birthday date selected",
    detailsAsk: "Enter child details",
    detailsSubmit: "Submit Details",
    detailsSaved: "Details saved. Now send your birthday message and photos.",
    textPlaceholder: "Type here",
    disabledPlaceholder: "Complete details first",
    uploadPhotos: "Add child photos",
    photoHint: "You can upload more than one image.",
    send: "Enter",
    photoUploaded: "Uploaded photos",
    paymentAsk: "Choose payment option",
    slip: "Add Slip",
    online: "Payment Online",
    uploadSlip: "Upload payment slip",
    payLater: "PayHere button will connect later.",
    sure: "Are your details correct?",
    sureButton: "Ok, I am sure",
    submit: "Submit",
    summaryTitle: "Check summary",
    finalThanks:
      "Thank you. Your birthday details are ready. ",
    menuDelete: "Delete all",
    menuRefresh: "Refresh",
    menuDownload: "Download summary PDF",
    menuLocked: "Available after final submit",
    fullName: "Full name",
    age: "Age",
    city: "City",
    phoneOne: "Phone number 1",
    phoneTwo: "Phone number 2",
    phoneLengthError: "Add 10 numbers.",
  },
  sinhala: {
    langLabel: "සිංහල",
    chatName: "A Plus Kids Birthday Chat",
    introTitle: "හැඳින්වීම",
    intro:
      "A Plus Kids Birthday Wishes වෙත සාදරයෙන් පිළිගනිමු. මේ chat එකෙන් උපන්දිනයට අවශ්‍ය විස්තර පියවරෙන් පියවර යවන්න පුළුවන්. මුලින් හැඳින්වීම කියවන්න, උපන්දිනය තෝරන්න, දරුවාගේ විස්තර දාන්න, ඡායාරූප upload කරන්න, පසුව payment option එක තෝරන්න.",
    introButton: "සම්පූර්ණ හැඳින්වීම කියවන්න",
    dateAsk: "කරුණාකර උපන්දිනය තෝරන්න",
    confirmDate: "දිනය Confirm කරන්න",
    resetDate: "දිනය Reset කරන්න",
    dateSelected: "තෝරාගත් උපන්දිනය",
    detailsAsk: "දරුවාගේ විස්තර ඇතුළත් කරන්න",
    detailsSubmit: "විස්තර Submit කරන්න",
    detailsSaved: "විස්තර save වුණා. දැන් birthday message සහ photos යවන්න.",
    textPlaceholder: "මෙතන type කරන්න",
    disabledPlaceholder: "මුලින් විස්තර සම්පූර්ණ කරන්න",
    uploadPhotos: "දරුවාගේ photos එකතු කරන්න",
    photoHint: "Images කිහිපයක් upload කරන්න පුළුවන්.",
    send: "Enter",
    photoUploaded: "Upload කළ photos",
    paymentAsk: "Payment option එක තෝරන්න",
    slip: "Slip එකතු කරන්න",
    online: "Online Payment",
    uploadSlip: "Payment slip upload කරන්න",
    payLater: "PayHere button එක පසුව connect කරනවා.",
    sure: "ඔබ දාපු විස්තර සියල්ල හරිද?",
    sureButton: "ඔව්, මට විශ්වාසයි",
    submit: "Submit",
    summaryTitle: "Summary එක check කරන්න",
    finalThanks:
      "ස්තුතියි. ඔබගේ birthday details සූදානම්.",
    menuDelete: "සියල්ල Delete කරන්න",
    menuRefresh: "Refresh කරන්න",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit පසුව available",
    fullName: "සම්පූර්ණ නම",
    age: "වයස",
    city: "නගරය",
    phoneOne: "දුරකථන අංකය 1",
    phoneTwo: "දුරකථන අංකය 2",
    phoneLengthError: "අංක 10ක් ඇතුළත් කරන්න.",
  },
  tamil: {
    langLabel: "தமிழ்",
    chatName: "A Plus Kids Birthday Chat",
    introTitle: "அறிமுகம்",
    intro:
      "A Plus Kids Birthday Wishes-க்கு வரவேற்கிறோம். இந்த chat மூலம் பிறந்தநாள் விவரங்களை படிப்படியாக அனுப்பலாம். முதலில் அறிமுகத்தை வாசிக்கவும், பிறந்தநாள் தேதியை தேர்வு செய்யவும், குழந்தையின் விவரங்களை சேர்க்கவும், படங்களை upload செய்யவும், பின்னர் payment option தேர்வு செய்யவும்.",
    introButton: "முழு அறிமுகத்தை வாசிக்க",
    dateAsk: "பிறந்தநாள் தேதியை தேர்வு செய்யவும்",
    confirmDate: "தேதியை Confirm செய்யவும்",
    resetDate: "தேதியை Reset செய்யவும்",
    dateSelected: "தேர்ந்தெடுத்த பிறந்தநாள்",
    detailsAsk: "குழந்தையின் விவரங்களை உள்ளிடவும்",
    detailsSubmit: "விவரங்களை Submit செய்யவும்",
    detailsSaved: "விவரங்கள் save ஆனது. இப்போது birthday message மற்றும் photos அனுப்பவும்.",
    textPlaceholder: "இங்கே type செய்யவும்",
    disabledPlaceholder: "முதலில் விவரங்களை முடிக்கவும்",
    uploadPhotos: "குழந்தையின் photos சேர்க்கவும்",
    photoHint: "பல images upload செய்யலாம்.",
    send: "Enter",
    photoUploaded: "Upload செய்த photos",
    paymentAsk: "Payment option தேர்வு செய்யவும்",
    slip: "Slip சேர்க்கவும்",
    online: "Online Payment",
    uploadSlip: "Payment slip upload செய்யவும்",
    payLater: "PayHere button பின்னர் connect செய்யப்படும்.",
    sure: "நீங்கள் சேர்த்த விவரங்கள் சரியா?",
    sureButton: "ஆம், உறுதி",
    submit: "Submit",
    summaryTitle: "Summary check செய்யவும்",
    finalThanks:
      "நன்றி. உங்கள் birthday details தயார்.",
    menuDelete: "அனைத்தையும் Delete செய்யவும்",
    menuRefresh: "Refresh செய்யவும்",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit பிறகு available",
    fullName: "முழு பெயர்",
    age: "வயது",
    city: "நகரம்",
    phoneOne: "தொலைபேசி எண் 1",
    phoneTwo: "தொலைபேசி எண் 2",
    phoneLengthError: "10 எண்கள் சேர்க்கவும்.",
  },
};

const languageTabs: Language[] = ["english", "sinhala", "tamil"];

const textOnlyFields: DetailId[] = ["fullName", "city"];
const numberOnlyFields: DetailId[] = ["age", "phoneOne", "phoneTwo"];

// Shared bubble wrappers keep the chat flow easy to scan and update.
function BotBubble({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/80 shadow-sm">
        <Image src="/images/birthday/chatbot.png" alt="" fill sizes="40px" className="object-contain p-1" />
      </div>
      <div
        className={`rounded-[22px] border border-white/70 bg-white/88 px-5 py-4 text-[#10275d] shadow-[0_14px_34px_rgba(45,151,217,0.14)] backdrop-blur-md ${
          wide ? "w-full max-w-3xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-xl rounded-[22px] bg-[#d9f2ff] px-5 py-4 text-[#08215d] shadow-[0_12px_26px_rgba(45,151,217,0.16)]">
        {children}
      </div>
    </div>
  );
}

export default function Birthday() {
  // Flow state area: future updates can plug extra steps here.
  const [language, setLanguage] = useState<Language>("english");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<SelectedBirthdayDate | null>(null);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sentChatText, setSentChatText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [childImages, setChildImages] = useState<PreviewFile[]>([]);
  const [sentChildImages, setSentChildImages] = useState<PreviewFile[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("");
  const [slipImage, setSlipImage] = useState<PreviewFile | null>(null);
  const [sureModalOpen, setSureModalOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  // Refs for chat scrolling and upload controls.
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const childImageInputRef = useRef<HTMLInputElement | null>(null);
  const slipInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedFilesRef = useRef<{
    draftImages: PreviewFile[];
    sentImages: PreviewFile[];
    slip: PreviewFile | null;
  }>({
    draftImages: [],
    sentImages: [],
    slip: null,
  });

  const t = copy[language];

  // Calendar booking window: orders are accepted only from today through the next 14 days.
  const bookingMonths = useMemo(() => {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const maxBookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
    const maxBookingTime = maxBookingDate.getTime();
    const monthCount =
      today.getFullYear() === maxBookingDate.getFullYear() && today.getMonth() === maxBookingDate.getMonth()
        ? 1
        : 2;

    return Array.from({ length: monthCount }, (_, monthOffset) => {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const leadingEmptyDays = (monthStart.getDay() + 6) % 7;

      return {
        key: `${year}-${month}`,
        label: `${monthLabels[month]} ${year}`,
        month,
        year,
        leadingEmptyDays,
        days: Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const dateKey = `${year}-${month}-${day}`;

          return {
            day,
            key: dateKey,
            disabled: date.getTime() < todayOnly || date.getTime() > maxBookingTime,
            selectedDate: {
              day,
              month,
              year,
              key: dateKey,
              label: `${monthLabels[month]} ${day}, ${year}`,
            },
          };
        }),
      };
    });
  }, []);
  const activeMonth = bookingMonths[activeMonthIndex];

  const detailsComplete = useMemo(
    () => Object.values(details).every((value) => value.trim().length > 0),
    [details],
  );
  const canTypeMessage = Boolean(confirmedDate) && detailsSubmitted;
  const canSubmitMessage = canTypeMessage && childImages.length > 0;
  const canShowPayment = canTypeMessage && messageSent;
  const canSubmitSlip = paymentMode === "slip" && Boolean(slipImage);

  // Auto-scroll only after user progress, so the first screen stays at the top.
  useEffect(() => {
    const shouldAutoScroll =
      Boolean(confirmedDate) ||
      detailsSubmitted ||
      messageSent ||
      Boolean(paymentMode) ||
      Boolean(slipImage) ||
      finalSubmitted ||
      childImages.length > 0 ||
      sentChildImages.length > 0;

    if (!shouldAutoScroll) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    confirmedDate,
    detailsSubmitted,
    messageSent,
    paymentMode,
    slipImage,
    sureModalOpen,
    summaryOpen,
    finalSubmitted,
    childImages.length,
    sentChildImages.length,
  ]);

  // Hide the global navigation only while the birthday chat itself is being used.
  useEffect(() => {
    document.body.classList.toggle("birthday-chat-nav-hidden", navHidden);
    return () => document.body.classList.remove("birthday-chat-nav-hidden");
  }, [navHidden]);

  // Keep the latest uploaded files for safe cleanup without breaking sent previews.
  useEffect(() => {
    uploadedFilesRef.current = {
      draftImages: childImages,
      sentImages: sentChildImages,
      slip: slipImage,
    };
  }, [childImages, sentChildImages, slipImage]);

  // Cleanup uploaded image object URLs only when leaving this page.
  useEffect(() => {
    return () => {
      uploadedFilesRef.current.draftImages.forEach((image) => URL.revokeObjectURL(image.url));
      uploadedFilesRef.current.sentImages.forEach((image) => URL.revokeObjectURL(image.url));
      if (uploadedFilesRef.current.slip) URL.revokeObjectURL(uploadedFilesRef.current.slip.url);
    };
  }, []);

  // Input filter area: text fields reject numbers, number fields keep digits only.
  const updateDetail = (id: DetailId, value: string) => {
    const nextValue = textOnlyFields.includes(id)
      ? value.replace(/[0-9]/g, "")
      : numberOnlyFields.includes(id)
        ? value.replace(/\D/g, "").slice(0, id === "age" ? 2 : undefined)
        : value;

    setDetails((current) => ({ ...current, [id]: nextValue }));
    setDetailsSubmitted(false);
    setDetailErrors((current) => ({ ...current, [id]: undefined }));
  };

  // Reset keeps the conversation fresh without touching other pages.
  const resetFlow = () => {
    setActiveMonthIndex(0);
    setSelectedDate(null);
    setConfirmedDate("");
    setDetails(emptyDetails);
    setDetailErrors({});
    setDetailsSubmitted(false);
    setChatText("");
    setSentChatText("");
    setMessageSent(false);
    setPaymentMode("");
    setSureModalOpen(false);
    setSummaryOpen(false);
    setFinalSubmitted(false);
    setChildImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
    setSentChildImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
    setSlipImage((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const confirmDate = () => {
    if (!selectedDate) return;
    setConfirmedDate(selectedDate.label);
  };

  const submitDetails = () => {
    const errors: DetailErrors = {};

    if (details.phoneOne.length !== 10) errors.phoneOne = t.phoneLengthError;
    if (details.phoneTwo.length !== 10) errors.phoneTwo = t.phoneLengthError;

    setDetailErrors(errors);
    if (!detailsComplete || Object.keys(errors).length > 0) return;

    setDetailsSubmitted(true);
  };

  // Multiple child images are shown in the chat, like a familiar messaging app.
  const handleChildImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const previews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setChildImages((current) => [...current, ...previews]);
    event.target.value = "";
  };

  // Draft photo remove button: user can remove a photo before pressing Enter.
  const removeDraftImage = (imageId: string) => {
    setChildImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);

      return current.filter((image) => image.id !== imageId);
    });
  };

  // Payment slip is separate because only one final proof is needed for now.
  const handleSlipUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = {
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      url: URL.createObjectURL(file),
    };

    setSlipImage((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return preview;
    });
    event.target.value = "";
  };

  // Payment slip remove button: clears preview and hides final submit until a new slip is uploaded.
  const removeSlipImage = () => {
    setSlipImage((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const handleMessageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitMessage) return;

    // Send the draft message into the chat, then clear the type area.
    setSentChatText(chatText.trim());
    setSentChildImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return childImages;
    });
    setChatText("");
    setChildImages([]);
    setMessageSent(true);
  };

  // Real PDF summary download. Keep this as jsPDF, not a fake PDF blob.
  const downloadSummaryPdf = () => {
    if (!finalSubmitted) return;

    const doc = new jsPDF();
    const rows = [
      ["Birthday date", confirmedDate || "-"],
      ["Full name", details.fullName || "-"],
      ["Age", details.age || "-"],
      ["City", details.city || "-"],
      ["Phone number 1", details.phoneOne || "-"],
      ["Phone number 2", details.phoneTwo || "-"],
      ["Child photos", sentChildImages.map((image) => image.name).join(", ") || "-"],
      ["Payment", paymentMode || "-"],
      ["Slip", slipImage?.name || "-"],
    ];

    doc.setFillColor(232, 248, 255);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(16, 39, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("A Plus Kids Birthday Summary", 16, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 111, 149);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 16, 42);

    let y = 56;
    rows.forEach(([label, value]) => {
      const valueLines = doc.splitTextToSize(value, 115);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(16, 39, 93);
      doc.text(`${label}:`, 16, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(35, 60, 114);
      doc.text(valueLines, 66, y);

      y += Math.max(10, valueLines.length * 6 + 4);
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("a-plus-kids-birthday-summary.pdf");
  };

  // Chat header back action: works like a normal app back button.
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  };

  return (
    <main
      className={`birthday-soft min-h-screen bg-[#f7fcff] px-4 pb-10 transition-[padding] duration-300 ease-out sm:px-6 lg:px-10 ${
        navHidden ? "pt-8" : "pt-[132px] sm:pt-[150px]"
      }`}
    >
      <section
        className={`mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/75 bg-white/72 shadow-[0_28px_80px_rgba(73,164,223,0.22)] backdrop-blur-xl transition-[height] duration-300 ease-out ${
          navHidden ? "h-[calc(100vh-78px)]" : "h-[calc(100vh-235px)] sm:h-[calc(100vh-250px)]"
        }`}
      >
        {/* Sticky chat header: app identity, back button, call, and menu stay visible. */}
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-white/70 bg-white/78 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/80 bg-[#eaf8ff]/90 text-2xl leading-none text-[#0b2c73] shadow-sm transition hover:-translate-x-0.5 hover:bg-white"
              aria-label="Go back"
            >
              &lt;
            </button>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white shadow-sm">
              <Image src="/images/birthday/chatbot.png" alt="A Plus Kids" fill sizes="44px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[#10275d] sm:text-lg">{t.chatName}</h1>
              <p className="truncate text-xs font-bold text-[#4c8eb7]">Chat</p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <a
              href={`tel:${callNumber}`}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-[#eaf8ff]/90 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              aria-label="Call A Plus Kids"
            >
              <Image src="/images/footer/call.png" alt="" width={22} height={22} />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-[#eaf8ff]/90 text-2xl font-black leading-none text-[#0b2c73] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              aria-label="Open menu"
            >
              ⋮
            </button>

            {/* Glass menu: high z-index so it stays above the background image. */}
            {menuOpen && (
              <div className="absolute right-0 top-14 z-[90] w-64 overflow-hidden rounded-3xl border border-white/80 bg-white/78 p-2 text-sm font-black text-[#10275d] shadow-[0_24px_60px_rgba(20,84,132,0.24)] backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={() => {
                    resetFlow();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-[#e8f8ff]"
                >
                  {t.menuDelete}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFlow();
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-[#e8f8ff]"
                >
                  {t.menuRefresh}
                </button>
                <button
                  type="button"
                  onClick={downloadSummaryPdf}
                  disabled={!finalSubmitted}
                  className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-[#e8f8ff] disabled:cursor-not-allowed disabled:text-[#8aa5bd]"
                  title={!finalSubmitted ? t.menuLocked : undefined}
                >
                  {t.menuDownload}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main chat scroll area: all automated messages live here. */}
        <div
          ref={chatBodyRef}
          onScroll={(event) => setNavHidden(event.currentTarget.scrollTop > 80)}
          className="relative flex-1 overflow-y-auto scroll-smooth bg-[#d8f3ff]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(216,243,255,0.42), rgba(216,243,255,0.42)), url('/images/birthday/wback.png')",
            backgroundSize: "760px auto",
            backgroundPosition: "center top",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            {/* Language selector and introduction message. */}
            <BotBubble wide>
              <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#eef9ff] p-1">
                {languageTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLanguage(tab)}
                    className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                      language === tab ? "bg-[#31aee4] text-white shadow-sm" : "text-[#5f7b99] hover:bg-white"
                    }`}
                  >
                    {copy[tab].langLabel}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[#0f91b9]">{t.introTitle}</p>
              <p className="text-sm font-bold leading-7 sm:text-base">{t.intro}</p>
              <button
                type="button"
                onClick={() => setIntroOpen(true)}
                className="mt-4 rounded-full bg-[#e8f8ff] px-5 py-3 text-sm font-black text-[#0f91b9] transition hover:bg-[#d6f3ff]"
              >
                {t.introButton}
              </button>
            </BotBubble>

            {/* Compact calendar area: full month visible without inner scroll. */}
            <BotBubble>
              <h2 className="mb-4 text-lg font-black">{t.dateAsk}</h2>
              <div className="rounded-3xl border border-[#bfdef2] bg-white p-4">
                <div className="mb-4 flex items-center justify-between text-2xl font-black tracking-[0.16em] text-black">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMonthIndex((index) => Math.max(0, index - 1));
                      setSelectedDate(null);
                    }}
                    disabled={activeMonthIndex === 0}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf7ff] text-base text-[#0b2c73] transition hover:bg-[#d9f2ff] disabled:cursor-not-allowed disabled:text-[#aac8da]"
                    aria-label="Previous month"
                  >
                    &lt;
                  </button>
                  <span>{monthLabels[activeMonth.month].toUpperCase()}</span>
                  <span>{activeMonth.year}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMonthIndex((index) => Math.min(bookingMonths.length - 1, index + 1));
                      setSelectedDate(null);
                    }}
                    disabled={activeMonthIndex === bookingMonths.length - 1}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf7ff] text-base text-[#0b2c73] transition hover:bg-[#d9f2ff] disabled:cursor-not-allowed disabled:text-[#aac8da]"
                    aria-label="Next month"
                  >
                    &gt;
                  </button>
                </div>
                <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-[#b8d9ef] text-center text-sm font-black">
                  {weekLabels.map((day) => (
                    <div key={day} className="bg-[#eaf7ff] py-2 text-[#54799b]">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: activeMonth.leadingEmptyDays }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-12 border-t border-[#d2e8f7]" />
                  ))}
                  {activeMonth.days.map((date) => (
                    <button
                      key={date.key}
                      type="button"
                      onClick={() => setSelectedDate(date.selectedDate)}
                      disabled={date.disabled}
                      className={`h-12 border-t border-[#d2e8f7] text-base font-black transition hover:bg-[#ddf5ff] disabled:cursor-not-allowed disabled:bg-[#f4f8fb] disabled:text-[#b6c3cf] ${
                        selectedDate?.key === date.key ? "bg-[#28abe0] text-white" : "bg-white text-[#08215d]"
                      }`}
                    >
                      {date.day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmDate}
                  disabled={!selectedDate}
                  className="rounded-2xl bg-[#31aee4] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#229bd2] disabled:cursor-not-allowed disabled:bg-[#b8dcef]"
                >
                  {t.confirmDate}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMonthIndex(0);
                    setSelectedDate(null);
                    setConfirmedDate("");
                  }}
                  className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-[#0b2c73] shadow-sm transition hover:bg-[#eaf8ff]"
                >
                  {t.resetDate}
                </button>
              </div>
            </BotBubble>

            {confirmedDate && (
              <UserBubble>
                <p className="text-sm font-black">{t.dateSelected}</p>
                <p className="mt-1 text-lg font-black">{confirmedDate}</p>
              </UserBubble>
            )}

            {/* Details form: text-only and number-only inputs are separated here. */}
            {confirmedDate && (
              <BotBubble wide>
                <h2 className="mb-4 text-lg font-black">{t.detailsAsk}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {(Object.keys(emptyDetails) as DetailId[]).map((id) => (
                    <label key={id} className={id === "phoneTwo" ? "md:col-span-2" : ""}>
                      <span className="mb-1 block text-xs font-black uppercase tracking-[0.06em] text-[#5a7b9c]">
                        {t[id]}
                      </span>
                      <div className={id === "phoneTwo" ? "flex gap-3" : ""}>
                        <input
                          value={details[id]}
                          onChange={(event) => updateDetail(id, event.target.value)}
                          inputMode={numberOnlyFields.includes(id) ? "numeric" : "text"}
                          pattern={numberOnlyFields.includes(id) ? "[0-9]*" : undefined}
                          maxLength={id === "age" ? 2 : id === "phoneOne" || id === "phoneTwo" ? 10 : undefined}
                          className={`min-h-12 w-full rounded-2xl border bg-[#f6fcff] px-4 text-sm font-black text-[#10275d] outline-none transition focus:bg-white ${
                            detailErrors[id] ? "border-[#ff5b6e]" : "border-[#cbe6f5] focus:border-[#31aee4]"
                          }`}
                        />
                        {id === "phoneTwo" && (
                          <button
                            type="button"
                            onClick={submitDetails}
                            disabled={!detailsComplete}
                            className="shrink-0 rounded-2xl bg-[#31aee4] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#229bd2] disabled:cursor-not-allowed disabled:bg-[#b8dcef]"
                          >
                            {t.detailsSubmit}
                          </button>
                        )}
                      </div>
                      {detailErrors[id] && (
                        <span className="mt-1 block text-xs font-black text-[#ff4560]">{detailErrors[id]}</span>
                      )}
                    </label>
                  ))}
                </div>
              </BotBubble>
            )}

            {detailsSubmitted && (
              <>
                <BotBubble>
                  <p className="text-sm font-black leading-6">{t.detailsSaved}</p>
                </BotBubble>
                <UserBubble>
                  <div className="grid gap-1 text-sm font-black leading-6">
                    <p>{t.fullName}: {details.fullName}</p>
                    <p>{t.age}: {details.age}</p>
                    <p>{t.city}: {details.city}</p>
                    <p>{t.phoneOne}: {details.phoneOne}</p>
                    <p>{t.phoneTwo}: {details.phoneTwo}</p>
                  </div>
                </UserBubble>
              </>
            )}

            {detailsSubmitted && !messageSent && (
              <BotBubble wide>
                <h2 className="mb-3 text-lg font-black">{t.uploadPhotos}</h2>
                <p className="mb-4 text-sm font-bold leading-6 text-[#62839f]">{t.photoHint}</p>
                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-dashed border-[#75c8ee] bg-white/65 p-4">
                  {childImages.map((image) => (
                    <div key={image.id} className="group relative h-20 w-20 shrink-0">
                      <img src={image.url} alt={image.name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                      <button
                        type="button"
                        onClick={() => removeDraftImage(image.id)}
                        className="absolute -right-1 -top-1 z-10 grid h-6 w-6 place-items-center rounded-full border border-white bg-[#10275d] text-xs leading-none text-white shadow-sm transition hover:bg-[#31aee4]"
                        aria-label={`Remove ${image.name}`}
                      >
                        x
                      </button>
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-3 hidden w-64 rounded-3xl border border-white/80 bg-white/78 p-3 shadow-[0_20px_50px_rgba(20,84,132,0.22)] backdrop-blur-2xl group-hover:block">
                        <img src={image.url} alt="" className="max-h-64 w-full rounded-2xl object-contain" />
                        <p className="mt-2 truncate text-xs font-black text-[#10275d]">{image.name}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => childImageInputRef.current?.click()}
                    className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-[#b9e2f6] bg-[#e8f8ff] text-4xl font-light leading-none text-[#31aee4] transition hover:bg-[#d6f3ff]"
                    aria-label={t.uploadPhotos}
                  >
                    +
                  </button>
                </div>
              </BotBubble>
            )}

            {/* User message preview: images appear inside the chat before payment. */}
            {messageSent && (
              <UserBubble>
                {sentChatText && <p className="mb-3 text-sm font-bold leading-6">{sentChatText}</p>}
                {sentChildImages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.06em]">{t.photoUploaded}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sentChildImages.map((image) => (
                        <a
                          key={image.id}
                          href={image.url}
                          target="_blank"
                          className="group relative block aspect-square overflow-hidden rounded-2xl border border-white/80 bg-white"
                        >
                          <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                          <span className="pointer-events-none absolute inset-x-2 bottom-2 hidden rounded-xl bg-white/80 px-2 py-1 text-[10px] font-black text-[#10275d] shadow-sm backdrop-blur-xl group-hover:block">
                            {image.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </UserBubble>
            )}

            {/* Payment cards: slip path shows submit, online path waits for PayHere API. */}
            {canShowPayment && (
              <BotBubble wide>
                <h2 className="mb-4 text-lg font-black">{t.paymentAsk}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("slip");
                      slipInputRef.current?.click();
                    }}
                    className={`rounded-3xl border p-5 text-left transition ${
                      paymentMode === "slip"
                        ? "border-[#31aee4] bg-[#e7f8ff]"
                        : "border-[#d8edf8] bg-white/80 hover:bg-[#f4fcff]"
                    }`}
                  >
                    <span className="text-base font-black text-[#10275d]">{t.slip}</span>
                    <span className="mt-1 block text-sm font-bold text-[#62839f]">{t.uploadSlip}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("online")}
                    className={`rounded-3xl border p-5 text-left transition ${
                      paymentMode === "online"
                        ? "border-[#31aee4] bg-[#e7f8ff]"
                        : "border-[#d8edf8] bg-white/80 hover:bg-[#f4fcff]"
                    }`}
                  >
                    <span className="text-base font-black text-[#10275d]">{t.online}</span>
                    <span className="mt-1 block text-sm font-bold text-[#62839f]">{t.payLater}</span>
                  </button>
                </div>

                {paymentMode === "slip" && (
                  <div className="mt-4 rounded-3xl border border-dashed border-[#75c8ee] bg-white/72 p-4">
                    {slipImage ? (
                      <div className="group relative mt-4 w-44 overflow-visible">
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
                          <img src={slipImage.url} alt={slipImage.name} className="h-full w-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={removeSlipImage}
                          className="absolute -right-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-white bg-[#10275d] text-xs leading-none text-white shadow-sm transition hover:bg-[#31aee4]"
                          aria-label={`Remove ${slipImage.name}`}
                        >
                          x
                        </button>
                        <div className="pointer-events-none absolute left-0 top-full z-30 mt-3 hidden w-72 rounded-3xl border border-white/80 bg-white/78 p-3 shadow-[0_20px_50px_rgba(20,84,132,0.22)] backdrop-blur-2xl group-hover:block">
                          <img src={slipImage.url} alt="" className="max-h-72 w-full rounded-2xl object-contain" />
                          <p className="mt-2 truncate text-xs font-black text-[#10275d]">{slipImage.name}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-[#62839f]">{t.uploadSlip}</p>
                    )}
                    {canSubmitSlip && (
                      <button
                        type="button"
                        onClick={() => setSureModalOpen(true)}
                        className="mt-4 rounded-2xl bg-[#10275d] px-6 py-3 text-sm font-black text-white transition hover:bg-[#173b87]"
                      >
                        {t.submit}
                      </button>
                    )}
                  </div>
                )}

                {paymentMode === "online" && (
                  <div className="mt-4 rounded-3xl bg-white/70 p-4 text-sm font-black text-[#62839f]">
                    {t.payLater}
                  </div>
                )}
              </BotBubble>
            )}

            {finalSubmitted && (
              <BotBubble>
                <p className="text-sm font-black leading-6">{t.finalThanks}</p>
              </BotBubble>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sticky type bar: always visible, image upload plus button included. */}
        <form
          onSubmit={handleMessageSubmit}
          className="sticky bottom-0 z-40 flex items-center gap-3 border-t border-white/75 bg-white/82 px-4 py-3 backdrop-blur-xl sm:px-6"
        >
          <button
            type="button"
            onClick={() => childImageInputRef.current?.click()}
            disabled={!canTypeMessage}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8f8ff] text-3xl font-light text-[#31aee4] transition hover:bg-[#d6f3ff] disabled:cursor-not-allowed disabled:text-[#aac8da]"
            aria-label={t.uploadPhotos}
          >
            +
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              disabled={!canTypeMessage}
              placeholder={canTypeMessage ? t.textPlaceholder : t.disabledPlaceholder}
              className="h-12 w-full rounded-full bg-[#f1f9fe] px-5 text-sm font-bold text-[#10275d] outline-none transition placeholder:text-[#a9bed0] focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmitMessage}
            className={`h-12 shrink-0 rounded-full px-6 text-sm font-black text-white transition disabled:cursor-not-allowed ${
              canSubmitMessage ? "bg-[#31aee4] shadow-sm hover:bg-[#229bd2]" : "bg-[#d9edf7]"
            }`}
          >
            {t.send}
          </button>
        </form>
      </section>

      {/* Hidden upload inputs: browser/native keyboard handles mobile typing. */}
      <input
        ref={childImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChildImages}
      />
      <input ref={slipInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlipUpload} />

      {/* Full introduction modal for long text updates later. */}
      {introOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b2c73]/35 p-4 backdrop-blur-sm">
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(8,33,93,0.25)] backdrop-blur-2xl">
            <h2 className="mb-4 text-xl font-black text-[#10275d]">{t.introTitle}</h2>
            <p className="text-base font-bold leading-8 text-[#10275d]">{t.intro}</p>
            <button
              type="button"
              onClick={() => setIntroOpen(false)}
              className="mt-6 rounded-full bg-[#31aee4] px-6 py-3 text-sm font-black text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* First confirmation modal: user confirms that all details are correct. */}
      {sureModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b2c73]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/90 p-6 text-center shadow-[0_30px_80px_rgba(8,33,93,0.25)] backdrop-blur-2xl">
            <h2 className="text-xl font-black text-[#10275d]">{t.sure}</h2>
            <button
              type="button"
              onClick={() => {
                setSureModalOpen(false);
                setSummaryOpen(true);
              }}
              className="mt-6 rounded-full bg-[#31aee4] px-6 py-3 text-sm font-black text-white"
            >
              {t.sureButton}
            </button>
          </div>
        </div>
      )}

      {/* Final summary modal: final submit appears only after user checks summary. */}
      {summaryOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b2c73]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(8,33,93,0.25)] backdrop-blur-2xl">
            <h2 className="mb-4 text-xl font-black text-[#10275d]">{t.summaryTitle}</h2>
            <div className="grid gap-2 text-sm font-bold text-[#10275d]">
              <p>Birthday date: {confirmedDate}</p>
              <p>{t.fullName}: {details.fullName}</p>
              <p>{t.age}: {details.age}</p>
              <p>{t.city}: {details.city}</p>
              <p>{t.phoneOne}: {details.phoneOne}</p>
              <p>{t.phoneTwo}: {details.phoneTwo}</p>
              <p>{t.photoUploaded}: {sentChildImages.length}</p>
              <p>{t.uploadSlip}: {slipImage?.name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSummaryOpen(false);
                setFinalSubmitted(true);
              }}
              className="mt-6 rounded-full bg-[#31aee4] px-6 py-3 text-sm font-black text-white"
            >
              {t.submit}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .birthday-soft,
        .birthday-soft * {
          letter-spacing: 0;
        }

        .birthday-soft .font-black,
        .birthday-soft .font-bold,
        .birthday-soft .font-semibold {
          font-weight: 500 !important;
        }

        body.birthday-chat-nav-hidden header.fixed,
        body.birthday-chat-nav-hidden nav.fixed {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-120%);
          transition:
            opacity 220ms ease,
            transform 220ms ease;
        }
      `}</style>
    </main>
  );
}
