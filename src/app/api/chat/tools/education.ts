import { Agent, Runner, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";
import { prisma } from "@/lib/db";

interface EducationToolInput {
  htmlToUpdate: string;
  educationDescription: string;
  userQuestion: string;
  currentEditorHTML: string;
  resumeId: string;
}

export const updateEducationTool: FunctionTool<EducationToolInput> = {
  type: "function",
  name: "updateEducation",
  description: "Updates the education section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      educationDescription: {
        type: "string",
        description: "The education description or details",
      },
      userQuestion: { type: "string", description: "The user question" },
      currentEditorHTML: {
        type: "string",
        description: "The current full editor HTML content for validation",
      },
      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: [
      "htmlToUpdate",
      "educationDescription",
      "userQuestion",
      "currentEditorHTML",
      "resumeId",
    ],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      educationDescription: string;
      userQuestion: string;
      currentEditorHTML: string;
      resumeId: string;
    };
    const subAgent = new Agent({
      name: "EducationUpdater",
      instructions: `
      # Role and Objective
      You are HTML, CSS and Resume building expert for tiptap editor, your task is to correctly construct the NewEditorHTML and DiffEditorHTML by updating the OldEditorHTML based on the education description and user question.

     # Instructions:
      You must format the education header to be in the following format:
      University Name [spaces] Location 
      Degree [spaces] Graduation Date
      You must also format the university name and location to be in the same line, University name on the left and location on the right and must be in the same line and add enough space between the university name and location so that university name will be left aligned and location will be right aligned.
      You must also format the Degree and Graduation Date to be in the same line, Degree on the left and Graduation Date on the right and must be in the same line and add enough space between the Degree and Graduation Date so that Degree will be left aligned and Graduation Date will be right aligned.
      If you are working with span tags, must create a new span tag inside any parent tag and keep the text inside the span tag.

      STEPS:
      First build NewEditorHTML by updating the OldEditorHTML based on the education description and user question.
      Then build DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML. For removed content wrap it mark tag with style="background-color: #fdb8c0;" and for added content wrap it mark tag with style="background-color: #acf2bd;", If you are adding mark tags inside any span tag then must create a new span tag inside the mark tag and keep the text inside the span tag.

      IMPORTANT:
      - Do not remove or add any content from the OldEditorHTML.
      - Create NewEditorHTML by updating the OldEditorHTML based on the education description and user question.
      - Create DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML.
      - Do not remove or add any content from the NewEditorHTML.
      - Do not remove or add any content from the DiffEditorHTML.

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
    const prompt = `Education Description: ${parsedInput.educationDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result = await subRunner.run(subAgent, prompt);
      let outputText = "";
      outputText = JSON.stringify(result);
      // Parse the result to validate oldEditorHTML
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
        const parsedResult =
          typeof outputText === "string" ? JSON.parse(outputText) : outputText;

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
            diffEditorHTML: parsedInput.htmlToUpdate,
            error: `TOOL_VALIDATION_FAILED: The HTML section to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. 

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the education section from this updated content and retry the tool call.

Original HTML to update: ${parsedInput.htmlToUpdate}
Tool returned oldEditorHTML: ${parsedResult.oldEditorHTML}
Current editor content: ${parsedInput.currentEditorHTML}`,
            retryInstructions:
              "Extract the education section from currentResumeContent and retry the updateEducation tool with: 1) htmlToUpdate = education section from currentResumeContent, 2) currentEditorHTML = currentResumeContent, 3) same educationDescription and userQuestion",
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
      } catch (parseError) {
        const error = parseError as Error;
        // Return failure response with current resume content
        return JSON.stringify({
          success: false,
          oldEditorHTML: parsedInput.htmlToUpdate,
          newEditorHTML: parsedInput.htmlToUpdate,
          diffEditorHTML: parsedInput.htmlToUpdate,
          error: `Failed to parse tool output: ${error.message}. RETRY REQUIRED: Use the currentResumeContent below and retry the tool call.`,
          retryInstructions:
            "Extract the education section from currentResumeContent and retry the updateEducation tool with: 1) htmlToUpdate = education section from currentResumeContent, 2) currentEditorHTML = currentResumeContent, 3) same educationDescription and userQuestion",
          currentResumeContent: resume?.content || "",
        });
      }
    } catch (err) {
      const error = err as Error;
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
        diffEditorHTML: parsedInput.htmlToUpdate,
        error: `Education update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
