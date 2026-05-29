import ScrollRevealObserver from "../animations/ScrollRevealObserver";
import KidsZoneHero from "./sections/KidsZoneHero";
import AdvertisementBox from "../Advertisements/AdvertisementBox";
import BirthdaySection from "./sections/BirthdaySection";
import KidsChampSection from "./sections/KidsChampSection";
import EventsSection from "./sections/EventsSection";

export default function KidsZonePage() {
  return (
    <main className="bg-white text-black">
      <ScrollRevealObserver />
      <KidsZoneHero />
      <div className="relative z-30 bg-white">
        <AdvertisementBox />
      </div>

      <BirthdaySection />
      <KidsChampSection />
      <EventsSection />
    </main>
  );
}
