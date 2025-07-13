"use client";

import { useRef, useState } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";
import ChatInput from "./ChatInput";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import ChatUI from "./ChatUI";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  newEditorHTML?: string;
  diffEditorHTML?: string;
}

export default function Home() {
  const [content, setContent] = useState(``);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showingDiff, setShowingDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const editorRef = useRef<TiptapEditorRef>(null);

  const handleAcceptChanges = () => {
    if (!editorRef.current) return;
    const currentMessage = messages[messages.length - 1];
    if (currentMessage?.newEditorHTML) {
      editorRef.current.setHTML(currentMessage.newEditorHTML);
      setShowingDiff(false);
    }
  };

  const handleRejectChanges = () => {
    if (!editorRef.current || !originalContent) return;
    editorRef.current.setHTML(originalContent);
    setShowingDiff(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Get the current editor HTML
    const editorHTML = editorRef.current?.getHTML?.() || "";
    // Store the original content before any changes
    setOriginalContent(editorHTML);

    const newMessages = [
      ...messages,
      { role: "user" as const, content: message.trim() },
    ];
    setMessages(newMessages);

    try {
      setIsLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages, editorHTML }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const aiMessage = (await response.json()) as ChatMessage;
      setMessages([...newMessages, aiMessage]);

      // If the backend returns new editor HTML, update the editor content
      if (aiMessage.newEditorHTML) {
        console.log("newEditorHTML", aiMessage.newEditorHTML);
        // First show the diff view if available
        if (aiMessage.diffEditorHTML) {
          editorRef.current?.setHTML?.(aiMessage.diffEditorHTML);
          setShowingDiff(true);
        } else {
          // If no diff view, just apply the changes directly
          editorRef.current?.setHTML?.(aiMessage.newEditorHTML);
        }
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider
      defaultOpen={false}
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
    >
      <AppSidebar />
      <div className="flex min-h-screen w-full">
        <SidebarInset className="flex-1 w-full">
          <div className="h-screen w-full flex flex-row gap-4 p-4">
            {/* Editor Section - Left side */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-lg border shadow-sm bg-background">
              <div className="flex-1 overflow-hidden">
                <TiptapEditor
                  ref={editorRef}
                  content={content}
                  onChange={setContent}
                  aiAppId="v91pj729"
                  aiToken="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTIzNDQzMzksIm5iZiI6MTc1MjM0NDMzOSwiZXhwIjoxNzUyNDMwNzM5LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJkM2VhNGU4ZC0xNmJiLTQyNTYtYmE5NC0xNGNiYjhkNjgxOGMifQ.wP1sL4WrSSW42_sRmp53RSBa4bDLsTOWZVkn79ieWLc"
                  placeholder=""
                  className="h-full"
                  enableExport={true}
                  previousState="<p>Hello</p>"
                />
              </div>
            </div>

            {/* Chat Section - Right side */}
            <ChatUI
              messages={messages}
              isLoading={isLoading}
              showingDiff={showingDiff}
              handleRejectChanges={handleRejectChanges}
              handleAcceptChanges={handleAcceptChanges}
              handleSendMessage={handleSendMessage}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
