import { Extension } from "@tiptap/core";

export interface LineHeightOptions {
  types: string[];
  defaultLineHeight: string;
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      defaultLineHeight: "1",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (
                !attributes.lineHeight ||
                attributes.lineHeight === this.options.defaultLineHeight
              ) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight};`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          let updated = false;
          if (commands.updateAttributes) {
            updated = commands.updateAttributes("paragraph", { lineHeight });
            updated =
              commands.updateAttributes("heading", { lineHeight }) || updated;
          }
          return updated;
        },
    };
  },
});
