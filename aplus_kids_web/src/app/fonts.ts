import localFont from "next/font/local";

export const fredoka = localFont({
  src: [
    {
      path: "../../public/fonts/Fredoka-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Fredoka-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Fredoka-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
});