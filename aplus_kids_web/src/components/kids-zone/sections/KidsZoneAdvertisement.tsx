export default function KidsZoneAdvertisement() {
  return (
    <section className="w-full bg-white px-6 pb-12 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-[8px] border-2 border-dashed border-[#13A8DF]/45 bg-[#F7FCFF] px-6 py-8 text-center md:min-h-[180px]">
          <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#13A8DF]">
            Advertisement
          </span>
          <h2 className="mt-3 text-[30px] font-bold leading-tight text-black md:text-[38px]">
            Your Ad Here
          </h2>
          <p className="mt-3 max-w-[620px] text-[17px] font-medium leading-[1.45] text-black/70 md:text-[18px]">
            Promote kids events, classes, birthday offers, and family-friendly
            brands with A+ Kids.
          </p>
        </div>
      </div>
    </section>
  );
}
