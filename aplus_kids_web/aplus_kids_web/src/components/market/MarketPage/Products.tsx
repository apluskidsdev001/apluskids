"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ProductDetails, {
  type MarketProduct,
} from "../ProductDetails/ProductDetails";
import TopParts from "./TopParts";

const categories = ["All", "School", "Toys", "Art", "Books", "Accessories"];

const products: MarketProduct[] = [
  {
    id: 1,
    name: "A Plus Kids Backpack",
    image: "/images/market/Products/Product2.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "School",
  },
  {
    id: 2,
    name: "A Plus Kids Cube",
    image: "/images/market/Products/Product5.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Toys",
  },
  {
    id: 3,
    name: "A Plus Kids Plane",
    image: "/images/market/Products/Product8.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Toys",
  },
  {
    id: 4,
    name: "A Plus Kids Pencil Pack",
    image: "/images/market/Products/Product7.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Art",
  },
  {
    id: 5,
    name: "A Plus Kids Dino Toy",
    image: "/images/market/Products/Product9.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Toys",
  },
  {
    id: 6,
    name: "A Plus Kids ABC Blocks",
    image: "/images/market/Products/Product11.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Toys",
  },
  {
    id: 7,
    name: "A Plus Kids Cap",
    image: "/images/market/Products/Product4.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Accessories",
  },
  {
    id: 8,
    name: "A Plus Kids Story Books",
    image: "/images/market/Products/Product1.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Books",
  },
  {
    id: 9,
    name: "A Plus Kids Teddy Bear",
    image: "/images/market/Products/Product3.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "Toys",
  },
  {
    id: 10,
    name: "A Plus Kids School Bottle",
    image: "/images/market/Products/Product6.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
    category: "School",
  },
];

const trendingProducts = [
  products[0],
  products[1],
  products[2],
  products[3],
  products[8],
  products[6],
  products[4],
  products[7],
  products[9],
];

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  const isLeft = direction === "left";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={isLeft ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function StarRating({
  rating,
  reviews,
}: {
  rating: number;
  reviews: number;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      <div className="flex items-center text-[16px] leading-none text-[#ffb800] sm:text-[14px] md:text-[15px]">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "\u2605" : "\u2606"}</span>
        ))}
      </div>
      <span className="text-[12px] text-[#7c869a]">({reviews})</span>
    </div>
  );
}

function ProductCard({
  product,
  index,
  isVisible,
  compact = false,
  onSelect,
}: {
  product: MarketProduct;
  index: number;
  isVisible: boolean;
  compact?: boolean;
  onSelect: (product: MarketProduct) => void;
}) {
  return (
    <div
      data-focus-item={compact ? "" : undefined}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(product)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(product);
        }
      }}
      className={`group cursor-pointer rounded-[20px] border border-[#edf1f7] bg-white p-3 shadow-[0_10px_28px_rgba(21,44,94,0.08)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_18px_36px_rgba(21,44,94,0.14)] sm:rounded-[24px] sm:p-3.5 ${
        compact ? "w-[210px] shrink-0 sm:w-[230px] md:w-[250px]" : ""
      } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"}`}
      style={{ transitionDelay: `${120 + index * 70}ms` }}
    >
      <div className="rounded-[20px] bg-[#f8fbff] p-2 transition-colors duration-300 group-hover:bg-[#f1f7ff]">
        <div className="relative aspect-square overflow-hidden rounded-[18px]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={
              compact
                ? "(max-width: 640px) 70vw, (max-width: 1024px) 35vw, 250px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
            }
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <h3
        className={`mt-3 font-bold leading-[1.3] text-black transition-colors duration-300 group-hover:text-[#4f78f3] ${
          compact ? "text-[14px] sm:text-[15px]" : "text-[16px] sm:text-[15px] md:text-[16px]"
        }`}
      >
        {product.name}
      </h3>

      <StarRating rating={product.rating} reviews={product.reviews} />

      <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`font-bold leading-none text-black ${compact ? "text-[18px] sm:text-[20px]" : "text-[22px] sm:text-[20px]"}`}>
            {product.price}
          </p>
          <p className="mt-1 text-[12px] text-[#9aa4b4] line-through">
            {product.oldPrice}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(product);
          }}
          className={`rounded-full bg-[#7a73ff] text-center font-medium leading-none text-white transition-colors duration-300 hover:bg-[#6357ff] ${
            compact
              ? "w-auto px-3 py-2 text-[10px] sm:px-4 sm:text-[11px]"
              : "w-full px-4 py-2.5 text-[12px] sm:w-auto sm:px-3 sm:py-2 sm:text-[11px] md:px-4 md:text-[12px]"
          }`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const sectionRef = useRef<HTMLElement>(null);
  const trendingSliderRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  function scrollTrending(direction: "left" | "right") {
    const offset = direction === "left" ? -280 : 280;

    trendingSliderRef.current?.scrollBy({
      left: offset,
      behavior: "smooth",
    });
  }

  return (
    <section
      ref={sectionRef}
      id="market-categories"
      className="bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div
          className={`transition-all duration-700 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
          }`}
        >
          <TopParts
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              isVisible={isVisible}
              onSelect={setSelectedProduct}
            />
          ))}
        </div>

        <div
          className={`relative mt-12 transition-all duration-700 ease-out sm:mt-14 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
          }`}
          style={{ transitionDelay: "180ms" }}
        >
          <h2 className="text-[30px] font-bold leading-none text-black sm:text-[38px] md:text-[46px] lg:text-[52px]">
            Trending Now
          </h2>

          <div className="relative mt-6 sm:mt-8">
            <button
              type="button"
              aria-label="Scroll trending products left"
              onClick={() => scrollTrending("left")}
              className="absolute left-0 top-1/2 z-10 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#b5b5b5] shadow-[0_12px_26px_rgba(21,44,94,0.12)] transition-colors hover:text-[#7a73ff] md:flex"
            >
              <ArrowIcon direction="left" />
            </button>

            <div
              ref={trendingSliderRef}
              data-focus-strip
              className="flex gap-4 overflow-x-auto px-1 pt-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5"
            >
              {trendingProducts.map((product, index) => (
                <ProductCard
                  key={`trending-${product.id}`}
                  product={product}
                  index={index}
                  isVisible={isVisible}
                  compact
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Scroll trending products right"
              onClick={() => scrollTrending("right")}
              className="absolute right-0 top-1/2 z-10 hidden h-14 w-14 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#b5b5b5] shadow-[0_12px_26px_rgba(21,44,94,0.12)] transition-colors hover:text-[#7a73ff] md:flex"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>
      </div>

      <ProductDetails
        key={selectedProduct?.id ?? "product-details"}
        product={selectedProduct}
        products={products}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={setSelectedProduct}
      />
    </section>
  );
}
