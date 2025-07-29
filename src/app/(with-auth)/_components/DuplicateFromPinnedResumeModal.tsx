import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

// Type to match the actual runtime type from TRPC (with serialized dates)
type PinnedResume = {
  id: string;
  name: string | null;
  content: string | null;
  link: string | null;
  is_default: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_id: string;
};

interface DuplicateFromPinnedResumeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DuplicateFromPinnedResumeModal = ({
  open,
  setOpen,
}: DuplicateFromPinnedResumeModalProps) => {
  const utils = trpc.useUtils();
  const router = useRouter();

  const [selectedResume, setSelectedResume] = useState<PinnedResume | null>(
    null
  );
  const [resumeName, setResumeName] = useState<string>("");
  const { data: pinnedResumes, isLoading: isPinnedResumesLoading } =
    trpc.resume.list.useQuery({ where: { pinned: true } });

  const duplicateResume = trpc.resume.create.useMutation({
    onSuccess: (data) => {
      utils.resume.list.invalidate();
      utils.resume.getAllResumeNames.invalidate();
      router.push(`/app/${data.id}`);
      setOpen(false);
    },
  });

  const handleDuplicateResume = () => {
    if (!selectedResume) return;
    duplicateResume.mutate({
      name: (resumeName || selectedResume?.name) ?? "New Resume",
      content: selectedResume?.content ?? "",
    });
  };

  const handleResumeSelect = (resume: PinnedResume) => {
    if (selectedResume?.id === resume.id) {
      // Double-click to deselect
      setSelectedResume(null);
      setResumeName("");
    } else {
      // Select new resume
      setSelectedResume(resume);
      if (!resumeName) {
        setResumeName(`${resume.name} (Copy)`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="space-y-4 p-6 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-sm">
              <Copy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Duplicate Resume
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a copy from your pinned templates
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Choose Template
              </label>
              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto">
                {isPinnedResumesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading templates...
                      </p>
                    </div>
                  </div>
                ) : pinnedResumes && pinnedResumes.length > 0 ? (
                  pinnedResumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => handleResumeSelect(resume)}
                      className={`
                        group relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ease-out
                        ${
                          selectedResume?.id === resume.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                        }
                      `}
                    >
                      <div
                        className={`
                        p-2 rounded-xl transition-colors duration-200
                        ${
                          selectedResume?.id === resume.id
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50"
                        }
                      `}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`
                          font-medium text-sm truncate
                          ${
                            selectedResume?.id === resume.id
                              ? "text-emerald-900 dark:text-emerald-100"
                              : "text-gray-900 dark:text-gray-100"
                          }
                        `}
                        >
                          {resume.name || "Untitled Resume"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Pinned resume
                        </p>
                      </div>
                      {selectedResume?.id === resume.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 w-fit mx-auto">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        No pinned resumes
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Pin some resumes first to use as templates
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Resume Name
            </label>
            <Input
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="Enter a name for your new resume"
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={!selectedResume}
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateResume}
              disabled={!selectedResume || duplicateResume.isPending}
              className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none transition-all duration-200 px-6"
            >
              {duplicateResume.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Create Copy
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateFromPinnedResumeModal;
