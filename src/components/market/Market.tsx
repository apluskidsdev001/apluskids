import HeroSection from "./MarketPage/HeroSection";
import Categories from "./MarketPage/Categories";
import Products from "./MarketPage/Products";

const slideTime = 4500;

export default function Market() {
  return (
    <main className="min-h-screen bg-white text-[#081944]">
      <HeroSection slideIntervalMs={slideTime} />
      <Categories />
      <Products />
    </main>
  );
}
