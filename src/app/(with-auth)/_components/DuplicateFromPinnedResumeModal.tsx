import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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
      <DialogContent className="!rounded-2xl">
        <DialogHeader>
          <DialogTitle>Duplicate pinned resume</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          Select a pinned resume to duplicate
        </p>
        <div className="flex flex-wrap gap-2">
          {isPinnedResumesLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            pinnedResumes?.map((resume) => (
              <Badge
                key={resume.id}
                variant={
                  selectedResume?.id === resume.id ? "default" : "outline"
                }
                className={`cursor-pointer transition-colors ${
                  selectedResume?.id === resume.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:bg-secondary"
                }`}
                onClick={() => handleResumeSelect(resume)}
              >
                {resume.name}
              </Badge>
            ))
          )}
        </div>
        <Input
          value={resumeName}
          onChange={(e) => setResumeName(e.target.value)}
          placeholder="Enter resume name"
        />

        <DialogFooter>
          <Button onClick={handleDuplicateResume} disabled={!selectedResume}>
            {duplicateResume.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateFromPinnedResumeModal;
