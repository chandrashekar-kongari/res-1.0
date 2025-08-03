import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";

export interface InlineEditOptions {
  minLength: number;
  debounce: number;
  apiEndpoint: string;
  enabled: boolean;
}

interface InlineEditPluginState {
  suggestions: Array<{
    id: string;
    text: string;
    type:
      | "word_replacement"
      | "phrase_replacement"
      | "phrase_completion"
      | "addition"
      | "enhancement";
    position: number;
    replaceFrom?: number;
    replaceTo?: number;
    originalText?: string;
    originalWord?: string;
    originalPhrase?: string;
    decoration: Decoration;
  }>;
  currentSuggestionIndex: number;
  isActive: boolean;
  lastProcessedText: string;
  decorationSet: DecorationSet;
  version: number;
  lastCursorPosition: number;
}

export const InlineEdit = Extension.create<InlineEditOptions>({
  name: "inlineEdit",

  addOptions() {
    return {
      minLength: 3,
      debounce: 800,
      apiEndpoint: "/api/inline-edit",
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<InlineEditPluginState>("inline-edit");
    const options = this.options;

    let suggestionTimeout: NodeJS.Timeout | null = null;

    const plugin = new Plugin<InlineEditPluginState>({
      key: pluginKey,

      state: {
        init(): InlineEditPluginState {
          return {
            suggestions: [],
            currentSuggestionIndex: -1,
            isActive: false,
            lastProcessedText: "",
            decorationSet: DecorationSet.empty,
            version: 0,
            lastCursorPosition: 0,
          };
        },

        apply(tr, state: InlineEditPluginState): InlineEditPluginState {
          const newState = {
            ...state,
            version: state.version + 1,
            decorationSet: state.decorationSet.map(tr.mapping, tr.doc),
          };

          // Clear suggestions when content changes (unless we're accepting a suggestion)
          if (tr.docChanged) {
            const meta = tr.getMeta(plugin);
            if (!meta?.acceptingSuggestion) {
              return {
                ...newState,
                suggestions: [],
                currentSuggestionIndex: -1,
                decorationSet: DecorationSet.empty,
                lastProcessedText: "",
              };
            }
          }

          const meta = tr.getMeta(plugin);

          if (meta?.type === "clear") {
            return {
              ...newState,
              suggestions: [],
              currentSuggestionIndex: -1,
              decorationSet: DecorationSet.empty,
            };
          }

          if (meta?.type === "setSuggestions") {
            return {
              ...newState,
              suggestions: meta.suggestions || [],
              currentSuggestionIndex: meta.suggestions?.length > 0 ? 0 : -1,
              decorationSet: meta.decorationSet || DecorationSet.empty,
              lastProcessedText: meta.text || "",
              lastCursorPosition: meta.position || newState.lastCursorPosition,
            };
          }

          if (meta?.type === "nextSuggestion") {
            const nextIndex =
              (state.currentSuggestionIndex + 1) % state.suggestions.length;
            return {
              ...newState,
              currentSuggestionIndex: nextIndex,
            };
          }

          if (meta?.type === "prevSuggestion") {
            const prevIndex =
              state.currentSuggestionIndex > 0
                ? state.currentSuggestionIndex - 1
                : state.suggestions.length - 1;
            return {
              ...newState,
              currentSuggestionIndex: prevIndex,
            };
          }

          if (meta?.type === "updateCursorPosition") {
            return {
              ...newState,
              lastCursorPosition: meta.position || 0,
            };
          }

          return newState;
        },
      },

      props: {
        decorations(state: EditorState): DecorationSet {
          const pluginState = plugin.getState(state) as InlineEditPluginState;
          if (!pluginState || !options.enabled) return DecorationSet.empty;
          return pluginState.decorationSet;
        },

        handleKeyDown(view: EditorView, event: KeyboardEvent) {
          const pluginState = plugin.getState(
            view.state
          ) as InlineEditPluginState;
          if (!pluginState || !options.enabled) return false;

          const { state } = view;
          const { suggestions, currentSuggestionIndex } = pluginState;

          // Tab key: Accept current suggestion or move to next suggestion
          if (event.key === "Tab" && !event.shiftKey) {
            event.preventDefault();

            if (suggestions.length === 0) {
              return false;
            }

            const currentSuggestion = suggestions[currentSuggestionIndex];
            if (!currentSuggestion) {
              return false;
            }

            // Check if cursor is at the suggestion position
            const { selection } = state;
            const cursorPos = selection.from;

            if (cursorPos === currentSuggestion.position) {
              // Accept the suggestion
              try {
                let tr = state.tr;

                if (
                  currentSuggestion.type === "word_replacement" ||
                  currentSuggestion.type === "phrase_replacement"
                ) {
                  // For word/phrase replacement: replace specific text within the paragraph
                  if (
                    currentSuggestion.replaceFrom !== undefined &&
                    currentSuggestion.replaceTo !== undefined
                  ) {
                    tr = tr
                      .deleteRange(
                        currentSuggestion.replaceFrom,
                        currentSuggestion.replaceTo
                      )
                      .insertText(
                        currentSuggestion.text,
                        currentSuggestion.replaceFrom
                      );
                  }
                } else if (currentSuggestion.type === "phrase_completion") {
                  // For phrase completion: just add at cursor position
                  tr = tr.insertText(currentSuggestion.text, cursorPos);
                } else if (
                  currentSuggestion.type === "enhancement" &&
                  currentSuggestion.replaceFrom !== undefined &&
                  currentSuggestion.replaceTo !== undefined
                ) {
                  // For enhancement: replace the existing text
                  tr = tr
                    .deleteRange(
                      currentSuggestion.replaceFrom,
                      currentSuggestion.replaceTo
                    )
                    .insertText(
                      currentSuggestion.text,
                      currentSuggestion.replaceFrom
                    );
                } else {
                  // For addition: just insert at cursor position
                  tr = tr.insertText(currentSuggestion.text, cursorPos);
                }

                tr.setMeta(plugin, {
                  type: "clear",
                  acceptingSuggestion: true,
                });

                view.dispatch(tr);
                return true;
              } catch (error) {
                console.error("Error applying suggestion:", error);
                return false;
              }
            } else {
              // Move cursor to the next suggestion
              if (suggestions.length > 1) {
                view.dispatch(
                  state.tr.setMeta(plugin, { type: "nextSuggestion" })
                );
              }

              // Move cursor to the suggestion position
              const resolvedPos = state.tr.doc.resolve(
                currentSuggestion.position
              );
              view.dispatch(
                state.tr.setSelection(
                  TextSelection.create(state.tr.doc, resolvedPos.pos)
                )
              );
              return true;
            }
          }

          // Shift+Tab: Move to previous suggestion
          if (event.key === "Tab" && event.shiftKey && suggestions.length > 1) {
            event.preventDefault();
            view.dispatch(state.tr.setMeta(plugin, { type: "prevSuggestion" }));

            const prevIndex =
              currentSuggestionIndex > 0
                ? currentSuggestionIndex - 1
                : suggestions.length - 1;
            const prevSuggestion = suggestions[prevIndex];

            if (prevSuggestion) {
              const resolvedPos = state.doc.resolve(prevSuggestion.position);
              view.dispatch(
                state.tr.setSelection(
                  TextSelection.create(state.doc, resolvedPos.pos)
                )
              );
            }
            return true;
          }

          // Escape: Clear all suggestions
          if (event.key === "Escape" && suggestions.length > 0) {
            event.preventDefault();
            view.dispatch(state.tr.setMeta(plugin, { type: "clear" }));
            return true;
          }

          return false;
        },
      },

      view() {
        let lastDocContent = "";

        return {
          update: async (view: EditorView) => {
            if (!options.enabled) return;

            const { state } = view;
            const { selection } = state;
            const { $from } = selection;
            const pluginState = plugin.getState(state) as InlineEditPluginState;

            if (!pluginState || !$from.parent.isTextblock) {
              return;
            }

            const currentCursorPosition = selection.from;
            const currentText = state.doc.textContent;
            const paragraph = $from.parent.textContent;

            // Only proceed if content has actually changed (typing occurred)
            const hasContentChanged = currentText !== lastDocContent;
            lastDocContent = currentText;

            if (!hasContentChanged) {
              return;
            }

            // Clear suggestions if cursor moved away from the current paragraph or far from suggestions
            if (pluginState.suggestions.length > 0) {
              const currentSuggestion =
                pluginState.suggestions[pluginState.currentSuggestionIndex];
              const paragraphEnd =
                $from.start() + $from.parent.textContent.length;
              const paragraphStart = $from.start();

              // Clear if cursor moved outside current paragraph or very far from suggestion
              if (
                currentCursorPosition < paragraphStart ||
                currentCursorPosition > paragraphEnd ||
                (currentSuggestion &&
                  Math.abs(currentCursorPosition - currentSuggestion.position) >
                    50)
              ) {
                view.dispatch(
                  state.tr.setMeta(plugin, {
                    type: "clear",
                  })
                );
                return;
              }
            }

            // Update cursor position tracking
            if (currentCursorPosition !== pluginState.lastCursorPosition) {
              view.dispatch(
                state.tr.setMeta(plugin, {
                  type: "updateCursorPosition",
                  position: currentCursorPosition,
                })
              );
            }

            // Only process if we have enough content and it's different from last processed
            if (
              paragraph.length >= options.minLength &&
              currentText !== pluginState.lastProcessedText
            ) {
              if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
              }

              suggestionTimeout = setTimeout(async () => {
                await generateSuggestions(view, paragraph, currentText);
              }, options.debounce);
            }
          },

          destroy: () => {
            if (suggestionTimeout) {
              clearTimeout(suggestionTimeout);
            }
          },
        };
      },
    });

    async function generateSuggestions(
      view: EditorView,
      text: string,
      context: string
    ) {
      try {
        // Get the full resume content
        const fullResumeContent = view.state.doc.textContent;
        const currentSelection = view.state.selection;
        const currentFrom = currentSelection.$from;
        const currentParagraph = currentFrom.parent.textContent;

        const response = await fetch(options.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: currentParagraph, // Current paragraph being edited
            fullResumeContent, // Entire resume content
            context: fullResumeContent, // Keep for backwards compatibility
            position: view.state.selection.from,
          }),
        });

        if (!response.ok) {
          return;
        }

        const responseData = await response.json();
        const {
          suggestion,
          type,
          originalText,
          originalWord,
          originalPhrase,
          wordStartIndex,
          wordEndIndex,
          phraseStartIndex,
          phraseEndIndex,
        } = responseData;

        // Validate state is still current
        const currentState = view.state;
        const currentPluginState = plugin.getState(
          currentState
        ) as InlineEditPluginState;

        if (!suggestion || !suggestion.trim()) {
          view.dispatch(
            currentState.tr.setMeta(plugin, {
              type: "setSuggestions",
              suggestions: [],
              decorationSet: DecorationSet.empty,
              text: context,
              position: view.state.selection.from,
            })
          );
          return;
        }

        // Calculate position and replacement range
        const { selection } = currentState;
        const { $from } = selection;
        const paragraph = $from.parent;
        const paragraphStart = $from.start();
        const suggestionPos = selection.from;
        let replaceFrom: number | undefined;
        let replaceTo: number | undefined;
        let suggestionPosition = suggestionPos; // Default to cursor position

        if (
          type === "word_replacement" &&
          wordStartIndex !== undefined &&
          wordEndIndex !== undefined
        ) {
          // For word replacement: calculate exact word position in document
          replaceFrom = paragraphStart + wordStartIndex;
          replaceTo = paragraphStart + wordEndIndex;
          suggestionPosition = paragraphStart + wordEndIndex; // Position suggestion after the word being replaced
        } else if (
          type === "phrase_replacement" &&
          phraseStartIndex !== undefined &&
          phraseEndIndex !== undefined
        ) {
          // For phrase replacement: calculate exact phrase position in document
          replaceFrom = paragraphStart + phraseStartIndex;
          replaceTo = paragraphStart + phraseEndIndex;
          suggestionPosition = paragraphStart + phraseEndIndex; // Position suggestion after the phrase being replaced
        } else if (type === "enhancement") {
          // For enhancement: replace entire paragraph
          replaceFrom = paragraphStart;
          replaceTo = paragraphStart + paragraph.textContent.length;
          // Keep suggestionPosition at cursor for enhancement
        }
        // For phrase_completion and addition, use cursor position

        // Determine hint text and colors based on suggestion type
        let hintText = " (Tab to add)";
        let suggestionColor = "#6b7280";
        let backgroundColor = "#f3f4f6";
        let borderColor = "#e5e7eb";

        if (type === "word_replacement") {
          hintText = ` (Tab to fix "${originalWord}")`;
          suggestionColor = "#059669";
          backgroundColor = "#ecfdf5";
          borderColor = "#6ee7b7";
        } else if (type === "phrase_replacement") {
          hintText = ` (Tab to replace "${originalPhrase}")`;
          suggestionColor = "#059669";
          backgroundColor = "#ecfdf5";
          borderColor = "#6ee7b7";
        } else if (type === "phrase_completion") {
          hintText = " (Tab to complete)";
          suggestionColor = "#059669";
          backgroundColor = "#ecfdf5";
          borderColor = "#6ee7b7";
        } else if (type === "enhancement") {
          hintText = " (Tab to enhance)";
          suggestionColor = "#7c3aed";
          backgroundColor = "#f3e8ff";
          borderColor = "#c4b5fd";
        }

        // Create decorations
        const decorations = [];

        // Add strikethrough decoration for text being replaced
        if (
          (type === "word_replacement" || type === "phrase_replacement") &&
          replaceFrom !== undefined &&
          replaceTo !== undefined
        ) {
          const strikethroughDecoration = Decoration.inline(
            replaceFrom,
            replaceTo,
            {
              style: "background-color: rgba(220, 38, 38, 0.1);",
            }
          );
          decorations.push(strikethroughDecoration);
        }

        // Create suggestion widget
        const suggestionDecoration = Decoration.widget(
          suggestionPosition,
          () => {
            const container = document.createElement("span");
            container.className = "inline-edit-suggestion-container";

            const suggestionSpan = document.createElement("span");
            suggestionSpan.className = "inline-edit-suggestion";
            suggestionSpan.textContent = suggestion;
            suggestionSpan.style.cssText = `
            color: ${suggestionColor};
            background-color: ${backgroundColor};
            padding: 2px 4px;
            border-radius: 3px;
            font-style: italic;
            opacity: 0.9;
            user-select: none;
            margin-left: 2px;
            border: 1px solid ${borderColor};
            font-size: 0.9em;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          `;

            const hintSpan = document.createElement("span");
            hintSpan.className = "inline-edit-hint";
            hintSpan.textContent = hintText;
            hintSpan.style.cssText = `
            color: #9ca3af;
            font-size: 0.7em;
            font-style: normal;
            margin-left: 4px;
            user-select: none;
          `;

            container.appendChild(suggestionSpan);
            container.appendChild(hintSpan);

            return container;
          }
        );

        decorations.push(suggestionDecoration);

        const suggestions = [
          {
            id: `suggestion-${Date.now()}`,
            text: suggestion,
            type: type as
              | "word_replacement"
              | "phrase_replacement"
              | "phrase_completion"
              | "addition"
              | "enhancement",
            position: suggestionPosition, // Use the calculated position
            replaceFrom,
            replaceTo,
            originalText,
            originalWord,
            originalPhrase,
            decoration: suggestionDecoration,
          },
        ];

        const decorationSet = DecorationSet.create(
          currentState.doc,
          decorations
        );

        view.dispatch(
          currentState.tr.setMeta(plugin, {
            type: "setSuggestions",
            suggestions,
            decorationSet,
            text: context,
            position: suggestionPosition,
          })
        );
      } catch (error) {
        console.error("Error generating suggestions:", error);
      }
    }

    return [plugin];
  },
});
