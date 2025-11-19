'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Image from 'next/image';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

type PreviewFile = { file: File; url: string };

export default function AddEntryPage() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const params = useParams();

  const tripId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const locationId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.locationID;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const next: PreviewFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const url = URL.createObjectURL(f);
      next.push({ file: f, url });
    }
    setPreviews((prev) => [...prev, ...next]);
    // clear input value to allow re-selecting same file if removed
    e.currentTarget.value = '';
  };

  const removePreview = (idx: number) => {
    setPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      try {
        URL.revokeObjectURL(removed.url);
      } catch {}
      return next;
    });
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      for (const p of previews) {
        try {
          URL.revokeObjectURL(p.url);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    null
  );
  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId) {
      showToastRef.current('Trip ID missing', 'error');
      return;
    }
    if (!title.trim()) {
      showToastRef.current('Please enter a title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (description) fd.append('content', description.trim());
      if (date) fd.append('date', new Date(date).toISOString());
      fd.append('tripId', tripId);
      if (locationId) fd.append('locationId', locationId);

      for (const p of previews) fd.append('images', p.file);

      await api.post('/entries', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToastRef.current('Entry created', 'success');
      if (locationId) {
        router.push(
          `/dashboard/trips-overview/${tripId}/location/${locationId}`
        );
      } else {
        router.push(`/dashboard/trips-overview/${tripId}`);
      }
    } catch (err: unknown) {
      type ErrLike = {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const anyErr = err as ErrLike;
      const msg =
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        'Failed to create entry';
      showToastRef.current(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative container mx-auto p-4 max-w-3xl">
      {isSubmitting && (
        <Spinner fullScreen label="Creating entry..." />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Images</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Upload images
                </Button>
                <span className="text-sm text-muted-foreground">
                  You can upload multiple images (max handled by
                  server)
                </span>
              </div>

              {previews.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {previews.map((p, idx) => (
                      <div
                        key={p.url}
                        className="relative rounded overflow-hidden border cursor-pointer"
                        onClick={() => openLightbox(idx)}
                      >
                        <Image
                          src={p.url}
                          alt={`preview-${idx}`}
                          width={400}
                          height={200}
                          unoptimized
                          className="object-cover w-full h-32"
                        />
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            removePreview(idx);
                          }}
                          className="absolute top-1 right-1 bg-white/80 rounded p-1"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Lightbox (library) */}
                  <Lightbox
                    open={lightboxIndex !== null}
                    close={closeLightbox}
                    slides={previews.map((p) => ({ src: p.url }))}
                    index={lightboxIndex ?? 0}
                  />
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
