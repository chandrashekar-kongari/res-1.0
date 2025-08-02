import { prisma } from "@/lib/db";
import { Agent, Runner, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const updateGeneralTool: FunctionTool<any> = {
  type: "function",
  name: "updateGeneral",
  description:
    "Updates any general section of the resume that doesn't fit into specific categories",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      generalDescription: {
        type: "string",
        description: "The description or content to be added/modified",
      },
      userQuestion: { type: "string", description: "The user question" },
      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: [
      "htmlToUpdate",
      "generalDescription",
      "userQuestion",
      "resumeId",
    ],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      generalDescription: string;
      userQuestion: string;
      resumeId: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "GeneralUpdater",
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
      }),
      instructions: `
<role>
You are an expert HTML/CSS resume building specialist for tiptap editor. Your task is to update any general section of the resume while maintaining exact HTML structure and formatting consistency.
</role>

<task_overview>
You will receive HTML content and must:
1. Preserve the original HTML exactly as "oldEditorHTML"
2. Create an updated version as "newEditorHTML" with the requested modifications
</task_overview>

<input_requirements>
- General description: Context for what content to add/modify
- User question: Specific request for updates
- HTML to update: The exact HTML content to modify
</input_requirements>

<modification_guidelines>
<general_formatting>
- Maintain consistent formatting with the existing content
- Follow the same style patterns as surrounding content
- Only ADD or MODIFY content based on the user's request
- Do NOT remove existing content unless explicitly requested
- Do NOT add unnecessary or unrelated information
</general_formatting>

<html_structure_rules>
- Preserve all existing HTML structure and attributes
- When working with span tags, always create new span tags inside parent elements
- Maintain consistent formatting and indentation
- Keep all existing CSS classes and styling intact
- Do not modify IDs, classes, or data attributes
</html_structure_rules>
</modification_guidelines>

<step_by_step_process>
<step_1>
Carefully analyze the provided HTML content and user requirements.
Identify the section that needs modification.
</step_1>

<step_2>
Create newEditorHTML by:
- Starting with the exact OldEditorHTML content
- Adding only the requested content in proper format
- Maintaining the existing HTML structure and formatting
- Ensuring all new content follows the same patterns as existing content
</step_2>
</step_by_step_process>

<critical_constraints>
- oldEditorHTML MUST be returned exactly as received with zero modifications
- newEditorHTML MUST contain the complete HTML document, not partial content
- Output MUST be valid, parseable JSON
- No explanatory text outside the JSON structure
</critical_constraints>

<output_format>
Your response must be EXACTLY this JSON structure with no additional text:

{
  "oldEditorHTML": "EXACT copy of received HTML with no changes whatsoever",
  "newEditorHTML": "Complete HTML document with updates applied"
}
</output_format>

<quality_checks>
Before outputting, verify:
1. oldEditorHTML matches input exactly (character-for-character)
2. newEditorHTML includes all original content plus requested additions
3. JSON is valid and parseable
4. No content is lost or corrupted in any version
</quality_checks>

CRITICAL: Output only the JSON object. No reasoning, explanations, or additional text.
`,
    });

    const subRunner = new Runner({ model: "gpt-4.1" });

    const prompt = `General Description: ${parsedInput.generalDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result: any = await subRunner.run(subAgent, prompt, {
        stream: false,
      });

      let outputText = "";

      if (result?.state?._currentStep?.output) {
        try {
          const parsedOutput = JSON.parse(result.state._currentStep.output);
          outputText = parsedOutput;
        } catch (e) {
          console.error("Error parsing output:", e);
          outputText = result.state._currentStep.output;
        }
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
      // Get current resume content from database
      const resume = await prisma.resume.findUnique({
        where: {
          id: parsedInput.resumeId,
        },
        select: {
          content: true,
        },
      });

      // Parse the result to validate oldEditorHTML
      try {
        const parsedResult = outputText as any;

        // Validate that the oldEditorHTML from the tool matches what's in the current editor
        if (
          parsedResult.oldEditorHTML &&
          resume?.content &&
          !resume?.content.includes(parsedResult.oldEditorHTML.trim())
        ) {
          // Tool failed - return failure response with current resume content
          return JSON.stringify({
            success: false,
            oldEditorHTML: parsedInput.htmlToUpdate,
            newEditorHTML: parsedInput.htmlToUpdate,
            error: `TOOL_VALIDATION_FAILED: The HTML section to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. 

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the relevant section from this updated content and retry the tool call.

Current Resume Content: ${resume?.content}
`,
            retryInstructions:
              "Extract the relevant section from currentResumeContent and retry the updateGeneral tool with: 1) htmlToUpdate = section from currentResumeContent, 2) same generalDescription and userQuestion",
            currentResumeContent: resume?.content || "",
          });
        }

        // Success case - add success flag and current resume content
        const successResult = {
          success: true,
          ...(typeof parsedResult === "string"
            ? JSON.parse(parsedResult)
            : parsedResult),
          currentResumeContent: resume?.content || "",
        };

        return JSON.stringify(successResult);
      } catch (parseError: any) {
        // Return failure response with current resume content
        return JSON.stringify({
          success: false,
          oldEditorHTML: parsedInput.htmlToUpdate,
          newEditorHTML: parsedInput.htmlToUpdate,
          error: `Failed to parse tool output: ${parseError.message}. RETRY REQUIRED: Use the currentResumeContent below and retry the tool call.`,
          retryInstructions:
            "Extract the relevant section from currentResumeContent and retry the updateGeneral tool with: 1) htmlToUpdate = section from currentResumeContent, 2) same generalDescription and userQuestion",
          currentResumeContent: resume?.content || "",
        });
      }
    } catch (error: any) {
      // Get current resume content even in error case
      let currentResumeContent = "";
      try {
        const resume = await prisma.resume.findUnique({
          where: {
            id: parsedInput.resumeId,
          },
          select: {
            content: true,
          },
        });
        currentResumeContent = resume?.content || "";
      } catch (dbError) {}

      // Return error response instead of throwing
      return JSON.stringify({
        success: false,
        oldEditorHTML: parsedInput.htmlToUpdate,
        newEditorHTML: parsedInput.htmlToUpdate,
        error: `General update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
