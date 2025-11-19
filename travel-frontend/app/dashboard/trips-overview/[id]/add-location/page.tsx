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
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Dynamically import LocationMap to avoid SSR issues with Leaflet
const LocationMap = dynamic(
  () => import('@/components/core/location-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg border border-border flex items-center justify-center bg-muted">
        <Spinner label="Loading map..." />
      </div>
    ),
  }
);

const addLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  road: z.string().optional(),
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
    county?: string;
    road?: string;
    street?: string;
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
    const state = r.address?.state || '';
    const city =
      r.address?.city || r.address?.town || r.address?.village || '';
    const street = r.address?.street || '';
    const road = r.address?.road || '';
    const primaryName =
      r.name || r.display_name.split(',')[0]?.trim() || '';
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (primaryName)
      setValue('name', primaryName, { shouldValidate: true });
    if (country) setValue('country', country);
    if (state) setValue('state', state);
    if (city) setValue('city', city);
    if (street) setValue('street', street);
    if (road) setValue('road', road);
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
    if (data.state) {
      formData.append('state', data.state);
    }
    if (data.city) {
      formData.append('city', data.city);
    }
    if (data.street) {
      formData.append('street', data.street);
    }
    if (data.road) {
      formData.append('road', data.road);
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
      const resp = await api.post('/locations', formData);
      const newId = resp?.data?.id;
      const qs = newId
        ? `?locationCreated=1&locationId=${encodeURIComponent(
            String(newId)
          )}`
        : '?locationCreated=1';
      router.push(`/dashboard/trips-overview/${tripId}${qs}`);
    } catch {
      showToast('Failed to add location. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Add New Location
          </CardTitle>
          {tripId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 w-full sm:w-auto"
            >
              <Link href={`/dashboard/trips-overview/${tripId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to
                Overview
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="search">
                Search by name (OpenStreetMap)
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Input
                  id="search"
                  value={searchQuery}
                  placeholder="e.g., Ho Chi Minh City, Vietnam"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {isSearching && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Searching…
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Type at least 3 characters to search.
              </p>
              {results.length > 0 && (
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                  {results.map((r, idx) => (
                    <div
                      key={`${r.lat}-${r.lon}-${idx}`}
                      className="rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => applyResult(r)}
                    >
                      <div className="font-medium text-sm sm:text-base wrap-break-word">
                        {r.display_name.split(',')[0]}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {r.display_name}
                      </div>
                      <div className="text-xs mt-1 text-muted-foreground">
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
              const selStreet = watch('street');
              const selLat = watch('lat');
              const selLng = watch('lng');
              const hasAny = Boolean(
                selName || selCountry || selStreet || selLat || selLng
              );
              if (!hasAny) return null;
              const hasValidCoordinates =
                typeof selLat === 'number' &&
                typeof selLng === 'number' &&
                !Number.isNaN(selLat) &&
                !Number.isNaN(selLng);
              return (
                <Card className="border border-muted">
                  <CardHeader className="py-3 px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">
                      Selected location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:gap-1">
                        <span className="text-muted-foreground font-medium sm:font-normal">
                          Name:{' '}
                        </span>
                        <span className="wrap-break-word">
                          {selName || '-'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-1">
                        <span className="text-muted-foreground font-medium sm:font-normal">
                          Country:{' '}
                        </span>
                        <span className="wrap-break-word">
                          {selCountry || '-'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:gap-1">
                        <span className="text-muted-foreground font-medium sm:font-normal">
                          Street:{' '}
                        </span>
                        <span className="wrap-break-word">
                          {selStreet || '-'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-1">
                        <span className="text-muted-foreground font-medium sm:font-normal">
                          Latitude:{' '}
                        </span>
                        <span>
                          {typeof selLat === 'number' ? selLat : '-'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-1">
                        <span className="text-muted-foreground font-medium sm:font-normal">
                          Longitude:{' '}
                        </span>
                        <span>
                          {typeof selLng === 'number' ? selLng : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Map Display */}
                    {hasValidCoordinates && (
                      <div className="mt-4">
                        <LocationMap
                          lat={selLat}
                          lng={selLng}
                          locationName={selName}
                          street={selStreet}
                          country={selCountry}
                        />
                      </div>
                    )}

                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setValue('name', '');
                          setValue('country', '');
                          setValue('street', '');
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="e.g., Ho Chi Minh"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="e.g., Ho Chi Minh City"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="e.g., Nguyen Hue Street"
                />
              </div>
              <div>
                <Label htmlFor="road">Road</Label>
                <Input
                  id="road"
                  {...register('road')}
                  placeholder="e.g., Nguyen Hue"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button
              type="submit"
              disabled={isSubmitting || !tripId}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Adding...' : 'Add Location'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
