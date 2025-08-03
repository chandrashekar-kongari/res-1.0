import { prisma } from "@/lib/db";
import {
  Agent,
  Runner,
  tool,
  FunctionTool,
  RunContext,
  OpenAIChatCompletionsModel,
} from "@openai/agents";
import { z } from "zod";
import AsyncOpenAI from "openai";

// Define your tools as before (example for nameAndContactInfoFormatTool)
export const nameAndContactInfoFormatTool: FunctionTool<any> = {
  type: "function",
  name: "nameAndContactInfoFormat",
  description: "Updates the name and contact info section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      jobDescription: {
        type: "string",
        description: "The job description",
      },
      userQuestion: { type: "string", description: "The user question" },

      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: ["htmlToUpdate", "jobDescription", "userQuestion", "resumeId"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      jobDescription: string;
      userQuestion: string;
      resumeId: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "NameAndContactInfoUpdater",
      instructions: `
<role>
You are an expert HTML/CSS resume building specialist for tiptap editor. Your task is to update resume name and contact info sections while maintaining exact HTML structure and formatting consistency.
</role>

<task_overview>
You will receive HTML content and must:
1. Preserve the original HTML exactly as "oldEditorHTML"
2. Create an updated version as "newEditorHTML" with name and contact info modifications
</task_overview>

<input_requirements>
- Job description: Context for what contact info to add/modify
- User question: Specific request for name and contact info updates
- HTML to update: The exact HTML content to modify
</input_requirements>

<modification_guidelines>
<contact_formatting>
- Name should be on the first line centered
- Contact info should be on the second line centered, separated by " | "
- All contact info elements should be on the same line
- Only use span tags if they already exist in the original HTML
- Do not create new span tags unless they are already present in the existing structure
- Only ADD relevant contact info based on the user's request
- Do NOT remove existing contact info unless explicitly requested
- Do NOT add unnecessary or unrelated information
</contact_formatting>

<html_structure_rules>
- Preserve all existing HTML structure and attributes
- When working with span tags, preserve the span structure as it was in the original HTML
- Maintain consistent formatting and indentation
- Keep all existing CSS classes and styling intact
- Do not modify IDs, classes, or data attributes
</html_structure_rules>
</modification_guidelines>

<step_by_step_process>
<step_1>
Carefully analyze the provided HTML content and user requirements.
Identify the name and contact info section that needs modification.
</step_1>

<step_2>
Create newEditorHTML by:
- Starting with the exact OldEditorHTML content
- Adding only the requested contact info in proper format
- Maintaining the existing HTML structure and formatting
- Ensuring all new content follows the same patterns as existing content
</step_2>



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
  "newEditorHTML": "Complete HTML document with name and contact info updates applied", 
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

    const external_client = new AsyncOpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://api.anthropic.com/v1/",
    });
    const runner = new Runner({
      model: new OpenAIChatCompletionsModel(
        external_client,
        "claude-3-5-sonnet-20241022"
      ),
    });

    const prompt = `Job Description: ${parsedInput.jobDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result: any = await runner.run(subAgent, prompt, { stream: false });

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

        // Try multiple parsing approaches for robustness
        let res;
        try {
          // First try direct parsing (for newer format)
          res =
            typeof parsedResult === "string"
              ? JSON.parse(parsedResult)
              : parsedResult;
        } catch {
          // Fallback to nested parsing (for older format)
          res = JSON.parse(parsedResult[0].content[0].text);
        }

        // Validate that the oldEditorHTML from the tool matches what's in the current editor
        if (
          res.oldEditorHTML &&
          resume?.content &&
          !resume?.content.includes(res.oldEditorHTML.trim())
        ) {
          // Tool failed - return failure response with current resume content
          return JSON.stringify({
            success: false,
            oldEditorHTML: parsedInput.htmlToUpdate,
            newEditorHTML: parsedInput.htmlToUpdate,
            error: `TOOL_VALIDATION_FAILED: The HTML section to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. 

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the name and contact section from this updated content and retry the tool call.

Original HTML to update: ${parsedInput.htmlToUpdate}
Tool returned oldEditorHTML: ${parsedResult.oldEditorHTML}
`,
            retryInstructions:
              "Extract the name and contact section from currentResumeContent and retry the nameAndContactInfoFormat tool with: 1) htmlToUpdate = name and contact section from currentResumeContent, 2) same jobDescription and userQuestion",
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
            "Extract the name and contact section from currentResumeContent and retry the nameAndContactInfoFormat tool with: 1) htmlToUpdate = name and contact section from currentResumeContent, 2)  same jobDescription and userQuestion",
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
        error: `Name and Contact update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
