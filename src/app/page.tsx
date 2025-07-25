"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
      diffFromAssistant?: any;
      diffEditorHTMLId?: string;
    };
  }>;
  attachPartOfHTML?: string[]; // <-- Add this line
}

export default function Home() {
  const [content, setContent] = useState(``);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  console.log("messages: ");
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(document.hidden ? "Tab hidden" : "Tab visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Simplified message sending with built-in retry
  const handleSendMessage = useCallback(
    async (message: string, retryCount: number = 0) => {
      if (!message.trim()) return;

      // Cancel existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const editorHTML = editorRef.current?.getHTML?.() || "";
      setOriginalContent(editorHTML);

      console.log("BEFORE: editorHTML: ", editorHTML);

      const userMessage: ChatMessage = {
        role: "user",
        content: message.trim(),
        events: [],
        newEditorHTML: editorHTML,
        attachPartOfHTML,
      };

      // Only add user message on first attempt
      if (retryCount === 0) {
        const updatedMessages = [
          ...messages,
          userMessage,
          {
            role: "assistant" as const,
            content: "",
            events: [],
          } as ChatMessage,
        ];
        setMessages(updatedMessages);
      }

      setIsLoading(true);

      try {
        await fetchEventSource("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            editorHTML,
            attachPartOfHTML,
          }),
          signal: abortControllerRef.current.signal,
          openWhenHidden: true, // This single line handles background tabs!

          onmessage(ev: EventSourceMessage) {
            if (ev.data) {
              try {
                const event = JSON.parse(ev.data);

                // Skip any meta messages
                if (event?.type === "error") {
                  console.error("Server error:", event.error);
                  return;
                }

                if (event?.data?.type == "output_text_delta") {
                  const text = event?.data?.delta;
                  setMessages((prev) => {
                    const lastIndex = prev.length - 1;
                    if (
                      lastIndex >= 0 &&
                      prev[lastIndex].role === "assistant"
                    ) {
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

                // ... rest of existing event handling remains the same ...
                if (
                  event?.data?.event?.item?.type == "function_call" &&
                  event?.data?.event?.item?.status == "completed"
                ) {
                  setMessages((prev) => {
                    const lastIndex = prev.length - 1;
                    if (
                      lastIndex >= 0 &&
                      prev[lastIndex].role === "assistant"
                    ) {
                      const updated = [...prev];
                      const lastMessage = updated[lastIndex];
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
                  console.log("event", event);
                  if (event?.item?.rawItem?.output) {
                    const textObj = event?.item?.rawItem?.output?.text;
                    const responseObj = JSON.parse(textObj);

                    if (responseObj[0]?.content) {
                      const res = JSON.parse(responseObj[0]?.content[0]?.text);
                      if (res?.diffEditorHTML) {
                        const htmlOfEditor = editorRef.current?.getHTML?.();
                        const diffFromAssistant = res?.diffEditorHTML;
                        if (htmlOfEditor) {
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
                                diffFromAssistant
                              )
                            );
                          }
                          const replicaHtml = replicaRef.current
                            ?.getHTML()
                            ?.replace(
                              /<p\s+style="font-size:\s*14px;\s*padding:\s*0px;\s*line-height:\s*1\.25;\s*font-family:\s*Calibri,\s*Arial,\s*sans-serif;\s*white-space:\s*pre-wrap;\s*margin:\s*0px;"\s*><\/p>\s*$/g,
                              ""
                            );

                          const newHtml = htmlOfEditor.replace(
                            res?.oldEditorHTML,
                            replicaHtml ?? ""
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
                                            diffFromAssistant:
                                              diffFromAssistant,
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
                    } else {
                      const res = responseObj;

                      if (responseObj?.diffEditorHTML) {
                        const htmlOfEditor = editorRef.current?.getHTML?.();

                        if (htmlOfEditor) {
                          if (!htmlOfEditor.includes(res.oldEditorHTML)) {
                            console.warn(
                              "oldEditorHTML not found in current editor HTML!"
                            );
                          }
                          const randomId = Math.random()
                            .toString(36)
                            .substring(2, 15);
                          const diffFromAssistant = `<p id="diff-editor-html-${randomId}" style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">${res?.diffEditorHTML}</p>`;
                          const replicaInitialHTML =
                            replicaRef.current?.getHTML();

                          if (replicaInitialHTML) {
                            replicaRef.current?.setHTML(
                              replicaInitialHTML.replace(
                                replicaInitialHTML,
                                diffFromAssistant
                              )
                            );
                          }
                          const replicaHtml = replicaRef.current
                            ?.getHTML()
                            ?.replace(
                              /<p\s+style="font-size:\s*14px;\s*padding:\s*0px;\s*line-height:\s*1\.25;\s*font-family:\s*Calibri,\s*Arial,\s*sans-serif;\s*white-space:\s*pre-wrap;\s*margin:\s*0px;"\s*><\/p>\s*$/g,
                              ""
                            );

                          const newHtml = htmlOfEditor.replace(
                            res?.oldEditorHTML,
                            res?.diffEditorHTML
                          );
                          console.log("newHtml: ", newHtml);
                          editorRef.current?.setHTML?.(newHtml);
                          console.log(
                            "editorRef.current?.getHTML(): ",
                            editorRef.current?.getHTML()
                          );

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
                                            diffFromAssistant:
                                              diffFromAssistant,
                                            diffEditorHTMLId: `diff-editor-html-${randomId}`,
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
              } catch (err) {
                console.error("Error parsing event:", err);
              }
            }
          },

          onerror(err: any) {
            // Simple retry logic - only retry network errors, max 3 times
            if (err.name !== "AbortError" && retryCount < 3) {
              console.log(`Retrying... (${retryCount + 1}/3)`);
              retryTimeoutRef.current = setTimeout(() => {
                handleSendMessage(message, retryCount + 1);
              }, (retryCount + 1) * 2000); // 2s, 4s, 6s delays
              return;
            }

            if (err.name !== "AbortError") {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: "Connection failed. Please try again.",
                  events: [],
                },
              ]);
            }
            setIsLoading(false);
          },

          onclose() {
            setIsLoading(false);
          },
        });
      } catch (err: any) {
        if (err.name !== "AbortError" && retryCount < 3) {
          console.log(`Request failed, retrying... (${retryCount + 1}/3)`);
          retryTimeoutRef.current = setTimeout(() => {
            handleSendMessage(message, retryCount + 1);
          }, (retryCount + 1) * 2000);
          return;
        }

        if (err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Error: Could not get response.",
              events: [],
            },
          ]);
        }
        setIsLoading(false);
      }
    },
    [messages, attachPartOfHTML]
  );

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

  return (
    <SidebarProvider
      defaultOpen={true}
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
    >
      <AppSidebar />
      <div className="flex min-h-screen w-full gap-0">
        <SidebarInset className="flex-1 w-full">
          <div className="h-screen w-full flex flex-row rounded-none bg-gray-100">
            {/* Editor Section - Left side */}
            <div className="flex-1 flex flex-col overflow-hidden">
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
