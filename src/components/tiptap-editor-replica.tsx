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

import { PageLimit } from "@/lib/extensions/page-limit";
import { PaginationPlus } from "@/lib/extensions/pagination-plus";
import { LineHeight } from "@/lib/extensions/line-height";
import { Margin } from "@/lib/extensions/margin";
import { FontSize } from "@/lib/extensions/font-size";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

import { BorderBottom } from "@/lib/extensions/border-bottom";
import { CustomHeading } from "@/lib/extensions/custom-heading";
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
      ],
      content,
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
