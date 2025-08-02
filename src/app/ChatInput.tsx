"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { useCallback, useRef, useEffect } from "react";
import {
  ArrowUp,
  Axe,
  AxeIcon,
  ChevronDownIcon,
  Circle,
  EllipsisVerticalIcon,
  FileTextIcon,
  Loader2,
  MessageSquare,
  Settings2,
  X,
} from "lucide-react";
import { Placeholder } from "@tiptap/extensions";
import { Badge } from "@/components/ui/badge";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSend?: (message: string) => void;
  isStreaming?: boolean;
  isResumeSelected?: boolean;
  setIsResumeSelected?: (value: boolean) => void;
  attachPartOfHTML?: string[];
  setAttachPartOfHTML?: (parts: string[]) => void;
  onStop?: () => void;
}

const ChatInput = ({
  onSend,
  isStreaming,
  isResumeSelected = true,
  setIsResumeSelected,
  attachPartOfHTML = [],
  setAttachPartOfHTML,
  onStop,
}: ChatInputProps) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleToggleResume = useCallback(
    (value: boolean) => {
      if (setIsResumeSelected) {
        setIsResumeSelected(value);
      }
    },
    [setIsResumeSelected]
  );

  const handleRemovePart = useCallback(
    (index: number) => {
      if (setAttachPartOfHTML && attachPartOfHTML) {
        const newParts = [...attachPartOfHTML];
        newParts.splice(index, 1);
        setAttachPartOfHTML(newParts);
      }
    },
    [attachPartOfHTML, setAttachPartOfHTML]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something …",
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        showOnlyWhenEditable: true,
        includeChildren: false,
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "w-full min-h-[50px] px-1 text-black/80 text-sm placeholder:text-black/50 focus-visible:outline-none [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:text-black/50",
      },
      handleKeyDown: (view, event) => {
        // Handle Enter without shift to send
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Ensure the cursor is always visible by scrolling to the bottom
      if (editorContainerRef.current) {
        const container = editorContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    },
  });

  const handleSend = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!editor || !editor.getText().trim()) return;
    onSend?.(editor.getText());
    editor.commands.clearContent();
  }, [editor, onSend]);

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor, attachPartOfHTML?.length]);

  return (
    <div className="relative flex flex-col w-full rounded-xl shadow-none bg-white p-2 gap-1 border">
      <div className="flex flex-wrap gap-1">
        {isResumeSelected ? (
          <Badge
            variant="outline"
            className="text-[10px] cursor-pointer rounded-xl"
            onClick={() => handleToggleResume(false)}
          >
            <FileTextIcon className="w-3 h-3 mr-1 text-[#00C950]" />
            Active Resume <X className="w-3 h-3 ml-1" />
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] cursor-pointer rounded-xl"
            onClick={() => handleToggleResume(true)}
          >
            Add Context
          </Badge>
        )}
        {attachPartOfHTML && attachPartOfHTML.length > 0 && (
          <>
            {attachPartOfHTML.map((part, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-[10px] cursor-pointer rounded-xl max-w-[150px] truncate"
                title={part}
                onClick={() => handleRemovePart(index)}
              >
                <FileTextIcon className="w-3 h-3 mr-1 text-[#00C950]" />{" "}
                Selected Part {index + 1} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-col rounded-full">
        <div className="flex-1">
          <div
            ref={editorContainerRef}
            className="w-full overflow-y-auto max-h-[150px] min-h-[50px] scroll-smooth"
          >
            <EditorContent disabled={isStreaming} editor={editor} />
          </div>
        </div>
        <div className="flex justify-between pt-1 ">
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white text-black/80 cursor-pointer rounded-xl h-6 px-2 flex items-center gap-1 hover:bg-gray-50"
                >
                  <Settings2 className="w-3 h-3 text-black/80" /> Agent{" "}
                  <ChevronDownIcon className="w-3 h-3 text-black/80" />
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl gap-2 w-30 shadow-2xl border-0 bg-white dark:bg-gray-900">
                <DropdownMenuItem className="rounded-xl p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-all duration-200 focus:bg-gray-50 dark:focus:bg-gray-900/20">
                  <Settings2 className="w-[10px] h-[10px]" />
                  <p className="text-[10px]">Agent</p>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MessageSquare className="w-[10px] h-[10px]" />
                  <p className="text-[10px]">Ask(coming soon)</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            {isStreaming ? (
              <Button
                onClick={onStop}
                className="shrink-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full border border-red-200 w-6 h-6 p-0 flex items-center justify-center"
              >
                <Circle className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                variant="outline"
                className="shrink-0 bg-[#AD46FF] text-white border-[#AD46FF] hover:bg-[#ca92f7] rounded-full w-6 h-6 p-0 flex items-center justify-center"
              >
                <ArrowUp rotate={45} className="w-[10px] h-[10px] text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
