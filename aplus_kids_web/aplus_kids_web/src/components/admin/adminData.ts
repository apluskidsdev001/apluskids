export type AdminCategory = {
  id: string;
  name: string;
  icon: string;
  active: boolean;
};

export type AdminVideo = {
  id: string;
  title: string;
  youtubeUrl: string;
  type: "Program" | "Trailer" | "Short";
  category: string;
  active: boolean;
};

export type ContentItem = {
  id: string;
  section: string;
  title: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
  active: boolean;
};

export type ScheduleDayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type ScheduleEntry = {
  id: string;
  time: string;
  title: string;
  youtubeUrl?: string;
};

export type WeeklySchedule = Record<ScheduleDayName, ScheduleEntry[]>;

export type HomeHeroContent = {
  titleLineOne: string;
  titleLineTwo: string;
  titleLineThree: string;
  description: string;
  videoUrl: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
};

export type HomeShortcut = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: string;
  active: boolean;
};

export type HomeLiveCard = {
  title: string;
  badge: string;
  nowLabel: string;
  programName: string;
  description?: string;
  buttonLabel: string;
  linkUrl: string;
  videoUrl: string;
  channelLabel: string;
};

export type HomeSpecialEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
  youtubeUrl: string;
  description: string;
  guests: string[];
  contact: string;
  active: boolean;
};

export const defaultHomeHero: HomeHeroContent = {
  titleLineOne: "Where Little",
  titleLineTwo: "Minds Learn,",
  titleLineThree: "Laugh & Grow!",
  description: "Sri Lanka's First 24/7 Kids TV Channel with safe, fun, and educational entertainment for every child.",
  videoUrl: "/videos/home/hero_video.mp4",
  primaryLabel: "Watch Now",
  primaryUrl: "/watch",
  secondaryLabel: "Explore Shows",
  secondaryUrl: "/watch",
};

export const defaultHomeShortcuts: HomeShortcut[] = [
  { id: "birthdays", label: "Birthdays", description: "Celebrate special birthday moments with A Plus Kids.", href: "/birthdays", icon: "/images/home/birthday pic.png", active: true },
  { id: "kids-champ", label: "Kids Champ", description: "Discover creative challenges, activities and young talent.", href: "/kids-zone", icon: "/images/home/kids_champ.png", active: true },
];

export const defaultHomeLiveCard: HomeLiveCard = {
  title: "Watch Live",
  badge: "Live",
  nowLabel: "Now Playing",
  programName: "Kids Champ",
  description: "Watch safe, fun and educational programs live throughout the day.",
  buttonLabel: "Watch Live Now",
  linkUrl: "/watch",
  videoUrl: "/videos/home/hero_video.mp4",
  channelLabel: "Dialog TV Channel 48",
};

export const defaultHomeSpecialEvents: HomeSpecialEvent[] = [
  { id: "radio-day", name: "A plus Radio", date: "25 Jun 2026", place: "Badulla", youtubeUrl: "https://www.youtube.com/watch?v=AwJR-7lrHWE", description: "A live family radio event with games, music, kids interviews, prize moments, and safe entertainment for young viewers.", guests: ["A Plus presenters", "Kids singers", "Parent guests"], contact: "+94 77 123 4567", active: true },
  { id: "kids-fiesta", name: "Kids Fiesta", date: "28 Jun 2026", place: "Colombo", youtubeUrl: "https://www.youtube.com/watch?v=XqZsoesa55w", description: "A colorful kids festival with stage activities, learning corners, character meetups, and family-friendly performances.", guests: ["Dance teams", "Story hosts", "A Plus mascots"], contact: "+94 77 234 5678", active: true },
  { id: "talent-show", name: "Talent Show", date: "05 Jul 2026", place: "Kandy", youtubeUrl: "https://www.youtube.com/watch?v=BELlZKpi1Zs", description: "A showcase for young singers, dancers, speakers, and creative performers from around the island.", guests: ["Junior performers", "Guest judges", "Music coaches"], contact: "+94 77 345 6789", active: true },
];

const scheduleVideoUrls: Record<string, string> = {
  "Rhyme Doo": "https://www.youtube.com/watch?v=XKCPXEZ0f4s",
  "A Plus Radio": "https://www.youtube.com/watch?v=AwJR-7lrHWE",
  "Ekomath Eka Kaleka": "https://www.youtube.com/watch?v=1Dwrdl9NNxk",
  "Chat with LM": "https://www.youtube.com/watch?v=5i4i9MkCiTA",
  "Kids Champ": "https://www.youtube.com/watch?v=BwoIa0v9Yts",
  "DP - Art": "https://www.youtube.com/watch?v=3r-zyu7UJss",
};

