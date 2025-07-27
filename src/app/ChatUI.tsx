"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "./(with-auth)/app/[id]/page";

import React, { RefObject, useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import DiffEditor from "@/components/diff-editor";
import { TiptapEditorRef } from "@/components/tiptap-editor-replica";
import { Node as ProseMirrorNode } from "prosemirror-model";
import {
  CheckCircledIcon,
  CounterClockwiseClockIcon,
  PlusIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";

interface ChatInputProps {
  messages: ChatMessage[];
  isLoading: boolean;

  handleSendMessage: (message: string, shouldSendEditorHTML?: boolean) => void;
  canvasEditor: RefObject<TiptapEditorRef | null>;
  attachPartOfHTML?: string[];
  setAttachPartOfHTML?: (parts: string[]) => void;
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => void;
}
const ChatUI = ({
  messages,
  isLoading,
  handleSendMessage,
  canvasEditor,
  attachPartOfHTML,
  setAttachPartOfHTML,
  setMessages,
}: ChatInputProps) => {
  // Expanded state for event accordions
  const [expandedEvents, setExpandedEvents] = useState<{
    [callId: string]: boolean;
  }>({});

  // Animated dots for streaming indicator
  const [dots, setDots] = useState(".");
  const [showingDiff, setShowingDiff] = useState<boolean>(false);

  // Add selection state
  const [isResumeSelected, setIsResumeSelected] = useState<boolean>(true);

  // Reference to access the scroll container inside ScrollToBottom
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to top when user sends a message
  const scrollToTop = () => {
    // Find the ScrollToBottom's internal scrollable element
    const scrollToBottomContainer = document.querySelector(
      ".flex-1.overflow-y-auto"
    );
    if (scrollToBottomContainer) {
      scrollToBottomContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // Find all event callIds from assistant messages
    const allEventIds: string[] = [];
    messages.forEach((message) => {
      if (message.role === "assistant" && Array.isArray(message.events)) {
        message.events.forEach((event) => {
          if (event.callId) allEventIds.push(event.callId);
        });
      }
    });
    // Set all to true (expanded)
    setExpandedEvents((prev) => {
      const newState = { ...prev };
      allEventIds.forEach((id) => {
        newState[id] = true;
      });
      return newState;
    });
  }, [messages]);

  // Handle scrolling when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // When user sends a message, scroll to top to provide space for response
        setTimeout(() => scrollToTop(), 100);
      }
      // Assistant messages will auto-scroll to bottom via ScrollToBottom component
    }
  }, [messages.length]);

  // Check if assistant is currently streaming
  const isAssistantStreaming = () => {
    if (messages.length === 0) return false;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return false;

    // Check if there are any incomplete events (no status means still running)
    const hasRunningEvents = lastMessage.events?.some((event) => !event.status);
    return hasRunningEvents || isLoading;
  };

  // Animate dots when streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAssistantStreaming()) {
      interval = setInterval(() => {
        setDots((prev) => {
          if (prev === ".") return "..";
          if (prev === "..") return "...";
          return ".";
        });
      }, 200); // Change dots every 200ms
    } else {
      setDots("."); // Reset to single dot when not streaming
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAssistantStreaming()]);

  // Utility function to replace an element by id with new HTML
  function replaceElementById(
    html: string,
    id: string,
    newHtml: string
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const oldElem = doc.getElementById(id);
    if (oldElem) {
      const temp = doc.createElement("div");
      temp.innerHTML = newHtml.trim();
      const newNodes = Array.from(temp.childNodes);
      if (newNodes.length === 1) {
        oldElem.replaceWith(newNodes[0]);
      } else {
        newNodes.forEach((node) =>
          oldElem.parentNode?.insertBefore(node, oldElem)
        );
        oldElem.remove();
      }
      return doc.body.innerHTML;
    }
    return html;
  }

  const handleRejectEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    newEditorHTML: string,
    diffEditorHTMLId?: string,
    eventCallId?: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();

    if (htmlOfEditor && diffEditorHTMLId) {
      const newHtml = replaceElementById(
        htmlOfEditor,
        diffEditorHTMLId,
        oldEditorHTML
      );
      canvasEditor?.current?.setHTML?.(newHtml);
    } else if (htmlOfEditor) {
      if (!htmlOfEditor.includes(diffEditorHTML)) {
        console.warn("diffEditorHTML not found in current editor HTML!");
        // Update message state to mark as notFound
        setMessages((prev: ChatMessage[]) => {
          return prev.map((message: ChatMessage) => {
            if (message.role === "assistant" && message.events) {
              return {
                ...message,
                events: message.events.map((event) => {
                  if (event.callId === eventCallId) {
                    return { ...event, notFound: true };
                  }
                  return event;
                }),
              };
            }
            return message;
          });
        });

        return;
      }
      const newHtml = htmlOfEditor.replace(diffEditorHTML, oldEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
    }

    // Update message state to mark as rejected
    setMessages((prev: ChatMessage[]) => {
      return prev.map((message: ChatMessage) => {
        if (message.role === "assistant" && message.events) {
          return {
            ...message,
            events: message.events.map((event) => {
              if (event.callId === eventCallId) {
                return { ...event, rejected: true, accepted: false };
              }
              return event;
            }),
          };
        }
        return message;
      });
    });
  };

  const handleAcceptEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    newEditorHTML: string,
    diffFromAssistant: string,
    diffEditorHTMLId?: string,
    eventCallId?: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();

    if (htmlOfEditor && diffEditorHTMLId) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlOfEditor, "text/html");
      const targetElement = doc.getElementById(diffEditorHTMLId);

      if (targetElement) {
        const newHtml = replaceElementById(
          htmlOfEditor,
          diffEditorHTMLId,
          newEditorHTML
        );
        canvasEditor?.current?.setHTML?.(newHtml);
      } else {
        console.warn(
          `Element with ID ${diffEditorHTMLId} not found in current editor HTML!`
        );
        // Update message state to mark as notFound
        setMessages((prev: ChatMessage[]) => {
          return prev.map((message: ChatMessage) => {
            if (message.role === "assistant" && message.events) {
              return {
                ...message,
                events: message.events.map((event) => {
                  if (event.callId === eventCallId) {
                    return { ...event, notFound: true };
                  }
                  return event;
                }),
              };
            }
            return message;
          });
        });

        return;
      }
    } else {
      console.log("something else: ", htmlOfEditor);
    }

    // Update message state to mark as accepted
    setMessages((prev: ChatMessage[]) => {
      return prev.map((message: ChatMessage) => {
        if (message.role === "assistant" && message.events) {
          return {
            ...message,
            events: message.events.map((event) => {
              if (event.callId === eventCallId) {
                return { ...event, accepted: true, rejected: false };
              }
              return event;
            }),
          };
        }
        return message;
      });
    });
  };

  const handleRejectAllChanges = () => {
    let anyEventProcessed = false;
    // Iterate through messages in reverse order
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "assistant" && message.events) {
        // Iterate through events in reverse order
        for (let j = message.events.length - 1; j >= 0; j--) {
          const event = message.events[j];
          // Only process events that have diff data, status is complete and aren't already rejected
          if (
            event.output?.diffEditorHTML &&
            event.status &&
            !event.rejected &&
            !event.notFound &&
            !event.accepted
          ) {
            handleRejectEvent(
              event.output.oldEditorHTML,
              event.output.diffEditorHTML,
              event.output.newEditorHTML,
              event.output.diffEditorHTMLId,
              event.callId
            );
            anyEventProcessed = true;
          }
        }
      }
    }
    // Only hide diff if we actually processed some events
    setShowingDiff(false);
  };

  const handleAcceptAllChanges = () => {
    let anyEventProcessed = false;
    // Iterate through messages in reverse order
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "assistant" && message.events) {
        // Iterate through events in reverse order
        for (let j = message.events.length - 1; j >= 0; j--) {
          const event = message.events[j];
          // Only process events that have diff data, status is complete and aren't already accepted
          if (
            event.output?.diffEditorHTML &&
            event.status &&
            !event.accepted &&
            !event.notFound &&
            !event.rejected
          ) {
            handleAcceptEvent(
              event.output.oldEditorHTML,
              event.output.diffEditorHTML,
              event.output.newEditorHTML,
              event.output.diffFromAssistant,
              event.output.diffEditorHTMLId,
              event.callId
            );
            anyEventProcessed = true;
          }
        }
      }
    }
    // Only hide diff if we actually processed some events
    setShowingDiff(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Check all messages for unaccepted events
      const hasUnacceptedEvents = messages.some(
        (message) =>
          message.role === "assistant" &&
          message.events?.some(
            (event) =>
              event.status &&
              event.type === "function_call" &&
              !event.accepted &&
              !event.rejected &&
              !event.notFound
          )
      );
      setShowingDiff(hasUnacceptedEvents);
    }
  }, [messages]);

  return (
    <div className="w-[400px] flex flex-col overflow-hidden ">
      <div className=" flex flex-row justify-between items-center">
        <div>
          <p className="p-2 text-xs ">New Chat Title</p>
        </div>
        <div className="flex flex-row items-center ">
          <Button variant="ghost">
            <PlusIcon className="w-4 h-4 text-black/80" />
          </Button>
          <Button variant="ghost">
            <CounterClockwiseClockIcon className="w-4 h-4 text-black/80" />
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        // Render ChatInput at the top when no messages
        <div className="p-2 pt-0 ">
          <ChatInput
            isStreaming={isAssistantStreaming()}
            onSend={(message) => handleSendMessage(message, isResumeSelected)}
            isResumeSelected={isResumeSelected}
            setIsResumeSelected={setIsResumeSelected}
            attachPartOfHTML={attachPartOfHTML}
            setAttachPartOfHTML={setAttachPartOfHTML}
          />
        </div>
      ) : (
        // Render messages and ChatInput at bottom when there are messages
        <>
          {/* Messages Container */}
          <ScrollToBottom
            className="flex-1 overflow-y-auto"
            followButtonClassName="hidden"
            mode="bottom"
          >
            <div ref={scrollContainerRef} className="p-3 space-y-4">
              {messages.map((message, index) => {
                // Only render user messages
                if (message.role === "user") {
                  return (
                    <div key={index} className="flex justify-end">
                      <div className="w-full rounded-xl bg-black/5  px-3 py-2 ">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (message.role === "assistant") {
                  return (
                    <div key={index} className="flex justify-start w-full">
                      <div className="w-full rounded-2xl text-black/80 py-1 rounded-bl-md">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {(() => {
                            // Build output chunks: buffer markdown, interleave tool components
                            const outputChunks: Array<
                              | { type: "markdown"; content: string }
                              | { type: "tool"; element: React.ReactNode }
                            > = [];
                            let currentMarkdown = "";

                            message.events?.forEach((event, eventIdx) => {
                              if (
                                event.type === "output_text_delta" &&
                                event.data?.delta
                              ) {
                                currentMarkdown += event.data.delta;
                              } else if (event.type === "function_call") {
                                // Flush buffered markdown before tool
                                if (currentMarkdown) {
                                  outputChunks.push({
                                    type: "markdown",
                                    content: currentMarkdown,
                                  });
                                  currentMarkdown = "";
                                }

                                // Show tool status - running or completed
                                outputChunks.push({
                                  type: "tool",
                                  element: (
                                    <div key={eventIdx} className="mt-2 mb-2">
                                      {/* Tool status indicator */}
                                      <div
                                        className={`flex flex-row justify-between items-center gap-2 px-2 py-1 w-full rounded text-xs border  rounded-b-none ${
                                          event.status
                                            ? event.accepted
                                              ? "bg-green-100 text-green-900"
                                              : event.rejected
                                              ? "bg-red-100 text-red-900"
                                              : event.notFound
                                              ? "bg-gray-100 text-gray-900"
                                              : "bg-yellow-100 text-yellow-900"
                                            : "bg-yellow-100 text-yellow-900"
                                        }`}
                                      >
                                        <div className="flex flex-row items-center gap-2">
                                          {event.status ? (
                                            event.accepted ? (
                                              <Check className="w-3 h-3" />
                                            ) : event.rejected ? (
                                              <X className="w-3 h-3" />
                                            ) : event.notFound ? (
                                              <X className="w-3 h-3" />
                                            ) : (
                                              <CheckCircledIcon className="w-3 h-3" />
                                            )
                                          ) : (
                                            <UpdateIcon className="w-3 h-3 animate-spin" />
                                          )}
                                          <span className="text-xs italic">
                                            {event.status
                                              ? event.accepted
                                                ? `${event.name} accepted`
                                                : event.rejected
                                                ? `${event.name} rejected`
                                                : event.notFound
                                                ? `${event.name}, resume part not found in resume`
                                                : `${event.name} completed`
                                              : `${event.name} running...`}
                                          </span>
                                        </div>

                                        {/* Accept/Reject buttons for completed tools */}
                                        <div>
                                          {event.status &&
                                            event.output?.diffEditorHTML &&
                                            !event.accepted &&
                                            !event.rejected && (
                                              <div className="flex items-center gap-1">
                                                <Badge
                                                  variant="outline"
                                                  className="cursor-pointer"
                                                  onClick={() =>
                                                    handleRejectEvent(
                                                      event.output
                                                        ?.oldEditorHTML,
                                                      event.output
                                                        ?.diffEditorHTML,
                                                      event.output
                                                        ?.newEditorHTML,
                                                      event.output
                                                        ?.diffEditorHTMLId,
                                                      event.callId
                                                    )
                                                  }
                                                >
                                                  <X className="w-3 h-3 mr-1" />{" "}
                                                  Reject
                                                </Badge>
                                                <Badge
                                                  variant="default"
                                                  className="cursor-pointer"
                                                  onClick={() =>
                                                    handleAcceptEvent(
                                                      event.output
                                                        ?.oldEditorHTML,
                                                      event.output
                                                        ?.diffEditorHTML,
                                                      event.output
                                                        ?.newEditorHTML,
                                                      event.output
                                                        ?.diffFromAssistant,
                                                      event.output
                                                        ?.diffEditorHTMLId,
                                                      event.callId
                                                    )
                                                  }
                                                >
                                                  <Check className="w-3 h-3 mr-1" />{" "}
                                                  Accept
                                                </Badge>
                                              </div>
                                            )}
                                        </div>
                                      </div>

                                      {/* Diff editor for completed tools */}
                                      {event.status &&
                                        event.output?.diffEditorHTML && (
                                          <div className="border rounded border-t-0 rounded-t-none border-gray-200 bg-gray-50 p-2 max-h-40 overflow-y-auto">
                                            <DiffEditor
                                              html={event.output.diffEditorHTML}
                                            />
                                          </div>
                                        )}
                                    </div>
                                  ),
                                });
                              }
                            });

                            // Flush any remaining markdown
                            if (currentMarkdown) {
                              outputChunks.push({
                                type: "markdown",
                                content: currentMarkdown,
                              });
                            }

                            // Render the chunks
                            return outputChunks.map((chunk, idx) =>
                              chunk.type === "markdown" ? (
                                <ReactMarkdown
                                  key={idx}
                                  components={{
                                    p: ({ children }) => <>{children}</>,
                                  }}
                                >
                                  {chunk.content}
                                </ReactMarkdown>
                              ) : (
                                chunk.element
                              )
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </ScrollToBottom>

          {/* Chat Input - Fixed at bottom */}
          <div className="p-2 ">
            {/* Streaming status indicator */}
            {(isAssistantStreaming() || showingDiff) && (
              <div className="flex items-center gap-2 py-2 px-3 w-[95%] mx-auto border-b-0 rounded-b-none border  rounded-lg text-sm">
                {isAssistantStreaming() && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black">Generating{dots}</span>
                  </div>
                )}
                {showingDiff && (
                  <div className="flex items-center ml-auto justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAssistantStreaming()}
                      className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
                      onClick={handleRejectAllChanges}
                    >
                      <X className="w-3 h-3" />
                      Reject all
                    </Button>
                    <Button
                      disabled={isAssistantStreaming()}
                      size="sm"
                      className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
                      onClick={handleAcceptAllChanges}
                    >
                      <Check className="w-3 h-3" />
                      Accept all
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ChatInput
              isStreaming={isAssistantStreaming()}
              onSend={(message) => handleSendMessage(message, isResumeSelected)}
              isResumeSelected={isResumeSelected}
              setIsResumeSelected={setIsResumeSelected}
              attachPartOfHTML={attachPartOfHTML}
              setAttachPartOfHTML={setAttachPartOfHTML}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatUI;
