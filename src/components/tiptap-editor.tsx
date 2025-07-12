"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { ExportDocx } from "@tiptap-pro/extension-export-docx";
import { ImportDocx } from "@tiptap-pro/extension-import-docx";
import { Ai } from "@tiptap-pro/extension-ai";
import { InlineSuggestion } from "@/lib/extensions/inline-suggestion";
import { InlineReplace } from "@/lib/extensions/inline-replace";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Upload,
  Download,
  Type,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingButtonProps {
  x: number;
  y: number;
  onAddToChat: () => void;
  onReplaceText: () => void;
}

const FloatingButton = ({
  x,
  y,
  onAddToChat,
  onReplaceText,
}: FloatingButtonProps) => (
  <div
    style={{
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      transform: "translateY(-100%)",
      zIndex: 50,
      padding: "4px",
      display: "flex",
      gap: "4px",
    }}
  >
    <Button
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      onClick={(e) => {
        e.preventDefault();
        onAddToChat();
      }}
    >
      <MessageSquarePlus className="h-4 w-4 mr-1" />
      Add to Chat
    </Button>
    <Button
      size="sm"
      variant="secondary"
      className="shadow-md"
      onClick={(e) => {
        e.preventDefault();
        onReplaceText();
      }}
    >
      Replace Text
    </Button>
  </div>
);

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  enableExport?: boolean;
  aiAppId?: string;
  aiToken?: string;
}

