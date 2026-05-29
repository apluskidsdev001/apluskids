import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/layout/Footer";
import TaskBar from "@/components/taskBar/TaskBar";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${fredoka.className} min-h-full flex flex-col pb-24 laptop:pb-0`}>
        <TaskBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
