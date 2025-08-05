import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface CleanPasteOptions {
  regexPattern: RegExp;
}

export const CleanPaste = Extension.create<CleanPasteOptions>({
  name: "cleanPaste",

  addOptions() {
    return {
      // - \x20-\x7E includes ASCII printable characters, including digits, letters, and punctuation.
      // - \u00A0-\u02AF and \u0370-\u03FF include many Latin, Greek, and other letters, including those with diacritics.
      // - \p{Letter} includes any Unicode letter character from any language.
      // - \s includes whitespace characters.
      // - u flag for Unicode mode.
      regexPattern: /[^\x20-\x7E\u00A0-\u02AF\u0370-\u03FF\p{Letter}\s]/gu,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey("cleanPaste"),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const text = clipboardData.getData("text/plain");
            if (!text) return false;

            const cleanText = text.replace(options.regexPattern, "");

            // Stop the default paste
            event.preventDefault();

            // Insert the cleaned text directly
            const { tr, selection } = view.state;
            const { from, to } = selection;

            // Create a transaction that replaces the selection with cleaned text
            const transaction = tr
              .deleteRange(from, to)
              .insertText(cleanText, from);

            view.dispatch(transaction);
            return true;
          },
        },
      }),
    ];
  },
});
