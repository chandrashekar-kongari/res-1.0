import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface InlineReplaceOptions {
  minLength: number;
  debounce: number;
  getReplacement: (text: string) => Promise<string>;
}

interface PluginState {
  decorationSet: DecorationSet;
  currentWord: string;
  currentReplacement: string | null;
  version: number;
}

export const InlineReplace = Extension.create<InlineReplaceOptions>({
  name: "inlineReplace",

  addOptions() {
    return {
      minLength: 2,
      debounce: 300,
      getReplacement: async () => "",
    };
  },

  addProseMirrorPlugins() {
    let timeout: NodeJS.Timeout | null = null;
    const key = new PluginKey<PluginState>("inline-replace");
    const options = this.options;

    return [
      new Plugin({
        key,
        state: {
          init() {
            return {
              decorationSet: DecorationSet.empty,
              currentWord: "",
              currentReplacement: null,
              version: 0,
            };
          },
          apply(tr, value) {
            const oldState = value;
            const newState = {
              ...oldState,
              version: oldState.version + 1,
            };

            // Clear decorations on any content change unless it's our replacement
            if (tr.docChanged && !tr.getMeta(key)?.isReplacement) {
              return {
                ...newState,
                decorationSet: DecorationSet.empty,
                currentWord: "",
                currentReplacement: null,
              };
            }

            // Handle meta updates
            const meta = tr.getMeta(key);
            if (meta?.type === "update") {
              return {
                decorationSet: meta.decorations || DecorationSet.empty,
                currentWord: meta.word || "",
                currentReplacement: meta.replacement || null,
                version: newState.version,
              };
            }

            // Map decorations through document changes
            newState.decorationSet = oldState.decorationSet.map(
              tr.mapping,
              tr.doc
            );
            return newState;
          },
        },
        props: {
          decorations(state) {
            const pluginState = key.getState(state);
            return pluginState
              ? pluginState.decorationSet
              : DecorationSet.empty;
          },
          handleKeyDown(view, event) {
            if (event.key !== "Tab") return false;

            const pluginState = key.getState(view.state);
            if (!pluginState?.currentReplacement) return false;

            const { $from } = view.state.selection;
            if (!$from.parent.isTextblock) return false;

            event.preventDefault();

            const wordStart = $from.pos - pluginState.currentWord.length;
            view.dispatch(
              view.state.tr
                .delete(wordStart, $from.pos)
                .insertText(pluginState.currentReplacement)
                .setMeta(key, { type: "update", isReplacement: true })
            );

            return true;
          },
        },
        view(editorView) {
          let currentVersion = 0;

          const updateReplacements = async () => {
            const { state } = editorView;
            const { $from } = state.selection;
            const pluginState = key.getState(state);

            if (!pluginState || !$from.parent.isTextblock) return;

            // Store the version we're working with
            const startVersion = pluginState.version;
            currentVersion = startVersion;

            const text = $from.parent.textContent;
            const currentWord = text.split(/\s+/).pop() || "";

            if (currentWord.length < options.minLength) {
              // Check if state is still valid
              const newPluginState = key.getState(editorView.state);
              if (!newPluginState || newPluginState.version !== startVersion)
                return;

              editorView.dispatch(
                editorView.state.tr.setMeta(key, {
                  type: "update",
                  decorations: DecorationSet.empty,
                  word: "",
                  replacement: null,
                })
              );
              return;
            }

            if (currentWord === pluginState.currentWord) return;

            try {
              const replacement = await options.getReplacement(currentWord);

              // Check if state is still valid
              const newPluginState = key.getState(editorView.state);
              if (!newPluginState || newPluginState.version !== startVersion)
                return;

              if (!replacement || replacement === currentWord) {
                editorView.dispatch(
                  editorView.state.tr.setMeta(key, {
                    type: "update",
                    decorations: DecorationSet.empty,
                    word: currentWord,
                    replacement: null,
                  })
                );
                return;
              }

              const wordStart = $from.pos - currentWord.length;

              // Final state check before creating decorations
              const finalPluginState = key.getState(editorView.state);
              if (
                !finalPluginState ||
                finalPluginState.version !== startVersion
              )
                return;

              const decorations = DecorationSet.create(editorView.state.doc, [
                Decoration.inline(wordStart, $from.pos, {
                  class: "inline-replace-strike",
                  style: "text-decoration: line-through; color: #666;",
                }),
                Decoration.widget($from.pos, () => {
                  const span = document.createElement("span");
                  span.className = "inline-replace-suggestion";
                  span.textContent = replacement;
                  span.style.opacity = "0.5";
                  span.style.userSelect = "none";
                  span.style.color = "#22c55e";
                  span.style.marginLeft = "0.25em";
                  return span;
                }),
              ]);

              editorView.dispatch(
                editorView.state.tr.setMeta(key, {
                  type: "update",
                  decorations,
                  word: currentWord,
                  replacement,
                })
              );
            } catch (error) {
              console.error("Error getting replacement:", error);

              // Check if state is still valid before clearing
              const newPluginState = key.getState(editorView.state);
              if (!newPluginState || newPluginState.version !== startVersion)
                return;

              editorView.dispatch(
                editorView.state.tr.setMeta(key, {
                  type: "update",
                  decorations: DecorationSet.empty,
                  word: "",
                  replacement: null,
                })
              );
            }
          };

          return {
            update: () => {
              if (timeout) clearTimeout(timeout);
              timeout = setTimeout(
                () => updateReplacements(),
                options.debounce
              );
            },
            destroy: () => {
              if (timeout) clearTimeout(timeout);
            },
          };
        },
      }),
    ];
  },
});
