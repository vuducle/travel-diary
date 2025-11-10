import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-10 w-full rounded-t-3xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/40 dark:ring-white/10">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="font-heading text-xl text-foreground md:text-left text-center">
            © TravelDiary {year}
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm md:justify-end justify-center">
            <Link
              href="/"
              className="hover:underline text-[--color-link]"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="hover:underline text-[--color-link]"
            >
              About
            </Link>
            <a
              href="https://github.com/vuducle/travel-diary"
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-[--color-link]"
            >
              Github
            </a>
            <Link
              href="/privacy"
              className="hover:underline text-[--color-link]"
            >
              Privacy policy
            </Link>
            <Link
              href="/imprint"
              className="hover:underline text-[--color-link]"
            >
              Imprint
            </Link>
            <Link
              href="/contact"
              className="hover:underline text-[--color-link]"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
