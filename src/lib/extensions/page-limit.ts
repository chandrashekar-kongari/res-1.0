import { Extension } from "@tiptap/core";

interface PageLimitOptions {
  maxHeight: number;
  onOverflow: (isOverflowing: boolean) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLimit: {
      /**
       * Check if content exceeds page height
       */
      checkContentHeight: () => ReturnType;
    };
  }
}

export const PageLimit = Extension.create<PageLimitOptions>({
  name: "pageLimit",

  addOptions() {
    return {
      maxHeight: 297, // A4 height in mm
      onOverflow: () => {},
    };
  },

  addStorage() {
    return {
      isOverflowing: false,
    };
  },

  onCreate({ editor }) {
    // Initialize overflow state
    this.storage.isOverflowing = false;

    // Check initial content
    const editorElement = editor.view.dom;
    if (editorElement) {
      const contentHeight = editorElement.scrollHeight;
      const containerHeight = editorElement.clientHeight;
      this.storage.isOverflowing = contentHeight > containerHeight;
      this.options.onOverflow(this.storage.isOverflowing);
    }
  },

  onUpdate({ editor }) {
    // Check content on update
    const editorElement = editor.view.dom;
    if (editorElement) {
      const contentHeight = editorElement.scrollHeight;
      const containerHeight = editorElement.clientHeight;

      const wasOverflowing = this.storage.isOverflowing;
      const isOverflowing = contentHeight > containerHeight;

      // Update storage
      this.storage.isOverflowing = isOverflowing;

      // If overflow state changed, call the handler
      if (wasOverflowing !== isOverflowing) {
        this.options.onOverflow(isOverflowing);
      }
    }
  },

  // Keep the command for external usage if needed
  addCommands() {
    return {
      checkContentHeight:
        () =>
        ({ editor }) => {
          const editorElement = editor.view.dom;
          if (!editorElement) return false;

          const contentHeight = editorElement.scrollHeight;
          const containerHeight = editorElement.clientHeight;

          const wasOverflowing = this.storage.isOverflowing;
          const isOverflowing = contentHeight > containerHeight;

          this.storage.isOverflowing = isOverflowing;

          if (wasOverflowing !== isOverflowing) {
            this.options.onOverflow(isOverflowing);
          }

          return true;
        },
    };
  },
});
