'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

// Dynamically import LocationMap to avoid SSR issues with Leaflet
const LocationMap = dynamic(
  () => import('@/components/core/location-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-lg border border-border flex items-center justify-center bg-muted">
        <Spinner label="Loading map..." />
      </div>
    ),
  }
);

const updateLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  country: z.string().optional(),
  street: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  coverImage: z.any().optional(),
});

type UpdateLocationFormValues = z.infer<typeof updateLocationSchema>;

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

interface Location {
  id: string;
  name: string;
  country?: string;
  street?: string;
  lat?: number;
  lng?: number;
  coverImage?: string;
  tripId: string;
}

interface UpdateLocationModalProps {
  open: boolean;
  onClose: () => void;
  location: Location;
  onSuccess?: () => void;
}

export default function UpdateLocationModal({
  open,
  onClose,
  location,
  onSuccess,
}: UpdateLocationModalProps) {
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
    updateLocationSchema
  ) as Resolver<UpdateLocationFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateLocationFormValues>({
    resolver: typedResolver,
  });

  // Load location data when modal opens
  useEffect(() => {
    if (open && location) {
      reset({
        name: location.name,
        country: location.country || '',
        street: location.street || '',
        lat: location.lat,
        lng: location.lng,
      });
      setSearchQuery('');
      setResults([]);
    }
  }, [open, location, reset]);

  // Debounced search against OpenStreetMap Nominatim
  useEffect(() => {
    const q = searchQuery.trim();
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
          return;
        showToastRef.current(
          'Failed to search location. Please try again.',
          'error'
        );
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const applyResult = (r: NominatimResult) => {
    const country = r.address?.country || '';
    const street = r.address?.road || r.address?.street || '';
    const primaryName =
      r.name || r.display_name.split(',')[0]?.trim() || '';
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);

    if (primaryName)
      setValue('name', primaryName, { shouldValidate: true });
    if (country) setValue('country', country);
    if (street) setValue('street', street);
    if (!Number.isNaN(lat)) setValue('lat', lat);
    if (!Number.isNaN(lng)) setValue('lng', lng);
    showToast('Location selected from OpenStreetMap', 'success');
  };

  const onSubmit = async (data: UpdateLocationFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', data.name);

    if (data.country) formData.append('country', data.country);
    if (data.lat) formData.append('lat', String(data.lat));
    if (data.lng) formData.append('lng', String(data.lng));
    if (data.coverImage && data.coverImage[0]) {
      formData.append('coverImage', data.coverImage[0]);
    }

    try {
      await api.patch(`/locations/${location.id}`, formData);
      showToast('Location updated successfully!', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      showToast(
        'Failed to update location. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const lat = watch('lat');
  const lng = watch('lng');

  const hasValidCoordinates = useMemo(() => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    );
  }, [lat, lng]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Location</DialogTitle>
          <DialogDescription>
            Update location details and search for new coordinates
            using OpenStreetMap
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Search Section */}
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
              <div className="grid gap-2 sm:gap-3 grid-cols-1">
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

          {/* Form Fields */}
          <div>
            <Label htmlFor="name">Location Name *</Label>
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

          <div>
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              {...register('street')}
              placeholder="e.g., Nguyen Hue Boulevard"
            />
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

          {/* Map Preview - Shows when coordinates are valid */}
          {hasValidCoordinates && (
            <Card className="border border-muted">
              <CardHeader className="py-3">
                <CardTitle className="text-base">
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <LocationMap
                  lat={lat!}
                  lng={lng!}
                  locationName={watch('name')}
                  street={watch('street')}
                  country={watch('country')}
                />
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            <Input
              id="coverImage"
              type="file"
              {...register('coverImage')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to keep current image
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
