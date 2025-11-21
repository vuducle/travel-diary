'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';

type EntryImage = { id: string; url: string; order: number };
type Entry = {
  id: number;
  title: string;
  content?: string | null;
  date: string;
  images?: EntryImage[];
  location?: {
    id: string;
    name: string;
  };
};

export default function PublicEntryDetailPage() {
  const params = useParams();
  const entryIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.entryId;
  const entryId = Array.isArray(entryIdRaw)
    ? entryIdRaw[0]
    : entryIdRaw;
  const tripIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.id;
  const tripId = Array.isArray(tripIdRaw) ? tripIdRaw[0] : tripIdRaw;
  const locationIdRaw = (
    params as Record<string, string | string[] | undefined>
  )?.locationId;
  const locationId = Array.isArray(locationIdRaw)
    ? locationIdRaw[0]
    : locationIdRaw;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    null
  );

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const fetchEntry = useCallback(async () => {
    if (!entryId || !tripId) return;
    setLoading(true);
    try {
      // Fetch entries for the trip and find the specific one
      const resp = await api.get('/entries/public', {
        params: { tripId, locationId },
      });
      const items = resp.data.items || resp.data || [];
      const foundEntry = items.find(
        (e: Entry) => String(e.id) === String(entryId)
      );

      if (foundEntry) {
        setEntry(foundEntry);
        setError(null);
      } else {
        setError('Entry not found');
      }
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
      const errorMsg = getMessage(err);
      setError(errorMsg);
      showToastRef.current(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [entryId, tripId, locationId]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (canceled) return;
      await fetchEntry();
    })();
    return () => {
      canceled = true;
    };
  }, [fetchEntry]);

  if (loading) return <Spinner fullScreen label="Loading entry..." />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!entry) return <div className="p-4">Entry not found</div>;

  const images: EntryImage[] = entry.images || [];

  const cover =
    images.length > 0
      ? getAssetUrl(images[0].url) || images[0].url
      : '/form/bg-chinatown.jpg';

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl">
          <div className="relative h-64 sm:h-[420px] w-full">
            <Image
              src={cover}
              alt={entry.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />
          </div>
          <div className="absolute left-6 bottom-6 text-white">
            <h1 className="text-2xl sm:text-4xl font-extrabold drop-shadow-md">
              {entry.title}
            </h1>
            <p className="mt-1 text-sm text-white opacity-90">
              {new Date(entry.date).toLocaleString()}
            </p>
          </div>
          <div className="absolute left-6 top-6">
            {tripId && locationId && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="backdrop-blur-md bg-black/30"
              >
                <Link
                  href={`/dashboard/trip/${tripId}/location/${locationId}`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Meta + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl">
              <CardContent>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {entry.content ? (
                    entry.content
                  ) : (
                    <em className="text-muted">
                      No description provided.
                    </em>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="rounded-xl overflow-hidden shadow-sm border group"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={getAssetUrl(img.url) || img.url}
                        alt={`img-${idx}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Lightbox
              open={lightboxIndex !== null}
              close={() => setLightboxIndex(null)}
              slides={images.map((i) => ({
                src: getAssetUrl(i.url) || i.url,
              }))}
              index={lightboxIndex ?? 0}
            />
          </div>

          <aside className="space-y-4">
            <Card className="rounded-2xl p-4">
              <CardHeader>
                <CardTitle className="text-sm">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {entry.location ? (
                    <Link
                      href={`/dashboard/trip/${tripId}/location/${entry.location.id}`}
                      className="font-medium text-primary"
                    >
                      {entry.location.name}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl p-4">
              <CardHeader>
                <CardTitle className="text-sm">Share</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? window.location.href
                        : ''
                    }
                    className="flex-1 input"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        typeof window !== 'undefined'
                          ? window.location.href
                          : ''
                      );
                      showToastRef.current('Link copied!', 'success');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
