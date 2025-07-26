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
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    },
  });

  const handleCreateResume = () => {
    if (!name) {
      return;
    }
    createResumeMutation.mutate({ content: "", name });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create from scratch</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogDescription>
        <DialogFooter>
          <Button
            className="rounded-2xl"
            onClick={handleCreateResume}
            disabled={createResumeMutation.isPending || !name}
          >
            {createResumeMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFromScratchModal;
