import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface DeleteConfirmationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  resumeId: string;
  resumeName: string;
}

const DeleteConfirmationDialog = ({
  open,
  setOpen,
  resumeId,
  resumeName,
}: DeleteConfirmationDialogProps) => {
  const deleteResumeMutation = trpc.resume.delete.useMutation();
  const utils = trpc.useUtils();
  const router = useRouter();

  const handleDelete = () => {
    deleteResumeMutation.mutate(
      { id: resumeId },
      {
        onSuccess: () => {
          utils.resume.getAllResumeNames.invalidate();
          setOpen(false);
          // If we're currently viewing the deleted resume, redirect to app home
          if (window.location.pathname.includes(resumeId)) {
            router.push("/app");
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!rounded-2xl">
        <DialogHeader>
          <DialogTitle>Delete resume</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{resumeName}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteResumeMutation.isPending}
            className="rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteResumeMutation.isPending}
            className="rounded-2xl"
          >
            {deleteResumeMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
