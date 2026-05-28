import KidsZoneHero from "./sections/KidsZoneHero";
import AdvertisementBox from "../Advertisements/AdvertisementBox";
import BirthdaySection from "./sections/BirthdaySection";
import KidsChampSection from "./sections/KidsChampSection";
import EventsSection from "./sections/EventsSection";

export default function KidsZonePage() {
  return (
    <main className="bg-white text-black">
      <KidsZoneHero />
      <AdvertisementBox 
        type="image"
        src="/images/kidszone/advertisement.jpg"
        href="https://google.com"
      />

      <BirthdaySection />
      <KidsChampSection />
      <EventsSection />
    </main>
  );
}
