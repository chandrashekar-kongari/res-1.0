import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

// Define your tools as before (example for updateSkillsTool)
export const updateSkillsTool: FunctionTool<any> = {
  type: "function",
  name: "updateSkills",
  description: "Updates the assistant's skills and knowledge using GPT-4",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: { type: "string", description: "The html to be updated" },
      skillsDescription: {
        type: "string",
        description: "The skills description or details",
      },
      userQuestion: { type: "string", description: "The user question" },
    },
    required: ["htmlToUpdate", "skillsDescription", "userQuestion"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      skillsDescription: string;
      userQuestion: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "SkillsUpdater",
      instructions: `
      
      You are an agent - please keep going until the user’s query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved.

      INSTRUCTIONS:
      - Analyze the current skills text and make requested modifications and based on job description and user question
      - Return both the old content and the new content
      - Return a diff view if there are changes
      - Just ADD skills DO NOT ADD unnecessary info

      OUTPUT FORMAT:    
      OldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)
      NewEditorHTML: The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)
      DiffEditorHTML: Is the diff view of the old and new HTML content (MUST be the full HTML, not just the changed part) and it should be in the same format as the old HTML. Append to inline style for removed color: rgb(255, 0, 0) and for added color: rgb(0, 255, 0).

      EXAMPLE:
      INPUT:
      Job Description: Experience with acquiring client requirements and resolving workflow problems through automation optimization, Experience with Java, Python, C#, C, C++, .NET, JavaScript, React, NodeJS, PHP, or Drupal, Ability to work with automated testing tools to perform testing and maintenance, Master’s degree 
      User Question: Update the skills section according to job description
      HTML to Update: <p style="font-size: 14px; margin: 0px 0px 5px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; border-bottom: 1px solid rgb(183, 183, 183); display: block; width: 100%;"><strong>SKILLS</strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Programming Languages</strong>: Java, C++</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Backend Technologies</strong>: Springboot, Flask, Django</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Database Technologies</strong>: MySQL, Planetscale</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Cloud Technologies</strong>: AWS, GCP, Azure</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p>
      
      OUTPUT:
      OldEditorHTML: <p style="font-size: 14px; margin: 0px 0px 5px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; border-bottom: 1px solid rgb(183, 183, 183); display: block; width: 100%;"><strong>SKILLS</strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Programming Languages</strong>: Java, C++</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Backend Technologies</strong>: Springboot, Flask, Django</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Database Technologies</strong>: MySQL, Planetscale</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Cloud Technologies</strong>: AWS, GCP, Azure</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"></p>
      NewEditorHTML: <p style="font-size: 14px; margin: 0px 0px 5px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; border-bottom: 1px solid rgb(183, 183, 183); display: block; width: 100%;"><strong>SKILLS</strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Programming Languages</strong>: Java, C, C++, C#, Python, Javascript</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Backend Technologies</strong>: Node JS, PHP, Drupal, .NET, Springboot, Flask, Django</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Frontend Technologies:</strong> React JS, HTML, CSS</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Database Technologies</strong>: MySQL, Planetscale</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Cloud Technologies</strong>: AWS, GCP, Azure</p>
      DiffEditorHTML: <p style="font-size: 14px; margin: 0px 0px 5px; padding: 0px; line-height: 1.15; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap; border-bottom: 1px solid rgb(183, 183, 183); display: block; width: 100%;"><strong>SKILLS</strong></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Programming Languages</strong>: Java,<span class="inline-styles" style="color: rgb(0, 255, 0);"> C</span>, C++, <span class="inline-styles" style="color: rgb(0, 255, 0);">C#</span>, <span class="inline-styles" style="color: rgb(0, 255, 0);">Python</span>, <span class="inline-styles" style="color: rgb(0, 255, 0);">Javascript</span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Backend Technologies</strong>: <span class="inline-styles" style="color: rgb(0, 255, 0);">Node JS</span>, <span class="inline-styles" style="color: rgb(0, 255, 0);">PHP</span>, <span class="inline-styles" style="color: rgb(0, 255, 0);">Drupal</span>, <span class="inline-styles" style="color: rgb(0, 255, 0);">.NET</span>, Springboot, Flask, Django</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><span class="inline-styles" style="color: rgb(0, 255, 0);"><strong>Frontend Technologies:</strong> React JS, HTML, CSS</span></p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Database Technologies</strong>: MySQL, Planetscale</p><p style="font-size: 14px; margin: 0px; padding: 0px; line-height: 1.25; font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;"><strong>Cloud Technologies</strong>: AWS, GCP, Azure</p>
      
      
      
      
      \n\nWhen returning oldEditorHTML, you must return it EXACTLY as you received it in the input, with no changes, reformatting, or normalization.\n\nWhen returning newEditorHTML and diffEditorHTML, you must return the entire HTML content you received as input, with the requested updates applied. Do not return only the changed part. All original HTML content must be preserved, except for the specific changes requested.\n\nFor example, if you receive <div>hello<p>good</p><p>morning</p></div> and you are asked to update only <p>morning</p>, your newEditorHTML must be <div>hello<p>good</p><p>[updated morning]</p></div>, not just <p>[updated morning]</p>.\n\nReturning Response (Must Follow this format):\n- Analyze the current skills/knowledge text\n- Make requested modifications\n- Return both the old content and the new content\n- Return a diff view if there are changes\n\nAlways return a structured response as a JSON object with:\n- response: Your explanation\n- oldEditorHTML: The original skills/knowledge text you received (before any changes) (MUST be returned exactly as received, with no changes)\n- newEditorHTML: (optional) The modified skills/knowledge text (after changes, without diff styling) (MUST be the full HTML, not just the changed part)\n- diffEditorHTML: (optional) If there are any changes, return a diff view (use style=\"color: rgb(255, 0, 0); font-family: Inter, sans-serif;\" for removed, style=\"color: rgb(0, 255, 0); font-family: Inter, sans-serif;\" for added) (MUST be the full HTML, not just the changed part)\n\nIMPORTANT: When adding color styling in HTML, always use rgb() format (e.g., color: rgb(0, 255, 0)) for color values and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color.\n\nWhen generating or updating HTML, always use inline styles for color in rgb() format and set font-family: Inter, sans-serif;. Do not use hex codes or named colors for color. Ensure all color styles are in rgb() format and font-family is set for compatibility with ProseMirror (Tiptap).\n\nIf there are no changes, return both oldEditorHTML and newEditorHTML as identical, and diffEditorHTML as null or empty.\n\nOutput must be a valid JSON object.`,
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
        diffEditorHTML: z.string(),
      }),
    });
    const subRunner = new Runner({ model: "gpt-4.1" });
    const prompt = `Skills Description: ${parsedInput.skillsDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
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
