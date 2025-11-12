'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Trash, X } from 'lucide-react';
import { Trip } from '@/lib/redux/tripsSlice';
import api from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DeleteTripModal({ trip }: { trip: Trip }) {
  const { showToast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await api.delete(`/trips/${trip.id}`);
      showToast('Trip deleted successfully!', 'success');
      router.push('/dashboard/trips-overview');
    } catch (error) {
      console.error('Failed to delete trip', error);
      showToast('Failed to delete trip.', 'error');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="gap-2 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm text-sm font-medium"
        >
          <Trash className="h-4 w-4" /> Delete Trip
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete "{trip.title}"?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete
            your trip and all of its data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
