"use client";

import { useEffect, useRef, useState } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ChatUI from "./ChatUI";
import {
  fetchEventSource,
  EventSourceMessage,
} from "@microsoft/fetch-event-source";
import TiptapEditorReplica from "@/components/tiptap-editor-replica";
import { trpc } from "@/lib/trpc";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  newEditorHTML?: string;
  diffEditorHTML?: string;
  events?: Array<{
    callId: string;
    name: string;
    status: boolean;
    output?: {
      diffEditorHTML?: any;
      newEditorHTML?: any;
      oldEditorHTML?: any;
    };
  }>;
  attachPartOfHTML?: string[]; // <-- Add this line
}

export default function Home() {
  const [content, setContent] = useState(``);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showingDiff, setShowingDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [updatedContent, setUpdatedContent] = useState<string>("");
  const [diffContent, setDiffContent] = useState<string>("");
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const editorRef = useRef<TiptapEditorRef>(null);
  const replicaRef = useRef<TiptapEditorRef>(null);
  const [attachPartOfHTML, setAttachPartOfHTML] = useState<string[]>([]);
  const { data: resumes } = trpc.resume.list.useQuery();

  const handleAcceptChanges = () => {
    if (!editorRef.current) return;
    if (updatedContent) {
      editorRef.current.setHTML(updatedContent);
      setShowingDiff(false);
    }
  };

  const handleRejectChanges = () => {
    if (!editorRef.current || !originalContent) return;
    editorRef.current.setHTML(originalContent);
    setShowingDiff(false);
  };

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    // Get the current editor HTML
    const editorHTML = editorRef.current?.getHTML?.() || "";
    setOriginalContent(editorHTML);
    const userMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
      events: [],
      newEditorHTML: editorHTML, // <-- Attach the current HTML here
      attachPartOfHTML, // <-- Attach the array of HTML parts here
    };
    // Add user message and an empty AI message for accumulating events
    const updatedMessages = [
      ...messages,
      userMessage,
      {
        role: "assistant" as const,
        content: "",
        events: [],
      } as ChatMessage,
    ];
    const updatedMessagesForAI = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setContent("");
    try {
      await fetchEventSource("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessagesForAI,
          editorHTML,
          attachPartOfHTML,
        }), // <-- Send attachPartOfHTML here
        onmessage(ev: EventSourceMessage) {
          if (ev.data) {
            try {
              const event = JSON.parse(ev.data);
              console.log("event: ", event);

              if (event?.data?.type == "output_text_delta") {
                const text = event?.data?.delta;
                console.log("text: ", text);
                setMessages((prev) => {
                  const lastIndex = prev.length - 1;
                  if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
                    const updated = [...prev];
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + text,
                    };
                    return updated;
                  }
                  return prev;
                });
              }
              if (
                event?.data?.event?.item?.type == "function_call" &&
                event?.data?.event?.item?.status == "completed"
              ) {
                console.log("event: ", event);

                // Accumulate events in the last AI message
                setMessages((prev) => {
                  const lastIndex = prev.length - 1;
                  if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
                    const updated = [...prev];
                    const lastMessage = updated[lastIndex];
                    // Check if event with the same callId already exists
                    const exists = (lastMessage.events || []).some(
                      (e) =>
                        e.callId === event?.data?.event?.item?.type?.call_id
                    );
                    if (!exists) {
                      updated[lastIndex] = {
                        ...lastMessage,
                        events: [
                          ...(lastMessage.events || []),
                          {
                            callId: event?.data?.event?.item?.call_id,
                            name: event?.data?.event?.item?.name,
                            status: false,
                          },
                        ],
                      };
                    }
                    return updated;
                  }
                  return prev;
                });
              } else if (
                event?.item?.type == "tool_call_output_item" &&
                event?.item?.rawItem?.type == "function_call_result"
              ) {
                console.log("event: ", event);

                if (event?.item?.rawItem?.output) {
                  const textObj = event?.item?.rawItem?.output?.text;
                  const responseObj = JSON.parse(textObj);
                  // console.log("responseObj: ", responseObj);
                  // console.log("responseObj[0]: ", responseObj[0]);

                  if (responseObj[0]?.content) {
                    const res = JSON.parse(responseObj[0]?.content[0]?.text);
                    console.log("res: ", res);
                    if (res?.diffEditorHTML) {
                      const htmlOfEditor = editorRef.current?.getHTML?.();
                      // console.log("htmlOfEditor: ", htmlOfEditor);
                      if (htmlOfEditor) {
                        // console.log("htmlOfEditor: ", htmlOfEditor);
                        if (!htmlOfEditor.includes(res.oldEditorHTML)) {
                          console.warn(
                            "oldEditorHTML not found in current editor HTML!"
                          );
                        }
                        const replicaInitialHTML =
                          replicaRef.current?.getHTML();
                        if (replicaInitialHTML) {
                          replicaRef.current?.setHTML(
                            replicaInitialHTML.replace(
                              replicaInitialHTML,
                              res?.diffEditorHTML
                            )
                          );
                        }
                        const replicaHtml = replicaRef.current
                          ?.getHTML()
                          ?.replace(/<p><\/p>\s*$/, "");
                        const newHtml = htmlOfEditor.replace(
                          res?.oldEditorHTML,
                          res?.diffEditorHTML
                        );
                        editorRef.current?.setHTML?.(newHtml);

                        setMessages((prev) => {
                          const lastIndex = prev.length - 1;
                          if (
                            lastIndex >= 0 &&
                            prev[lastIndex].role === "assistant"
                          ) {
                            const updated = [...prev];
                            const lastMessage = updated[lastIndex];
                            const exists = (lastMessage.events || []).some(
                              (e) => e.callId === event?.item?.rawItem?.callId
                            );
                            if (exists) {
                              updated[lastIndex] = {
                                ...lastMessage,

                                events: (lastMessage.events || []).map((e) =>
                                  e.callId === event?.item?.rawItem?.callId
                                    ? {
                                        ...e,
                                        status: true,
                                        output: {
                                          diffEditorHTML: replicaHtml,
                                          newEditorHTML: res?.newEditorHTML,
                                          oldEditorHTML: res?.oldEditorHTML,
                                        },
                                      }
                                    : e
                                ),
                              };
                            }
                            return updated;
                          }
                          return prev;
                        });
                      }
                    }
                  }
                }
              }
            } catch (err) {}
          }
        },
        onerror(err: any) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Error: Could not get response.",
              events: [],
            },
          ]);
          setIsLoading(false);
        },
        onclose() {
          setIsLoading(false);
        },
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Could not get response.",
          events: [],
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider
      defaultOpen={true}
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
    >
      <AppSidebar />
      <div className="flex min-h-screen w-full">
        <SidebarInset className="flex-1 w-full">
          <div className="h-screen w-full flex flex-row gap-2 p-2">
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
                  setAttachPartOfHTML={setAttachPartOfHTML}
                />
                <TiptapEditorReplica ref={replicaRef} />
              </div>
            </div>

            {/* Chat Section - Right side */}
            <ChatUI
              messages={
                streamingMessage !== null
                  ? [
                      ...messages,
                      { role: "assistant", content: streamingMessage },
                    ]
                  : messages
              }
              isLoading={isLoading}
              showingDiff={showingDiff}
              handleRejectChanges={handleRejectChanges}
              handleAcceptChanges={handleAcceptChanges}
              handleSendMessage={handleSendMessage}
              canvasEditor={editorRef}
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
