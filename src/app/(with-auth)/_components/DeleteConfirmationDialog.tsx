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
import { Trash2, Loader2 } from "lucide-react";

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
      <DialogContent className="max-w-lg mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="space-y-4 p-6 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 shadow-sm">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Delete Resume
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <DialogDescription className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
              Are you sure you want to delete "
              <span className="font-medium">{resumeName}</span>"? This will
              permanently remove the resume and all its content.
            </DialogDescription>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={deleteResumeMutation.isPending}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-6"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteResumeMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none transition-all duration-200 px-6"
            >
              {deleteResumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Resume
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