export interface TiptapEditorRef {
  getEditorElement: () => HTMLElement | null;
  getEditor: () => any;
  getHTML: () => string;
  setHTML: (html: string) => void;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      content = "",
      onChange,
      placeholder = "",
      className = "",
      enableExport = false,
      aiAppId = "",
      aiToken = "",
    },
    ref
  ) => {
    const editorContentRef = useRef<HTMLDivElement>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [floatingButton, setFloatingButton] = useState<{
      x: number;
      y: number;
      visible: boolean;
      text: string;
      from: number;
      to: number;
    }>({
      x: 0,
      y: 0,
      visible: false,
      text: "",
      from: 0,
      to: 0,
    });

    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "outline-none min-h-[150px] prose prose-sm max-w-none",
            // Add custom spacing overrides
            "[&>*]:my-1 [&_p]:my-1 [&_h1]:mt-3 [&_h2]:mt-2 [&_h3]:mt-2"
          ),
        },
      },
      extensions: [
        StarterKit.configure({
          // Disable these since we're adding them separately
          link: false,
          underline: false,
        }),
        Image.configure({
          inline: true,
          HTMLAttributes: {
            class: "max-w-full h-auto",
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-gray-500 before:float-left before:pointer-events-none",
        }),

        Highlight.configure({
          multicolor: true,
          HTMLAttributes: {
            class: "bg-yellow-200 dark:bg-yellow-800 px-1 rounded",
          },
        }),
        TextStyle.configure({
          mergeNestedSpanStyles: true,
        }),
        ImportDocx.configure({
          appId: "v91pj729",
          token:
            "CowwvBxz4Hn1mSg21WwYevrw1HV9rz0owJcOBbyN00UyrWqJRwQufU8tuFWKUSEu",
          endpoint: "https://app.tiptap.com/api/import",
        }),
        ExportDocx.configure({
          onCompleteExport: (result: any) => {
            try {
              let blob: Blob;

              if (result instanceof Blob) {
                blob = result;
              } else if (typeof result === "string") {
                blob = new Blob([result], {
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });
              } else {
                blob = new Blob([result], {
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });
              }

              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "export.docx";
              a.click();
              URL.revokeObjectURL(url);
              setIsLoading(false);
            } catch (error: unknown) {
              console.error("Export error:", error);
              setError(
                error instanceof Error ? error.message : "Unknown export error"
              );
              setIsLoading(false);
            }
          },
        }),
        Table.configure({
          HTMLAttributes: {
            class: "border-collapse table-auto w-full border border-gray-300",
          },
        }),
        TableRow,
        TableCell.configure({
          HTMLAttributes: {
            class: "border border-gray-300 px-3 py-2",
          },
        }),
        TableHeader.configure({
          HTMLAttributes: {
            class: "border border-gray-300 px-3 py-2 bg-gray-50 font-semibold",
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          HTMLAttributes: {
            class: "text-blue-600 hover:text-blue-800 underline",
          },
        }),
        Color,
        FontFamily,
        Underline,
        Ai.configure({
          appId: aiAppId,
          token: aiToken,
          autocompletion: true,
          autocompletionOptions: {
            debounce: 10,
            inputLength: 4000,
          },
          onError: (error: Error) => {
            console.error("AI Extension Error:", error);
            setError(`AI Configuration Error: ${error.message}`);
          },
        }),
        InlineSuggestion.configure({
          minLength: 2,
          debounce: 300,
          getSuggestions: async (text: string) => {
            try {
              // First detect which mode to use
              const detectResponse = await fetch("/api/detect-mode", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
              });

              if (!detectResponse.ok) {
                console.error("Failed to detect mode");
                return "";
              }

              const { mode } = await detectResponse.json();

              // If mode is replace, don't show suggestion
              if (mode === "replace") {
                return "";
              }

              const response = await fetch("/api/suggest", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
              });

              if (!response.ok) {
                console.error("Failed to get suggestion");
                return "";
              }

              const { suggestion } = await response.json();
              return suggestion || "";
            } catch (error) {
              console.error("Error getting suggestion:", error);
              return "";
            }
          },
        }),
        InlineReplace.configure({
          minLength: 2,
          debounce: 300,
          getReplacement: async (text: string) => {
            try {
              // First detect which mode to use
              const detectResponse = await fetch("/api/detect-mode", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
              });

              if (!detectResponse.ok) {
                console.error("Failed to detect mode");
                return "";
              }

              const { mode } = await detectResponse.json();

              // If mode is suggest, don't show replacement
              if (mode === "suggest") {
                return "";
              }

              const response = await fetch("/api/rephrase", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
              });

              if (!response.ok) {
                console.error("Failed to get replacement");
                return "";
              }

              const { rephrasedText } = await response.json();
              return rephrasedText || "";
            } catch (error) {
              console.error("Error getting replacement:", error);
              return "";
            }
          },
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const selection = editor.state.selection;
        const selectedText = selection.empty
          ? ""
          : editor.state.doc.textBetween(selection.from, selection.to);

        if (selectedText) {
          const { view } = editor;
          const { from, to } = selection;
          const start = view.coordsAtPos(from);
          const end = view.coordsAtPos(to);

          const x = start.left + (end.left - start.left) / 2;
          const y = start.top;

          setFloatingButton({
            x,
            y,
            visible: true,
            text: selectedText,
            from: from,
            to: to,
          });
        } else {
          setFloatingButton((prev) => ({ ...prev, visible: false }));
        }
      },
    });

    const handleAddToChat = useCallback(() => {
      console.log("Adding to chat:", floatingButton.text);
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, [floatingButton.text]);

    const handleReplaceText = useCallback(async () => {
      if (!editor) return;

      // Store the current selection state
      const { from, to, text } = floatingButton;
      const tr = editor.state.tr;

      try {
        const response = await fetch("/api/rephrase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Failed to rephrase text");
        }

        const { rephrasedText } = await response.json();

        // Create a new transaction and apply it
        editor.view.dispatch(
          tr.deleteRange(from, to).insertText(rephrasedText, from)
        );

        setFloatingButton((prev) => ({ ...prev, visible: false }));
      } catch (error) {
        console.error("Error rephrasing text:", error);
        alert("Failed to rephrase text. Please try again.");
      }
    }, [editor, floatingButton]);

    useImperativeHandle(ref, () => ({
      getEditorElement: () => editorContentRef.current,
      getEditor: () => editor,
      getHTML: () => editor?.getHTML() ?? "",
      setHTML: (html: string) => {
        if (editor) {
          editor.commands.setContent(html);
        }
      },
    }));

    const createExport = useCallback(() => {
      if (!editor || editor.isEmpty) return;
      setIsLoading(true);

      try {
        editor.chain().focus().exportDocx().run();
      } catch (error: any) {
        console.error("Export error:", error);
        setError(error.message);
        setIsLoading(false);
      }
    }, [editor]);

    const handleImportClick = useCallback(() => {
      importRef.current?.click();
    }, []);

    const handleImportFilePick = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (importRef.current) {
          importRef.current.value = "";
        }
        if (!file || !editor) return;

        setIsLoading(true);
        setError(null);

        editor
          .chain()
          .importDocx({
            file,
            onImport(context: any) {
              if (context.error) {
                setError(context.error.message);
                setIsLoading(false);
                return;
              }
              context.setEditorContent();
              setError(null);
              setIsLoading(false);
            },
          })
          .run();
      },
      [editor]
    );

    if (!editor) {
      return null;
    }

    return (
      <div
        className={cn(
          "rounded-lg border border-input bg-background relative",
          className
        )}
      >
        {floatingButton.visible && (
          <FloatingButton
            x={floatingButton.x}
            y={floatingButton.y}
            onAddToChat={handleAddToChat}
            onReplaceText={handleReplaceText}
          />
        )}
        <div className="border-b border-input p-2 flex flex-wrap gap-1 items-center">
          {/* Document Operations */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={createExport}
              disabled={isLoading || editor.isEmpty}
            >
              <Download className="h-4 w-4" />
              Export DOCX
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportClick}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
              Import DOCX
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".docx"
              onChange={handleImportFilePick}
              style={{ display: "none" }}
            />
          </div>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Formatting */}
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Alignment */}
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Font Family */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setFontFamily('"Comic Sans MS", "Comic Sans"')
                .run()
            }
            className={cn(
              editor.isActive("textStyle", {
                fontFamily: '"Comic Sans MS", "Comic Sans"',
              }) && "bg-accent"
            )}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().setFontFamily("monospace").run()
            }
            className={cn(
              editor.isActive("textStyle", { fontFamily: "monospace" }) &&
                "bg-accent"
            )}
          >
            <Type className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* History */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="p-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 text-sm">Processing...</span>
          </div>
        )}
        {error && (
          <div className="p-2 bg-red-50 border-b border-red-200">
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        <div className="p-4" ref={editorContentRef}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
