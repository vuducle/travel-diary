'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { hideExpiry } from '@/lib/redux/sessionSlice';
import { clearToken } from '@/lib/redux/authSlice';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function SessionExpiredModal() {
  const { showExpiryModal, expiryReason } = useSelector(
    (s: RootState) => s.session
  );
  const dispatch = useDispatch();
  const router = useRouter();

  const onLogin = () => {
    dispatch(hideExpiry());
    dispatch(clearToken());
    router.push('/login');
  };

  const onClose = () => {
    dispatch(hideExpiry());
  };

  const title =
    expiryReason === 'logout'
      ? 'You were logged out'
      : 'Your session expired';
  const desc =
    expiryReason === 'logout'
      ? 'For your security, you have been logged out. Please sign in again to continue.'
      : 'Your login session has ended. Please sign in again to keep using TravelDiary.';

  return (
    <Dialog
      open={showExpiryModal}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-primary text-white" onClick={onLogin}>
            Log in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
