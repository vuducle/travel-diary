import Hero from '@/components/hero';
import Features from '@/components/features';
import AppShowcase from '@/components/app-showcase';
import QuoteBanner from '@/components/quote-banner';
import PublicGuard from '@/components/public-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'TravelDiary – Capture trips, locations, photos and journal entries in one beautiful place.',
};

function HomePage() {
  return (
    <PublicGuard>
      <Hero />
      <Features />
      <AppShowcase />
      <QuoteBanner />
    </PublicGuard>
  );
}

export default HomePage;
