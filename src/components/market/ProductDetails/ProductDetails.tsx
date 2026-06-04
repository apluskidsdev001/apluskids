"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type MarketProduct = {
  id: number;
  name: string;
  image: string;
  price: string;
  oldPrice: string;
  rating: number;
  reviews: number;
  category: string;
};

type ProductDetailsProps = {
  product: MarketProduct | null;
  products: MarketProduct[];
  onClose: () => void;
  onSelectProduct: (product: MarketProduct) => void;
};

function StarRating({
  rating,
  reviews,
  compact = false,
}: {
  rating: number;
  reviews: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex items-center leading-none text-[#ffcc33] ${
          compact ? "text-[11px]" : "text-[15px]"
        }`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>{star <= rating ? "\u2605" : "\u2606"}</span>
        ))}
      </div>
      <span className={compact ? "text-[10px] text-[#8a94a8]" : "text-[12px] text-[#8a94a8]"}>
        ({reviews})
      </span>
    </div>
  );
}

export default function ProductDetails({
  product,
  products,
  onClose,
}: ProductDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(product?.image ?? "");
  const [quantity, setQuantity] = useState(1);

  const galleryImages = useMemo(() => {
    if (!product) {
      return [];
    }

    const currentIndex = products.findIndex((item) => item.id === product.id);

    return Array.from({ length: Math.min(4, products.length) }, (_, index) => {
      const item = products[(currentIndex + index + products.length) % products.length];
      return item.image;
    });
  }, [product, products]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-[rgba(15,23,42,0.58)] p-4 backdrop-blur-[3px] sm:p-6"
      onClick={onClose}
    >
      <div
        className="mx-auto my-4 w-full max-w-[1100px] rounded-[28px] bg-white p-4 shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:p-5 lg:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-end">
          <button
            type="button"
            aria-label="Close popup"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl text-[#c6cad6] transition-colors hover:bg-[#f5f7ff] hover:text-[#6e63ff]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m6 6 12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0 rounded-[28px] bg-[linear-gradient(180deg,#f8f2ff_0%,#fffaf8_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
            <div className="relative overflow-hidden rounded-[24px]">
              <div className="relative aspect-square w-full">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => {
                  const currentIndex = galleryImages.indexOf(selectedImage);
                  const nextIndex =
                    (currentIndex - 1 + galleryImages.length) % galleryImages.length;
                  setSelectedImage(galleryImages[nextIndex]);
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e6eaf4] bg-white text-[#a8b0c2]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>

              <div className="grid flex-1 grid-cols-4 gap-3">
                {galleryImages.map((image) => {
                  const active = image === selectedImage;

                  return (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-[12px] border bg-white p-1.5 transition-all ${
                        active
                          ? "border-[#7d68ff] shadow-[0_8px_22px_rgba(109,95,255,0.16)]"
                          : "border-[#e9edf7]"
                      }`}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-[10px]">
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="110px"
                          className="object-cover"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Next image"
                onClick={() => {
                  const currentIndex = galleryImages.indexOf(selectedImage);
                  const nextIndex = (currentIndex + 1) % galleryImages.length;
                  setSelectedImage(galleryImages[nextIndex]);
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e6eaf4] bg-white text-[#a8b0c2]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-w-0 rounded-[28px] bg-white p-5 shadow-[0_20px_54px_rgba(14,35,96,0.08)] ring-1 ring-[#edf1fb]">
            <h2 className="text-[20px] font-bold leading-[1.15] text-[#111827] sm:text-[22px]">
              Building Blocks Set (120 Pieces)
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StarRating rating={product.rating} reviews={product.reviews} />
              <span className="text-[12px] text-[#8b95a8]">4.7 (43)</span>
              <span className="text-[12px] text-[#8b95a8]">|</span>
              <span className="text-[12px] text-[#8b95a8]">Add a review</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <p className="text-[22px] font-bold leading-none text-[#d62b86] sm:text-[24px]">
                LKR 3,990.00
              </p>
              <p className="text-[15px] text-[#b1b7c5] line-through">
                LKR 4,990.00
              </p>
              <span className="rounded-full bg-[#ffe4ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#d62b86]">
                20% Off
              </span>
            </div>

            <p className="mt-3 text-[13px] font-medium text-[#8b95a8]">
              Inclusive of VAT
            </p>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((image) => (
                <button
                  key={`swatch-${image}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`h-10 rounded-[12px] border transition-colors ${
                    image === selectedImage
                      ? "border-[#7d68ff] bg-[#f5f1ff]"
                      : "border-[#e8edf7] bg-white"
                  }`}
                />
              ))}
            </div>

            <p className="mt-5 text-[15px] font-medium text-[#485267]">Quantity</p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex h-11 items-center rounded-[14px] border border-[#e6ebf5] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="grid h-full w-11 place-items-center text-[#485267]"
                >
                  -
                </button>
                <span className="grid h-full min-w-[40px] place-items-center text-[15px] font-semibold text-[#111827]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => value + 1)}
                  className="grid h-full w-11 place-items-center text-[#485267]"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="inline-flex h-11 min-w-[168px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#f34fb7_0%,#d72b8a_100%)] px-5 text-[14px] font-semibold text-white shadow-[0_14px_26px_rgba(215,43,138,0.25)]"
              >
                Add to Cart
              </button>

              <button
                type="button"
                aria-label="Add to wishlist"
                className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#e6ebf5] text-[#a1a8b8]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 20-6.1-5.6a4.4 4.4 0 0 1 6.1-6.3 4.4 4.4 0 0 1 6.1 6.3Z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-[15px] bg-[linear-gradient(180deg,#fff06a_0%,#ffd93b_100%)] px-5 text-[16px] font-bold text-[#111827] shadow-[0_18px_32px_rgba(255,217,59,0.24)]"
            >
              <span className="mr-2 text-[16px]">+</span>
              Buy Now
            </button>

            <div className="mt-5 grid gap-2 rounded-[18px] bg-[#fbf9ff] p-3 sm:grid-cols-3">
              <div className="rounded-[14px] bg-white px-3 py-3 ring-1 ring-[#ece7ff]">
                <p className="text-[12px] font-semibold text-[#6f63ff]">
                  Secure Checkout
                </p>
                <p className="mt-1 text-[11px] text-[#7c869a]">
                  100% safe payments
                </p>
              </div>
              <div className="rounded-[14px] bg-white px-3 py-3 ring-1 ring-[#ece7ff]">
                <p className="text-[12px] font-semibold text-[#6f63ff]">
                  Islandwide Delivery
                </p>
                <p className="mt-1 text-[11px] text-[#7c869a]">
                  Fast & reliable
                </p>
              </div>
              <div className="rounded-[14px] bg-white px-3 py-3 ring-1 ring-[#ece7ff]">
                <p className="text-[12px] font-semibold text-[#6f63ff]">
                  Easy Returns
                </p>
                <p className="mt-1 text-[11px] text-[#7c869a]">
                  7-day return policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
