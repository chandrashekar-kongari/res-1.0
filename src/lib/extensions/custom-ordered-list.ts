import { OrderedList } from "@tiptap/extension-ordered-list";

export const CustomOrderedList = OrderedList.extend({
  renderHTML({ HTMLAttributes }) {
    const style =
      "margin: 0; padding-left: 20px; list-style-type: decimal; font-family: Calibri, Arial, sans-serif;";

    return [
      "ol",
      {
        ...HTMLAttributes,
        style: `${style} ${HTMLAttributes.style || ""}`.trim(),
      },
      0,
    ];
  },
});
