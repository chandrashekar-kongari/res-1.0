import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const updateExperienceTool: FunctionTool<any> = {
  type: "function",
  name: "updateExperience",
  description: "Updates the experience section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
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
      name: "ExperienceUpdater",
      instructions: `
      # Role and Objective
      You are HTML, CSS and Resume building expert, your task is to correctly construct the NewEditorHTML and DiffEditorHTML by updating the OldEditorHTML based on the job description and user question.

     # Instructions:
      You must format the experience header to be in the following format: Role | Company | Location [spaces] Date
      Add enough spaces between the role, company, location and date so that role, company, location(on the left end) and date(on the right end) are in the same line.
      You must also format the experience header to be in the same line.
      Update experince points based on the job description. 

      STEPS:
      First build NewEditorHTML by updating the OldEditorHTML based on the job description and user question.
      Then build DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML.

      IMPORTANT:
      - Do not remove or add any content from the OldEditorHTML.
      - Create NewEditorHTML by updating the OldEditorHTML based on the job description and user question.
      - Create DiffEditorHTML by comparing the NewEditorHTML and OldEditorHTML.
      - Do not remove or add any content from the NewEditorHTML.
      - Do not remove or add any content from the DiffEditorHTML.




      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: It is the diff view of the old and new HTML content (MUST be the full HTML, not just the changed part) and it should be in the same format as the old HTML. Append to inline style for removed color: rgb(255, 0, 0) and for added color: rgb(0, 255, 0).


      Before returning the output, think step by step and make sure you have followed the steps correctly.


`,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Job Description: ${parsedInput.jobDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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

    return outputText;
  },
};
