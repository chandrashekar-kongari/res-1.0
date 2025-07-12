"use client";

import { useRef, useState } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TestApp from "./TestApp";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [content, setContent] = useState(``);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  const editorRef = useRef<TiptapEditorRef>(null);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setMessages([...messages, { role: "user", content: inputMessage.trim() }]);

    setInputMessage("");
  };

  return (
    <main className="min-h-screen h-screen overflow-hidden">
      <div className="container mx-auto py-8 h-full">
        <div className="flex gap-4 h-full">
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

          <div className="w-[400px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
