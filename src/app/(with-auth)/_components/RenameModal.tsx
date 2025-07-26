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
      <DialogContent className="!rounded-2xl">
        <DialogHeader>
          <DialogTitle>Rename resume</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter resume name"
            autoFocus
          />
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={updateResumeMutation.isPending}
            className="rounded-2xl"
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
            className="rounded-2xl"
          >
            {updateResumeMutation.isPending ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameModal;
