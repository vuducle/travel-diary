import Image from 'next/image';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const items = [
  {
    src: '/feature/feature1.jpg',
    alt: 'Writing memories',
    emoji: '📝',
    title: 'Write your memories',
    desc: 'Add journal entries for every stop.',
  },
  {
    src: '/feature/feature2.jpg',
    alt: 'Track your trips',
    emoji: '📍',
    title: 'Track your trips',
    desc: 'Visualize your journeys on a map.',
  },
  {
    src: '/feature/feature3.jpg',
    alt: 'Add photos and locations',
    emoji: '📸',
    title: 'Add photos & locations',
    desc: 'Bring your stories to life.',
  },
];

export function Features() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {items.map((f) => (
          <Card
            key={f.title}
            className="overflow-hidden border-black/5 bg-white/80 shadow-lg ring-1 ring-black/5 backdrop-blur-sm dark:bg-black/40 dark:ring-white/10"
          >
            <div className="relative aspect-video w-full">
              <Image
                src={f.src}
                alt={f.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 384px, 100vw"
              />
            </div>
            <CardHeader className="gap-2">
              <CardTitle className="font-heading text-lg font-semibold text-foreground">
                <span className="mr-2 align-middle text-base">
                  {f.emoji}
                </span>
                <span className="align-middle">{f.title}</span>
              </CardTitle>
              <CardDescription className="text-[--color-foreground] opacity-80">
                {f.desc}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default Features;
