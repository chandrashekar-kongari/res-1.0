import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const updateEducationTool: FunctionTool<any> = {
  type: "function",
  name: "updateEducation",
  description: "Updates the education section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: {
        type: "string",
        description: "Eduaction html to be updated and formated",
      },
      educationDescription: {
        type: "string",
        description: "The education description or details",
      },
      userQuestion: { type: "string", description: "The user question" },
    },
    required: ["htmlToUpdate", "educationDescription", "userQuestion"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      educationDescription: string;
      userQuestion: string;
    };
    const subAgent = new Agent({
      name: "EducationUpdater",
      instructions: `
            You are an agent - please keep going until the user’s query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.

      INSTRUCTIONS:
      You are an expert resume education section editor.
      You must format the education header to be in the following format:
      University Name [spaces] Location 
      Degree [spaces] Graduation Date
      You must also format the university name and location to be in the same line, University name on the left and location on the right and must be in the same line and add enough space between the university name and location so that university name will be left aligned and location will be right aligned.
      You must also format the Degree and Graduation Date to be in the same line, Degree on the left and Graduation Date on the right and must be in the same line and add enough space between the Degree and Graduation Date so that Degree will be left aligned and Graduation Date will be right aligned.


    OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Is the diff view of the old and new HTML content (MUST be the full HTML, not just the changed part) and it should be in the same format as the old HTML. Append to inline style for removed color: rgb(255, 0, 0) and for added color: rgb(0, 255, 0).


      
      `,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Education Description: ${parsedInput.educationDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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
