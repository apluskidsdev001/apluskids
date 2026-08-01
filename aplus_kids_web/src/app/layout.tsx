import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import AppFooter from "@/components/layout/AppFooter";
import TaskBar from "@/components/taskBar/TaskBar";
import BackendLoadingOverlay from "@/components/layout/BackendLoadingOverlay";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

const fredoka = localFont({
  src: [
    {
      path: "../../public/fonts/Fredoka-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Fredoka-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Fredoka-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "A+ Kids TV",
  description: "A scalable kids entertainment platform built with Next.js.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${fredoka.className} min-h-full flex flex-col pb-24 laptop:pb-0`}>
        <BackendLoadingOverlay />
        <TaskBar />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
