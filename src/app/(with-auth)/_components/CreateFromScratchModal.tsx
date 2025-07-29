import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

interface CreateFromScratchModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CreateFromScratchModal = ({
  open,
  setOpen,
}: CreateFromScratchModalProps) => {
  const [name, setName] = useState("");
  const router = useRouter();
  const utils = trpc.useUtils();
  const createResumeMutation = trpc.resume.create.useMutation({
    onSuccess: (data) => {
      utils.resume.getAllResumeNames.invalidate();
      utils.resume.list.invalidate();
      router.push(`/app/${data.id}`);
      setOpen(false);
      setName(""); // Reset form
    },
  });

  const handleCreateResume = () => {
    if (!name.trim()) {
      return;
    }
    createResumeMutation.mutate({ content: "", name: name.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim() && !createResumeMutation.isPending) {
      handleCreateResume();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="space-y-4 p-6 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 shadow-sm">
              <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create New Resume
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start building from a blank template
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Resume Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Software Engineer Resume"
                className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Give your resume a descriptive name to help you identify it
                later
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-6"
              disabled={createResumeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateResume}
              disabled={createResumeMutation.isPending || !name.trim()}
              className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none transition-all duration-200 px-6"
            >
              {createResumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Resume
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFromScratchModal;
