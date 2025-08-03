import { Mark, mergeAttributes } from "@tiptap/core";

export const CustomSpan = Mark.create({
  name: "customSpan",

  addAttributes() {
    return {
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
    return [
      {
        tag: "span[style]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
