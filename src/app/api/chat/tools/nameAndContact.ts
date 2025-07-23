import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const nameAndContactInfoFormatTool: FunctionTool<any> = {
  type: "function",
  name: "nameAndContactInfoFormat",
  description: "Updates the name and contact info section of the resume",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: {
        type: "string",
        description:
          "The html of name and contact info section which to be updated with the format",
      },
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
      name: "NameAndContactInfoUpdater",
      instructions: `
      You are an agent - please keep going until the user’s query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.
      You are an expert formatting name and contact info.
      You must format the name and contact info to be in the following format: Make name on the 1st line in the center and all the contact info on the 2nd line in the center.
      Name  
      Contact Info
      EXAMPLE:
      HTML: <p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><strong><span style="font-size: 18px;">Chandra shekar</span></strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href=""><span style="font-size: 12px;">chandra@school.edu</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="linkedin/chandra"><span style="font-size: 12px;">linkedin/chandra</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://chandra.github.io"><span style="font-size: 12px;">chandra.github.io</span></a><span style="font-size: 12px;"> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="leetcode/chandra"><span style="font-size: 12px;">leetcode/chandra</span></a><span style="font-size: 12px;"> | New York</span></p>
      
      In the above example white space is also important. Do not remove it. You must calculate the white space based on the font size,font weight, font family and line height. 


      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Is the diff view of the old and new HTML content (MUST be the full HTML, not just the changed part) and it should be in the same format as the old HTML. Append to inline style for removed color: rgb(255, 0, 0) and for added color: rgb(0, 255, 0).


      EXAMPLE:
      OldEditorHTML: <p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span class="inline-styles"><strong><span>Swetha Kompelli</span></strong></span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span>swetha@gmail.com</span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span>linkedin/swetha</span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.io/swetha"><span>github.io/swetha</span></a></p>
      NewEditorHTML:<p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><span class="inline-styles"><strong><span>Swetha Kompelli</span></strong></span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href=""><span>swetha@gmail.com</span></a><span> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="linkedin/swetha"><span>linkedin/swetha</span></a><span> | </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.io/swetha"><span>github.io/swetha</span></a></p>
      DiffEditorHTML: <p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span class="inline-styles" style="color: rgb(255, 0, 0);"><strong><span>Swetha Kompelli</span></strong></span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href=""><span class="inline-styles" style="color: rgb(255, 0, 0);"><span>swetha@gmail.com</span></span></a></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span class="inline-styles" style="color: rgb(255, 0, 0);"><span>linkedin/swetha</span></span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.io/swetha"><span class="inline-styles" style="color: rgb(255, 0, 0);"><span>github.io/swetha</span></span></a></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><span class="inline-styles" style="color: rgb(0, 255, 0);"><strong>Swetha Kompelli</strong></span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; text-align: center;"><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href=""><span class="inline-styles" style="color: rgb(0, 255, 0);">swetha@gmail.com</span></a><span class="inline-styles" style="color: rgb(0, 255, 0);"><strong> </strong></span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="linkedin/swetha"><span class="inline-styles" style="color: rgb(0, 255, 0);">linkedin/swetha</span></a><span class="inline-styles" style="color: rgb(0, 255, 0);"> </span><a target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 hover:text-blue-800 underline" href="https://github.io/swetha"><span class="inline-styles" style="color: rgb(0, 255, 0);">github.io/swetha</span></a></p>

      
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
