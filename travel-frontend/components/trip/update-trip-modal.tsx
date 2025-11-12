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
import UpdateTripForm from '@/components/trip/update-trip-form';
import { Button } from '../ui/button';
import { Pencil, X } from 'lucide-react';
import { Trip } from '@/lib/redux/tripsSlice';

export default function UpdateTripModal({ trip }: { trip: Trip }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-9 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white shadow-sm text-sm font-medium"
        >
          <Pencil className="h-4 w-4" /> Edit Trip
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="p-0 w-full left-1/2 top-0 sm:top-1/2 translate-x-[-50%] translate-y-0 sm:translate-y-[-50%] h-screen sm:h-auto sm:max-h-[85vh] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl rounded-none sm:rounded-xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-linear-to-r from-primary/20 via-primary/10 to-transparent dark:from-primary/25">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg sm:text-2xl font-semibold tracking-tight">
              Edit Trip
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update your trip information and cover image.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <button
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur hover:bg-white shadow ring-1 ring-black/5 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>
        {/* Scroll Area */}
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent px-4 sm:px-6 pb-[max(env(safe-area-inset-bottom),1rem)] sm:pb-6 pt-2 flex-1">
          <UpdateTripForm trip={trip} />
        </div>
        {/* Footer hint */}
        <DialogFooter className="border-t bg-muted/30 px-6 py-3 text-[11px] sm:text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>Images up to 10MB (JPG / PNG / WEBP).</span>
          <span className="font-medium text-muted-foreground/70">
            Changes apply after saving.
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