const defaultScheduleRows: ScheduleEntry[] = [
  ["06.00", "Rhyme Doo"], ["07.00", "A Plus Kids House"], ["07.30", "Plus Toon"],
  ["08.00", "A Plus Radio"], ["08.30", "Ekomath Eka Kaleka"], ["09.00", "Chat with LM"],
  ["10.00", "Kids Champ"], ["10.30", "DP - Art"], ["11.00", "Uncle Toy"], ["11.30", "O2"],
  ["12.00", "Rhyme Doo"], ["13.00", "A Plus Kids House"], ["13.30", "Plus Toon"],
  ["14.00", "Chat with LM"], ["15.00", "Kids Champ"], ["15.30", "Ekomath Eka Kaleka"],
  ["16.00", "Uncle Toy"], ["16.30", "O2"], ["17.00", "A Plus Radio"], ["17.30", "Rhyme Doo"],
  ["18.30", "A Plus Kids House"], ["19.00", "Kids Champ"], ["19.30", "O2"],
  ["20.00", "Chat with LM"], ["21.00", "A Plus Radio"], ["22.30", "DP - Art"], ["23.00", "Uncle Toy"],
].map(([time, title], index) => ({
  id: `slot-${index + 1}`,
  time,
  title,
  youtubeUrl: scheduleVideoUrls[title],
}));

export const scheduleDayNames: ScheduleDayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const defaultWeeklySchedule = Object.fromEntries(
  scheduleDayNames.map((day) => [day, defaultScheduleRows.map((row) => ({ ...row, id: `${day.toLowerCase()}-${row.id}` }))]),
) as WeeklySchedule;

export const defaultCategories: AdminCategory[] = [
  { id: "stories", name: "Stories", icon: "📚", active: true },
  { id: "education", name: "Education", icon: "🎓", active: true },
  { id: "songs", name: "Songs & Rhymes", icon: "🎵", active: true },
  { id: "events", name: "Events", icon: "⭐", active: true },
  { id: "shorts", name: "Shorts", icon: "▶", active: true },
  { id: "tv-programs", name: "TV Programs", icon: "📺", active: true },
];

export const defaultVideos: AdminVideo[] = [
  { id: "5U8KT4cPSe8", title: "Story Line", youtubeUrl: "https://www.youtube.com/watch?v=5U8KT4cPSe8", type: "Program", category: "Stories", active: true },
  { id: "4LByTo3r0uI", title: "Scholarship Learning", youtubeUrl: "https://www.youtube.com/watch?v=4LByTo3r0uI", type: "Program", category: "Education", active: true },
  { id: "AwJR-7lrHWE", title: "A Plus Radio", youtubeUrl: "https://www.youtube.com/watch?v=AwJR-7lrHWE", type: "Program", category: "Songs & Rhymes", active: true },
  { id: "gQKbGLVY9Wk", title: "Story Line Trailer", youtubeUrl: "https://www.youtube.com/watch?v=gQKbGLVY9Wk", type: "Trailer", category: "Stories", active: true },
];

export const defaultKidsZoneContent: ContentItem[] = [
  { id: "hero", section: "Hero", title: "A World Made for Little Stars", description: "Main Kids Zone introduction and featured video.", linkLabel: "Explore Kids Zone", linkUrl: "/kids-zone", active: true },
  { id: "birthdays", section: "Birthday", title: "Celebrate Your Birthday With Us", description: "Birthday wishes and TV celebration section.", linkLabel: "Send Birthday", linkUrl: "/birthdays", active: true },
  { id: "kids-champ", section: "Kids Champ", title: "Show Your Creative Talent", description: "Artwork and Kids Champ submission section.", linkLabel: "Join Kids Champ", linkUrl: "/kids-champ", active: true },
  { id: "events", section: "Events", title: "Special Events", description: "Upcoming events and family activities.", linkLabel: "View Events", linkUrl: "/kids-zone#events", active: true },
];

export const defaultFooterContent: ContentItem[] = [
  { id: "brand", section: "Brand", title: "A Plus Kids TV", description: "A happy kids TV space for songs, stories, learning moments, and bright little smiles.", linkLabel: "", linkUrl: "", active: true },
  { id: "phone", section: "Contact", title: "Phone", description: "076 821 2266", linkLabel: "Call", linkUrl: "tel:0768212266", active: true },
  { id: "email", section: "Contact", title: "Email", description: "apluskidstvinfo@gmail.com", linkLabel: "Email", linkUrl: "mailto:apluskidstvinfo@gmail.com", active: true },
  { id: "location", section: "Contact", title: "Location", description: "61/27, Parakum Mawatha, Pannipitiya", linkLabel: "Open Map", linkUrl: "https://maps.google.com", active: true },
  { id: "youtube", section: "Social", title: "YouTube", description: "Official A Plus Kids TV channel", linkLabel: "YouTube", linkUrl: "https://www.youtube.com/@Apluskidstvofficial", active: true },
];
