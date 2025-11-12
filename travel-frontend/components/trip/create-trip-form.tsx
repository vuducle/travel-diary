'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import Image from 'next/image';

export default function CreateTripForm() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'PRIVATE' | 'FRIENDS'
  >('PUBLIC');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<
    string | null
  >(null);
  const { showToast } = useToast();
  const router = useRouter();
  // baseURL and Authorization handled by centralized api client

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    // Normalize and validate visibility for backend enum
    const allowed = new Set(['PUBLIC', 'PRIVATE', 'FRIENDS']);
    const normalizedVisibility = (
      visibility || 'PUBLIC'
    ).toUpperCase();
    formData.append(
      'visibility',
      allowed.has(normalizedVisibility)
        ? normalizedVisibility
        : 'PUBLIC'
    );
    if (coverImage) {
      formData.append('cover', coverImage);
    }
    try {
      await api.post(`/trips`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Trip created successfully!', 'success');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create trip', error);
      type ApiError = {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = (error as ApiError)?.response?.data?.message;
      if (Array.isArray(msg)) {
        showToast(msg.join('\n'), 'error');
      } else if (typeof msg === 'string') {
        showToast(msg, 'error');
      } else {
        showToast('Failed to create trip.', 'error');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new trip</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="create-trip-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="My awesome trip"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A short description of your trip"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <Input
              id="coverImage"
              type="file"
              accept="image/jpeg, image/png, image/jpg, image/webp"
              onChange={handleCoverImageChange}
            />
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, WEBP, max 10MB.
            </p>
            {coverImagePreview && (
              <div className="mt-4">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  width={1200}
                  height={600}
                  className="w-full h-auto rounded-lg object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="create-trip-form"
          className="w-full"
        >
          Create Trip
        </Button>
      </CardFooter>
    </Card>
  );
}
