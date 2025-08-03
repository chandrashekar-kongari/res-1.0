import { prisma } from "@/lib/db";
import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

// Define your tools as before (example for updateProjectsTool)
export const updateProjectsTool: FunctionTool<any> = {
  type: "function",
  name: "updateProjects",
  description: "Updates the projects entries of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      projectDescription: {
        type: "string",
        description: "The project description or details",
      },
      userQuestion: { type: "string", description: "The user question" },

      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: [
      "htmlToUpdate",
      "projectDescription",
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
      projectDescription: string;
      userQuestion: string;
      resumeId: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "ProjectsUpdater",
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
      }),
      instructions: `
<role>
You are an expert HTML/CSS resume editor for the Tiptap editor. Your job is to update the projects section of a resume, strictly preserving the original HTML structure and formatting.
</role>

<task>
Given:
- "oldEditorHTML": The current HTML content to update (must be preserved exactly).
- "projectDescription": Context for the projects to add or modify.
- "userQuestion": The user's specific request for projects updates.

Your steps:
1. Analyze the provided HTML and user requirements.
2. Identify the projects section to modify.
3. Create "newEditorHTML" by:
   - Starting with the exact "oldEditorHTML".
   - Adding or updating only the requested projects, following the formatting rules below.
   - Preserving all existing HTML, CSS classes, IDs, and attributes.
   - Ensuring the new content matches the style and structure of the original.

<formatting_rules>
- Project header: Product Name | Product Tech (if mentioned, otherwise infer from job description) | Product link (if mentioned) [spaces] Duration (if mentioned)
- Project description: bullet points, use <ul> and <li>; each <li> must contain a <p> tag.
- If creating <li> from a <span>, create a new <span> inside the <p>.
- Only add or update projects as requested. Do NOT remove existing entries unless explicitly told.
- Do NOT add unrelated or unnecessary information.
</formatting_rules>

<html_rules>
- Do not alter any HTML outside the projects section.
- All new spans must be inside their parent elements.
- Keep indentation, classes, and styling consistent.
- Do not change IDs, classes, or data attributes.
</html_rules>

<output>
Respond with a valid JSON object, and nothing else:
{
  "oldEditorHTML": "EXACT copy of input HTML",
  "newEditorHTML": "Full HTML with projects updates"
}
</output>

<validation>
- "oldEditorHTML" must match the input exactly, character-for-character.
- "newEditorHTML" must include all original content plus the requested changes.
- Output must be valid, parseable JSON. No extra text.
</validation>
`,
    });

    const subRunner = new Runner({ model: "gpt-4.1" });

    const prompt = `Project Description: ${parsedInput.projectDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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
        const res = outputText as any;

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

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the projects section from this updated content and retry the tool call.

Current Resume Content: ${resume?.content}
`,
            retryInstructions:
              "Extract the projects section from currentResumeContent and retry the updateProjects tool with: 1) htmlToUpdate = projects section from currentResumeContent, 2) same projectDescription and userQuestion",
            currentResumeContent: resume?.content || "",
          });
        }

        // Success case - add success flag and current resume content
        const successResult = {
          success: true,
          ...res,
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
            "Extract the projects section from currentResumeContent and retry the updateProjects tool with: 1) htmlToUpdate = projects section from currentResumeContent, 2)  same projectDescription and userQuestion",
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
        error: `Projects update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
