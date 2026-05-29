type AdvertisementBannerProps = {
  type?: "image" | "video";
  src?: string;
  href?: string;
  alt?: string;
};

export default function AdvertisementBanner({
  type,
  src,
  href,
  alt = "Advertisement",
}: AdvertisementBannerProps) {

  // Placeholder
  if (!src) {
    return (
      <section  className="-mt-px w-full bg-white px-3 py-4 md:px-6 md:py-8">
        <div className="mx-auto flex h-[132px] max-w-7xl items-center justify-center rounded-[22px] bg-[#D9D9D9] md:h-[120px] md:rounded-3xl">

          <p className="text-[30px] font-bold text-[#6B6B6B] md:text-3xl">
            advertisement here
          </p>

        </div>
      </section>
    );
  }

  return (
    <section  className="-mt-px w-full bg-white px-3 py-4 md:px-6 md:py-8">

      {/* Entire Banner Clickable */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto block h-[132px] max-w-7xl overflow-hidden rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:h-[120px] md:rounded-3xl"
      >

        {type === "video" ? (

          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source
              src={src}
              type="video/mp4"
            />
          </video>

        ) : (

          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
          />

        )}

      </a>
    </section>
  );
}
