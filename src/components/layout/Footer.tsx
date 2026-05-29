import Image from "next/image";
import Link from "next/link";
import { sitePath } from "@/utils/sitePath";

const quickLinks = [
  "Home",
  "Watch",
  "Programs",
  "Schedule",
  "Kids Champ",
  "Birthday wishes",
  "Contact",
];

const categories = [
  "Education",
  "Entertainment",
  "Art & Craft",
  "Story Telling",
  "Science & Technology",
  "Sport & Executive",
];

const contactItems = [
  {
    icon: "TEL",
    color: "text-[#EA5227]",
    content: (
      <a
        href="tel:0768212266"
        className="text-[20px] font-medium text-black transition-colors hover:text-[#EA5227] sm:text-[22px]"
      >
        076 821 2266
      </a>
    ),
  },
  {
    icon: "MAIL",
    color: "text-[#0876D8]",
    content: (
      <a
        href="mailto:apluskidstvinfo@gmail.com"
        className="break-all text-[20px] font-medium text-black transition-colors hover:text-[#0876D8] sm:text-[22px]"
      >
        apluskidstvinfo@gmail.com
      </a>
    ),
  },
  {
    icon: "LOC",
    color: "text-[#65A832]",
    content: (
      <p className="max-w-[430px] text-center text-[20px] font-medium leading-[1.25] text-black sm:text-[22px] lg:text-left">
        No.61/27, Parakum Mawatha, Kalalgoda Road, Pannipitiya, Sri Lanka.
      </p>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#EFEFF1] px-5 py-12 sm:px-8 md:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-[1220px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <div className="flex justify-center lg:justify-start">
            <Image
              src={sitePath("/images/footer/footer-pic.png")}
              alt="A Plus Kids TV footer characters"
              width={560}
              height={260}
              className="h-auto w-full max-w-[520px] object-contain"
            />
          </div>

          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="text-[24px] font-extrabold tracking-wide text-black">
                Quick Links
              </h3>

              <ul className="mt-5 space-y-3">
                {quickLinks.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#EA5227]" />
                    <Link
                      href="#"
                      className="text-[22px] font-medium leading-none text-black transition-colors hover:text-[#EA5227]"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[24px] font-extrabold tracking-wide text-black">
                Categories
              </h3>

              <ul className="mt-5 space-y-3">
                {categories.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#09A5DE]" />
                    <span className="text-[22px] font-medium leading-none text-black">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:pt-6">
          <div className="flex justify-center lg:justify-start">
            <Image
              src={sitePath("/images/footer/logo3.png")}
              alt="A Plus Kids logo"
              width={330}
              height={130}
              className="h-auto w-[230px] object-contain sm:w-[280px] lg:w-[330px]"
            />
          </div>

          <p className="mt-8 max-w-[430px] text-center text-[20px] font-normal leading-[1.35] tracking-wide text-black sm:text-[22px] lg:text-left">
            Sri Lanka first 24/7 kids TV Channel bringing fun, safe and
            educational entertainment for children.
          </p>

          <div className="mt-8 space-y-6">
            {contactItems.map((item) => (
              <div
                key={item.icon}
                className="flex items-start justify-center gap-4 lg:justify-start"
              >
                <span
                  className={`mt-1 w-12 shrink-0 text-center text-[15px] font-extrabold ${item.color}`}
                >
                  {item.icon}
                </span>
                {item.content}
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center gap-8 lg:justify-start">
            {["f", "IG", "YT"].map((item) => (
              <Link
                key={item}
                href="#"
                aria-label={item}
                className="flex h-[100px] w-[100px] items-center justify-center bg-[#D9D9D9] transition-transform hover:scale-105"
              >
                <span className="text-[24px] font-extrabold text-[#071B63]">
                  {item}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
