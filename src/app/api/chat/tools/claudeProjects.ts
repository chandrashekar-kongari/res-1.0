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

// Define your tools as before (example for updateProjectsTool)
export const updateProjectsTool: FunctionTool<any> = {
  type: "function",
  name: "updateProjects",
  description: "Updates the projects section of the resume",
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
      instructions: `
<role>
You are an expert HTML/CSS resume building specialist for tiptap editor. Your task is to update resume projects sections while maintaining exact HTML structure and formatting consistency.
</role>

<task_overview>
You will receive HTML content and must:
1. Preserve the original HTML exactly as "oldEditorHTML"
2. Create an updated version as "newEditorHTML" with projects modifications
</task_overview>

<input_requirements>
- Project description: Context for what projects to add/modify
- User question: Specific request for projects updates
- HTML to update: The exact HTML content to modify
</input_requirements>

<modification_guidelines>
<projects_formatting>
- Format project header as: Product Name | Product Tech(if any mentioned or not mentioned add from the job description) | link to the product(if mentioned) [spaces] Duration(if mentioned)
- Project description should be bullet points and use job description to enhance the project descriptions
- Use ul and li tags to list project points
- Must create p tag inside li tag
- If creating li tag by taking content from span tag, must create new span tag inside p tag
- Only ADD relevant projects based on the user's request
- Do NOT remove existing projects unless explicitly requested
- Do NOT add unnecessary or unrelated information
</projects_formatting>

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
Identify the projects section that needs modification.
</step_1>

<step_2>
Create newEditorHTML by:
- Starting with the exact OldEditorHTML content
- Adding only the requested projects in proper format
- Maintaining the existing HTML structure and formatting
- Ensuring all new content follows the same patterns as existing content
</step_2>


</step_by_step_process>

<example_io>
INPUT:
Job Description: Desire to lead and build a winning team, Strong communication skills with a variety of stakeholders. Deep understanding of system design, architecture, and microservices. Experience shipping zero-to-one products and iterating rapidly. Passion for clean, scalable code and a bias for action. Hungry to learn and experiment with new tools (especially in AI/ML). Entrepreneurial mindset: you take ownership, push through ambiguity, and love building with others
User Question: Update the projects section according to job description
HTML to Update: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>

OUTPUT:
{
  "oldEditorHTML": "<p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-blue-600 hover:text-blue-800 underline\" href=\"https://github.com/tanujtinish/Actor_Graph_Library\">Github</a>            Jan 2023 - Jun 2024</p><ul style=\"margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;\"><li style=\"margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;\"><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\"></p>",
  "newEditorHTML": "<p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-blue-600 hover:text-blue-800 underline\" href=\"https://github.com/tanujtinish/Actor_Graph_Library\">Github</a>            Jan 2023 - Jun 2024</p><ul style=\"margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;\"><li style=\"margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;\"><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style=\"margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;\"><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</p></li></ul>",
  "diffEditorHTML": "<p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-blue-600 hover:text-blue-800 underline\" href=\"https://github.com/tanujtinish/Actor_Graph_Library\">Github</a>            Jan 2023 - Jun 2024</p><ul style=\"margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;\"><li style=\"margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;\"><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style=\"margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;\"><p style=\"font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;\"><mark style=\"background-color: #acf2bd;\">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</mark></p></li></ul>"
}
</example_io>

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
  "newEditorHTML": "Complete HTML document with projects updates applied"
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

    const prompt = `Project Description: ${parsedInput.projectDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the projects section from this updated content and retry the tool call.

Original HTML to update: ${parsedInput.htmlToUpdate}
Tool returned oldEditorHTML: ${parsedResult.oldEditorHTML}
`,
            retryInstructions:
              "Extract the projects section from currentResumeContent and retry the updateProjects tool with: 1) htmlToUpdate = projects section from currentResumeContent, 2) same projectDescription and userQuestion",
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
