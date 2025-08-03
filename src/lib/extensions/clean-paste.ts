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

            // Split text into words and create spans
            const words = cleanText
              .split(/(\s+)/)
              .filter((word) => word.length > 0);
            const { tr, selection } = view.state;
            const { from, to } = selection;

            // Start a new transaction
            let transaction = tr.deleteRange(from, to);
            let currentPos = from;

            // Insert each word wrapped in a span
            words.forEach((word) => {
              // Skip empty strings
              if (!word) return;

              if (word.trim()) {
                // For actual words, create a span
                const spanNode = view.state.schema.marks.customSpan.create();
                const textNode = view.state.schema.text(word);
                transaction = transaction
                  .insert(currentPos, textNode)
                  .addMark(currentPos, currentPos + word.length, spanNode);
                currentPos += word.length;
              } else if (word.length > 0) {
                // For whitespace, just insert it directly
                const textNode = view.state.schema.text(word);
                transaction = transaction.insert(currentPos, textNode);
                currentPos += word.length;
              }
            });

            view.dispatch(transaction);
            return true;
          },
        },
      }),
    ];
  },
});
