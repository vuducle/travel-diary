'use client';

import { useEffect, useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';

const updateEntrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  addImages: z.any().optional(),
});

type UpdateEntryFormValues = z.infer<typeof updateEntrySchema>;

type EntryImage = { id: string; url: string; order: number };

interface Entry {
  id: string | number;
  title: string;
  content?: string | null;
  date?: string | null;
  images?: EntryImage[];
}

interface UpdateEntryModalProps {
  open: boolean;
  onClose: () => void;
  entry: Entry;
  onSuccess?: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export default function UpdateEntryModal({
  open,
  onClose,
  entry,
  onSuccess,
  onSubmittingChange,
}: UpdateEntryModalProps) {
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeIds, setRemoveIds] = useState<Set<string>>(new Set());
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  const typedResolver = zodResolver(
    updateEntrySchema
  ) as Resolver<UpdateEntryFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEntryFormValues>({ resolver: typedResolver });

  useEffect(() => {
    if (open && entry) {
      reset({
        title: entry.title,
        content: entry.content ?? undefined,
        date: entry.date ?? undefined,
      });
      setRemoveIds(new Set());
      setPreviewFiles([]);
    }
  }, [open, entry, reset]);

  const existingImages = entry?.images ?? [];

  const toggleRemove = (id: string) => {
    setRemoveIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setPreviewFiles([]);
      return;
    }
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      urls.push(URL.createObjectURL(f));
    }
    setPreviewFiles(urls);
  };

  const onSubmit = async (data: UpdateEntryFormValues) => {
    setIsSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const form = new FormData();
      if (data.title) form.append('title', data.title);
      if (data.content) form.append('content', data.content);
      if (data.date) form.append('date', data.date);

      // Append files (input name expected by backend: addImages)
      // Attempt to find file input in DOM
      const fileInput = document.querySelector<HTMLInputElement>(
        `input[name=\"addImages\"]`
      );
      if (fileInput && fileInput.files && fileInput.files.length) {
        for (const f of Array.from(fileInput.files)) {
          form.append('addImages', f);
        }
      }

      // Append removeImageIds as repeated fields
      for (const id of Array.from(removeIds)) {
        form.append('removeImageIds', id);
      }

      await api.patch(`/entries/${entry.id}`, form);
      onClose();
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      showToastRef.current('Failed to update entry', 'error');
    } finally {
      setIsSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Entry</DialogTitle>
          <DialogDescription>
            Update entry details and manage images
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" {...register('content')} />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
            />
          </div>

          <div>
            <Label>Existing Images</Label>
            <div className="grid grid-cols-3 gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative">
                  <Image
                    src={getAssetUrl(img.url) || img.url}
                    alt={`entry-image-${img.id}`}
                    width={400}
                    height={300}
                    unoptimized
                    className={`w-full h-24 object-cover rounded-md border ${
                      removeIds.has(img.id) ? 'opacity-40' : ''
                    }`}
                  />
                  <div className="absolute top-1 right-1">
                    <Button
                      size="sm"
                      variant={
                        removeIds.has(img.id)
                          ? 'secondary'
                          : 'destructive'
                      }
                      onClick={() => toggleRemove(img.id)}
                    >
                      {removeIds.has(img.id) ? 'Undo' : 'Remove'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="addImages">Add Images</Label>
            <Input
              id="addImages"
              name="addImages"
              type="file"
              multiple
              onChange={handleFilesChange}
            />
            {previewFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previewFiles.map((p, idx) => (
                  <Image
                    key={idx}
                    src={p}
                    alt={`preview-${idx}`}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            )}
          </div>

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
              {isSubmitting ? <Spinner /> : 'Update Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
