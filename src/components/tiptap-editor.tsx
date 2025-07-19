"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CustomColor } from "@/lib/extensions/custom-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  FontBoldIcon,
  FontItalicIcon,
  FontSizeIcon,
  Link2Icon,
  ListBulletIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  UnderlineIcon,
  TextIcon,
  FontStyleIcon,
  ResetIcon,
  BorderBottomIcon,
} from "@radix-ui/react-icons";

import { PageLimit } from "@/lib/extensions/page-limit";
import { PaginationPlus } from "@/lib/extensions/pagination-plus";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";

import { cn } from "@/lib/utils";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { getHTMLFromFragment } from "@tiptap/core";
import { trpc } from "@/lib/trpc";
import { DownloadIcon, HeadingIcon } from "lucide-react";
import { BorderBottom } from "@/lib/extensions/border-bottom";
import { CustomHeading } from "@/lib/extensions/custom-heading";

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
      padding: "2px",
      display: "flex",
      gap: "2px",
      backgroundColor: "white",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    }}
  >
    <Button
      size="sm"
      variant="ghost"
      className="text-xs rounded-none p-1 h-fit"
      onClick={(e) => {
        e.preventDefault();
        onAddToChat();
      }}
    >
      Add to Chat
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-xs rounded-none p-1 h-fit"
      onClick={(e) => {
        e.preventDefault();
        onReplaceText();
      }}
    >
      <FontBoldIcon className="h-4 w-4" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-xs rounded-none p-1 h-fit"
      onClick={(e) => {
        e.preventDefault();
        onReplaceText();
      }}
    >
      <FontItalicIcon className="h-4 w-4" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-xs rounded-none p-1 h-fit"
      onClick={(e) => {
        e.preventDefault();
        onReplaceText();
      }}
    >
      <Link2Icon className="h-4 w-4" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-xs rounded-none p-1 h-fit"
      onClick={(e) => {
        e.preventDefault();
        onReplaceText();
      }}
    >
      <FontSizeIcon className="h-4 w-4" />
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
  setAttachPartOfHTML?: (content: string[]) => void;
}

