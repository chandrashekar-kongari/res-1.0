import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const nameAndContactInfoFormatTool: FunctionTool<any> = {
  type: "function",
  name: "nameAndContactInfoFormat",
  description: "Updates the name and contact info section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: {
        type: "string",
        description:
          "The html of name and contact info section which to be updated with the format",
      },
      jobDescription: { type: "string", description: "The job description" },
      userQuestion: { type: "string", description: "The user question" },
    },
    required: ["htmlToUpdate", "jobDescription", "userQuestion"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      jobDescription: string;
      userQuestion: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "NameAndContactInfoUpdater",
      instructions: `
      # Role and Objective
      You are HTML, CSS and Resume building expert for tiptap editor, your task is to correctly construct the NewEditorHTML and DiffEditorHTML by updating the OldEditorHTML based on the job description and user question.

      # Instructions:
      You must format the name and contact info to be in the following format: Make name on the 1st line in the center and all the contact info on the 2nd line in the center.
      Name should be on the first line centered.
      Contact info should be on the second line centered, separated by " | ".
      All contact info elements should be on the same line.

      STEPS:
      First build NewEditorHTML by updating the OldEditorHTML based on the job description and user question.
      Then build DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML. For removed content wrap it mark tag with style="background-color: #fdb8c0;" and for added content wrap it mark tag with style="background-color: #acf2bd;". If you are adding mark tags inside any span tag then must create a new span tag inside the mark tag and keep the text inside the span tag.

      IMPORTANT:
      - Do not remove or add any content from the OldEditorHTML.
      - Create NewEditorHTML by updating the OldEditorHTML based on the job description and user question.
      - Create DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML.
      - Do not remove or add any content from the NewEditorHTML.
      - Do not remove or add any content from the DiffEditorHTML.
      - Return the FULL HTML content, not just the changed part.

      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Generate a diff view of the OldEditorHTML and NewEditorHTML.

      Before returning the output, think step by step and make sure you have followed the steps correctly.

      EXAMPLE:
      HTML: <p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><strong><span style="font-size: 18px;">Chandra shekar</span></strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href=""><span style="font-size: 12px;">chandra@school.edu</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="linkedin/chandra"><span style="font-size: 12px;">linkedin/chandra</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://chandra.github.io"><span style="font-size: 12px;">chandra.github.io</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="leetcode/chandra"><span style="font-size: 12px;">leetcode/chandra</span></a><span style="font-size: 12px;"> | New York</span></p>
      
      In the above example white space is also important. Do not remove it. You must calculate the white space based on the font size, font weight, font family and line height.
        `,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Job Description: ${parsedInput.jobDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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
        `Name and Contact update tool failed: ${
          error.message || "Unknown error"
        }`
      );
    }
  },
};
