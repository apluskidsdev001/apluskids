"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const products = [
  {
    id: 1,
    name: "A Plus Kids Backpack",
    image: "/images/market/Products/Product2.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 2,
    name: "A Plus Kids Cube",
    image: "/images/market/Products/Product5.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 3,
    name: "A Plus Kids Plane",
    image: "/images/market/Products/Product8.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 4,
    name: "A Plus Kids Pencil Pack",
    image: "/images/market/Products/Product7.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 5,
    name: "A Plus Kids Dino Toy",
    image: "/images/market/Products/Product9.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 6,
    name: "A Plus Kids ABC Blocks",
    image: "/images/market/Products/Product11.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 7,
    name: "A Plus Kids Cap",
    image: "/images/market/Products/Product4.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 8,
    name: "A Plus Kids Story Books",
    image: "/images/market/Products/Product1.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 9,
    name: "A Plus Kids Teddy Bear",
    image: "/images/market/Products/Product3.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
  {
    id: 10,
    name: "A Plus Kids School Bottle",
    image: "/images/market/Products/Product6.png",
    price: "Rs. 1,200",
    oldPrice: "Rs. 1,500",
    rating: 4,
    reviews: 43,
  },
];

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

export default function Products() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <h2
          className={`text-[30px] font-bold leading-none text-black transition-all duration-700 ease-out sm:text-[38px] md:text-[46px] lg:text-[52px] ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
          }`}
        >
          Featured Products
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`group cursor-pointer rounded-[20px] border border-[#edf1f7] bg-white p-3 shadow-[0_10px_28px_rgba(21,44,94,0.08)] transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_18px_36px_rgba(21,44,94,0.14)] sm:rounded-[24px] sm:p-3.5 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
              }`}
              style={{ transitionDelay: `${120 + index * 70}ms` }}
            >
              <div className="rounded-[20px] bg-[#f8fbff] p-2 transition-colors duration-300 group-hover:bg-[#f1f7ff]">
                <div className="relative aspect-square overflow-hidden rounded-[18px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              <h3 className="mt-3 text-[16px] font-bold leading-[1.3] text-black transition-colors duration-300 group-hover:text-[#4f78f3] sm:text-[15px] md:text-[16px]">
                {product.name}
              </h3>

              <StarRating rating={product.rating} reviews={product.reviews} />

              <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[22px] font-bold leading-none text-black sm:text-[20px]">
                    {product.price}
                  </p>
                  <p className="mt-1 text-[12px] text-[#9aa4b4] line-through">
                    {product.oldPrice}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full rounded-full bg-[#7a73ff] px-4 py-2.5 text-center text-[12px] font-medium leading-none text-white transition-colors duration-300 hover:bg-[#6357ff] sm:w-auto sm:px-3 sm:py-2 sm:text-[11px] md:px-4 md:text-[12px]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
