import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

export interface InlineAiAssistOptions {
  minLength: number;
  debounce: number;
  getSuggestions: (text: string) => Promise<string>;
  getReplacement: (word: string) => Promise<string>;
}

interface PluginState {
  suggestionDecorations: DecorationSet;
  replacementDecorations: DecorationSet;
  currentSuggestion: string | null;
  currentReplacement: string | null;
  currentWord: string;
  lastProcessedText: string;
  waitingForNewInput: boolean;
  version: number;
}

export const InlineAiAssist = Extension.create<InlineAiAssistOptions>({
  name: "inlineAiAssist",

  addOptions() {
    return {
      minLength: 2,
      debounce: 300,
      getSuggestions: async () => "",
      getReplacement: async () => "",
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<PluginState>("inline-ai-assist");
    const options = this.options;

    let suggestionTimeout: NodeJS.Timeout | null = null;
    let replacementTimeout: NodeJS.Timeout | null = null;

    const plugin = new Plugin<PluginState>({
      key: pluginKey,

      state: {
        init(): PluginState {
          return {
            suggestionDecorations: DecorationSet.empty,
            replacementDecorations: DecorationSet.empty,
            currentSuggestion: null,
            currentReplacement: null,
            currentWord: "",
            lastProcessedText: "",
            waitingForNewInput: false,
            version: 0,
          };
        },

        apply(tr, state: PluginState): PluginState {
          const newState = {
            ...state,
            version: state.version + 1,
          };

          // Clear suggestions and replacements when content changes
          if (tr.docChanged) {
            const meta = tr.getMeta(plugin);
            // Only clear if it's not our own suggestion/replacement being accepted
            if (!meta?.acceptingSuggestion && !meta?.acceptingReplacement) {
              return {
                ...newState,
                suggestionDecorations: DecorationSet.empty,
                replacementDecorations: DecorationSet.empty,
                currentSuggestion: null,
                currentReplacement: null,
                currentWord: "",
                lastProcessedText: "",
                waitingForNewInput: false,
              };
            }
          }

          const meta = tr.getMeta(plugin);
          if (meta?.type === "clear") {
            return {
              ...newState,
              suggestionDecorations: DecorationSet.empty,
              replacementDecorations: DecorationSet.empty,
              currentSuggestion: null,
              currentReplacement: null,
              currentWord: "",
            };
          }

          if (meta?.type === "updateSuggestion") {
            return {
              ...newState,
              suggestionDecorations: meta.decorations || DecorationSet.empty,
              currentSuggestion: meta.suggestion || null,
              lastProcessedText: meta.text || "",
            };
          }

          if (meta?.type === "updateReplacement") {
            return {
              ...newState,
              replacementDecorations: meta.decorations || DecorationSet.empty,
              currentReplacement: meta.replacement || null,
              currentWord: meta.word || "",
            };
          }

          // Map decorations to new positions
          return {
            ...newState,
            suggestionDecorations: state.suggestionDecorations.map(
              tr.mapping,
              tr.doc
            ),
            replacementDecorations: state.replacementDecorations.map(
              tr.mapping,
              tr.doc
            ),
          };
        },
      },

      props: {
        decorations(state: EditorState): DecorationSet {
          const pluginState = plugin.getState(state) as PluginState;
          if (!pluginState) return DecorationSet.empty;

          // Combine both decoration sets
          return pluginState.suggestionDecorations.add(
            state.doc,
            pluginState.replacementDecorations.find()
          );
        },

        handleKeyDown(view: EditorView, event: KeyboardEvent) {
          const pluginState = plugin.getState(view.state) as PluginState;
          if (!pluginState) return false;

          const { state } = view;
          const { $from } = state.selection;

          // Handle Tab for suggestions (append text)
          if (
            event.key === "Tab" &&
            !event.shiftKey &&
            pluginState.currentSuggestion
          ) {
            event.preventDefault();

            if (!$from.parent.isTextblock) {
              return false;
            }

            try {
              view.dispatch(
                state.tr
                  .insertText(pluginState.currentSuggestion)
                  .setMeta(plugin, { type: "clear", acceptingSuggestion: true })
              );
              return true;
            } catch (error) {
              console.error("Error applying suggestion:", error);
              return false;
            }
          }

          // Handle Shift+Tab for replacements (replace current word)
          if (
            event.key === "Tab" &&
            event.shiftKey &&
            pluginState.currentReplacement
          ) {
            event.preventDefault();

            if (!$from.parent.isTextblock) {
              return false;
            }

            try {
              const wordStart = $from.pos - pluginState.currentWord.length;
              view.dispatch(
                state.tr
                  .delete(wordStart, $from.pos)
                  .insertText(pluginState.currentReplacement)
                  .setMeta(plugin, {
                    type: "clear",
                    acceptingReplacement: true,
                  })
              );
              return true;
            } catch (error) {
              console.error("Error applying replacement:", error);
              return false;
            }
          }

          return false;
        },
      },

      view() {
        return {
          update: async (view: EditorView) => {
            const { state } = view;
            const { $from } = state.selection;
            const pluginState = plugin.getState(state) as PluginState;

            if (!pluginState || pluginState.waitingForNewInput) {
              return;
            }

            if (!$from.parent.isTextblock) {
              if (
                pluginState.suggestionDecorations !== DecorationSet.empty ||
                pluginState.replacementDecorations !== DecorationSet.empty
              ) {
                view.dispatch(state.tr.setMeta(plugin, { type: "clear" }));
              }
              return;
            }

            const textBefore = $from.parent.textContent;
            const words = textBefore.split(/\s+/);
            const currentWord = words[words.length - 1] || "";

            // Process suggestions (for the full text)
            if (
              textBefore !== pluginState.lastProcessedText &&
              textBefore.length >= options.minLength
            ) {
              if (suggestionTimeout) clearTimeout(suggestionTimeout);
              suggestionTimeout = setTimeout(async () => {
                try {
                  const suggestion = await options.getSuggestions(textBefore);

                  // Validate state is still current
                  const currentState = view.state;
                  const currentPluginState = plugin.getState(
                    currentState
                  ) as PluginState;
                  if (
                    !currentPluginState ||
                    currentPluginState.version !== pluginState.version
                  ) {
                    return;
                  }

                  if (!suggestion) {
                    view.dispatch(
                      currentState.tr.setMeta(plugin, {
                        type: "updateSuggestion",
                        decorations: DecorationSet.empty,
                        suggestion: null,
                        text: textBefore,
                      })
                    );
                    return;
                  }

                  // Create suggestion decoration
                  const deco = Decoration.widget($from.pos, () => {
                    const span = document.createElement("span");
                    span.className = "inline-suggestion";
                    span.textContent = suggestion;
                    span.style.opacity = "0.5";
                    span.style.userSelect = "none";
                    span.style.color = "#666";
                    span.style.fontStyle = "italic";
                    return span;
                  });

                  const decorations = DecorationSet.create(currentState.doc, [
                    deco,
                  ]);

                  view.dispatch(
                    currentState.tr.setMeta(plugin, {
                      type: "updateSuggestion",
                      decorations,
                      suggestion,
                      text: textBefore,
                    })
                  );
                } catch (error) {
                  console.error("Error getting suggestions:", error);
                }
              }, options.debounce);
            }

            // Process replacements (for the current word)
            if (
              currentWord !== pluginState.currentWord &&
              currentWord.length >= options.minLength
            ) {
              if (replacementTimeout) clearTimeout(replacementTimeout);
              replacementTimeout = setTimeout(async () => {
                try {
                  const replacement = await options.getReplacement(currentWord);

                  // Validate state is still current
                  const currentState = view.state;
                  const currentPluginState = plugin.getState(
                    currentState
                  ) as PluginState;
                  if (
                    !currentPluginState ||
                    currentPluginState.version !== pluginState.version
                  ) {
                    return;
                  }

                  if (!replacement || replacement === currentWord) {
                    view.dispatch(
                      currentState.tr.setMeta(plugin, {
                        type: "updateReplacement",
                        decorations: DecorationSet.empty,
                        replacement: null,
                        word: currentWord,
                      })
                    );
                    return;
                  }

                  const wordStart = $from.pos - currentWord.length;

                  // Create replacement decorations
                  const decorations = DecorationSet.create(currentState.doc, [
                    Decoration.inline(wordStart, $from.pos, {
                      class: "inline-replace-strike",
                      style:
                        "text-decoration: line-through; color: #666; opacity: 0.7;",
                    }),
                    Decoration.widget($from.pos, () => {
                      const span = document.createElement("span");
                      span.className = "inline-replace-suggestion";
                      span.textContent = replacement;
                      span.style.opacity = "0.6";
                      span.style.userSelect = "none";
                      span.style.color = "#22c55e";
                      span.style.marginLeft = "0.25em";
                      span.style.fontWeight = "500";
                      return span;
                    }),
                  ]);

                  view.dispatch(
                    currentState.tr.setMeta(plugin, {
                      type: "updateReplacement",
                      decorations,
                      replacement,
                      word: currentWord,
                    })
                  );
                } catch (error) {
                  console.error("Error getting replacement:", error);
                }
              }, options.debounce);
            }

            // Clear replacements if current word is too short
            if (
              currentWord.length < options.minLength &&
              pluginState.currentReplacement
            ) {
              view.dispatch(
                state.tr.setMeta(plugin, {
                  type: "updateReplacement",
                  decorations: DecorationSet.empty,
                  replacement: null,
                  word: "",
                })
              );
            }

            // Clear suggestions if text is too short
            if (
              textBefore.length < options.minLength &&
              pluginState.currentSuggestion
            ) {
              view.dispatch(
                state.tr.setMeta(plugin, {
                  type: "updateSuggestion",
                  decorations: DecorationSet.empty,
                  suggestion: null,
                  text: "",
                })
              );
            }
          },

          destroy: () => {
            if (suggestionTimeout) clearTimeout(suggestionTimeout);
            if (replacementTimeout) clearTimeout(replacementTimeout);
          },
        };
      },
    });

    return [plugin];
  },
});
