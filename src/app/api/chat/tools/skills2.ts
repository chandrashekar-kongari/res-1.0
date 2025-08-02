import { prisma } from "@/lib/db";
import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

// Define your tools as before (example for updateSkillsTool)
export const updateSkillsTool: FunctionTool<any> = {
  type: "function",
  name: "updateSkills",
  description: "Updates the skills section of the resume",
  parameters: {
    type: "object",
    properties: {
      skillsDescription: {
        type: "string",
        description: "The skills description or details",
      },
      userQuestion: { type: "string", description: "The user question" },

      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: ["skillsDescription", "userQuestion", "resumeId"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      skillsDescription: string;
      userQuestion: string;
      resumeId: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "SkillsUpdater",
      instructions: `
      # Role and Objective
      You are an HTML, CSS and Resume building expert for tiptap editor. Your task is to:
      1. First identify and extract the skills section from the full resume content
      2. Update that skills section based on the skills description and user question
      3. Generate the OldEditorHTML, NewEditorHTML, and DiffEditorHTML

     # Instructions:
      You will receive the full resume content. You need to identify the skills section within it.
      Look for skills-related content (skills, technologies, technical skills, etc.) and extract that specific HTML section.
      Analyze the current skills text and make requested modifications based on job description and user question.
      Just ADD skills DO NOT ADD unnecessary info.
      Organize skills into appropriate categories (Programming Languages, Backend Technologies, Frontend Technologies, Database Technologies, Cloud Technologies, etc.).
      If you are working with span tags, must create a new span tag inside any parent tag and keep the text inside the span tag.

      STEPS:
      1. First, identify and extract the skills section from the full resume content - this becomes your OldEditorHTML
      2. Create NewEditorHTML by updating the OldEditorHTML (skills section) based on the skills description and user question
      3. Create DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML. For removed content wrap it with mark tag with style="background-color: #fdb8c0;" and for added content wrap it with mark tag with style="background-color: #acf2bd;". If you are adding mark tags inside any span tag then must create a new span tag inside the mark tag and keep the text inside the span tag.

      IMPORTANT:
      - First correctly identify the skills section from the full resume content
      - OldEditorHTML should be the extracted skills section (not the full resume)
      - NewEditorHTML should be the updated skills section (same structure but with modifications)
      - DiffEditorHTML should show the changes between old and new skills sections
      - Preserve all HTML structure and styling of the original skills section

      OUTPUT FORMAT:    
      OldEditorHTML: The original skills section HTML extracted from the full resume content (MUST be returned exactly as found)
      NewEditorHTML: The modified skills section HTML (after changes, without diff styling) (MUST be the full skills section HTML, not just the changed part)
      DiffEditorHTML: Generate a diff view of the OldEditorHTML and NewEditorHTML showing changes in the skills section.

      Before returning the output, think step by step and make sure you have:
      1. Correctly identified the skills section
      2. Applied the requested changes
      3. Generated proper diff markup

`,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });

    const resume = await prisma.resume.findUnique({
      where: {
        id: parsedInput.resumeId,
      },
      select: {
        content: true,
      },
    });

    const prompt = `Skills Description: ${parsedInput.skillsDescription}\nUser Question: ${parsedInput.userQuestion}\nFull Resume Content: ${resume?.content}`;
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

        // Validate that the oldEditorHTML (skills section) from the tool exists in the current resume content
        if (
          res.oldEditorHTML &&
          resume?.content &&
          !resume?.content.includes(res.oldEditorHTML.trim())
        ) {
          // Tool failed - return failure response with current resume content
          return JSON.stringify({
            success: false,
            oldEditorHTML: resume?.content || "",
            newEditorHTML: resume?.content || "",
            diffEditorHTML: resume?.content || "",
            error: `TOOL_VALIDATION_FAILED: The skills section identified by the tool was not found in the current resume content. This likely means the agent failed to correctly identify the skills section or the resume content has changed.

Tool returned oldEditorHTML (skills section): ${res.oldEditorHTML}

RETRY REQUIRED: The tool should re-analyze the current resume content to correctly identify the skills section.`,
            retryInstructions:
              "Retry the updateSkills tool with the same skillsDescription and userQuestion. The agent should correctly identify the skills section from the current resume content.",
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
          oldEditorHTML: resume?.content || "",
          newEditorHTML: resume?.content || "",
          diffEditorHTML: resume?.content || "",
          error: `Failed to parse tool output: ${parseError.message}. RETRY REQUIRED: The tool should re-analyze the current resume content.`,
          retryInstructions:
            "Retry the updateSkills tool with the same skillsDescription and userQuestion. The agent should correctly identify and update the skills section from the current resume content.",
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
        oldEditorHTML: currentResumeContent,
        newEditorHTML: currentResumeContent,
        diffEditorHTML: currentResumeContent,
        error: `Skills update tool failed: ${error.message || "Unknown error"}`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
