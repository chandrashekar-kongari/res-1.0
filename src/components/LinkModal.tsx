import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link, Trash2, ExternalLink } from "lucide-react";

interface LinkModalProps {
  isOpen: boolean;
  url: string;
  text: string;
  existingLink: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onRemove: () => void;
}

const LinkModal = ({
  isOpen,
  url,
  text,
  existingLink,
  onUrlChange,
  onSubmit,
  onCancel,
  onRemove,
}: LinkModalProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="space-y-4 p-6 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-sm">
              <Link className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {existingLink ? "Edit Link" : "Add Link"}
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {existingLink
                  ? "Update the link URL"
                  : "Add a link to the selected text"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {text && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Text
              </label>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {text}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              URL
            </label>
            <div className="relative">
              <Input
                type="url"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                autoFocus
                className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 py-3 pl-4 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty to remove the link
            </p>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <div className="flex justify-between w-full">
              <div>
                {existingLink && (
                  <Button
                    variant="outline"
                    onClick={onRemove}
                    className="rounded-xl border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 px-4"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Link
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 transition-all duration-200 px-6"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {existingLink ? "Update" : "Add"} Link
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkModal;
