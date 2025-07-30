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
  BorderBottomIcon,
  FontBoldIcon,
  FontItalicIcon,
  FontSizeIcon,
  Link2Icon,
  ListBulletIcon,
} from "@radix-ui/react-icons";

import { PageLimit } from "@/lib/extensions/page-limit";
import { PaginationPlus } from "@/lib/extensions/pagination-plus";
import { LineHeight } from "@/lib/extensions/line-height";
import { Margin } from "@/lib/extensions/margin";
import { FontSize } from "@/lib/extensions/font-size";
import { InlineEdit } from "@/lib/extensions/inline-edit";

import { Button } from "@/components/ui/button";
import LinkModal from "./LinkModal";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import { cn } from "@/lib/utils";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { getHTMLFromFragment } from "@tiptap/core";
import { trpc } from "@/lib/trpc";
import { BorderBottom } from "@/lib/extensions/border-bottom";
import { CustomHeading } from "@/lib/extensions/custom-heading";
import { TiptapToolbar } from "./tiptap-toolbar";
import { Node, mergeAttributes } from "@tiptap/core";

// Extend Paragraph to allow id attribute
const ParagraphWithId = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },
});

// Extend CustomHeading to allow id attribute
const CustomHeadingWithId = CustomHeading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },
});

// Create a custom Div node with id and style attributes
const DivWithId = Node.create({
  name: "divWithId",
  group: "block",
  content: "block*",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});

interface FloatingButtonProps {
  x: number;
  y: number;
  onAddToChat: () => void;
  onReplaceText: () => void;
  onAddLink: () => void;
  editor: any; // Add editor instance to props
}

const FloatingButton = ({
  x,
  y,
  onAddToChat,
  onReplaceText,
  onAddLink,
  editor,
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
      border: "1px solid #fbbf24",
      borderRadius: "8px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    }}
  >
    <Button
      size="sm"
      variant="ghost"
      className="text-xs  p-1 h-fit rounded-sm"
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
      className="text-xs p-1 h-fit rounded-sm"
      onClick={(e) => {
        e.preventDefault();
        editor?.chain().focus().toggleBold().run();
      }}
    >
      <FontBoldIcon className="h-4 w-4" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="text-xs p-1 h-fit rounded-sm"
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
      className={cn(
        "text-xs p-1 h-fit rounded-sm",
        editor?.getAttributes("paragraph").borderBottom ? "bg-accent" : ""
      )}
      onClick={(e) => {
        e.preventDefault();
        editor?.chain().focus().toggleBorderBottom().run();
      }}
    >
      <BorderBottomIcon className="h-4 w-4" />
    </Button>
    {["14px", "18px", "21px"].map((size) => (
      <Button
        variant="ghost"
        key={size}
        size="sm"
        className={cn(
          "text-xs p-1 h-fit rounded-sm",
          editor?.getAttributes("fontSize").size === size ? "bg-accent" : ""
        )}
        onClick={(e) => {
          e.preventDefault();
          editor?.chain().focus().setFontSize(size).run();
        }}
      >
        {size}
      </Button>
    ))}

    <Button
      size="sm"
      variant="ghost"
      className={cn(
        "text-xs p-1 h-fit rounded-sm",
        editor?.isActive("bulletList") ? "bg-accent" : ""
      )}
      onClick={(e) => {
        e.preventDefault();
        editor?.chain().focus().toggleBulletList().run();
      }}
    >
      <ListBulletIcon className="h-4 w-4" />
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
  setAttachPartOfHTML?: React.Dispatch<React.SetStateAction<string[]>>;
  resumeId: string;
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
      resumeId,
    },
    ref
  ) => {
    const utils = trpc.useUtils();
    const saveResumeMutation = trpc.resume.update.useMutation({
      onSuccess: (data) => {
        void utils.resume.invalidate();
      },
    });
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
        ParagraphWithId.configure({
          HTMLAttributes: {
            style:
              "font-size: 14px; padding: 0; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0;",
          },
        }),
        DivWithId,
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
        CustomHeadingWithId.configure({
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
        InlineEdit.configure({
          minLength: 3,
          debounce: 500,
          apiEndpoint: "/api/inline-edit",
          enabled: true,
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        console.log("onUpdate", editor.getHTML());

        console.log("editor.getJSON(): ", editor.getJSON());

        onChange?.(editor.getHTML());
        saveResumeMutation.mutate({
          content: editor.getHTML(),
          id: resumeId,
        });
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

    // Update editor content when content prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }, [editor, content]);

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
        setFloatingButton((prev) => ({ ...prev, visible: false }));
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
        setFloatingButton((prev) => ({ ...prev, visible: false }));
      } catch (e: any) {
        alert(e.message);
      }
    }, [editor, linkModal.url]);

    const handleLinkCancel = useCallback(() => {
      setLinkModal({ isOpen: false, url: "", text: "" });
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, []);

    const handleLinkRemove = useCallback(() => {
      if (!editor) return;
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkModal({ isOpen: false, url: "", text: "" });
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, [editor]);

    const handleAddToChat = useCallback(() => {
      console.log("Adding to chat:", floatingButton.selectedHTML);
      if (setAttachPartOfHTML) {
        setAttachPartOfHTML((prev: string[]) => [
          ...prev,
          floatingButton.selectedHTML,
        ]);
      }
      setFloatingButton((prev) => ({ ...prev, visible: false }));
    }, [floatingButton.selectedHTML]);

    const handleAddLink = useCallback(() => {
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
      // Don't hide floating button immediately - let the modal handle the selection
    }, [editor]);

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
      <div className="flex flex-col bg-[#FCFCFC] h-full min-w-[794px]">
        {/* Toolbar */}
        <TiptapToolbar
          editor={editor}
          isLoading={isLoading}
          onExportPDF={createPDFExport}
          onSetLink={setLink}
        />

        {/* Editor Container - Scrollable */}
        <div
          className={cn(
            "flex-1 overflow-auto bg-[#f6f1fc] border  shadow-none rounded-lg rounded-b-none p-3",
            className
          )}
        >
          {floatingButton.visible && (
            <FloatingButton
              x={floatingButton.x}
              y={floatingButton.y}
              onAddToChat={handleAddToChat}
              onReplaceText={handleReplaceText}
              onAddLink={handleAddLink}
              editor={editor}
            />
          )}

          <div className="flex justify-center items-center">
            <div className="bg-white shadow-md w-[794px]">
              <EditorContent
                editor={editor}
                className="w-full !outline-none !focus:outline-none !focus-visible:outline-none"
                style={{ outline: "none !important" }}
              />
            </div>
          </div>
        </div>

        {/* Link Modal */}
        <LinkModal
          isOpen={linkModal.isOpen}
          url={linkModal.url}
          text={linkModal.text}
          existingLink={!!editor?.getAttributes("link").href}
          onUrlChange={(url) => setLinkModal((prev) => ({ ...prev, url }))}
          onSubmit={handleLinkSubmit}
          onCancel={handleLinkCancel}
          onRemove={handleLinkRemove}
        />
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
