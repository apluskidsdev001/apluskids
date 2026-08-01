"use client";

type TopPartsProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export default function TopParts({
  categories,
  selectedCategory,
  onSelectCategory,
}: TopPartsProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <h2 className="text-[30px] font-bold leading-none text-black sm:text-[38px] md:text-[46px] lg:text-[52px]">
        Featured Products
      </h2>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
        <p className="text-[20px] font-semibold leading-none text-[#575a63] sm:text-[22px]">
          Categories
        </p>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {categories.map((category) => {
            const isActive = category === selectedCategory;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`inline-flex h-10 min-w-[112px] items-center justify-center rounded-full px-5 text-[16px] font-bold leading-none transition-all duration-200 sm:h-11 sm:min-w-[122px] sm:px-6 sm:text-[17px] ${
                  isActive
                    ? "bg-[linear-gradient(180deg,#756dff_0%,#6357ff_100%)] text-white shadow-[0_10px_22px_rgba(99,87,255,0.24)]"
                    : "bg-[#d9d9d9] text-[#6c6c6c] hover:bg-[#cfcfcf]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
