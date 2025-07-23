import React, { useEffect, useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import TextAlign from "@tiptap/extension-text-align";
import { FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

import { CustomHeading } from "@/lib/extensions/custom-heading";
import { CustomBulletList } from "@/lib/extensions/custom-bullet-list";
import { CustomOrderedList } from "@/lib/extensions/custom-ordered-list";
import { CustomListItem } from "@/lib/extensions/custom-list-item";
import { CustomColor } from "@/lib/extensions/custom-color";
import { BorderBottom } from "@/lib/extensions/border-bottom";
import { Margin } from "@/lib/extensions/margin";

const DiffEditor = ({ html }: { html: string }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const ed = new Editor({
      content: html,
      editable: false,
      parseOptions: {
        preserveWhitespace: true,
      },
      extensions: [
        Document,
        Paragraph.configure({
          HTMLAttributes: {
            style:
              "font-size: 14px; margin: 0; padding: 0; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;",
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
      ],
    });
    setEditor(ed);
    return () => {
      ed.destroy();
    };
  }, [html]);

  if (!editor) return null;
  return (
    <div className="flex justify-center items-center">
      <div className="bg-[hsl(var(--card))] w-[794px]  rounded p-2 prose prose-sm max-w-none transition-colors">
        <EditorContent
          editor={editor}
          className="w-full !outline-none border-none !focus:outline-none !focus-visible:outline-none !focus:ring-0 !focus-visible:ring-0"
          style={{ outline: "none !important" }}
        />
      </div>
    </div>
  );
};

export default DiffEditor;
