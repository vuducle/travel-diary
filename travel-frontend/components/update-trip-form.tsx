'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import { Trip } from '@/lib/redux/tripsSlice'; // Assuming you have a tripsSlice with a Trip type

export default function UpdateTripForm({ trip }: { trip: Trip }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState<string>(trip.title);
  const [description, setDescription] = useState<string>(
    trip.description || ''
  );
  const [startDate, setStartDate] = useState<string>(
    new Date(trip.startDate).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(trip.endDate).toISOString().split('T')[0]
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<
    string | null
  >(trip.coverImage ? getAssetUrl(trip.coverImage) : null);
  const [removeCover, setRemoveCover] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'PRIVATE' | 'FRIENDS'
  >(trip.visibility);

  const handleCoverImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast(
          'Cover image size should not exceed 10MB.',
          'error'
        );
        return;
      }
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
      setRemoveCover(false);
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setRemoveCover(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    if (coverImage) {
      formData.append('cover', coverImage);
    }
    if (removeCover) {
      formData.append('removeCover', 'true');
    }
    const normalizedVisibility = (
      visibility || 'PUBLIC'
    ).toUpperCase();
    formData.append('visibility', normalizedVisibility);

    try {
      await api.patch(`/trips/${trip.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Trip updated successfully!', 'success');
      // Here you might want to refetch the trip data or update the Redux store
    } catch (error) {
      console.error('Failed to update trip', error);
      showToast('Failed to update trip.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="coverImage" className="font-medium">
            Cover Image
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Recommended 1200x400
          </span>
        </div>
        <div className="space-y-3">
          <div className="w-full overflow-hidden rounded-lg ring-1 ring-border bg-muted h-32 sm:h-48 md:h-56 lg:h-64 relative">
            {coverImagePreview ? (
              <Image
                src={coverImagePreview}
                alt="Cover preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Input
              id="coverImage"
              type="file"
              accept="image/jpeg, image/png, image/jpg, image/webp"
              onChange={handleCoverImageChange}
              className="max-w-xs"
            />
            {coverImagePreview && (
              <Button
                variant="outline"
                onClick={handleRemoveCoverImage}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, JPEG, PNG, WEBP, max 10MB.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="Your trip title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Tell us about your trip"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 5">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(
                e.target.value as 'PUBLIC' | 'PRIVATE' | 'FRIENDS'
              )
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="FRIENDS">Friends</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button type="submit" className="rounded-full px-5">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
