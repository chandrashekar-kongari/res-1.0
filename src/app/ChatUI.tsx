"use client";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, History, LoaderIcon, X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/app/(with-auth)/app/[id]/page";

import React, { RefObject, useEffect, useState } from "react";
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
    } else {
      console.log("searchTerm not found");
    }
  };

  const handleReplace = (searchTerm: string, replaceWith: string) => {
    console.log("searchTerm: ", searchTerm);
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
    diffEditorHTMLId?: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    console.log("htmlOfEditor: ", htmlOfEditor);
    console.log("diffEditorHTML: ", diffEditorHTML);
    console.log("oldEditorHTML: ", oldEditorHTML);
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
      }
      const newHtml = htmlOfEditor.replace(diffEditorHTML, oldEditorHTML);
      canvasEditor?.current?.setHTML?.(newHtml);
    }
  };
  const handleAcceptEvent = (
    oldEditorHTML: string,
    diffEditorHTML: string,
    newEditorHTML: string,
    diffFromAssistant: string,
    diffEditorHTMLId?: string
  ) => {
    const htmlOfEditor = canvasEditor?.current?.getHTML?.();
    console.log("Accepted", diffEditorHTMLId);
    console.log("htmlOfEditor: ", htmlOfEditor);
    // console.log("diffEditorHTML: ", diffEditorHTML);
    // console.log("newEditorHTML: ", newEditorHTML);
    // console.log("textOfEditor: ", diffFromAssistant);

    if (htmlOfEditor && diffEditorHTMLId) {
      const newHtml = replaceElementById(
        htmlOfEditor,
        diffEditorHTMLId,
        newEditorHTML
      );
      canvasEditor?.current?.setHTML?.(newHtml);
    } else {
      console.log("oldEditorHTML not found in current editor HTML!");
    }
    // else if (htmlOfEditor) {
    //   if (!htmlOfEditor?.includes(diffEditorHTML)) {
    //     console.warn("oldEditorHTML not found in current editor HTML!");
    //   }
    //   if (!htmlOfEditor?.includes(diffFromAssistant)) {
    //     console.warn("diffFromAssistant not found in current editor HTML!");
    //   }
    //   const newHtml = htmlOfEditor.replace(diffEditorHTML, newEditorHTML);
    //   canvasEditor?.current?.setHTML?.(newHtml);
    // } else if (htmlOfEditor?.includes(diffFromAssistant)) {
    //   const newHtml = htmlOfEditor.replace(diffFromAssistant, newEditorHTML);
    //   canvasEditor?.current?.setHTML?.(newHtml);
    //   console.log("diff from assistant: ", newHtml);
    // }
  };

  return (
    <div className="w-[400px] flex flex-col overflow-hidden">
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

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message, index) => {
          // Only render user messages
          if (message.role === "user") {
            return (
              <div key={index} className="flex justify-end">
                <div className="max-w-[95%] rounded-2xl bg-black/5  px-4 py-3 rounded-br-md">
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
                  <div className="flex flex-col gap-1 mb-2 w-full">
                    {message.events?.map((event) => (
                      <div
                        key={event.callId}
                        className={
                          "w-full border rounded-sm border-black/10 bg-black/5 text-black shadow-none font-bold outline-none   flex flex-col"
                        }
                      >
                        <button
                          className="flex flex-row gap-1 py-2 items-center w-full focus:outline-none px-2"
                          type="button"
                        >
                          <div className="flex items-center gap-1">
                            {event.status ? (
                              <span className="text-xs font-normal text-green-900">
                                <CheckCircledIcon className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-xs font-normal text-yellow-900 flex items-center gap-1">
                                <UpdateIcon className="w-3 h-3 animate-spin" />{" "}
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
                                      event.output?.newEditorHTML,
                                      event.output?.diffEditorHTMLId
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
                                      event.output?.newEditorHTML,
                                      event.output?.diffFromAssistant,
                                      event.output?.diffEditorHTMLId
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
                              className="transition-all duration-200 mb-2 ease-in-out overflow-hidden max-h-64 overflow-y-auto px-2"
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
      <div className="p-2 bg-gray-50/50">
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
