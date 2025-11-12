'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative isolate min-h-[88vh] w-full overflow-hidden bg-background">
      {/* Background image */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/hero/header-bg.png"
          alt="Tropical coastline"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" /> */}
        <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/0 to-background/40" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-24 md:grid-cols-2 lg:px-10">
        {/* Left glass card (centered like design) */}
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-white/35 p-10 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/40">
          {/* soft teal gradient inside card */}
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-linear-to-br from-transparent via-transparent to-[--color-secondary]/25" />

          {/* Logo placeholder square */}
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-xl bg-white/80 shadow-md ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <Image
              src="/hero/logo.png"
              alt="Travel Diary Logo"
              width={48}
              height={48}
              className="h-auto w-12 select-none"
              priority
            />
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Capture Your Journey
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-balance text-base leading-relaxed text-foreground">
            A minimalist travel diary to remember every place,
            feeling, and story
          </p>

          <div className="mx-auto mt-8 flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-primary text-white hover:bg-primary/90"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-secondary text-white hover:bg-secondary/80"
            >
              <Link className="text-white" href="/register">
                Sign Up
              </Link>
            </Button>
          </div>
        </div>

        {/* Right photocard composite */}
        <div className="relative hidden md:block">
          <div className="pointer-events-none absolute -left-6 -top-6 size-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative mx-auto w-88 max-w-full rotate-2 overflow-visible">
            <Image
              src="/hero/header-right.png"
              alt="Stacked trip photos"
              width={640}
              height={800}
              className="h-auto w-full select-none drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
