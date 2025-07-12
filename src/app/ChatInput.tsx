"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend?: (message: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "w-full min-h-[50px] rounded-xs px-1 text-black/80 text-sm bg-transparent placeholder:text-black/50 focus-visible:outline-none",
      },
    },
  });

  const handleSend = () => {
    if (!editor || !editor.getText().trim()) return;
    onSend?.(editor.getText());
    editor.commands.clearContent();
  };

  return (
    <div className="relative flex flex-col w-full rounded-lg bg-white border border-gray-200 p-2">
      <div className="flex-1">
        <EditorContent editor={editor} className="w-full overflow-y-auto" />
      </div>
      <div className="flex justify-end ">
        <Button
          onClick={handleSend}
          className="shrink-0 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-full border border-gray-200 w-6 h-6 p-0 flex items-center justify-center"
        >
          <ArrowUp className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
