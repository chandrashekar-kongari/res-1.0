import React, { useEffect, useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
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
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

const DiffEditor = ({ html }: { html: string }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    const ed = new Editor({
      content: html,
      editable: false,
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
          placeholder: "",
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-gray-500 before:float-left before:pointer-events-none",
        }),
        Highlight.configure({
          multicolor: true,
          HTMLAttributes: {
            class: "diff-highlight px-1 rounded",
          },
        }),
        TextStyle.configure({
          HTMLAttributes: {
            class: "inline-styles",
          },
          mergeNestedSpanStyles: true,
        }),
        Color.configure({
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
        // Do NOT include PageLimit or PaginationPlus here
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
      <div className="bg-[hsl(var(--card))] w-[794px] border border-[hsl(var(--border))] rounded px-2 prose prose-sm max-w-none transition-colors">
        <EditorContent
          editor={editor}
          className="w-full !outline-none !focus:outline-none !focus-visible:outline-none"
          style={{ outline: "none !important" }}
        />
      </div>
    </div>
  );
};

export default DiffEditor;
