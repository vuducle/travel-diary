'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { setUser } from '@/lib/redux/authSlice';

export default function UpdateProfileForm() {
  const [name, setName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { token, user } = useSelector(
    (state: RootState) => state.auth
  );

  const PUBLIC_API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${PUBLIC_API_URL}/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        dispatch(setUser(response.data));
      } catch (error) {
        console.error('Failed to fetch profile', error);
        showToast('Failed to fetch profile.', 'error');
      }
    };

    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, dispatch, showToast, PUBLIC_API_URL]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
    }
  }, [user]);

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
      await axios.patch(`${PUBLIC_API_URL}/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      showToast('Profile updated successfully!', 'success');
      const fetchProfile = async () => {
        try {
          const response = await axios.get(
            `${PUBLIC_API_URL}/users/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Your username"
              value={user?.username || ''}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              placeholder="Your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar Image</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, max 5MB.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <Input
              id="coverImage"
              type="file"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleCoverImageChange}
            />
            <p className="text-xs text-muted-foreground">
              JPG, JPEG, PNG, max 5MB.
            </p>
          </div>
          <Button type="submit" className="w-full">
            Update Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
