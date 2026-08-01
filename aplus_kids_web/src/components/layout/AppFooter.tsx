"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const hiddenFooterPaths = ["/birthdays", "/kids-champ", "/admin", "/login", "/register"];

export default function AppFooter() {
  const pathname = usePathname();
  const shouldHideFooter = hiddenFooterPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
