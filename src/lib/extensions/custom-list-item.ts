import { ListItem } from "@tiptap/extension-list-item";

export const CustomListItem = ListItem.extend({
  renderHTML({ HTMLAttributes }) {
    const style =
      "margin: 0; padding: 0; line-height: 1.2; font-family: Calibri, Arial, sans-serif;";

    return [
      "li",
      {
        ...HTMLAttributes,
        style: `${style} ${HTMLAttributes.style || ""}`.trim(),
      },
      0,
    ];
  },
});
