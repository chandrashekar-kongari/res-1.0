"use client";

import { useRef } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";

export default function AiEditorDemo() {
  const editorRef = useRef<TiptapEditorRef>(null);

  const handleRephrase = async (selectedText: string) => {
    try {
      const response = await fetch("/api/rephrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!response.ok) {
        throw new Error("Failed to rephrase text");
      }

      const data = await response.json();
      return data.rephrasedText;
    } catch (error) {
      console.error("Error rephrasing text:", error);
      alert("Failed to rephrase text. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Enabled TipTap Editor</h1>
      <TiptapEditor
        ref={editorRef}
        aiAppId="v91pj729"
        aiToken="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTIzNDQzMzksIm5iZiI6MTc1MjM0NDMzOSwiZXhwIjoxNzUyNDMwNzM5LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJkM2VhNGU4ZC0xNmJiLTQyNTYtYmE5NC0xNGNiYjhkNjgxOGMifQ.wP1sL4WrSSW42_sRmp53RSBa4bDLsTOWZVkn79ieWLc"
        content=""
      />
    </div>
  );
}
