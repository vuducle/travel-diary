import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function AppShowcase() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Copy */}
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your travels, beautifully organized
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            Journal entries, photos, and locations live together so
            you can relive every step. Plan ahead or capture memories
            on the go.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="rounded-full bg-primary text-white hover:bg-primary/90 cursor-pointer">
              Sign up
            </Button>
            <Button
              variant="outline"
              className="rounded-full bg-secondary text-white hover:bg-secondary/90 cursor-pointer"
            >
              Learn more
            </Button>
          </div>
        </div>

        {/* Screenshot */}
        <div className="relative mx-auto w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-black/5 shadow-2xl ring-1 ring-black/10 dark:border-white/10 dark:ring-white/10">
            <Image
              src="/appshowcase/showcase.png"
              alt="TravelDiary app showcase"
              width={1600}
              height={1000}
              className="h-auto w-full select-none"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
