export type AboutLanguage = "en" | "si";

export type LocalizedText = Record<AboutLanguage, string>;

export type StoryScene = {
  id: string;
  number: string;
  side: "left" | "right";
  title: LocalizedText;
  body: LocalizedText;
  image: string;
  alt: LocalizedText;
  theme: {
    background: string;
    glow: string;
  };
};

export const aboutCopy = {
  language: {
    en: "EN",
    si: "සිං",
  },
  hero: {
    eyebrow: {
      en: "About A+ Kids",
      si: "A+ Kids ගැන",
    },
    title: {
      en: "Every Child Has a Spark.",
      si: "සෑම දරුවෙකු තුළම දිදුලන හැකියාවක් ඇත.",
    },
    highlight: {
      en: "A+ Kids Helps It Shine.",
      si: "A+ Kids එය තවත් දීප්තිමත් කරයි.",
    },
    body: {
      en: "A+ Kids turns joyful moments into learning, creativity and confidence.",
      si: "සතුටින් ඉගෙනීමට, නිර්මාණය කිරීමට සහ දක්ෂතා බෙදාගැනීමට A+ Kids දරුවන්ට ආශ්වාදයක් වේ.",
    },
    primary: {
      en: "Discover Story",
      si: "කතාව බලන්න",
    },
    secondary: {
      en: "Explore A+ Kids",
      si: "A+ Kids බලන්න",
    },
  },
  intro: {
    eyebrow: {
      en: "Kavi's Journey",
      si: "කවිගේ ගමන",
    },
    title: {
      en: "A Small Spark Can Change Everything",
      si: "කුඩා ආශ්වාදයක් විශාල වෙනසක් ඇති කරයි",
    },
    body: {
      en: "Children do not always need their energy to be controlled. Sometimes, they simply need the right inspiration and the right direction.",
      si: "දරුවන්ගේ ජවය සැමවිටම පාලනය කළ යුතු දෙයක් නොවේ. සමහරවිට ඔවුන්ට අවශ්‍ය වන්නේ නිවැරදි ආශ්වාදය සහ නිවැරදි දිශාව පමණයි.",
    },
  },
  story: {
    eyebrow: {
      en: "The Four-Scene Story",
      si: "දර්ශන හතරක කතාව",
    },
    title: {
      en: "From Natural Energy to a Bright First Step",
      si: "ස්වභාවික ජවයෙන් දීප්තිමත් පළමු පියවරකට",
    },
    finalStatement: {
      en: "Every Child Has a Spark. A+ Kids Helps It Shine.",
      si: "සෑම දරුවෙකු තුළම දිදුලන හැකියාවක් ඇත. A+ Kids එය තවත් දීප්තිමත් කරයි.",
    },
  },
  mission: {
    eyebrow: {
      en: "Mission",
      si: "මෙහෙවර",
    },
    title: {
      en: "Growing Brighter, Together",
      si: "එක්ව තවත් දීප්තිමත් වෙමු",
    },
    body: {
      en: "Our mission is to create joyful, safe and meaningful experiences that support children's curiosity, creativity and confidence while giving families content they can trust.",
      si: "දරුවන්ගේ කුතුහලය, නිර්මාණශීලීත්වය සහ විශ්වාසය වර්ධනය කිරීමටත්, පවුල්වලට විශ්වාස කළ හැකි අන්තර්ගතයක් ලබාදීමටත් අපි සතුටුදායක, ආරක්ෂිත සහ අර්ථවත් අත්දැකීම් නිර්මාණය කරමු.",
    },
    points: [
      {
        en: "Safe and child-friendly experiences",
        si: "ආරක්ෂිත සහ දරුවන්ට හිතකර අත්දැකීම්",
      },
      {
        en: "Learning through joy",
        si: "සතුට තුළින් ඉගෙනීම",
      },
      {
        en: "Opportunities for young talent",
        si: "ළමා දක්ෂතා සඳහා අවස්ථා",
      },
    ],
  },
  impact: {
    eyebrow: {
      en: "Impact",
      si: "බලපෑම",
    },
    title: {
      en: "More Than Entertainment",
      si: "විනෝදාස්වාදයට වඩා වැඩි දෙයක්",
    },
  },
  moments: {
    eyebrow: {
      en: "Real Moments",
      si: "සැබෑ මොහොතන්",
    },
    title: {
      en: "Real Children. Real Creativity. Real Moments.",
      si: "සැබෑ දරුවන්. සැබෑ නිර්මාණශීලීත්වය. සැබෑ මොහොතන්.",
    },
    body: {
      en: "This space is ready for approved A+ Kids moments: Kids Champ artwork, programme participation, birthdays, talent performances, events and behind-the-scenes images.",
      si: "Kids Champ නිර්මාණ, වැඩසටහන් සහභාගීත්වය, උපන්දින මොහොතන්, දක්ෂතා ඉදිරිපත් කිරීම් සහ සිදුවීම් මෙහි පෙන්වීමට මෙම කොටස සූදානම්.",
    },
  },
  cta: {
    eyebrow: {
      en: "Start Here",
      si: "මෙතැනින් ආරම්භ කරන්න",
    },
    title: {
      en: "Let Their Brightest Ideas Begin Here",
      si: "ඔවුන්ගේ දීප්තිමත්ම අදහස් මෙතැනින් ආරම්භ වීමට ඉඩ දෙමු",
    },
    body: {
      en: "Discover programmes, creative activities and opportunities designed to help every child learn, create and shine.",
      si: "සෑම දරුවෙකුටම ඉගෙනීමට, නිර්මාණය කිරීමට සහ දිදුලන්නට උපකාර වන වැඩසටහන් සහ අවස්ථා සොයා බලන්න.",
    },
  },
} as const;

