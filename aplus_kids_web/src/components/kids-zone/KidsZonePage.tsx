"use client";

import ScrollRevealObserver from "../animations/ScrollRevealObserver";
import type { ContentItem } from "../admin/adminData";
import { useAdminDisplayContent } from "../admin/useAdminStorage";
import KidsZoneHero from "./sections/KidsZoneHero";
import AdvertisementBox from "../Advertisements/AdvertisementBox";
import BirthdaySection from "./sections/BirthdaySection";
import KidsChampSection from "./sections/KidsChampSection";
import EventsSection from "./sections/EventsSection";

export default function KidsZonePage() {
  const content = useAdminDisplayContent<ContentItem[]>("aplus-admin-kids-zone-content", "aplus-published-kids-zone-content", []);
  const active = content.filter((item) => item.active);
  const section = (id: string, name: string) => active.find((item) => item.id === id || item.section === name);
  const hasManagedContent = content.length > 0;
  const hero = section("hero", "Hero");
  const birthday = section("birthdays", "Birthday");
  const kidsChamp = section("kids-champ", "Kids Champ");
  const events = section("events", "Events");

  return (
    <main className="bg-white text-black">
      <ScrollRevealObserver />
      {!hasManagedContent || hero ? <KidsZoneHero content={hero} /> : null}
      <div className="relative z-30 bg-white">
        <AdvertisementBox />
      </div>

      {!hasManagedContent || birthday ? <BirthdaySection content={birthday} /> : null}
      {!hasManagedContent || kidsChamp ? <KidsChampSection content={kidsChamp} /> : null}
      {!hasManagedContent || events ? <EventsSection content={events} /> : null}
    </main>
  );
}
