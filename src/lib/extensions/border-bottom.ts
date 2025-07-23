import { Extension } from "@tiptap/core";

export interface BorderBottomOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    borderBottom: {
      /**
       * Set a border bottom on current paragraph
       */
      setBorderBottom: () => ReturnType;
      /**
       * Toggle a border bottom on current paragraph
       */
      toggleBorderBottom: () => ReturnType;
      /**
       * Unset a border bottom on current paragraph
       */
      unsetBorderBottom: () => ReturnType;
    };
  }
}

export const BorderBottom = Extension.create<BorderBottomOptions>({
  name: "borderBottom",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          borderBottom: {
            default: null,
            parseHTML: (element) => {
              const style = (element as HTMLElement).style.borderBottom;
              return style ? "true" : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.borderBottom) {
                return {};
              }
              return {
                style:
                  "border-bottom: 1px solid #b7b7b7; display: block; width: 100%; padding-bottom: 5px;",
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBorderBottom:
        () =>
        ({ commands, editor }) => {
          const { selection } = editor.state;
          const { $from } = selection;
          const node = $from.node();

          if (node.type.name === "paragraph" || node.type.name === "heading") {
            return commands.updateAttributes(node.type.name, {
              borderBottom: "true",
            });
          }
          return false;
        },
      toggleBorderBottom:
        () =>
        ({ commands, editor }) => {
          const { selection } = editor.state;
          const { $from } = selection;
          const node = $from.node();

          if (node.type.name === "paragraph" || node.type.name === "heading") {
            if (node.attrs.borderBottom) {
              return commands.updateAttributes(node.type.name, {
                borderBottom: null,
              });
            } else {
              return commands.updateAttributes(node.type.name, {
                borderBottom: "true",
              });
            }
          }
          return false;
        },
      unsetBorderBottom:
        () =>
        ({ commands, editor }) => {
          const { selection } = editor.state;
          const { $from } = selection;
          const node = $from.node();

          if (node.type.name === "paragraph" || node.type.name === "heading") {
            return commands.updateAttributes(node.type.name, {
              borderBottom: null,
            });
          }
          return false;
        },
    };
  },
});
