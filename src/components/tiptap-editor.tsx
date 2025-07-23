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
import { CustomBulletList } from "@/lib/extensions/custom-bullet-list";
import { CustomOrderedList } from "@/lib/extensions/custom-ordered-list";
import { CustomListItem } from "@/lib/extensions/custom-list-item";
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
  ResetIcon,
  BorderBottomIcon,
  TextAlignBottomIcon,
  TextAlignTopIcon,
  LineHeightIcon,
  CircleIcon,
  ColorWheelIcon,
} from "@radix-ui/react-icons";

import { PageLimit } from "@/lib/extensions/page-limit";
import { PaginationPlus } from "@/lib/extensions/pagination-plus";
import { LineHeight } from "@/lib/extensions/line-height";
import { Margin } from "@/lib/extensions/margin";
import { FontSize } from "@/lib/extensions/font-size";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  onAddLink: () => void;
}

const FloatingButton = ({
  x,
  y,
  onAddToChat,
  onReplaceText,
  onAddLink,
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
        onAddLink();
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
    const [linkModal, setLinkModal] = useState({
      isOpen: false,
      url: "",
      text: "",
    });

    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "!outline-none min-h-[150px] max-w-none",
            // Add custom spacing overrides
            "!focus:outline-none min-h-[200px] px-[44px]",
            // Force remove all outline styles
            "!outline-0 !focus:outline-0 !active:outline-0 !focus-visible:outline-0"
          ),

          style: "outline: none !important; box-shadow: none !important;",
        },
      },
      parseOptions: {
        preserveWhitespace: true,
      },
      extensions: [
        Document,
        Paragraph.configure({
          HTMLAttributes: {
            style:
              "font-size: 14px; padding: 0; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0;",
          },
        }),

        Text,
        StarterKit.configure({
          // Disable these since we're adding them separately
          link: false,
          underline: false,
          heading: false, // Disable default heading to add custom one
          paragraph: false, // Disable default paragraph to add custom one
          bulletList: false, // Disable default bullet list to add custom one
          orderedList: false, // Disable default ordered list to add custom one
          listItem: false, // Disable default list item to add custom one
        }),
        CustomHeading.configure({
          levels: [1, 2, 3, 4, 5, 6],
        }),
        CustomBulletList,
        CustomOrderedList,
        CustomListItem,
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
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https"],
          HTMLAttributes: {
            class: "text-blue-600 hover:text-blue-800 underline",
          },
          isAllowedUri: (url, ctx) => {
            try {
              // construct URL
              const parsedUrl = url.includes(":")
                ? new URL(url)
                : new URL(`${ctx.defaultProtocol}://${url}`);

              // use default validation
              if (!ctx.defaultValidate(parsedUrl.href)) {
                return false;
              }

              // disallowed protocols
              const disallowedProtocols = ["ftp", "file", "mailto"];
              const protocol = parsedUrl.protocol.replace(":", "");

              if (disallowedProtocols.includes(protocol)) {
                return false;
              }

              // only allow protocols specified in ctx.protocols
              const allowedProtocols = ctx.protocols.map((p) =>
                typeof p === "string" ? p : p.scheme
              );

              if (!allowedProtocols.includes(protocol)) {
                return false;
              }

              // disallowed domains
              const disallowedDomains = [
                "example-phishing.com",
                "malicious-site.net",
              ];
              const domain = parsedUrl.hostname;

              if (disallowedDomains.includes(domain)) {
                return false;
              }

              // all checks have passed
              return true;
            } catch {
              return false;
            }
          },
          shouldAutoLink: (url) => {
            try {
              // construct URL
              const parsedUrl = url.includes(":")
                ? new URL(url)
                : new URL(`https://${url}`);

              // only auto-link if the domain is not in the disallowed list
              const disallowedDomains = [
                "example-no-autolink.com",
                "another-no-autolink.com",
              ];
              const domain = parsedUrl.hostname;

              return !disallowedDomains.includes(domain);
            } catch {
              return false;
            }
          },
        }),

        FontFamily,
        Underline,
        BorderBottom,
        LineHeight,
        Margin,
        FontSize,

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
          pageHeight: 1123, // A4 height: 297mm = 1123px at 96 DPI
          pageGap: 20,
          pageBreakBackground: "#f7f7f7",
          pageHeaderHeight: 37.8,
          maxPages: 10, // Allow more pages for longer documents
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

    const setLink = useCallback(() => {
      if (!editor) return;

      const previousUrl = editor.getAttributes("link").href || "";
      const selectedText = editor.state.selection.empty
        ? ""
        : editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          );

      setLinkModal({
        isOpen: true,
        url: previousUrl,
        text: selectedText,
      });
    }, [editor]);

    const handleLinkSubmit = useCallback(() => {
      if (!editor) return;

      // empty URL means unlink
      if (linkModal.url.trim() === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLinkModal({ isOpen: false, url: "", text: "" });
        return;
      }

      // update link
      try {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: linkModal.url.trim() })
          .run();
        setLinkModal({ isOpen: false, url: "", text: "" });
      } catch (e: any) {
        alert(e.message);
      }
    }, [editor, linkModal.url]);

    const handleLinkCancel = useCallback(() => {
      setLinkModal({ isOpen: false, url: "", text: "" });
    }, []);

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

    const handleAddLink = useCallback(() => {
      if (!editor) return;

      const previousUrl = editor.getAttributes("link").href || "";

      setLinkModal({
        isOpen: true,
        url: previousUrl,
        text: floatingButton.text,
      });
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, [editor, floatingButton.text]);

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
        console.log("html: ", html);

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
          <div className="p-[2px] flex flex-wrap gap-[2px] items-center">
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
            {/* Color Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ColorWheelIcon
                    className="h-4 w-4"
                    style={{
                      color: editor.getAttributes("textStyle").color || "#000",
                    }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">
                  Text Color
                </DropdownMenuLabel>
                {[
                  "#000000",
                  "rgb(255,0,0)",
                  "rgb(0,255,0)",
                  "#404040",
                  "#4d4d4d",
                  "#595959",
                  "#666666",
                  "#737373",
                  "#808080",
                ].map((color) => (
                  <DropdownMenuItem
                    key={color}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes("paragraph", { color })
                        .run()
                    }
                    className={cn(
                      editor.getAttributes("paragraph").color === color
                        ? "bg-accent"
                        : ""
                    )}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .updateAttributes("paragraph", { color: null })
                      .run()
                  }
                >
                  Remove Color
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Toggle
              size="sm"
              pressed={editor.getAttributes("paragraph").borderBottom}
              onPressedChange={() =>
                editor.chain().focus().toggleBorderBottom().run()
              }
            >
              <BorderBottomIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              className={cn(
                editor.getAttributes("fontSize").size === "14px"
                  ? "bg-accent"
                  : "",
                "text-xs"
              )}
              pressed={editor.getAttributes("fontSize").size === "14px"}
              onPressedChange={() =>
                editor.chain().focus().setFontSize("14px").run()
              }
            >
              14px
            </Toggle>
            <Toggle
              size="sm"
              className={cn(
                editor.getAttributes("fontSize").size === "18px"
                  ? "bg-accent"
                  : "",
                "text-xs"
              )}
              pressed={editor.getAttributes("fontSize").size === "18px"}
              onPressedChange={() =>
                editor.chain().focus().setFontSize("18px").run()
              }
            >
              18px
            </Toggle>
            <Toggle
              size="sm"
              className={cn(
                editor.getAttributes("fontSize").size === "21px"
                  ? "bg-accent"
                  : "",
                "text-xs"
              )}
              pressed={editor.getAttributes("fontSize").size === "21px"}
              onPressedChange={() =>
                editor.chain().focus().setFontSize("21px").run()
              }
            >
              21px
            </Toggle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FontSizeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">
                  Font Size
                </DropdownMenuLabel>
                {["12px", "14px", "16px", "18px", "21px"].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() =>
                      editor.chain().focus().setFontSize(size).run()
                    }
                    className={cn(
                      editor.getAttributes("fontSize").size === size
                        ? "bg-accent"
                        : ""
                    )}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().unsetFontSize().run()}
                >
                  Remove Font Size
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              onPressedChange={setLink}
            >
              <Link2Icon className="h-4 w-4" />
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M5.75024 3.5H4.71733L3.25 3.89317V5.44582L4.25002 5.17782L4.25018 8.5H3V10H7V8.5H5.75024V3.5ZM10 4H21V6H10V4ZM10 11H21V13H10V11ZM10 18H21V20H10V18ZM2.875 15.625C2.875 14.4514 3.82639 13.5 5 13.5C6.17361 13.5 7.125 14.4514 7.125 15.625C7.125 16.1106 6.96183 16.5587 6.68747 16.9167L6.68271 16.9229L5.31587 18.5H7V20H3.00012L2.99959 18.8786L5.4717 16.035C5.5673 15.9252 5.625 15.7821 5.625 15.625C5.625 15.2798 5.34518 15 5 15C4.67378 15 4.40573 15.2501 4.37747 15.5688L4.3651 15.875H2.875V15.625Z"></path>
              </svg>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LineHeightIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs ">
                  Line Height
                </DropdownMenuLabel>
                {[
                  "0.75",
                  "0.80",
                  "0.90",
                  "1",
                  "1.10",
                  "1.25",
                  "1.5",
                  "1.75",
                  "2",
                ].map((lh) => (
                  <DropdownMenuItem
                    key={lh}
                    onClick={() =>
                      editor.chain().focus().setLineHeight(lh).run()
                    }
                    className={cn(
                      editor.getAttributes("paragraph").lineHeight === lh ||
                        editor.getAttributes("heading").lineHeight === lh
                        ? "bg-accent"
                        : ""
                    )}
                  >
                    {lh}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <TextAlignTopIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs ">
                  Margin Top
                </DropdownMenuLabel>
                {["0.25", "0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"].map(
                  (mt) => (
                    <DropdownMenuItem
                      key={mt}
                      onClick={() => {
                        editor.commands.focus();
                        (editor.commands as any).setMarginTop(mt + "em");
                      }}
                      className={cn(
                        editor.getAttributes("paragraph").marginTop ===
                          mt + "em" ||
                          editor.getAttributes("heading").marginTop ===
                            mt + "em"
                          ? "bg-accent"
                          : ""
                      )}
                    >
                      {mt}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <TextAlignBottomIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs ">
                  Margin Bottom
                </DropdownMenuLabel>
                {["0.25", "0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"].map(
                  (mb) => (
                    <DropdownMenuItem
                      key={mb}
                      onClick={() => {
                        editor.commands.focus();
                        (editor.commands as any).setMarginBottom(mb + "em");
                      }}
                      className={cn(
                        editor.getAttributes("paragraph").marginBottom ===
                          mb + "em" ||
                          editor.getAttributes("heading").marginBottom ===
                            mb + "em"
                          ? "bg-accent"
                          : ""
                      )}
                    >
                      {mb}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button
              size="sm"
              onClick={createPDFExport}
              disabled={isLoading || editor.isEmpty}
              variant="ghost"
            >
              PDF
              <DownloadIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Editor Container - Scrollable */}
        <div className={cn("flex-1 overflow-auto bg-black/10 p-4", className)}>
          {floatingButton.visible && (
            <FloatingButton
              x={floatingButton.x}
              y={floatingButton.y}
              onAddToChat={handleAddToChat}
              onReplaceText={handleReplaceText}
              onAddLink={handleAddLink}
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

        {/* Link Modal */}
        {linkModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={handleLinkCancel}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editor?.getAttributes("link").href ? "Edit Link" : "Add Link"}
              </h3>

              <div className="space-y-4">
                {linkModal.text && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Selected Text
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                      {linkModal.text}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                    value={linkModal.url}
                    onChange={(e) =>
                      setLinkModal((prev) => ({ ...prev, url: e.target.value }))
                    }
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLinkSubmit();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        handleLinkCancel();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to remove the link
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <div>
                  {editor?.getAttributes("link").href && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .extendMarkRange("link")
                          .unsetLink()
                          .run();
                        setLinkModal({ isOpen: false, url: "", text: "" });
                      }}
                    >
                      Remove Link
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLinkCancel}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleLinkSubmit}>
                    {editor?.getAttributes("link").href ? "Update" : "Add"} Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
