import ScrollRevealObserver from "../animations/ScrollRevealObserver";
import AdvertisementBanner from "../Advertisements/AdvertisementBox";
import SpecialEventsSection from "../specialEvents/SpecialEventsSection";
import TrailersSection from "../trailers/TrailersSection";
import TVScheduleSection from "../tvSchedule/TVScheduleSection";
import HeroSection from "./sections/HeroSection";
import Shortcuts from "./sections/Shortcuts";

export default function Home(){
    return(
        <>
            <ScrollRevealObserver />
            <HeroSection />
            <AdvertisementBanner />
            <Shortcuts/>
            <AdvertisementBanner />
            <TrailersSection />
            <SpecialEventsSection />
            <AdvertisementBanner />
            <TVScheduleSection />
        </>
    );
}