export const storyScenes = [
  {
    id: "energy",
    number: "01",
    side: "right",
    title: {
      en: "Full of Energy",
      si: "ජවයෙන් පිරුණු දරුවෙක්",
    },
    body: {
      en: "Kavi is full of energy, moving from one unfinished activity to another. He is not a bad child. He simply has not found what truly inspires him yet.",
      si: "කවි ජවයෙන් පිරුණු දරුවෙක්. ඔහු නරක දරුවෙක් නොවේ. ඔහුට තවමත් තමන්ව සැබවින්ම ආශ්වාදනය කරන දේ හමුවී නැත.",
    },
    image: "/images/about_us/story-01-energy.webp",
    alt: {
      en: "A cheerful child-focused A+ Kids moment.",
      si: "සතුටින් පිරුණු A+ Kids ළමා මොහොතක්.",
    },
    theme: {
      background: "#F1F7FB",
      glow: "rgba(9,165,222,0.16)",
    },
  },
  {
    id: "discovery",
    number: "02",
    side: "left",
    title: {
      en: "The Spark Appears",
      si: "ආශ්වාදයේ ආරම්භය",
    },
    body: {
      en: "One day, Kavi discovers A+ Kids. Its stories, songs and creative activities capture his curiosity. For the first time, he stops only watching and begins to imagine.",
      si: "එක් දිනක කවිට A+ Kids හමුවෙයි. කතා, ගීත සහ නිර්මාණාත්මක ක්‍රියාකාරකම් ඔහුගේ කුතුහලය දිනාගනියි.",
    },
    image: "/images/about_us/story-02-discovery.webp",
    alt: {
      en: "A Kids Zone moment that suggests discovery and imagination.",
      si: "සොයාගැනීම සහ පරිකල්පනය පෙන්වන Kids Zone මොහොතක්.",
    },
    theme: {
      background: "#F5FBFF",
      glow: "rgba(254,210,52,0.24)",
    },
  },
  {
    id: "creation",
    number: "03",
    side: "right",
    title: {
      en: "He Begins to Create",
      si: "ඔහු නිර්මාණය කිරීමට පටන් ගනියි",
    },
    body: {
      en: "Kavi picks up his pencils and begins to create. His energy has not disappeared. It has found a direction.",
      si: "කවි තම පාට පෑන්සල් අතට ගෙන නිර්මාණය කිරීමට පටන් ගනියි. ඔහුගේ ජවය නැතිවී නැත. එයට නිවැරදි දිශාවක් ලැබී ඇත.",
    },
    image: "/images/about_us/story-03-creation.webp",
    alt: {
      en: "A colourful learning image representing creativity.",
      si: "නිර්මාණශීලීත්වය පෙන්වන වර්ණවත් ඉගෙනුම් රූපයක්.",
    },
    theme: {
      background: "#FFF8E4",
      glow: "rgba(234,82,39,0.18)",
    },
  },
  {
    id: "confidence",
    number: "04",
    side: "left",
    title: {
      en: "A Talent Begins to Shine",
      si: "දක්ෂතාව දිදුලන්නට පටන් ගනියි",
    },
    body: {
      en: "Kavi proudly shares his creation with his family and becomes part of Kids Champ. His small idea becomes confidence, and his hidden spark begins to shine.",
      si: "කවි තම නිර්මාණය ආඩම්බරයෙන් පවුලේ අය සමඟ බෙදාගනී. ඔහුගේ කුඩා අදහස විශ්වාසයක් බවට පත්වෙයි.",
    },
    image: "/images/about_us/story-04-confidence.webp",
    alt: {
      en: "A warm A+ Kids celebration moment.",
      si: "උණුසුම් A+ Kids සැමරුම් මොහොතක්.",
    },
    theme: {
      background: "#FFF4EE",
      glow: "rgba(9,165,222,0.22)",
    },
  },
] satisfies StoryScene[];

export const impactCards = [
  {
    title: { en: "Learn", si: "ඉගෙනගන්න" },
    body: {
      en: "Joyful experiences that encourage curiosity and discovery.",
      si: "කුතුහලය සහ සොයාගැනීම දිරිගන්වන සතුටුදායක අත්දැකීම්.",
    },
  },
  {
    title: { en: "Create", si: "නිර්මාණය කරන්න" },
    body: {
      en: "Activities that turn imagination into something children can make and share.",
      si: "පරිකල්පනය දරුවන්ට නිර්මාණය කර බෙදාගත හැකි දෙයක් බවට පත් කරන ක්‍රියාකාරකම්.",
    },
  },
  {
    title: { en: "Express", si: "ප්‍රකාශ කරන්න" },
    body: {
      en: "Opportunities for children to communicate their ideas and talents.",
      si: "අදහස් සහ දක්ෂතා ප්‍රකාශ කිරීමට දරුවන්ට ලැබෙන අවස්ථා.",
    },
  },
  {
    title: { en: "Shine", si: "දිදුලන්න" },
    body: {
      en: "Platforms such as Kids Champ that celebrate effort, creativity and participation.",
      si: "උත්සාහය, නිර්මාණශීලීත්වය සහ සහභාගීත්වය අගය කරන Kids Champ වැනි වේදිකා.",
    },
  },
] as const;
