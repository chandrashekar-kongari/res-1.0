"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CustomColor } from "@/lib/extensions/custom-color";
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
import { InlineSuggestion } from "@/lib/extensions/inline-suggestion";
import { InlineReplace } from "@/lib/extensions/inline-replace";
import { PageLimit } from "@/lib/extensions/page-limit";
import { PaginationPlus } from "@/lib/extensions/pagination-plus";

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
import Stream from "stream";
import { exportToPDF } from "@/lib/pdf-export";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

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
  previousState?: string;
}

export interface TiptapEditorRef {
  getEditorElement: () => HTMLElement | null;
  getEditor: () => any;
  getHTML: () => string | undefined;
  setHTML: (html: string) => void;
  getText: () => string | undefined;
}

const TiptapEditorReplica = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  (
    {
      content = null,
      onChange,
      placeholder = "",
      className = "",
      enableExport = false,
      aiAppId = "",
      aiToken = "",
      previousState = "",
    },
    ref
  ) => {
    const editorContentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "!outline-none min-h-[150px] prose prose-sm max-w-none",
            "[&>*]:my-1 [&_p]:my-1 [&_h1]:mt-3 [&_h2]:mt-2 [&_h3]:mt-2 mx-auto !focus:outline-none min-h-[200px] px-10",
            "!outline-0 !focus:outline-0 !active:outline-0 !focus-visible:outline-0"
          ),
          style: "outline: none !important; box-shadow: none !important;",
        },
      },
      extensions: [
        Document,
        Paragraph,
        Text,
        StarterKit.configure({
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
          pageHeaderHeight: 30,
          maxPages: 10, // Allow more pages for longer documents
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      getEditorElement: () => editorContentRef.current,
      getEditor: () => editor,
      getHTML: () => editor?.getHTML(),
      setHTML: (html: string) => {
        if (editor) {
          editor.commands.setContent(html);
        }
      },
      getText: () => editor?.getText(),
    }));

    // Do not render anything
    return null;
  }
);

TiptapEditorReplica.displayName = "TiptapEditorReplica";

export default TiptapEditorReplica;
