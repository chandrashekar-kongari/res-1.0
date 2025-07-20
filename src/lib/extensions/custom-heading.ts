import { Heading } from "@tiptap/extension-heading";

export const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level;
    const styles = {
      1: "font-size: 21.33px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
      2: "font-size: 18.67px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
      3: "font-size: 16px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
      4: "font-size: 14.67px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
      5: "font-size: 13.33px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
      6: "font-size: 12px; font-weight: normal; margin: 0; padding: 0; line-height: 1; font-family: Calibri, Arial, sans-serif;",
    };

    const style = styles[level as keyof typeof styles] || styles[1];

    return [
      `h${level}`,
      {
        ...HTMLAttributes,
        style: `${style} ${HTMLAttributes.style || ""}`.trim(),
      },
      0,
    ];
  },
});
