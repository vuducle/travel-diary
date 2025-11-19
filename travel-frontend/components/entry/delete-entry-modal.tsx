import api from "@/lib/api/client";
import {
    useToast
} from "@/hooks/use-toast";
import {useRouter} from "next/navigation";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

interface Entry {
    id: string;
    name: string;
    tripId: string;
    locationId: string;
}

interface DeleteEntryModalProps {
    open: boolean;
    onClose: () => void;
    entry: Entry;
}

export default function DeleteEntryModal({
    open,
    onClose,
    entry,
 }: DeleteEntryModalProps) {
    const {showToast} = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        try {
            await api.delete(`/entries/${entry.id}`);
            showToast('Entry deleted successfully.', 'success');
            router.push(`/dashboard/trips-overview/${entry.tripId}/location/${entry.locationId}`);
        } catch (err) {
            console.error(err);
            showToast('Error while deleting entry', 'error');
            onClose();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Are you sure you want to delete {entry.name}?
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your
                        entry and all of its data.
                    </DialogDescription>
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
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}