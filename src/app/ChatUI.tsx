"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Circle, Loader2, X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "./(with-auth)/app/[id]/page";

import React, { RefObject, useEffect, useState, useRef, Fragment } from "react";
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
  resumeId: string;
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
  resumeId,
}: ChatInputProps) => {
  const updateMessage = trpc.message.update.useMutation();
  const saveResumeMutation = trpc.resume.update.useMutation();
  // Expanded state for event accordions
  const [expandedEvents, setExpandedEvents] = useState<{
    [callId: string]: boolean;
  }>({});

  // Animated dots for streaming indicator
  const [dots, setDots] = useState(".");
  const [showingDiff, setShowingDiff] = useState<boolean>(false);
  const [isRejectingAll, setIsRejectingAll] = useState<boolean>(false);
  const [isAcceptingAll, setIsAcceptingAll] = useState<boolean>(false);
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

  // Shared utility function to update message state and database
  const updateMessageStateAndDB = (
    eventCallId: string,
    updates: { accepted?: boolean; rejected?: boolean; notFound?: boolean }
  ) => {
    // Update state
    setMessages((prev: ChatMessage[]) => {
      const newMessages = prev.map((message: ChatMessage) => {
        if (message.role === "assistant" && message.events) {
          return {
            ...message,
            events: message.events.map((event) => {
              if (event.callId === eventCallId) {
                return { ...event, ...updates };
              }
              return event;
            }),
          };
        }
        return message;
      });

      // Update database
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

  const handleRejectEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    diffEditorHTMLId?: string,
    eventCallId?: string
  ) => {
    if (!eventCallId) return;

    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    if (!htmlOfEditor) return;

    if (diffEditorHTMLId) {
      const newHtml = replaceElementById(
        htmlOfEditor,
        diffEditorHTMLId,
        oldEditorHTML
      );
      canvasEditor?.current?.setHTML?.(newHtml);
      // Save the resume content to the database
      saveResumeMutation.mutate({
        content: newHtml,
        id: resumeId,
      });
      updateMessageStateAndDB(eventCallId, { rejected: true, accepted: false });
    } else {
      if (!htmlOfEditor.includes(diffEditorHTML)) {
        updateMessageStateAndDB(eventCallId, { notFound: true });
        return;
      }
      const newHtml = htmlOfEditor.replace(diffEditorHTML, oldEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
      // Save the resume content to the database
      saveResumeMutation.mutate({
        content: newHtml,
        id: resumeId,
      });
    }

    updateMessageStateAndDB(eventCallId, { rejected: true, accepted: false });
  };

  const handleAcceptEvent = (
    newEditorHTML: string,
    diffEditorHTMLId?: string,
    eventCallId?: string
  ) => {
    if (!eventCallId) return;

    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    if (!htmlOfEditor) return;

    if (diffEditorHTMLId) {
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
        // Save the resume content to the database
        saveResumeMutation.mutate({
          content: newHtml,
          id: resumeId,
        });
        updateMessageStateAndDB(eventCallId, {
          accepted: true,
          rejected: false,
        });
      } else {
        console.warn(
          `Element with ID ${diffEditorHTMLId} not found in current editor HTML!`
        );
        updateMessageStateAndDB(eventCallId, { notFound: true });
      }
    } else {
      updateMessageStateAndDB(eventCallId, { accepted: true, rejected: false });
    }
  };

  const handleRejectAllChanges = async () => {
    try {
      setIsRejectingAll(true);
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
              await new Promise((resolve) => setTimeout(resolve, 500));
              handleRejectEvent(
                event.output.oldEditorHTML,
                event.output.diffEditorHTML,
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
    } finally {
      setIsRejectingAll(false);
    }
  };

  const handleAcceptAllChanges = async () => {
    try {
      setIsAcceptingAll(true);
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
              await new Promise((resolve) => setTimeout(resolve, 500));
              handleAcceptEvent(
                event.output.newEditorHTML,
                event.output.diffEditorHTMLId,
                event.callId
              );
              anyEventProcessed = true;
            }
          }
        }
      }
    } finally {
      setIsAcceptingAll(false);
    }
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
        <div className=" pl-2 flex flex-row items-center gap-1">
          <p className="p-2 text-xs ">Chat Window</p>
          <Button
            variant="ghost"
            onClick={createNewChat}
            className="flex text-[10px] bg-gray-100  hover:bg-gray-200 hover:border-gray-300 rounded-lg px-1 items-center gap-0.5  h-6 min-h-0"
          >
            <div className="p-0.5 rounded-md bg-gray-200/50">
              {creatingNewThread ? (
                <Loader2 className="w-2.5 h-2.5 text-gray-600 animate-spin" />
              ) : (
                <PlusIcon className="w-2.5 h-2.5 text-gray-700" />
              )}
            </div>
            New Chat
          </Button>
        </div>
        {/* <div className="flex flex-row items-center ">
          <Button variant="ghost" className="hover:bg-gray-100">
            <CounterClockwiseClockIcon className="w-4 h-4 text-gray-600" />
          </Button>
        </div> */}
      </div>

      {messages.length === 0 ? (
        // Render ChatInput at the top when no messages
        <div className="p-2 pt-1 ">
          <ChatInput
            isStreaming={isAgentRunning}
            onSend={(message) => handleSendMessage(message, isResumeSelected)}
            onStop={handleStopAssistant}
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
                    <div key={index} className="flex justify-end mb-3">
                      <div className="w-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
                        <div className="text-sm px-4 py-3 leading-relaxed whitespace-pre-wrap text-gray-800">
                          {message.content}
                        </div>
                        {index == messages.length - 2 && isAgentRunning && (
                          <div className="flex border-t border-gray-200 justify-between items-center gap-2 py-2 px-4 mx-auto text-sm bg-white rounded-b-2xl">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 font-medium">
                                Generating{dots}
                              </span>
                            </div>
                            <Button
                              onClick={() => {
                                handleStopAssistant();
                              }}
                              variant="ghost"
                              className="rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 w-5 h-5 p-0.5 min-h-0 flex items-center justify-center"
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
                    <div key={index} className="flex justify-start w-full mb-3">
                      <div className="w-full rounded-2xl text-gray-700 p-1">
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
                                    <div key={eventIdx} className="my-3">
                                      {/* Tool status indicator */}
                                      <div
                                        className={`flex flex-row justify-between items-center gap-2 px-3 py-2.5 w-full rounded-xl text-xs border shadow-sm ${
                                          event.status
                                            ? event.accepted
                                              ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 text-emerald-800 rounded-b-none"
                                              : event.rejected
                                              ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-800 rounded-b-none"
                                              : event.notFound
                                              ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 text-amber-800"
                                              : "bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 text-blue-800 rounded-b-none"
                                            : "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 text-purple-800"
                                        }`}
                                      >
                                        <div className="flex flex-row items-center gap-2">
                                          <div
                                            className={`p-1 rounded-lg ${
                                              event.status
                                                ? event.accepted
                                                  ? "bg-emerald-100"
                                                  : event.rejected
                                                  ? "bg-red-100"
                                                  : event.notFound
                                                  ? "bg-amber-100"
                                                  : "bg-blue-100"
                                                : "bg-purple-100"
                                            }`}
                                          >
                                            {event.status ? (
                                              event.accepted ? (
                                                <Check className="w-3 h-3 text-emerald-600" />
                                              ) : event.rejected ? (
                                                <X className="w-3 h-3 text-red-600" />
                                              ) : event.notFound ? (
                                                <X className="w-3 h-3 text-amber-600" />
                                              ) : (
                                                <CheckCircledIcon className="w-3 h-3 text-blue-600" />
                                              )
                                            ) : message.isStreaming ? (
                                              <UpdateIcon className="w-3 h-3 text-purple-600 animate-spin" />
                                            ) : (
                                              <UpdateIcon className="w-3 h-3 text-purple-600" />
                                            )}
                                          </div>
                                          <span className="text-xs font-medium">
                                            {event.status
                                              ? event.accepted
                                                ? `${event.name} accepted`
                                                : event.rejected
                                                ? `${event.name} rejected`
                                                : event.notFound
                                                ? `${event.name}, text not found to update`
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
                                              <div className="flex items-center gap-1.5">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="cursor-pointer rounded-lg text-[10px] h-6 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                  onClick={() =>
                                                    handleRejectEvent(
                                                      event.output
                                                        ?.oldEditorHTML,
                                                      event.output
                                                        ?.diffEditorHTML,

                                                      event.output
                                                        ?.diffEditorHTMLId,
                                                      event.callId
                                                    )
                                                  }
                                                >
                                                  <X className="w-3 h-3" />
                                                  Reject
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="cursor-pointer rounded-lg text-[10px] h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                                                  onClick={() =>
                                                    handleAcceptEvent(
                                                      event.output
                                                        ?.newEditorHTML,
                                                      event.output
                                                        ?.diffEditorHTMLId,
                                                      event.callId
                                                    )
                                                  }
                                                >
                                                  <Check className="w-3 h-3" />
                                                  Accept
                                                </Button>
                                              </div>
                                            )}
                                        </div>
                                      </div>

                                      {/* Diff editor for completed tools */}
                                      {event.status &&
                                        event.output?.diffEditorHTML && (
                                          <div className="border border-gray-200 rounded-xl border-t-0 rounded-t-none bg-gradient-to-br from-gray-50 to-white p-3 max-h-40 overflow-y-auto shadow-sm">
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
                                  key={`markdown-${message.id}-${idx}`}
                                  components={{
                                    p: ({ children }) => <>{children}</>,
                                  }}
                                >
                                  {chunk.content}
                                </ReactMarkdown>
                              ) : (
                                <React.Fragment
                                  key={`tool-${message.id}-${idx}`}
                                >
                                  {chunk.element}
                                </React.Fragment>
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
              <div className="flex items-center gap-2 py-2.5 px-3 w-[95%] mx-auto border-b-0 rounded-b-none border rounded-xl text-sm bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-sm">
                {isAgentRunning ? (
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-purple-100">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">
                      Generating{dots}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center flex-row gap-2 pl-1">
                    <div className="p-1 rounded-lg bg-blue-100">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">
                      Resume edited
                    </span>
                  </div>
                )}
                {showingDiff && (
                  <div className="flex items-center ml-auto justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        isAgentRunning || isRejectingAll || isAcceptingAll
                      }
                      className="flex text-[10px] items-center rounded-lg gap-1 h-6 min-h-0 px-2 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={handleRejectAllChanges}
                    >
                      {isRejectingAll ? (
                        <Loader2 className="w-[10px] h-[10px] animate-spin" />
                      ) : (
                        <X className="w-[10px] h-[10px]" />
                      )}
                      Reject all
                    </Button>
                    <Button
                      disabled={
                        isAgentRunning || isRejectingAll || isAcceptingAll
                      }
                      size="sm"
                      className="flex text-[10px] bg-emerald-600 rounded-lg text-white hover:bg-emerald-700 items-center gap-1 h-6 min-h-0 px-2 border-0"
                      onClick={handleAcceptAllChanges}
                    >
                      {isAcceptingAll ? (
                        <Loader2 className="w-[10px] h-[10px] animate-spin" />
                      ) : (
                        <Check className="w-[10px] h-[10px]" />
                      )}
                      Accept all
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ChatInput
              isStreaming={isAgentRunning}
              onSend={(message) => handleSendMessage(message, isResumeSelected)}
              onStop={handleStopAssistant}
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
