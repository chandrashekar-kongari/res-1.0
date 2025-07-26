import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

// Define your tools as before (example for updateSkillsTool)
export const updateSkillsTool: FunctionTool<any> = {
  type: "function",
  name: "updateSkills",
  description: "Updates the assistant's skills and knowledge using GPT-4",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      skillsDescription: {
        type: "string",
        description: "The skills description or details",
      },
      userQuestion: { type: "string", description: "The user question" },
    },
    required: ["htmlToUpdate", "skillsDescription", "userQuestion"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      skillsDescription: string;
      userQuestion: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "SkillsUpdater",
      instructions: `
      # Role and Objective
      You are HTML, CSS and Resume building expert for tiptap editor, your task is to correctly construct the NewEditorHTML and DiffEditorHTML by updating the OldEditorHTML based on the skills description and user question.

      # Instructions:
      Analyze the current skills text and make requested modifications based on job description and user question.
      Just ADD skills DO NOT ADD unnecessary info.
      Organize skills into appropriate categories (Programming Languages, Backend Technologies, Frontend Technologies, Database Technologies, Cloud Technologies, etc.).

      STEPS:
      First build NewEditorHTML by updating the OldEditorHTML based on the skills description and user question.
      Then build DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML. For removed content wrap it mark tag with style="background-color: #fdb8c0;" and for added content wrap it mark tag with style="background-color: #acf2bd;". If you are adding mark tags inside any span tag then must create a new span tag inside the mark tag and keep the text inside the span tag.

      IMPORTANT:
      - Do not remove or add any content from the OldEditorHTML.
      - Create NewEditorHTML by updating the OldEditorHTML based on the skills description and user question.
      - Create DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML.
      - Do not remove or add any content from the NewEditorHTML.
      - Do not remove or add any content from the DiffEditorHTML.
      - Return the FULL HTML content, not just the changed part.

      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Generate a diff view of the OldEditorHTML and NewEditorHTML.

      Before returning the output, think step by step and make sure you have followed the steps correctly.

`,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Skills Description: ${parsedInput.skillsDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result: any = await subRunner.run(subAgent, prompt);
      let outputText = "";
      if (result && typeof result === "object" && "output" in result) {
        outputText = result.output;
      } else if (typeof result === "string") {
        outputText = result;
      } else if (
        Array.isArray(result) &&
        result.length > 0 &&
        typeof result[0] === "string"
      ) {
        outputText = result[0];
      } else {
        outputText = JSON.stringify(result);
      }
      // Parse the result to validate oldEditorHTML
      try {
        const parsedResult = JSON.parse(outputText);
        if (
          parsedResult.oldEditorHTML &&
          !parsedInput.htmlToUpdate
            .trim()
            .includes(parsedResult.oldEditorHTML.trim()) &&
          !parsedResult.oldEditorHTML
            .trim()
            .includes(parsedInput.htmlToUpdate.trim())
        ) {
          throw new Error(
            `TOOL_VALIDATION_FAILED: The HTML section to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. Please retry with the updated editor content. \n\nOriginal HTML to update: ${parsedInput.htmlToUpdate}\nTool returned oldEditorHTML: ${parsedResult.oldEditorHTML}`
          );
        }
        return outputText;
      } catch (parseError: any) {
        if (
          parseError.message &&
          parseError.message.startsWith("TOOL_VALIDATION_FAILED:")
        ) {
          throw parseError; // Re-throw validation errors
        }
        // If parsing fails, return the original output
        return outputText;
      }
    } catch (error: any) {
      if (
        error.message &&
        error.message.startsWith("TOOL_VALIDATION_FAILED:")
      ) {
        throw error;
      }
      throw new Error(
        `Skills update tool failed: ${error.message || "Unknown error"}`
      );
    }
  },
};
