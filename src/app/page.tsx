"use client";

import { useRef, useState } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";
import ChatInput from "./ChatInput";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [content, setContent] = useState(``);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Get the current editor HTML
    const editorHTML = editorRef.current?.getHTML?.() || "";

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

      const aiMessage = (await response.json()) as ChatMessage & {
        newEditorHTML?: string;
      };
      setMessages([...newMessages, aiMessage]);

      // If the backend returns new editor HTML, update the editor content
      if (aiMessage.newEditorHTML) {
        editorRef.current?.setHTML?.(aiMessage.newEditorHTML);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen h-screen overflow-hidden">
      <div className="container mx-auto py-8 h-full relative">
        <div className="flex gap-4 h-full pr-[400px]">
          <div className="flex-1 overflow-hidden">
            <div className="bg-white rounded-lg shadow-lg h-full overflow-auto">
              <TiptapEditor
                ref={editorRef}
                content={content}
                onChange={setContent}
                aiAppId="v91pj729"
                aiToken="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTIzNDQzMzksIm5iZiI6MTc1MjM0NDMzOSwiZXhwIjoxNzUyNDMwNzM5LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJkM2VhNGU4ZC0xNmJiLTQyNTYtYmE5NC0xNGNiYjhkNjgxOGMifQ.wP1sL4WrSSW42_sRmp53RSBa4bDLsTOWZVkn79ieWLc"
                placeholder=""
                className="bg-background focus:outline-none h-full min-h-[1123px]"
                enableExport={true}
              />
            </div>
          </div>

          <div className="w-[400px] bg-white flex flex-col overflow-hidden fixed top-8 right-4 bottom-8 border rounded-sm">
            <div className="p-2 border-b">
              <h2 className="text-sm font-semibold">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`w-full rounded-lg ${
                      message.role === "user"
                        ? "bg-black/5 text-black px-4 py-2 rounded-xs"
                        : "px-2"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">Thinking...</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <ChatInput onSend={handleSendMessage} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
