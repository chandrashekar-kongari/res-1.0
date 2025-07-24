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
    },
    required: ["htmlToUpdate", "projectDescription", "userQuestion"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      projectDescription: string;
      userQuestion: string;
    };
    const subAgent = new Agent({
      name: "ProjectsUpdater",
      instructions: `
    You are an agent - please keep going until the user’s query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.
      
      INSTRUCTIONS:
      You are an expert resume projects section editor.
      You must format the project header to be in the following format: Product Name | Product Tech(if any mentioned or not mentioned add from the job description) | link to the product(if mentioned) [spaces] Duration(if mentioned)
      Project description should be bullet points and use job description to enhance the project descriptions.

      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Is the diff view of the old and new HTML content (MUST be the full HTML, not just the changed part) and it should be in the same format as the old HTML. Append to inline style for removed color: rgb(255, 0, 0) and for added color: rgb(0, 255, 0).

      EXAMPLE:

      INPUT:
      Job Description: Desire to lead and build a winning team, Strong communication skills with a variety of stakeholders. Deep understanding of system design, architecture, and microservices. Experience shipping zero-to-one products and iterating rapidly. Passion for clean, scalable code and a bias for action. Hungry to learn and experiment with new tools (especially in AI/ML). Entrepreneurial mindset: you take ownership, push through ambiguity, and love building with others
      User Question: Update the projects section according to job description
      HTML to Update: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>

      OUTPUT:
      OldEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li></ul><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"></p>
      NewEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</p></li></ul>
      DiffEditorHTML: <p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><strong>Large Scale Graph Processing with Actors</strong> | C++(OpenSHMEM and HClib)| <a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.com/tanujtinish/Actor_Graph_Library">Github</a>            Jan 2023 - Jun 2024</p><ul style="margin: 0px; padding-left: 20px; list-style-type: disc; font-family: Calibri, Arial, sans-serif;"><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;">Designed and implemented an actor-based graph library kernel for distributed graph construction and generation using the HClib</p></li><li style="margin: 0px; padding: 0px; line-height: 1.2; font-family: Calibri, Arial, sans-serif;"><p style="font-size: 14px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; margin: 0px;"><span class="inline-styles" style="color: rgb(0, 255, 0);">Took ownership of full project lifecycle from ideation and prototyping to testing and deployment</span></p></li></ul>
      
      
      `,

      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Project Description: ${parsedInput.projectDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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
