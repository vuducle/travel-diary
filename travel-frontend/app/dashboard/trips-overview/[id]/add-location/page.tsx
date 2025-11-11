'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddLocationFormValues>({
    resolver: zodResolver(addLocationSchema),
  });

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
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
