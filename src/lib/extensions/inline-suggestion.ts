import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

export interface InlineSuggestionOptions {
  minLength: number;
  debounce: number;
  getSuggestions: (text: string) => Promise<string>;
}

interface PluginState {
  decorationSet: DecorationSet;
}

export const InlineSuggestion = Extension.create<InlineSuggestionOptions>({
  name: "inlineSuggestion",

  addOptions() {
    return {
      minLength: 2,
      debounce: 300,
      getSuggestions: async () => "",
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<PluginState>("inline-suggestion");
    const options = this.options;

    let timeout: NodeJS.Timeout | null = null;
    let decorations: DecorationSet | null = null;
    let currentSuggestion: string | null = null;
    let lastProcessedText: string = "";
    let waitingForNewInput: boolean = false;

    const plugin = new Plugin<PluginState>({
      key: pluginKey,

      state: {
        init(): PluginState {
          return { decorationSet: DecorationSet.empty };
        },
        apply(tr, state: PluginState): PluginState {
          // Clear suggestions when content changes
          if (tr.docChanged) {
            const meta = tr.getMeta(plugin);
            // Only clear if it's not our own suggestion being accepted
            if (!meta?.acceptingSuggestion) {
              waitingForNewInput = false;
            }
          }

          const meta = tr.getMeta(plugin);
          if (meta?.clear) {
            return { decorationSet: DecorationSet.empty };
          }
          if (meta?.add) {
            return { decorationSet: meta.decorations };
          }
          return {
            decorationSet: state.decorationSet.map(tr.mapping, tr.doc),
          };
        },
      },

      props: {
        decorations(state: EditorState): DecorationSet {
          return (plugin.getState(state) as PluginState).decorationSet;
        },
        handleKeyDown(view: EditorView, event: KeyboardEvent) {
          if (event.key === "Tab" && currentSuggestion) {
            event.preventDefault();
            const { state } = view;
            const { $from } = state.selection;

            view.dispatch(
              state.tr
                .insertText(currentSuggestion)
                .setMeta(plugin, { clear: true, acceptingSuggestion: true })
            );

            currentSuggestion = null;
            waitingForNewInput = true;
            return true;
          }
          return false;
        },
      },

      view() {
        return {
          update: async (view: EditorView) => {
            if (waitingForNewInput) {
              return;
            }

            const { state } = view;
            const { $from } = state.selection;

            if (!$from.parent.isTextblock) return;

            const textBefore = $from.parent.textContent;

            // Don't process if text hasn't changed
            if (textBefore === lastProcessedText) {
              return;
            }

            if (textBefore.length < options.minLength) {
              if (decorations) {
                view.dispatch(state.tr.setMeta(plugin, { clear: true }));
                decorations = null;
              }
              return;
            }

            lastProcessedText = textBefore;

            // Debounce getting suggestions
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(async () => {
              try {
                const suggestion = await options.getSuggestions(textBefore);
                if (!suggestion) {
                  if (decorations) {
                    view.dispatch(state.tr.setMeta(plugin, { clear: true }));
                    decorations = null;
                  }
                  return;
                }

                currentSuggestion = suggestion;

                // Create ghost text decoration
                const deco = Decoration.widget($from.pos, () => {
                  const span = document.createElement("span");
                  span.className = "inline-suggestion";
                  span.textContent = suggestion;
                  span.style.opacity = "0.5";
                  span.style.userSelect = "none";
                  span.style.color = "#666";
                  return span;
                });

                decorations = DecorationSet.create(state.doc, [deco]);
                view.dispatch(
                  state.tr.setMeta(plugin, { add: true, decorations })
                );
              } catch (error) {
                console.error("Error getting suggestions:", error);
              }
            }, options.debounce);
          },
        };
      },
    });

    return [plugin];
  },
});
