"use client";

import Image from "next/image";
import Link from "next/link";
import type { ContentItem } from "@/components/admin/adminData";
import { useAdminDisplayContent } from "@/components/admin/useAdminStorage";
import { sitePath } from "@/utils/sitePath";

const mapLink =
"https://www.google.com/maps/place/A+Plus+Studio/@6.8720429,79.9501704,17z/data=!4m14!1m7!3m6!1s0x3ae250ef1d12000b:0xee30429ad2214ce1!2s61,+27+Parakum+Mawatha,+Pannipitiya+10230!3b1!8m2!3d6.8720429!4d79.9501704!3m5!1s0x3ae251eb2dcb12d9:0x610930f2010cf2b4!8m2!3d6.8714399!4d79.9502714!16s%2Fg%2F11yk2zgp99?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D";
const linkGroups = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Watch", href: "/watch" },
      { label: "Kids Zone", href: "/kids-zone" },
    ],
  },
  {
    title: "Fun Time",
    links: [
      { label: "Market", href: "/market" },
      { label: "Search", href: "/search" },
      { label: "Info", href: "/info" },
    ],
  },
  {
    title: "Kids Zone",
    links: [
      { label: "Birthdays", href: "/kids-zone#birthdays" },
      { label: "Kids Champ", href: "/kids-zone#kids-champ" },
      { label: "Events", href: "/kids-zone#events" },
    ],
  },
];

const contactItems = [
  {
    label: "Call",
    href: "tel:0768212266",
    icon: "/images/footer/call.png",
    text: "076 821 2266",
  },
  {
    label: "Email",
    href: "mailto:apluskidstvinfo@gmail.com",
    icon: "/images/footer/email.png",
    text: "apluskidstvinfo@gmail.com",
  },
  {
    label: "Location",
    href: mapLink,
    icon: "/images/footer/location.png",
    text: "61/27, Parakum Mawatha, Pannipitiya",
  },
];

const socials = ["f", "ig", "yt"];

export default function Footer() {
  const managedContent = useAdminDisplayContent<ContentItem[]>("aplus-admin-footer-content", "aplus-published-footer-content", []);
  const hasManagedContent = managedContent.length > 0;
  const activeContent = managedContent.filter((item) => item.active);
  const brand = activeContent.find((item) => item.id === "brand" || item.section === "Brand");
  const managedContacts = activeContent.filter((item) => item.section === "Contact");
  const effectiveContacts = hasManagedContent
    ? managedContacts.map((item) => ({
        label: item.title,
        href: item.linkUrl || "#",
        icon: item.title.toLowerCase().includes("mail") ? "/images/footer/email.png" : item.title.toLowerCase().includes("location") ? "/images/footer/location.png" : "/images/footer/call.png",
        text: item.description,
      }))
    : contactItems;
  const managedSocials = activeContent.filter((item) => item.section === "Social");

  return (
    <footer
      id="site-footer"
      className="relative overflow-hidden bg-[#F5FBFF] px-4 pb-8 pt-10 text-[#071B63] sm:px-6 sm:pt-12 md:px-10 lg:px-16 xl:px-20"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-28 w-28 rounded-full bg-[#FFE36E]/35 blur-3xl sm:h-36 sm:w-36" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-[#13A8DF]/16 blur-3xl sm:h-44 sm:w-44" />

      <div className="relative mx-auto w-full max-w-[1220px]">
        <div className="grid gap-9 border-b border-[#D7ECFA] pb-8 md:grid-cols-[0.95fr_1.45fr] md:gap-10 lg:grid-cols-[0.95fr_1.35fr] xl:grid-cols-[0.9fr_1.4fr]">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Image
              src={sitePath("/images/footer/logo3.png")}
              alt="A Plus Kids logo"
              width={220}
              height={88}
              className="h-auto w-[145px] object-contain sm:w-[165px] lg:w-[182px]"
              priority={false}
            />

            <p className="mt-4 max-w-[330px] text-[13px] font-medium leading-[1.7] text-[#435A84] sm:text-[14px] lg:text-[15px]">
              {hasManagedContent ? (brand?.description ?? "") : "A happy kids TV space for songs, stories, learning moments, and bright little smiles."}
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-7 text-center sm:grid-cols-3 sm:text-left md:gap-x-10 lg:gap-x-14 xl:gap-x-20"
          >
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#F04B23] sm:text-[13px]">
                  {group.title}
                </h2>

                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] font-medium leading-none text-[#233C72] transition-colors hover:text-[#13A8DF] sm:text-[14px] lg:text-[15px]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="grid gap-6 py-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-8">
          <h2 className="text-center text-[12px] font-bold uppercase tracking-[0.1em] text-[#F04B23] sm:text-[13px] lg:text-left">
            Say Hello
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {effectiveContacts.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target={item.label === "Location" ? "_blank" : undefined}
                rel={
                  item.label === "Location" ? "noopener noreferrer" : undefined
                }
                className="flex min-h-11 items-center gap-3 rounded-[8px] border border-[#D7ECFA] bg-white/72 px-3 py-2 text-[12px] font-medium leading-[1.35] text-[#233C72] transition-colors hover:border-[#13A8DF]/45 hover:text-[#0876D8] sm:text-[13px]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7FCFF]">
                  <Image
                    src={sitePath(item.icon)}
                    alt={`${item.label} icon`}
                    width={24}
                    height={24}
                    className="h-5 w-5 object-contain"
                  />
                </span>
                <span className="min-w-0 break-words">{item.text}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#D7ECFA] pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] font-medium text-[#5A6F95] sm:text-[12px]">
            Copyright. All rights reserved.
          </p>

          <div className="flex gap-2">
            {(hasManagedContent ? managedSocials.map((item) => item.linkLabel || item.title) : socials).map((item) => (
              <Link
                key={item}
                href={managedSocials.find((social) => (social.linkLabel || social.title) === item)?.linkUrl || "#"}
                aria-label={item}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D7ECFA] bg-white/80 text-[11px] font-bold uppercase text-[#071B63] transition-colors hover:bg-[#FFE36E]"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
