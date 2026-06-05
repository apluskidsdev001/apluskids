"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { jsPDF } from "jspdf";
import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Language = "english" | "sinhala" | "tamil";
type DetailId = "fullName" | "city" | "mobile" | "school" | "age" | "topic";
type Details = Record<DetailId, string>;
type DetailErrors = Partial<Record<DetailId | "artImage", string>>;

type PreviewFile = {
  id: string;
  name: string;
  url: string;
};

const emptyDetails: Details = {
  fullName: "",
  age: "",
  school: "",
  city: "",
  mobile: "",
  topic: "",
};

const callNumber = "0768212266";
const avatarPath = "/icons/shortcuts/KidsChamp.png";
const backgroundPath = "/images/kidschamp/kcback.png";

// Easy copy update area for future Sinhala/Tamil/client text updates.
const copy = {
  english: {
    langLabel: "English",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "Submit your art",
    intro:
      "Welcome to A Plus Kids Kids Champ. Submit your art image, add your details, and tell us the topic of your art. This is a simple chat-style submission flow for Kids Champ.",
    introButton: "Read full introduction",
    uploadAsk: "Upload your drawing",
    uploadHint: "Add one or more clear photos of the artwork.",
    uploadSubmit: "Submit Drawing",
    uploadSuccess: "Upload successful. Now please add your details.",
    detailsAsk: "Enter art details",
    detailsSubmit: "Submit Details",
    detailsSaved: "Are you sure these details are correct?",
    yesSure: "Yes, sure",
    updateButton: "Update",
    summaryTitle: "Check your summary",
    okButton: "OK",
    uploadArt: "Upload art image",
    uploadRequired: "Please upload your art image before submitting.",
    textPlaceholder: "Type a short note",
    disabledPlaceholder: "Submit details first",
    send: "Enter",
    artUploaded: "Submitted art",
    thanks: "Thank you!",
    checking: "Checking available slots",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks: "Thanks for submitting your art. This is the preview slot for the current version.",
    menuDelete: "Delete all",
    menuRefresh: "Refresh",
    menuDownload: "Download summary PDF",
    menuLocked: "Available after final submit",
    fullName: "Full name",
    city: "City",
    mobile: "Mobile number",
    school: "School",
    age: "Age",
    topic: "Topic of art",
    required: "This field is required.",
    mobileError: "Enter a valid mobile number.",
  },
  sinhala: {
    langLabel: "සිංහල",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "ඔබේ චිත්‍රය submit කරන්න",
    intro:
      "A Plus Kids Kids Champ වෙත සාදරයෙන් පිළිගනිමු. ඔබේ art image එක upload කරලා, විස්තර දාලා, art topic එක සඳහන් කරන්න. මේක Kids Champ සඳහා chat style submission flow එකක්.",
    introButton: "සම්පූර්ණ හැඳින්වීම කියවන්න",
    uploadAsk: "ඔබේ drawing එක upload කරන්න",
    uploadHint: "Artwork එක පැහැදිලිව පේන photo එකක් හෝ කිහිපයක් add කරන්න.",
    uploadSubmit: "Drawing Submit කරන්න",
    uploadSuccess: "Upload successful. දැන් ඔබේ විස්තර ඇතුළත් කරන්න.",
    detailsAsk: "Art විස්තර ඇතුළත් කරන්න",
    detailsSubmit: "විස්තර Submit කරන්න",
    detailsSaved: "මේ විස්තර සියල්ල නිවැරදිද?",
    yesSure: "ඔව්, sure",
    updateButton: "Update",
    summaryTitle: "Summary එක check කරන්න",
    okButton: "OK",
    uploadArt: "Art image upload කරන්න",
    uploadRequired: "Submit කිරීමට පෙර art image එක upload කරන්න.",
    textPlaceholder: "කුඩා note එකක් type කරන්න",
    disabledPlaceholder: "මුලින් විස්තර submit කරන්න",
    send: "Enter",
    artUploaded: "Submit කළ art",
    thanks: "ස්තුතියි!",
    checking: "Available slots check කරනවා",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks: "ඔබේ art එක submit කළාට ස්තුතියි. මේක current version එකේ preview slot එකයි.",
    menuDelete: "සියල්ල Delete කරන්න",
    menuRefresh: "Refresh කරන්න",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit පසුව available",
    fullName: "සම්පූර්ණ නම",
    city: "නගරය",
    mobile: "දුරකථන අංකය",
    school: "පාසල",
    age: "වයස",
    topic: "Art topic",
    required: "මෙම field එක අවශ්‍යයි.",
    mobileError: "නිවැරදි mobile number එකක් ඇතුළත් කරන්න.",
  },
  tamil: {
    langLabel: "தமிழ்",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "உங்கள் art submit செய்யவும்",
    intro:
      "A Plus Kids Kids Champ-க்கு வரவேற்கிறோம். உங்கள் art image upload செய்து, விவரங்களை சேர்த்து, art topic குறிப்பிடவும். இது Kids Champ-க்கான chat style submission flow.",
    introButton: "முழு அறிமுகத்தை வாசிக்க",
    uploadAsk: "உங்கள் drawing upload செய்யவும்",
    uploadHint: "Artwork தெளிவாக தெரியும் ஒரு அல்லது பல photos add செய்யவும்.",
    uploadSubmit: "Drawing Submit செய்யவும்",
    uploadSuccess: "Upload successful. இப்போது உங்கள் விவரங்களை உள்ளிடவும்.",
    detailsAsk: "Art விவரங்களை உள்ளிடவும்",
    detailsSubmit: "விவரங்களை Submit செய்யவும்",
    detailsSaved: "இந்த விவரங்கள் சரியா?",
    yesSure: "ஆம், sure",
    updateButton: "Update",
    summaryTitle: "Summary check செய்யவும்",
    okButton: "OK",
    uploadArt: "Art image upload செய்யவும்",
    uploadRequired: "Submit செய்வதற்கு முன் art image upload செய்யவும்.",
    textPlaceholder: "சிறிய note type செய்யவும்",
    disabledPlaceholder: "முதலில் விவரங்களை submit செய்யவும்",
    send: "Enter",
    artUploaded: "Submitted art",
    thanks: "நன்றி!",
    checking: "Available slots check செய்கிறோம்",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks: "உங்கள் art submit செய்ததற்கு நன்றி. இது current version preview slot.",
    menuDelete: "அனைத்தையும் Delete செய்யவும்",
    menuRefresh: "Refresh செய்யவும்",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit பிறகு available",
    fullName: "முழு பெயர்",
    city: "நகரம்",
    mobile: "மொபைல் எண்",
    school: "பள்ளி",
    age: "வயது",
    topic: "Art topic",
    required: "இந்த field அவசியம்.",
    mobileError: "சரியான mobile number உள்ளிடவும்.",
  },
};

