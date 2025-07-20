import { BulletList } from "@tiptap/extension-bullet-list";

export const CustomBulletList = BulletList.extend({
  renderHTML({ HTMLAttributes }) {
    const style =
      "margin: 0; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;";

    return [
      "ul",
      {
        ...HTMLAttributes,
        style: `${style} ${HTMLAttributes.style || ""}`.trim(),
      },
      0,
    ];
  },
});
