import { prisma } from "@/lib/db";
import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

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
    const subAgent = new Agent({
      name: "ProjectsUpdater",
      instructions: `
      # Role and Objective
      You are HTML, CSS and Resume building expert for tiptap editor, your task is to correctly construct the NewEditorHTML and DiffEditorHTML by updating the OldEditorHTML based on the project description and user question.
      
      # Instructions:
      You must format the project header to be in the following format: Product Name | Product Tech(if any mentioned or not mentioned add from the job description) | link to the product(if mentioned) [spaces] Duration(if mentioned)
      Project description should be bullet points and use job description to enhance the project descriptions.

      STEPS:
      First build NewEditorHTML by updating the OldEditorHTML based on the project description and user question.
      Then build DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML. For removed content wrap it mark tag with style="background-color: #fdb8c0;" and for added content wrap it mark tag with style="background-color: #acf2bd;". If you are adding mark tags inside any span tag then must create a new span tag inside the mark tag and keep the text inside the span tag.

      IMPORTANT:
      - Do not remove or add any content from the OldEditorHTML.
      - Create NewEditorHTML by updating the OldEditorHTML based on the project description and user question.
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

      INPUT:
      Job Description: Desire to lead and build a winning team, Strong communication skills with a variety of stakeholders. Deep understanding of system design, architecture, and microservices. Experience shipping zero-to-one products and iterating rapidly. Passion for clean, scalable code and a bias for action. Hungry to learn and experiment with new tools (especially in AI/ML). Entrepreneurial mindset: you take ownership, push through ambiguity, and love building with others
      User Question: Update the projects section according to job description
      HTML to Update: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>

      OUTPUT:
      OldEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>
      NewEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</p></li></ul>
      DiffEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><mark style="background-color: #acf2bd;">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</mark></p></li></ul>
      `,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });

    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Project Description: ${parsedInput.projectDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;

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
            diffEditorHTML: parsedInput.htmlToUpdate,
            error: `TOOL_VALIDATION_FAILED: The HTML section to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. 

RETRY REQUIRED: Use the currentResumeContent provided below as the new currentEditorHTML parameter. Extract the projects section from this updated content and retry the tool call.

Current editor content: ${resume?.content}
`,
            retryInstructions:
              "Extract the projects section from currentResumeContent and retry the updateProjects tool with: 1) htmlToUpdate = projects section from currentResumeContent, 2)  same projectDescription and userQuestion",
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
          diffEditorHTML: parsedInput.htmlToUpdate,
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
        diffEditorHTML: parsedInput.htmlToUpdate,
        error: `Projects update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
