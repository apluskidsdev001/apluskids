import Home from "@/components/home/Home";

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
    <AdvertisementBanner
      type="image"  //image or video
      src="/videos/home/hero_video.mp4"   // path here
      href="https://google.com"  //link here
      />
    </>
  );
}

