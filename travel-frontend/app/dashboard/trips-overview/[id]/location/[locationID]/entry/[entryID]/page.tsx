'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api/client';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAssetUrl } from '@/lib/utils/image-utils';
import { Spinner } from '@/components/ui/spinner';

type EntryImage = { id: string; url: string; order: number };
type Entry = {
  id: number;
  title: string;
  content?: string | null;
  date: string;
  images?: EntryImage[];
};

export default function EntryDetailPage() {
  const params = useParams();
  const entryIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.entryID;
  const entryId = Array.isArray(entryIdRaw)
    ? entryIdRaw[0]
    : entryIdRaw;
  const tripIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.id;
  const tripId = Array.isArray(tripIdRaw) ? tripIdRaw[0] : tripIdRaw;
  const locationIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.locationID;
  const locationId = Array.isArray(locationIdRaw)
    ? locationIdRaw[0]
    : locationIdRaw;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!entryId) return;
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const idNum = parseInt(entryId, 10);
        const resp = await api.get(`/entries/${idNum}`);
        if (canceled) return;
        setEntry(resp.data as Entry);
      } catch (err: unknown) {
        const getMessage = (e: unknown) => {
          if (!e) return 'Failed to load entry';
          if (typeof e === 'object' && e !== null) {
            const o = e as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            return (
              o.response?.data?.message ||
              o.message ||
              'Failed to load entry'
            );
          }
          return String(e);
        };
        setError(getMessage(err));
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [entryId]);

  if (loading) return <Spinner fullScreen label="Loading entry..." />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!entry) return <div className="p-4">Entry not found</div>;

  const images: EntryImage[] = entry.images || [];

  return (
    <div className="relative min-h-screen ">
      <div className="relative container mx-auto p-4 max-w-3xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {tripId && locationId && (
          <div className="mb-4">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="backdrop-blur-md bg-primary/90 hover:bg-primary/80 shadow-lg"
            >
              <Link
                href={`/dashboard/trips-overview/${tripId}/location/${locationId}`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
          </div>
        )}

        <Card className="rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
              {entry.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs sm:text-sm text-gray-700/80 dark:text-gray-300/80 mb-4 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur border border-white/40">
              {new Date(entry.date).toLocaleString()}
            </div>
            {entry.content && (
              <div className="prose prose-sm sm:prose-base prose-zinc dark:prose-invert max-w-none mb-6">
                {entry.content}
              </div>
            )}

            {images.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative rounded-xl overflow-hidden border border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur hover:bg-white/20 transition cursor-pointer"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <Image
                        src={getAssetUrl(img.url) || img.url}
                        alt={`entry-img-${idx}`}
                        width={800}
                        height={600}
                        unoptimized
                        className="object-cover w-full h-40"
                      />
                    </div>
                  ))}
                </div>

                <Lightbox
                  open={lightboxIndex !== null}
                  close={() => setLightboxIndex(null)}
                  slides={images.map((i) => ({
                    src: getAssetUrl(i.url) || i.url,
                  }))}
                  index={lightboxIndex ?? 0}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
