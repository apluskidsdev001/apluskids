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
      <section className="-mt-px w-full bg-white px-6 py-8">
        <div className="mx-auto flex h-[120px] max-w-7xl items-center justify-center rounded-3xl bg-[#D9D9D9]">

          <p className="text-3xl font-bold text-[#6B6B6B]">
            advertisement here
          </p>

        </div>
      </section>
    );
  }

  return (
    <section className="-mt-px w-full bg-white px-6 py-8">

      {/* Entire Banner Clickable */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto block h-[120px] max-w-7xl overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
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
