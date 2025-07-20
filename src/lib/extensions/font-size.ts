import { Mark, mergeAttributes } from "@tiptap/core";

export const FontSize = Mark.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize.replace(/['\"]+/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.size) {
            return {};
          }
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        style: "font-size",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) => {
          return chain().setMark(this.name, { size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});
