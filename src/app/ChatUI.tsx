"use client";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, History, LoaderIcon, Plus, X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./page";

import React, { RefObject, useEffect, useState } from "react";
import DiffEditor from "@/components/ui/diff-editor";
import { TiptapEditorRef } from "@/components/tiptap-editor-replica";
import { Node as ProseMirrorNode } from "prosemirror-model";

interface ChatInputProps {
  messages: ChatMessage[];
  isLoading: boolean;
  showingDiff: boolean;
  handleRejectChanges: () => void;
  handleAcceptChanges: () => void;
  handleSendMessage: (message: string) => void;
  canvasEditor: RefObject<TiptapEditorRef | null>;
}
const ChatUI = ({
  messages,
  isLoading,
  showingDiff,
  handleRejectChanges,
  handleAcceptChanges,
  handleSendMessage,
  canvasEditor,
}: ChatInputProps) => {
  // Expanded state for event accordions
  const [expandedEvents, setExpandedEvents] = useState<{
    [callId: string]: boolean;
  }>({});

  // Search/Replace state
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceWith, setReplaceWith] = useState("");

  // Search/Replace handlers
  const handleFind = (searchTerm: string) => {
    const editor = canvasEditor?.current?.getEditor?.();
    if (!editor || !searchTerm) return;
    const { state } = editor;
    let found = false;
    let pos = 0;
    state.doc.descendants((node: ProseMirrorNode, posHere: number) => {
      if (!found && node.isText) {
        const nodeText = node.text || "";
        const localIndex = nodeText.indexOf(searchTerm);
        if (localIndex !== -1) {
          pos = posHere + localIndex;
          found = true;
        }
      }
    });
    if (found) {
      editor.commands.setTextSelection({
        from: pos,
        to: pos + searchTerm.length,
      });
      editor.chain().focus().run();
    }
  };

  const handleReplace = (searchTerm: string, replaceWith: string) => {
    const editor = canvasEditor?.current?.getEditor?.();
    if (!editor || !searchTerm) return;
    const { state } = editor;
    const { from, to } = state.selection;
    const selectedText = state.doc.textBetween(from, to, "\n");
    if (selectedText === searchTerm) {
      editor.commands.insertContent(replaceWith);
    } else {
      handleFind(searchTerm);
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

  const toggleExpanded = (callId: string) => {
    setExpandedEvents((prev) => ({ ...prev, [callId]: !prev[callId] }));
  };

  const handleRejectEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    newEditorHTML: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    console.log("htmlOfEditor: ", htmlOfEditor);
    console.log("diffEditorHTML: ", diffEditorHTML);
    console.log("oldEditorHTML: ", oldEditorHTML);
    if (htmlOfEditor) {
      if (!htmlOfEditor.includes(diffEditorHTML)) {
        console.warn("diffEditorHTML not found in current editor HTML!");
      }
      const newHtml = htmlOfEditor.replace(diffEditorHTML, oldEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
    }
  };
  const handleAcceptEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    newEditorHTML: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    console.log("htmlOfEditor: ", htmlOfEditor);
    console.log("diffEditorHTML: ", diffEditorHTML);
    console.log("newEditorHTML: ", newEditorHTML);
    console.log("textOfEditor: ", canvasEditor?.current?.getText?.());
    const textOfEditor = canvasEditor?.current?.getText?.();
    setSearchTerm(textOfEditor || "");
    handleReplace(textOfEditor || "", "replaceWith");

    if (!htmlOfEditor?.includes(diffEditorHTML)) {
      console.warn("oldEditorHTML not found in current editor HTML!");
    }
    if (htmlOfEditor) {
      const newHtml = htmlOfEditor.replace(diffEditorHTML, newEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
    }
  };

  return (
    <div className="w-[390px] flex flex-col overflow-hidden">
      <div className="py-[2px] border rounded-md flex flex-row justify-between items-center">
        <div>
          <p className="p-2 text-sm font-semibold">New Chat</p>
        </div>
        <div className="flex flex-row gap-2 items-center ">
          <Button variant="ghost" size="sm">
            <Plus className="w-8 h-8 text-black/80" />
          </Button>
          <Button variant="ghost" size="sm">
            <History className="w-8 h-8 text-black/80" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          // Only render user messages
          if (message.role === "user") {
            return (
              <div key={index} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-gray-100  px-4 py-3 rounded-br-md">
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
                <div className="w-full rounded-2xl text-gray-800 py-1 rounded-bl-md">
                  <div className="flex flex-col gap-1 mb-2 w-full">
                    {message.events?.map((event) => (
                      <div
                        key={event.callId}
                        className={
                          "mb-2 w-full border border-black/10 bg-black/10 text-black gap-1 shadow-none font-bold outline-none hover:bg-black/10 rounded-md flex flex-col px-2"
                        }
                      >
                        <button
                          className="flex flex-row gap-1 py-2 items-center w-full focus:outline-none"
                          type="button"
                        >
                          <div className="flex items-center gap-1">
                            {event.status ? (
                              <span className="text-xs font-normal text-green-600"></span>
                            ) : (
                              <span className="text-xs font-normal text-yellow-600 flex items-center gap-1">
                                <LoaderIcon className="w-3 h-3 animate-spin" />{" "}
                                running
                              </span>
                            )}
                          </div>

                          <span className="text-xs font-semibold flex-1 text-left">
                            {event.name}
                          </span>
                          {event.status && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold flex-1 text-left">
                                <X
                                  className="w-3 h-3 "
                                  onClick={() =>
                                    handleRejectEvent(
                                      event.output?.oldEditorHTML,
                                      event.output?.diffEditorHTML,
                                      event.output?.newEditorHTML
                                    )
                                  }
                                />
                              </span>
                              <span className="text-xs font-semibold flex-1 text-left">
                                <Check
                                  className="w-3 h-3"
                                  onClick={() =>
                                    handleAcceptEvent(
                                      event.output?.oldEditorHTML,
                                      event.output?.diffEditorHTML,
                                      event.output?.newEditorHTML
                                    )
                                  }
                                />
                              </span>

                              <span
                                className={cn(
                                  "transition-transform cursor-pointer",
                                  expandedEvents[event.callId]
                                    ? "rotate-180"
                                    : "rotate-0"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(event.callId);
                                }}
                              >
                                <ChevronsUpDown className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </button>
                        {expandedEvents[event.callId] &&
                          event.output?.diffEditorHTML && (
                            <div
                              className="transition-all duration-200 mb-2 ease-in-out overflow-hidden max-h-64 overflow-y-auto"
                              style={{ maxHeight: "16rem" }} // 16rem = 256px, adjust as needed
                            >
                              <DiffEditor html={event.output.diffEditorHTML} />
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="py-1 bg-gray-50/50">
        {showingDiff && (
          <div className="flex items-center justify-end gap-1 py-1 px-2 ">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
              onClick={handleRejectChanges}
            >
              <X className="w-3 h-3" />
              Reject
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
              onClick={handleAcceptChanges}
            >
              <Check className="w-3 h-3" />
              Accept
            </Button>
          </div>
        )}
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatUI;
