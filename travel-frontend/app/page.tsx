import Hero from '@/components/hero';
import Features from '@/components/features';
import AppShowcase from '@/components/app-showcase';
import QuoteBanner from '@/components/quote-banner';
import PublicGuard from '@/components/public-guard';

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