const languageTabs: Language[] = ["english", "sinhala", "tamil"];
void copy;
const localizedCopy = {
  english: {
    langLabel: "English",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "Submit your art",
    intro:
      "Welcome to A Plus Kids Kids Champ. Upload your art image, add your details, and tell us the topic of your artwork. This chat helps you submit everything step by step.",
    introButton: "Read full introduction",
    uploadAsk: "Upload your drawing",
    uploadHint: "Add one or more clear photos of the artwork.",
    uploadSubmit: "Submit Drawing",
    uploadSuccess: "Upload successful. Now please add your details.",
    detailsAsk: "Enter art details",
    detailsSubmit: "Submit Details",
    detailsSaved: "Are you sure these details are correct?",
    yesSure: "Yes, sure",
    updateButton: "Update",
    summaryTitle: "Check your summary",
    okButton: "OK",
    uploadArt: "Upload art image",
    uploadRequired: "Please upload your art image before submitting.",
    textPlaceholder: "Type a short note",
    disabledPlaceholder: "Submit details first",
    send: "Enter",
    artUploaded: "Submitted art",
    thanks: "Thank you!",
    checking: "Checking available slots",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks:
      "Thanks for submitting your art. Your artwork will be reviewed and the expected TV display slot is shown here.",
    menuDelete: "Delete all",
    menuRefresh: "Refresh",
    menuDownload: "Download summary PDF",
    menuLocked: "Available after final submit",
    fullName: "Full name",
    city: "City",
    mobile: "Mobile number",
    school: "School",
    age: "Age",
    topic: "Topic of art",
    required: "This field is required.",
    mobileError: "Add 10 numbers.",
    ageError: "Enter a valid age.",
  },
  sinhala: {
    langLabel: "සිංහල",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "ඔබේ චිත්‍රය submit කරන්න",
    intro:
      "A Plus Kids Kids Champ වෙත සාදරයෙන් පිළිගනිමු. ඔබේ art image එක upload කරලා, විස්තර දාලා, art topic එක සඳහන් කරන්න. මේ chat එකෙන් ඔබට step by step submit කරන්න පුළුවන්.",
    introButton: "සම්පූර්ණ හැඳින්වීම කියවන්න",
    uploadAsk: "ඔබේ drawing එක upload කරන්න",
    uploadHint: "Artwork එක පැහැදිලිව පේන photo එකක් හෝ කිහිපයක් add කරන්න.",
    uploadSubmit: "Drawing submit කරන්න",
    uploadSuccess: "Upload successful. දැන් ඔබේ විස්තර ඇතුළත් කරන්න.",
    detailsAsk: "Art විස්තර ඇතුළත් කරන්න",
    detailsSubmit: "විස්තර submit කරන්න",
    detailsSaved: "මේ විස්තර සියල්ල නිවැරදිද?",
    yesSure: "ඔව්, sure",
    updateButton: "Update",
    summaryTitle: "Summary එක check කරන්න",
    okButton: "OK",
    uploadArt: "Art image upload කරන්න",
    uploadRequired: "Submit කිරීමට පෙර art image එක upload කරන්න.",
    textPlaceholder: "කුඩා note එකක් type කරන්න",
    disabledPlaceholder: "මුලින් විස්තර submit කරන්න",
    send: "Enter",
    artUploaded: "Submit කළ art",
    thanks: "ස්තුතියි!",
    checking: "Available slots check කරනවා",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks:
      "ඔබේ art එක submit කළාට ස්තුතියි. ඔබේ art එක review කරලා expected TV display slot එක මෙහි පෙන්වයි.",
    menuDelete: "සියල්ල delete කරන්න",
    menuRefresh: "Refresh කරන්න",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit පසුව available",
    fullName: "සම්පූර්ණ නම",
    city: "නගරය",
    mobile: "දුරකථන අංකය",
    school: "පාසල",
    age: "වයස",
    topic: "Art topic",
    required: "මෙම field එක අවශ්‍යයි.",
    mobileError: "අංක 10ක් ඇතුළත් කරන්න.",
    ageError: "නිවැරදි වයසක් ඇතුළත් කරන්න.",
  },
  tamil: {
    langLabel: "தமிழ்",
    chatName: "A Plus Kids Kids Champ",
    introTitle: "உங்கள் art submit செய்யவும்",
    intro:
      "A Plus Kids Kids Champ-க்கு வரவேற்கிறோம். உங்கள் art image upload செய்து, விவரங்களை சேர்த்து, art topic குறிப்பிடவும். இந்த chat மூலம் step by step submit செய்யலாம்.",
    introButton: "முழு அறிமுகத்தை வாசிக்க",
    uploadAsk: "உங்கள் drawing upload செய்யவும்",
    uploadHint: "Artwork தெளிவாக தெரியும் ஒரு அல்லது பல photos add செய்யவும்.",
    uploadSubmit: "Drawing submit செய்யவும்",
    uploadSuccess: "Upload successful. இப்போது உங்கள் விவரங்களை உள்ளிடவும்.",
    detailsAsk: "Art விவரங்களை உள்ளிடவும்",
    detailsSubmit: "விவரங்களை submit செய்யவும்",
    detailsSaved: "இந்த விவரங்கள் சரியா?",
    yesSure: "ஆம், sure",
    updateButton: "Update",
    summaryTitle: "Summary check செய்யவும்",
    okButton: "OK",
    uploadArt: "Art image upload செய்யவும்",
    uploadRequired: "Submit செய்வதற்கு முன் art image upload செய்யவும்.",
    textPlaceholder: "சிறிய note type செய்யவும்",
    disabledPlaceholder: "முதலில் விவரங்களை submit செய்யவும்",
    send: "Enter",
    artUploaded: "Submitted art",
    thanks: "நன்றி!",
    checking: "Available slots check செய்கிறோம்",
    greatNews: "Great News",
    date: "Date",
    time: "Time",
    channel: "Channel",
    timeValue: "07:30 PM (Evening Slot)",
    channelValue: "A Plus Kids",
    finalThanks:
      "உங்கள் art submit செய்ததற்கு நன்றி. உங்கள் art review செய்யப்பட்டு expected TV display slot இங்கே காட்டப்படும்.",
    menuDelete: "அனைத்தையும் delete செய்யவும்",
    menuRefresh: "Refresh செய்யவும்",
    menuDownload: "Summary PDF Download",
    menuLocked: "Final submit பிறகு available",
    fullName: "முழு பெயர்",
    city: "நகரம்",
    mobile: "மொபைல் எண்",
    school: "பள்ளி",
    age: "வயது",
    topic: "Art topic",
    required: "இந்த field அவசியம்.",
    mobileError: "10 எண்கள் சேர்க்கவும்.",
    ageError: "சரியான வயது உள்ளிடவும்.",
  },
};
const textOnlyFields: DetailId[] = ["fullName", "city", "school"];
const numberOnlyFields: DetailId[] = ["mobile", "age"];
const multilineFields: DetailId[] = ["topic"];
const detailFieldOrder: DetailId[] = ["fullName", "age", "school", "city", "mobile", "topic"];

