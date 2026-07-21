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
