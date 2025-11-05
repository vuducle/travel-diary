import Image from 'next/image';

export default function QuoteBanner() {
  return (
    <section className="relative isolate w-full py-20 sm:py-28">
      {/* Background image */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/quote/quote.jpg"
          alt="Street with pedicabs"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/50" />
        {/* subtle vignette */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/30" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <h2 className="font-heading text-2xl font-normal leading-tight text-white sm:text-3xl md:text-4xl">
          Every trip tells a story. Make sure yours is never forgotten
        </h2>
      </div>
    </section>
  );
}