export interface TiptapEditorRef {
  getEditorElement: () => HTMLElement | null;
  getEditor: () => any;
  getHTML: () => string;
  setHTML: (html: string) => void;
  getText: () => string;
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
      setAttachPartOfHTML,
    },
    ref
  ) => {
    const editorContentRef = useRef<HTMLDivElement>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { mutate: saveResume } = trpc.resume.create.useMutation();
    const [floatingButton, setFloatingButton] = useState<{
      x: number;
      y: number;
      visible: boolean;
      text: string;
      from: number;
      to: number;
      selectedHTML: string;
    }>({
      x: 0,
      y: 0,
      visible: false,
      text: "",
      from: 0,
      to: 0,
      selectedHTML: "",
    });
    const [isOverflowing, setIsOverflowing] = useState(false);

    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "!outline-none min-h-[150px] max-w-none",
            // Add custom spacing overrides
            "!focus:outline-none min-h-[200px] px-10",
            // Force remove all outline styles
            "!outline-0 !focus:outline-0 !active:outline-0 !focus-visible:outline-0"
          ),
          // class:
          //   "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] px-10",
          style: "outline: none !important; box-shadow: none !important;",
        },
      },
      extensions: [
        Document,
        Paragraph.configure({
          HTMLAttributes: {
            style:
              "font-size: 12px; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
          },
        }),
        Text,
        StarterKit.configure({
          // Disable these since we're adding them separately
          link: false,
          underline: false,
          heading: false, // Disable default heading to add custom one
          paragraph: false, // Disable default paragraph to add custom one
        }),
        CustomHeading.configure({
          levels: [1, 2, 3, 4, 5, 6],
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
          HTMLAttributes: {
            class: "inline-styles",
          },
          mergeNestedSpanStyles: true,
        }),
        CustomColor.configure({
          types: ["textStyle"],
        }),

        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Link.configure({
          HTMLAttributes: {
            class: "text-blue-600 hover:text-blue-800 underline",
          },
        }),

        FontFamily,
        Underline,
        BorderBottom,

        PageLimit.configure({
          onOverflow: (overflow: boolean) => {
            setIsOverflowing(overflow);
            if (overflow) {
              setError("Content exceeds A4 page size");
            } else {
              setError(null);
            }
          },
        }),
        PaginationPlus.configure({
          pageHeight: 1090,
          pageGap: 20,
          pageBreakBackground: "#f7f7f7",
          pageHeaderHeight: 30,
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        console.log("onUpdate", editor.getHTML());

        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const selection = editor.state.selection;
        const selectedText = selection.empty
          ? ""
          : editor.state.doc.textBetween(selection.from, selection.to);

        let selectedHTML = "";
        if (!selection.empty) {
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              selectedHTML = getHTMLFromFragment(
                tr.doc.slice(selection.from, selection.to).content,
                editor.schema
              );
              return true;
            })
            .run();
        }

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
            selectedHTML, // new property
          });
        } else {
          setFloatingButton((prev) => ({ ...prev, visible: false }));
        }
      },
    });

    const handleAddToChat = useCallback(() => {
      console.log("Adding to chat:", floatingButton.selectedHTML);
      if (setAttachPartOfHTML) {
        setAttachPartOfHTML([
          ...(Array.isArray(setAttachPartOfHTML) ? setAttachPartOfHTML : []),
          floatingButton.selectedHTML,
        ]);
      }
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, [floatingButton.selectedHTML]);

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
      getText: () => editor?.getText() ?? "",
    }));

    const createPDFExport = useCallback(async () => {
      if (!editor || editor.isEmpty) return;
      setIsLoading(true);
      setError(null);

      try {
        const html = editor.getHTML();
        console.log("html", html);
        const response = await fetch("/api/export-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html, filename: "document.pdf" }),
        });

        if (!response.ok) throw new Error("Failed to export PDF");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.pdf";
        a.click();
        window.URL.revokeObjectURL(url);

        setIsLoading(false);
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
      }
    }, [editor]);

    const handleImportClick = useCallback(() => {
      importRef.current?.click();
    }, []);

    if (!editor) {
      return null;
    }

    return (
      <div className="flex flex-col h-full  min-w-[794px]">
        {/* Toolbar - Fixed at top */}
        <div className="sticky top-0 z-10 border-b justify-center flex flex-row">
          <div className="p-[2px] flex flex-wrap gap-1 items-center">
            <Separator orientation="vertical" className=" h-6" />

            <Toggle
              size="sm"
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
              <FontBoldIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("italic")}
              onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
              }
            >
              <FontItalicIcon className="h-4 w-4" />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  {editor.isActive("heading", { level: 1 })
                    ? "30px"
                    : editor.isActive("heading", { level: 2 })
                    ? "24px"
                    : editor.isActive("heading", { level: 3 })
                    ? "20px"
                    : editor.isActive("heading", { level: 4 })
                    ? "16px"
                    : editor.isActive("heading", { level: 5 })
                    ? "14px"
                    : editor.isActive("heading", { level: 6 })
                    ? "12px"
                    : "Text"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 6 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 6 }) && "bg-accent"
                  )}
                >
                  12px
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 5 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 5 }) && "bg-accent"
                  )}
                >
                  14px
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 4 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 4 }) && "bg-accent"
                  )}
                >
                  16px
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 3 }) && "bg-accent"
                  )}
                >
                  20px
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 2 }) && "bg-accent"
                  )}
                >
                  24px
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={cn(
                    editor.isActive("heading", { level: 1 }) && "bg-accent"
                  )}
                >
                  30px
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Toggle
              size="sm"
              pressed={editor.getAttributes("paragraph").borderBottom}
              onPressedChange={() =>
                editor.chain().focus().toggleBorderBottom().run()
              }
            >
              <BorderBottomIcon className="h-4 w-4" />
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
              <ListBulletIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("orderedList")}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
            >
              <ListBulletIcon className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: "left" })}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
            >
              <TextAlignLeftIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: "center" })}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
            >
              <TextAlignCenterIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: "right" })}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
            >
              <TextAlignRightIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: "justify" })}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
            >
              <TextAlignJustifyIcon className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="mx-1 h-6" />

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
              <TextIcon className="h-4 w-4" />
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
              <FontStyleIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <ResetIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <ResetIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={createPDFExport}
              disabled={isLoading || editor.isEmpty}
              variant="ghost"
            >
              PDF
              <DownloadIcon className="h-4 w-4 ml-1" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                saveResume({
                  content: editor.getHTML(),
                });
              }}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Editor Container - Scrollable */}
        <div className={cn("flex-1 overflow-auto bg-gray-100 p-4", className)}>
          {floatingButton.visible && (
            <FloatingButton
              x={floatingButton.x}
              y={floatingButton.y}
              onAddToChat={handleAddToChat}
              onReplaceText={handleReplaceText}
            />
          )}

          {/* A4 Container with responsive scaling */}
          {/* <div
            className="mx-auto relative"
            style={{
              width: "210mm",
              maxWidth: "100%",
              aspectRatio: "210/297",
            }}
          >
            <div
              ref={editorContentRef}
              className="absolute inset-0 bg-white shadow-lg"
              style={
                {
                  padding: "6rem",
                  transform: "scale(var(--scale))",
                  transformOrigin: "top center",
                  "--scale": "min(1, calc((100vw - 2rem) / 210mm))",
                } as React.CSSProperties
              }
            >
              <EditorContent editor={editor} />
            </div>
          </div> */}
          <div className="flex justify-center items-center">
            <div className="bg-white w-[794px] ">
              <EditorContent
                editor={editor}
                className="w-full !outline-none !focus:outline-none !focus-visible:outline-none"
                style={{ outline: "none !important" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
