'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';

interface Location {
  id: string;
  name: string;
  tripId: string;
}

interface DeleteLocationModalProps {
  open: boolean;
  onClose: () => void;
  location: Location;
}

export default function DeleteLocationModal({
  open,
  onClose,
  location,
}: DeleteLocationModalProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await api.delete(`/locations/${location.id}`);
      // Redirect with query param to allow parent page to update counts optimistically
      router.push(
        `/dashboard/trips-overview/${
          location.tripId
        }?locationDeleted=1&locationId=${encodeURIComponent(
          location.id
        )}`
      );
    } catch (error) {
      console.error('Failed to delete location', error);
      showToast('Failed to delete location.', 'error');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete {location.name}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete
            your location and all of its data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
