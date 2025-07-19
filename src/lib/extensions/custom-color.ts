import { Color } from "@tiptap/extension-color";

export const CustomColor = Color.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color || null,
        renderHTML: (attributes: { color?: string }) => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },
  addOptions() {
    return {
      ...this.parent?.(),
      types: ["textStyle"],
      // Accept hex, rgb, rgba, hsl, hsla, and named colors
      colorMatcher:
        /^(#(?:[0-9a-fA-F]{3}){1,2}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-zA-Z]+)$/,
    };
  },
});
