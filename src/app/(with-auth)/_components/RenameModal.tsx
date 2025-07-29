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
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";

interface RenameModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  resumeId: string;
  currentName: string;
}

const RenameModal = ({
  open,
  setOpen,
  resumeId,
  currentName,
}: RenameModalProps) => {
  const [name, setName] = useState(currentName);
  const updateResumeMutation = trpc.resume.update.useMutation();
  const utils = trpc.useUtils();

  // Reset name when modal opens with new resume
  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleRename = () => {
    if (!name.trim() || name === currentName) {
      return;
    }
    updateResumeMutation.mutate(
      { id: resumeId, name: name.trim() },
      {
        onSuccess: () => {
          utils.resume.getAllResumeNames.invalidate();
          setOpen(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="space-y-4 p-6 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-sm">
              <Pencil className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Rename Resume
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update the name of your resume
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resume Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter resume name"
              autoFocus
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateResumeMutation.isPending}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={
                updateResumeMutation.isPending ||
                !name.trim() ||
                name === currentName
              }
              className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none transition-all duration-200 px-6"
            >
              {updateResumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Renaming...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenameModal;
