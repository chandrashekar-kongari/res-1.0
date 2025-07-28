"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Circle, Loader2, X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "./(with-auth)/app/[id]/page";

import React, { RefObject, useEffect, useState, useRef } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import DiffEditor from "@/components/diff-editor";
import { TiptapEditorRef } from "@/components/tiptap-editor-replica";
import {
  CheckCircledIcon,
  CounterClockwiseClockIcon,
  PlusIcon,
  StopIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { trpc } from "@/lib/trpc";

interface ChatInputProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isAgentRunning: boolean;
  handleSendMessage: (message: string, shouldSendEditorHTML?: boolean) => void;
  canvasEditor: RefObject<TiptapEditorRef | null>;
  attachPartOfHTML?: string[];
  setAttachPartOfHTML?: (parts: string[]) => void;
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => void;
  handleStopAssistant: () => void;
}
const ChatUI = ({
  messages,
  isLoading,
  isAgentRunning,
  handleSendMessage,
  canvasEditor,
  attachPartOfHTML,
  setAttachPartOfHTML,
  setMessages,
  handleStopAssistant,
}: ChatInputProps) => {
  const updateMessage = trpc.message.update.useMutation();
  // Expanded state for event accordions
  const [expandedEvents, setExpandedEvents] = useState<{
    [callId: string]: boolean;
  }>({});

  // Animated dots for streaming indicator
  const [dots, setDots] = useState(".");
  const [showingDiff, setShowingDiff] = useState<boolean>(false);

  const [creatingNewThread, setCreatingNewThread] = useState<boolean>(false);
  const utils = trpc.useUtils();

  const createNewThread = trpc.thread.create.useMutation({
    onSuccess: (data) => {
      void utils.thread.getLatest.invalidate(undefined, {
        refetchType: "all",
      });

      // setMessages([]);
      setCreatingNewThread(false);
    },
  });

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

  // Animate dots when streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAgentRunning) {
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
  }, [isAgentRunning]);

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
          const newMessages = prev.map((message: ChatMessage) => {
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

          // Update message in database
          const targetMessage = newMessages.find(
            (msg) =>
              msg.role === "assistant" &&
              msg.events?.some((e) => e.callId === eventCallId)
          );
          if (targetMessage?.id) {
            updateMessage.mutate({
              id: targetMessage.id,
              events: targetMessage.events || [],
            });
          }

          return newMessages;
        });

        return;
      }
      const newHtml = htmlOfEditor.replace(diffEditorHTML, oldEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
    }

    // Update message state to mark as rejected
    setMessages((prev: ChatMessage[]) => {
      const newMessages = prev.map((message: ChatMessage) => {
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

      // Update message in database
      const targetMessage = newMessages.find(
        (msg) =>
          msg.role === "assistant" &&
          msg.events?.some((e) => e.callId === eventCallId)
      );
      if (targetMessage?.id) {
        updateMessage.mutate({
          id: targetMessage.id,
          events: targetMessage.events || [],
        });
      }

      return newMessages;
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
          const newMessages = prev.map((message: ChatMessage) => {
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

          // Update message in database
          const targetMessage = newMessages.find(
            (msg) =>
              msg.role === "assistant" &&
              msg.events?.some((e) => e.callId === eventCallId)
          );
          if (targetMessage?.id) {
            updateMessage.mutate({
              id: targetMessage.id,
              events: targetMessage.events || [],
            });
          }

          return newMessages;
        });

        return;
      }
    } else {
      console.log("something else: ", htmlOfEditor);
    }

    // Update message state to mark as accepted
    setMessages((prev: ChatMessage[]) => {
      const newMessages = prev.map((message: ChatMessage) => {
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

      // Update message in database
      const targetMessage = newMessages.find(
        (msg) =>
          msg.role === "assistant" &&
          msg.events?.some((e) => e.callId === eventCallId)
      );
      if (targetMessage?.id) {
        updateMessage.mutate({
          id: targetMessage.id,
          events: targetMessage.events || [],
        });
      }

      return newMessages;
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

  const createNewChat = () => {
    setCreatingNewThread(true);
    createNewThread.mutate();
  };

  return (
    <div className="w-[410px] flex flex-col overflow-hidden ">
      <div className=" flex flex-row justify-between items-center">
        <div className="pl-2 flex flex-row items-center gap-1">
          <p className="p-2 text-xs ">Chat Window</p>
          <Button
            variant="outline"
            onClick={createNewChat}
            className="flex text-[10px] bg-[#E0E5EB] border-[#8FA1B9] hover:bg-[#E0E5EB]/80 hover:border-[#8FA1B9]/80 rounded-xl items-center gap-0.5  h-6 min-h-0 px-2"
          >
            {creatingNewThread ? (
              <Loader2 className="w-[10px] h-[10px] text-black/80 animate-spin" />
            ) : (
              <PlusIcon className="w-[10px] h-[10px] text-black/80" />
            )}
            New Chat
          </Button>
        </div>
        <div className="flex flex-row items-center ">
          <Button variant="ghost">
            <CounterClockwiseClockIcon className="w-4 h-4 text-black/80" />
          </Button>
        </div>
      </div>

      {messages.length === 0 ? (
        // Render ChatInput at the top when no messages
        <div className="p-2 pt-0 ">
          <ChatInput
            isStreaming={isAgentRunning}
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
            <div ref={scrollContainerRef} className="p-3 pt-0">
              {messages.map((message, index) => {
                // Only render user messages
                if (message.role === "user") {
                  return (
                    <div key={index} className="flex justify-end">
                      <div className="w-full rounded-xl bg-black/5   ">
                        <div className="text-sm px-4 py-2 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        {index == messages.length - 2 && isAgentRunning && (
                          <div className="flex border-t justify-between border-[#AD46FF]/10 items-center gap-2 py-[5px] px-4 mx-auto text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-black">
                                Generating{dots}
                              </span>
                            </div>
                            <Button
                              onClick={() => {
                                handleStopAssistant();
                              }}
                              variant="ghost"
                              className="rounded-full bg-[#FA2C37]/10 hover:text-[#FA2C37]/70 border-[#FA2C37] text-[#FA2C37] w-5 h-5 p-0.5 min-h-0 flex items-center justify-center"
                            >
                              <Circle className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                if (message.role === "assistant") {
                  return (
                    <div key={index} className="flex justify-start w-full">
                      <div className="w-full rounded-2xl text-black/80 p-1 rounded-bl-md">
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
                                event.type === "response.output_text.delta" &&
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
                                        className={`flex flex-row justify-between items-center gap-2 px-2 py-1 w-full rounded-md text-xs border ${
                                          event.status
                                            ? event.accepted
                                              ? "bg-[#CEEDD5] border-[#00C950] rounded-b-none"
                                              : event.rejected
                                              ? "bg-[#FEE4E2] border-[#FA2C37] rounded-b-none"
                                              : event.notFound
                                              ? "bg-[#FEF0C7] border-[#FE9900] "
                                              : "bg-[#E0E5EB] border-[#8FA1B9] rounded-b-none"
                                            : "bg-[#F3EBFD] border-[#AD46FF] "
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
                                          <span className="text-xs">
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
                                            !event.rejected &&
                                            !event.notFound && (
                                              <div className="flex items-center gap-1">
                                                <Badge
                                                  variant="outline"
                                                  className="cursor-pointer rounded-xl text-[10px]"
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
                                                  className="cursor-pointer rounded-xl text-[10px]"
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
                                          <div className="border rounded-md border-t-0 rounded-t-none border-gray-200 bg-gray-50 p-2 max-h-40 overflow-y-auto">
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
            {(isAgentRunning || showingDiff) && (
              <div className="flex items-center gap-2 py-[5px] px-1 w-[95%] mx-auto border-b-0 rounded-b-none border rounded-xl text-sm">
                {isAgentRunning ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs text-black">Generating{dots}</span>
                  </div>
                ) : (
                  <div className="flex items-center flex-row gap-2 pl-1">
                    <span className="text-xs text-black">Resume edited</span>
                  </div>
                )}
                {showingDiff && (
                  <div className="flex items-center ml-auto justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAgentRunning}
                      className="flex text-[10px] items-center rounded-xl gap-0.5  h-6 min-h-0 px-2"
                      onClick={handleRejectAllChanges}
                    >
                      <X className="w-[10px] h-[10px]" />
                      Reject all
                    </Button>
                    <Button
                      disabled={isAgentRunning}
                      size="sm"
                      variant="outline"
                      className="flex text-[10px] bg-black rounded-xl text-white hover:bg-black/80 hover:text-white items-center gap-0.5  h-6 min-h-0 px-2"
                      onClick={handleAcceptAllChanges}
                    >
                      <Check className="w-[10px] h-[10px]" />
                      Accept all
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ChatInput
              isStreaming={isAgentRunning}
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
