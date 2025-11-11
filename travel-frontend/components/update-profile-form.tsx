'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { setUser } from '@/lib/redux/authSlice';
import Image from 'next/image';
import { getAvatarUrl, getAssetUrl } from '@/lib/utils/image-utils';

export default function UpdateProfileForm() {
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState<string>(user?.name || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [location, setLocation] = useState<string>(
    user?.location || ''
  );
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    getAvatarUrl(user?.avatarUrl)
  );
  const [coverImagePreview, setCoverImagePreview] = useState<
    string | null
  >(user?.coverImage ? getAssetUrl(user.coverImage) : null);

  // baseURL handled by api client

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast(
          'Avatar image size should not exceed 5MB.',
          'error'
        );
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Cover image size should not exceed 5MB.', 'error');
        return;
      }
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('location', location);
    if (avatar) {
      formData.append('avatar', avatar);
    }
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    try {
      await api.patch(`/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Profile updated successfully!', 'success');
      const fetchProfile = async () => {
        try {
          const response = await api.get(`/users/profile`);
          dispatch(setUser(response.data));
        } catch (error) {
          console.error('Failed to fetch profile', error);
          showToast('Failed to fetch profile.', 'error');
        }
      };
      fetchProfile();
    } catch (error) {
      console.error('Failed to update profile', error);
      showToast('Failed to update profile.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Media Section */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Avatar */}
        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="avatar" className="font-medium">
              Avatar Image
            </Label>
            <span className="text-[11px] text-muted-foreground">
              80x80
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden ring-1 ring-border bg-muted shrink-0">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleAvatarChange}
                className="max-w-xs"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, JPEG, PNG, max 5MB.
              </p>
            </div>
          </div>
        </div>
        {/* Cover */}
        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
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
            <Input
              id="coverImage"
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleCoverImageChange}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Text Fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Your username"
            value={user?.username || ''}
            disabled
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="Your location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
