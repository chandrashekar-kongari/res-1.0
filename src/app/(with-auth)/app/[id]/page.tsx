"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import TiptapEditor, { TiptapEditorRef } from "@/components/tiptap-editor";
import { SidebarInset } from "@/components/ui/sidebar";
import ChatUI from "@/app/ChatUI";
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
    type?: string; // Add type field for different event types
    data?: any; // Add data field for event data
    output?: {
      diffEditorHTML?: any;
      newEditorHTML?: any;
      oldEditorHTML?: any;
      diffFromAssistant?: any;
      diffEditorHTMLId?: string;
    };
    accepted?: boolean;
    rejected?: boolean;
    notFound?: boolean;
  }>;
  attachPartOfHTML?: string[];
  isStreaming?: boolean; // Add streaming flag
}

export default function Home({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: resume, isLoading: isResumeLoading } = trpc.resume.get.useQuery(
    { id }
  );
  const [content, setContent] = useState(resume?.content || "");

  useEffect(() => {
    // Only set content if we don't have any content yet (initial load only)
    if (resume?.content && !content) {
      setContent(resume.content);
    }
  }, [resume?.content]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);
  const replicaRef = useRef<TiptapEditorRef>(null);
  const [attachPartOfHTML, setAttachPartOfHTML] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified message sending with built-in retry
  const handleSendMessage = useCallback(
    async (
      message: string,
      shouldSendEditorHTML: boolean = true,
      retryCount: number = 0
    ) => {
      if (!message.trim()) return;

      // Cancel existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const editorHTML = editorRef.current?.getHTML?.() || "";

      const userMessage: ChatMessage = {
        role: "user",
        content: message.trim(),
        events: [],
        newEditorHTML: editorHTML,
        attachPartOfHTML:
          attachPartOfHTML.length > 0 ? attachPartOfHTML : undefined,
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
            isStreaming: true,
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
            attachPartOfHTML:
              attachPartOfHTML.length > 0 ? attachPartOfHTML : undefined,
            shouldModifyFullResume: shouldSendEditorHTML,
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
                      const lastMessage = updated[lastIndex];
                      updated[lastIndex] = {
                        ...lastMessage,
                        events: [
                          ...(lastMessage.events || []),
                          {
                            callId: `text-delta-${Date.now()}-${Math.random()}`,
                            name: "text_delta",
                            status: true,
                            type: "output_text_delta",
                            data: { delta: text },
                          },
                        ],
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
                              type: "function_call",
                              data: event?.data?.event?.item,
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

                        if (htmlOfEditor) {
                          if (
                            res.oldEditorHTML &&
                            !htmlOfEditor.includes(res.oldEditorHTML.trim())
                          ) {
                            //Retry the tool call with the updated HTML
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
                                    e.callId === event?.item?.rawItem?.callId
                                );
                                if (exists) {
                                  updated[lastIndex] = {
                                    ...lastMessage,
                                    events: (lastMessage.events || []).map(
                                      (e) =>
                                        e.callId ===
                                        event?.item?.rawItem?.callId
                                          ? {
                                              ...e,
                                              status: true,
                                              notFound: true,
                                            }
                                          : e
                                    ),
                                  };
                                }
                                return updated;
                              }
                              return prev;
                            });
                            console.log("Should retry the tool call");
                            return;
                          }

                          // Check if res?.diffEditorHTML already has a root div with id

                          const tempDiv = document.createElement("div");
                          tempDiv.innerHTML = res.diffEditorHTML;
                          const rootElement = tempDiv.firstElementChild;

                          let finalId: string;
                          let diffFromAssistant: string;

                          if (
                            rootElement &&
                            rootElement.tagName === "DIV" &&
                            rootElement.id
                          ) {
                            // Root div has an id
                            if (rootElement.id.startsWith("diff-editor-html")) {
                              // Keep existing id as it starts with "diff-editor-html"
                              finalId = rootElement.id;
                              diffFromAssistant = res.diffEditorHTML;
                            } else {
                              // Replace existing id with new one
                              const randomId = Math.random()
                                .toString(36)
                                .substring(2, 15);
                              finalId = `diff-editor-html-${randomId}`;
                              const updatedHTML = res.diffEditorHTML.replace(
                                `id="${rootElement.id}"`,
                                `id="${finalId}"`
                              );
                              diffFromAssistant = updatedHTML;
                            }
                          } else {
                            // No root div with id, use current approach
                            const randomId = Math.random()
                              .toString(36)
                              .substring(2, 15);
                            finalId = `diff-editor-html-${randomId}`;
                            diffFromAssistant = `<div id="${finalId}" style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">${res?.diffEditorHTML}</div>`;
                          }

                          const replicaInitialHTML =
                            replicaRef.current?.setHTML(diffFromAssistant);

                          // if (replicaInitialHTML) {
                          //   replicaRef.current?.setHTML(
                          //     replicaInitialHTML.replace(
                          //       replicaInitialHTML,
                          //       diffFromAssistant
                          //     )
                          //   );
                          // }

                          console.log(
                            "replicaInitialHTML",
                            replicaRef.current?.getHTML()
                          );
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
                                              res?.diffEditorHTML,
                                            diffEditorHTMLId: finalId,
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
                      console.log("else");
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
                handleSendMessage(
                  message,
                  shouldSendEditorHTML,
                  retryCount + 1
                );
              }, (retryCount + 1) * 2000); // 2s, 4s, 6s delays
              return;
            }

            if (err.name !== "AbortError") {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (
                  lastIndex >= 0 &&
                  updated[lastIndex].role === "assistant" &&
                  updated[lastIndex].isStreaming
                ) {
                  // Update existing streaming message with error
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    isStreaming: false,
                    events: [
                      ...(updated[lastIndex].events || []),
                      {
                        callId: `error-${Date.now()}`,
                        name: "error",
                        status: true,
                        type: "output_text_delta",
                        data: { delta: "Connection failed. Please try again." },
                      },
                    ],
                  };
                } else {
                  // Add new error message
                  updated.push({
                    role: "assistant",
                    content: "",
                    events: [
                      {
                        callId: `error-${Date.now()}`,
                        name: "error",
                        status: true,
                        type: "output_text_delta",
                        data: { delta: "Connection failed. Please try again." },
                      },
                    ],
                    isStreaming: false,
                  });
                }
                return updated;
              });
            }
            setIsLoading(false);
          },

          onclose() {
            setIsLoading(false);
            // Mark streaming as finished
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  isStreaming: false,
                };
              }
              return updated;
            });
          },
        });
      } catch (err: any) {
        if (err.name !== "AbortError" && retryCount < 3) {
          console.log(`Request failed, retrying... (${retryCount + 1}/3)`);
          retryTimeoutRef.current = setTimeout(() => {
            handleSendMessage(message, shouldSendEditorHTML, retryCount + 1);
          }, (retryCount + 1) * 2000);
          return;
        }

        if (err.name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (
              lastIndex >= 0 &&
              updated[lastIndex].role === "assistant" &&
              updated[lastIndex].isStreaming
            ) {
              // Update existing streaming message with error
              updated[lastIndex] = {
                ...updated[lastIndex],
                isStreaming: false,
                events: [
                  ...(updated[lastIndex].events || []),
                  {
                    callId: `error-${Date.now()}`,
                    name: "error",
                    status: true,
                    type: "output_text_delta",
                    data: { delta: "Error: Could not get response." },
                  },
                ],
              };
            } else {
              // Add new error message
              updated.push({
                role: "assistant",
                content: "",
                events: [
                  {
                    callId: `error-${Date.now()}`,
                    name: "error",
                    status: true,
                    type: "output_text_delta",
                    data: { delta: "Error: Could not get response." },
                  },
                ],
                isStreaming: false,
              });
            }
            return updated;
          });
        }
        setIsLoading(false);
      }
    },
    [messages, attachPartOfHTML]
  );

  if (isResumeLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
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
                  resumeId={resume?.id || ""}
                />
                <TiptapEditorReplica ref={replicaRef} />
              </div>
            </div>

            {/* Chat Section - Right side */}
            <ChatUI
              messages={messages}
              isLoading={isLoading}
              handleSendMessage={handleSendMessage}
              canvasEditor={editorRef}
              attachPartOfHTML={attachPartOfHTML}
              setAttachPartOfHTML={setAttachPartOfHTML}
              setMessages={setMessages}
            />
          </div>
        </SidebarInset>
      </div>
    </>
  );
}
