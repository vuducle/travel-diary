'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const addLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  country: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  coverImage: z.any().optional(),
});

type AddLocationFormValues = z.infer<typeof addLocationSchema>;

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
  name?: string;
};

export default function AddLocationPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const typedResolver = zodResolver(
    addLocationSchema
  ) as Resolver<AddLocationFormValues>;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddLocationFormValues>({
    resolver: typedResolver,
  });

  // Debounced search against OpenStreetMap Nominatim
  useEffect(() => {
    const q = searchQuery.trim();
    // Clear results when empty or too short
    if (q.length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const qs = new URLSearchParams({
          q,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }
        );
        if (!res.ok) throw new Error('Search failed');
        const data: NominatimResult[] = await res.json();
        setResults(data);
        if (data.length === 0) {
          showToastRef.current(
            'No results found for that query.',
            'error'
          );
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError')
          return; // ignore canceled requests
        showToastRef.current(
          'Failed to search location. Please try again.',
          'error'
        );
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const applyResult = (r: NominatimResult) => {
    const country = r.address?.country || '';
    const primaryName =
      r.name || r.display_name.split(',')[0]?.trim() || '';
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (primaryName)
      setValue('name', primaryName, { shouldValidate: true });
    if (country) setValue('country', country);
    if (!Number.isNaN(lat)) setValue('lat', lat);
    if (!Number.isNaN(lng)) setValue('lng', lng);
    showToast('Location selected from OpenStreetMap', 'success');
  };

  const onSubmit = async (data: AddLocationFormValues) => {
    if (!tripId || typeof tripId !== 'string') {
      showToast(
        'Invalid trip. Please go back and try again.',
        'error'
      );
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('tripId', tripId);
    if (data.country) {
      formData.append('country', data.country);
    }
    if (data.lat) {
      formData.append('lat', String(data.lat));
    }
    if (data.lng) {
      formData.append('lng', String(data.lng));
    }
    if (data.coverImage && data.coverImage[0]) {
      formData.append('coverImage', data.coverImage[0]);
    }

    try {
      // Let axios set the correct multipart boundary header automatically
      await api.post('/locations', formData);
      showToast('Location added successfully!', 'success');
      router.push(`/dashboard/trips-overview/${tripId}`);
    } catch {
      showToast('Failed to add location. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Add New Location</CardTitle>
          {tripId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Link href={`/dashboard/trips-overview/${tripId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to
                Overview
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="search">
                Search by name (OpenStreetMap)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="search"
                  value={searchQuery}
                  placeholder="e.g., Ho Chi Minh City, Vietnam"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <span className="text-sm text-muted-foreground">
                    Searching…
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Type at least 3 characters to search.
              </p>
              {results.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map((r, idx) => (
                    <div
                      key={`${r.lat}-${r.lon}-${idx}`}
                      className="rounded-md border p-3 cursor-pointer hover:bg-accent"
                      onClick={() => applyResult(r)}
                    >
                      <div className="font-medium">
                        {r.display_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {r.display_name}
                      </div>
                      <div className="text-xs mt-1">
                        Lat: {r.lat} · Lng: {r.lon}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Selected location summary */}
            {(() => {
              const selName = watch('name');
              const selCountry = watch('country');
              const selLat = watch('lat');
              const selLng = watch('lng');
              const hasAny = Boolean(
                selName || selCountry || selLat || selLng
              );
              if (!hasAny) return null;
              return (
                <Card className="border border-muted">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">
                      Selected location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Name:{' '}
                        </span>
                        <span>{selName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Country:{' '}
                        </span>
                        <span>{selCountry || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Latitude:{' '}
                        </span>
                        <span>
                          {typeof selLat === 'number' ? selLat : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Longitude:{' '}
                        </span>
                        <span>
                          {typeof selLng === 'number' ? selLng : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setValue('name', '');
                          setValue('country', '');
                          setValue('lat', undefined);
                          setValue('lng', undefined);
                        }}
                      >
                        Clear selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            <div>
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Ho Chi Minh City"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="e.g., Vietnam"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  {...register('lat')}
                  placeholder="e.g., 10.7769"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  {...register('lng')}
                  placeholder="e.g., 106.7009"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="coverImage">Cover Image</Label>
              <Input
                id="coverImage"
                type="file"
                {...register('coverImage')}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !tripId}>
              {isSubmitting ? 'Adding...' : 'Add Location'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
