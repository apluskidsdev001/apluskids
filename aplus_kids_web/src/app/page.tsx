import HeroSection from "@/components/home/HeroSection";
import KidsZonePage from "./kids-zone/page";
import AdvertisementBanner from "@/components/Advertisements/AdvertisementBox";

export default function HomePage() {
  return (
    <>
    <HeroSection/>
    <AdvertisementBanner
      type="image"  //image or video
      src="/videos/home/hero_video.mp4"   // path here
      href="https://google.com"  //link here
      />
    </>
  );
}
