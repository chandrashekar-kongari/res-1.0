import { Extension } from "@tiptap/core";

export interface MarginOptions {
  types: string[];
  defaultMarginTop: string;
  defaultMarginBottom: string;
}

export const Margin = Extension.create<MarginOptions>({
  name: "margin",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      defaultMarginTop: "0",
      defaultMarginBottom: "0",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          marginTop: {
            default: this.options.defaultMarginTop,
            parseHTML: (element) => element.style.marginTop || null,
            renderHTML: (attributes) => {
              if (
                !attributes.marginTop ||
                attributes.marginTop === this.options.defaultMarginTop
              ) {
                return {};
              }
              return {
                style: `margin-top: ${attributes.marginTop};`,
              };
            },
          },
          marginBottom: {
            default: this.options.defaultMarginBottom,
            parseHTML: (element) => element.style.marginBottom || null,
            renderHTML: (attributes) => {
              if (
                !attributes.marginBottom ||
                attributes.marginBottom === this.options.defaultMarginBottom
              ) {
                return {};
              }
              return {
                style: `margin-bottom: ${attributes.marginBottom};`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setMarginTop:
        (marginTop: string) =>
        ({ commands }: { commands: any }) => {
          let updated = false;
          if (commands.updateAttributes) {
            updated = commands.updateAttributes("paragraph", { marginTop });
            updated =
              commands.updateAttributes("heading", { marginTop }) || updated;
          }
          return updated;
        },
      setMarginBottom:
        (marginBottom: string) =>
        ({ commands }: { commands: any }) => {
          let updated = false;
          if (commands.updateAttributes) {
            updated = commands.updateAttributes("paragraph", { marginBottom });
            updated =
              commands.updateAttributes("heading", { marginBottom }) || updated;
          }
          return updated;
        },
    } as Partial<Record<string, any>>;
  },
});
