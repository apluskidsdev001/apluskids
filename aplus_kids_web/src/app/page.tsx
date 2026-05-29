import Home from "@/components/home/Home";
import AdvertisementBanner from "@/components/Advertisements/AdvertisementBox";
import KidsZonePage from "@/components/kids-zone/KidsZonePage";
import AdvertisementBox from "@/components/Advertisements/AdvertisementBox";

export default function HomePage() {
  return (
    <>
      <Home/>
    </>
  );
}
export function KidsZonePageWrapper() {
  return (
    <>
    <KidsZonePage/>
    <AdvertisementBox
      type="image"  //image or video
      src="/videos/home/hero_video.mp4"   // path here
      href="https://google.com"  //link here
      />
    </>
  );
}

