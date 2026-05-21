import KidsZoneHero from "./sections/KidsZoneHero";
import KidsZoneAdvertisement from "./sections/KidsZoneAdvertisement";
// import BirthdaySection from "./sections/BirthdaySection";
// import KidsChampSection from "./sections/KidsChampSection";
// import EventsSection from "./sections/EventsSection";
// import KidsZoneFooterCTA from "./sections/KidsZoneFooterCTA";

export default function KidsZonePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <KidsZoneHero />
      <KidsZoneAdvertisement />
      {/*<BirthdaySection />
      <KidsChampSection />
      <EventsSection />
      <KidsZoneFooterCTA />*/}
    </main>
  );
}
