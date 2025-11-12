import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Imprint',
  description:
    'Legal disclosure and ownership information for TravelDiary.',
};
export default function ImprintPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Imprint
      </h1>
      <p className="mt-4 leading-relaxed text-foreground/80">
        This is a placeholder imprint page.
      </p>
    </section>
  );
}