// Bot bubble: same chat language as Birthday, with KidsChamp-specific content.
function BotBubble({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/85 shadow-sm">
        <Image src={avatarPath} alt="" fill sizes="40px" className="object-contain p-1" />
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

function formatSlotDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KidsChamp() {
  // Main flow state: details -> art image upload -> auto thank-you slot.
  const [language, setLanguage] = useState<Language>("english");
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [chatText, setChatText] = useState("");
  const [sentChatText, setSentChatText] = useState("");
  const [artImages, setArtImages] = useState<PreviewFile[]>([]);
  const [sentArtImages, setSentArtImages] = useState<PreviewFile[]>([]);
  const [uploadSubmitted, setUploadSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  // Refs for scroll and uploads.
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const artInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedFilesRef = useRef<{
    draftImages: PreviewFile[];
    sentImages: PreviewFile[];
  }>({
    draftImages: [],
    sentImages: [],
  });

  const t = localizedCopy[language];
  const slotDate = useMemo(() => {
    const today = new Date();
    return formatSlotDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14));
  }, []);

  // Auto-scroll when the automated flow moves forward.
  useEffect(() => {
    const shouldAutoScroll =
      uploadSubmitted || detailsSubmitted || sentArtImages.length > 0 || submissionComplete;

    if (!shouldAutoScroll) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [uploadSubmitted, detailsSubmitted, sentArtImages.length, submissionComplete]);

  // Hide global nav only while this chat is actively scrolled.
  useEffect(() => {
    document.body.classList.toggle("kidschamp-chat-nav-hidden", navHidden);
    return () => document.body.classList.remove("kidschamp-chat-nav-hidden");
  }, [navHidden]);

  // Keep object URLs safe and clear them on unmount.
  useEffect(() => {
    uploadedFilesRef.current = {
      draftImages: artImages,
      sentImages: sentArtImages,
    };
  }, [artImages, sentArtImages]);

  useEffect(() => {
    return () => {
      uploadedFilesRef.current.draftImages.forEach((image) => URL.revokeObjectURL(image.url));
      uploadedFilesRef.current.sentImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  // Input filter: name/city/school are text-only, mobile is 10 digits, age is 2 digits.
  const updateDetail = (id: DetailId, value: string) => {
    const nextValue = textOnlyFields.includes(id)
      ? value.replace(/[0-9]/g, "")
      : id === "age"
        ? value.replace(/\D/g, "").slice(0, 2)
        : numberOnlyFields.includes(id)
          ? value.replace(/\D/g, "").slice(0, 10)
          : value;

    setDetails((current) => ({ ...current, [id]: nextValue }));
    setDetailsSubmitted(false);
    setSubmissionComplete(false);
    setSummaryOpen(false);
    setDetailErrors((current) => ({ ...current, [id]: undefined }));
  };

  // Validation: show red borders and messages only for wrong/missing fields.
  const validateDetails = () => {
    const errors: DetailErrors = {};

    (Object.keys(emptyDetails) as DetailId[]).forEach((id) => {
      if (!details[id].trim()) errors[id] = t.required;
    });

    if (details.mobile.trim() && details.mobile.trim().length !== 10) {
      errors.mobile = t.mobileError;
    }

    if (details.age.trim() && Number(details.age) < 1) {
      errors.age = t.ageError;
    }
    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitDetails = () => {
    if (!validateDetails()) return;
    setDetailsSubmitted(true);
  };

  // Art image upload: must be supplied before final submission.
  const handleArtImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const previews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setArtImages((current) => [...current, ...previews]);
    setUploadSubmitted(false);
    setDetailErrors((current) => ({ ...current, artImage: undefined }));
    event.target.value = "";
  };

  const submitUploadedArt = () => {
    if (artImages.length === 0) {
      setDetailErrors((current) => ({ ...current, artImage: t.uploadRequired }));
      return;
    }

    setUploadSubmitted(true);
  };

  const removeDraftImage = (imageId: string) => {
    setArtImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
      const nextImages = current.filter((image) => image.id !== imageId);
      if (nextImages.length === 0) {
        setUploadSubmitted(false);
        setDetailsSubmitted(false);
      }

      return nextImages;
    });
  };

  const completeSubmission = () => {
    // Move uploaded image into chat after summary OK.
    setSentChatText("");
    setSentArtImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return artImages;
    });
    setArtImages([]);
    setChatText("");
    setSummaryOpen(false);
    setSubmissionComplete(true);
  };

  const resetFlow = () => {
    setDetails(emptyDetails);
    setDetailErrors({});
    setDetailsSubmitted(false);
    setChatText("");
    setSentChatText("");
    setUploadSubmitted(false);
    setSummaryOpen(false);
    setSubmissionComplete(false);
    setArtImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
    setSentArtImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
  };

  // Real PDF summary download for Kids Champ final submissions.
  const downloadSummaryPdf = () => {
    if (!submissionComplete) return;

    const doc = new jsPDF();
    const rows = [
      ["Full name", details.fullName || "-"],
      ["Age", details.age || "-"],
      ["School", details.school || "-"],
      ["City", details.city || "-"],
      ["Mobile number", details.mobile || "-"],
      ["Topic of art", details.topic || "-"],
      ["Submitted art images", sentArtImages.map((image) => image.name).join(", ") || "-"],
      ["Slot date", slotDate],
      ["Slot time", t.timeValue],
      ["Channel", t.channelValue],
    ];

    doc.setFillColor(232, 248, 255);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(16, 39, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("A Plus Kids Champ Summary", 16, 22);

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

    doc.save("a-plus-kids-champ-summary.pdf");
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/kids-zone";
  };

  // Hysteresis scroll rule prevents navbar/chat height flickering on small scrolls.
  const handleChatScroll = (scrollTop: number) => {
    setNavHidden((current) => {
      if (!current && scrollTop > 180) return true;
      if (current && scrollTop < 35) return false;
      return current;
    });
  };

  return (
    <main
      className={`kidschamp-soft min-h-screen bg-[#f7fcff] px-4 pb-10 transition-[padding] duration-300 ease-out sm:px-6 lg:px-10 ${
        navHidden ? "pt-8" : "pt-[132px] sm:pt-[150px]"
      }`}
    >
      <section
        className={`mx-auto flex max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/75 bg-white/72 shadow-[0_28px_80px_rgba(73,164,223,0.22)] backdrop-blur-xl transition-[height] duration-300 ease-out ${
          navHidden ? "h-[calc(100vh-78px)]" : "h-[calc(100vh-235px)] sm:h-[calc(100vh-250px)]"
        }`}
      >
        {/* Chat header: back, avatar, page name, call, and menu. */}
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
              <Image src={avatarPath} alt="A Plus Kids" fill sizes="44px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[#10275d] sm:text-lg">{t.chatName}</h1>
              <p className="truncate text-xs font-bold text-[#4c8eb7]">Art submission</p>
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
              ...
            </button>

            {/* Glass menu: only refresh/delete for this version. */}
            {menuOpen && (
              <div className="absolute right-0 top-14 z-[90] w-56 overflow-hidden rounded-3xl border border-white/80 bg-white/78 p-2 text-sm font-black text-[#10275d] shadow-[0_24px_60px_rgba(20,84,132,0.24)] backdrop-blur-2xl">
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
                  disabled={!submissionComplete}
                  className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-[#e8f8ff] disabled:cursor-not-allowed disabled:text-[#8aa5bd]"
                  title={!submissionComplete ? t.menuLocked : undefined}
                >
                  {t.menuDownload}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main chat area: background uses KidsChamp image. */}
        <div
          ref={chatBodyRef}
          onScroll={(event) => handleChatScroll(event.currentTarget.scrollTop)}
          className="relative flex-1 overflow-y-auto scroll-smooth bg-[#d8f3ff]"
          style={{
            backgroundImage: `linear-gradient(rgba(216,243,255,0.36), rgba(216,243,255,0.36)), url('${backgroundPath}')`,
            backgroundSize: "760px auto",
            backgroundPosition: "center top",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            {/* Language selector and intro: update this copy for client wording. */}
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
                    {localizedCopy[tab].langLabel}
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

            {/* Upload drawing first: details form appears only after a successful upload. */}
            {!submissionComplete && (
              <BotBubble wide>
                <h2 className="mb-3 text-lg font-black">{t.uploadAsk}</h2>
                <p className="mb-3 text-sm font-bold leading-6 text-[#527392]">{t.uploadHint}</p>
                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-dashed border-[#75c8ee] bg-white/65 p-4">
                  {artImages.map((image) => (
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
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => artInputRef.current?.click()}
                    className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-[#b9e2f6] bg-[#e8f8ff] text-4xl font-light leading-none text-[#31aee4] transition hover:bg-[#d6f3ff]"
                    aria-label={t.uploadArt}
                  >
                    +
                  </button>
                </div>
                {detailErrors.artImage && <p className="mt-2 text-xs font-black text-[#ff4560]">{detailErrors.artImage}</p>}
                <button
                  type="button"
                  onClick={submitUploadedArt}
                  disabled={artImages.length === 0 || uploadSubmitted}
                  className="mt-4 rounded-2xl bg-[#31aee4] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#229bd2] disabled:cursor-not-allowed disabled:bg-[#b8dcef]"
                >
                  {t.uploadSubmit}
                </button>
              </BotBubble>
            )}

            {uploadSubmitted && !submissionComplete && (
              <BotBubble>
                <p className="text-sm font-black leading-6">{t.uploadSuccess}</p>
              </BotBubble>
            )}

            {/* Details form: appears only after user submits uploaded art. */}
            {uploadSubmitted && !submissionComplete && !detailsSubmitted && (
              <BotBubble wide>
                <h2 className="mb-4 text-lg font-black">{t.detailsAsk}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {detailFieldOrder.map((id) => (
                    <label key={id} className={multilineFields.includes(id) ? "md:col-span-2" : ""}>
                      <span className="mb-1 block text-xs font-black uppercase tracking-[0.06em] text-[#5a7b9c]">
                        {t[id]}
                      </span>
                      {multilineFields.includes(id) ? (
                        <textarea
                          value={details[id]}
                          onChange={(event) => updateDetail(id, event.target.value)}
                          rows={2}
                          className={`min-h-20 w-full resize-none rounded-2xl border bg-[#f6fcff] px-4 py-3 text-sm font-black text-[#10275d] outline-none transition focus:bg-white ${
                            detailErrors[id] ? "border-[#ff5b6e]" : "border-[#cbe6f5] focus:border-[#31aee4]"
                          }`}
                        />
                      ) : (
                        <input
                          value={details[id]}
                          onChange={(event) => updateDetail(id, event.target.value)}
                          inputMode={numberOnlyFields.includes(id) ? "numeric" : "text"}
                          pattern={numberOnlyFields.includes(id) ? "[0-9]*" : undefined}
                          maxLength={id === "age" ? 2 : numberOnlyFields.includes(id) ? 10 : undefined}
                          className={`min-h-12 w-full rounded-2xl border bg-[#f6fcff] px-4 text-sm font-black text-[#10275d] outline-none transition focus:bg-white ${
                            detailErrors[id] ? "border-[#ff5b6e]" : "border-[#cbe6f5] focus:border-[#31aee4]"
                          }`}
                        />
                      )}
                      {detailErrors[id] && <span className="mt-1 block text-xs font-black text-[#ff4560]">{detailErrors[id]}</span>}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={submitDetails}
                  className="mt-4 rounded-2xl bg-[#31aee4] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#229bd2]"
                >
                  {t.detailsSubmit}
                </button>
              </BotBubble>
            )}

            {detailsSubmitted && (
              <BotBubble>
                <p className="text-sm font-black leading-6">{t.detailsSaved}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailsSubmitted(false)}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0b2c73] shadow-sm transition hover:bg-[#eaf8ff]"
                  >
                    {t.updateButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(true)}
                    className="rounded-2xl bg-[#31aee4] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#229bd2]"
                  >
                    {t.yesSure}
                  </button>
                </div>
              </BotBubble>
            )}

            {/* User submitted art preview. */}
            {submissionComplete && (
              <UserBubble>
                {sentChatText && <p className="mb-3 text-sm font-bold leading-6">{sentChatText}</p>}
                <p className="mb-2 text-xs font-black uppercase tracking-[0.06em]">{t.artUploaded}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sentArtImages.map((image) => (
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
              </UserBubble>
            )}

            {/* Automated reply: demo slot appears after final art submit. */}
            {submissionComplete && (
              <>
                <BotBubble>
                  <p className="text-sm font-black leading-7">{t.thanks}</p>
                  <p className="mt-1 text-sm font-black leading-7">{t.checking}</p>
                </BotBubble>
                <BotBubble>
                  <p className="mb-3 text-base font-black text-[#182bff]">{t.greatNews}</p>
                  <div className="rounded-3xl bg-[#ecffe8] p-4 text-sm font-black text-[#10275d] shadow-inner">
                    <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
                      <span>{t.date}</span>
                      <span>: {slotDate}</span>
                      <span>{t.time}</span>
                      <span>: {t.timeValue}</span>
                      <span>{t.channel}</span>
                      <span>: {t.channelValue}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-black leading-6">{t.finalThanks}</p>
                </BotBubble>
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom type bar: quick upload shortcut only; final submit happens in the chat cards. */}
        <div className="sticky bottom-0 z-40 flex items-center gap-3 border-t border-white/75 bg-white/82 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => artInputRef.current?.click()}
            disabled={submissionComplete || uploadSubmitted}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8f8ff] text-3xl font-light text-[#31aee4] transition hover:bg-[#d6f3ff] disabled:cursor-not-allowed disabled:text-[#aac8da]"
            aria-label={t.uploadArt}
          >
            +
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              disabled
              placeholder={uploadSubmitted ? t.disabledPlaceholder : t.uploadArt}
              className="h-12 w-full rounded-full bg-[#f1f9fe] px-5 text-sm font-bold text-[#10275d] outline-none transition placeholder:text-[#a9bed0] focus:bg-white"
            />
            {detailErrors.artImage && <p className="mt-1 text-xs font-black text-[#ff4560]">{detailErrors.artImage}</p>}
          </div>
        </div>
      </section>

      {/* Hidden native image picker. */}
      <input ref={artInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleArtImages} />

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

      {/* Summary modal: final OK triggers the thank-you and date slot. */}
      {summaryOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b2c73]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(8,33,93,0.25)] backdrop-blur-2xl">
            <h2 className="mb-4 text-xl font-black text-[#10275d]">{t.summaryTitle}</h2>
            <div className="grid gap-3 text-sm font-bold text-[#10275d] sm:grid-cols-2">
              {[
                [t.fullName, details.fullName],
                [t.age, details.age],
                [t.school, details.school],
                [t.city, details.city],
                [t.mobile, details.mobile],
                [t.topic, details.topic],
                [t.artUploaded, String(artImages.length)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-2xl border border-[#d7effa] bg-[#f5fbff] px-4 py-3 ${
                    label === t.topic ? "sm:col-span-2" : ""
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.06em] text-[#5a7b9c]">{label}</p>
                  <p className="mt-1 break-words text-sm font-black text-[#10275d]">{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={completeSubmission}
              className="mt-6 rounded-full bg-[#31aee4] px-6 py-3 text-sm font-black text-white"
            >
              {t.okButton}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .kidschamp-soft,
        .kidschamp-soft * {
          letter-spacing: 0;
        }

        .kidschamp-soft .font-black,
        .kidschamp-soft .font-bold,
        .kidschamp-soft .font-semibold {
          font-weight: 500 !important;
        }

        body.kidschamp-chat-nav-hidden header.fixed,
        body.kidschamp-chat-nav-hidden nav.fixed {
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
