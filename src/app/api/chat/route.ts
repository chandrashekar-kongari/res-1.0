import { NextResponse } from "next/server";
import { Agent, Runner, tool, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";
import OpenAI from "openai";

interface AssistantResponse {
  role: string;
  content: string;
  newEditorHTML?: string;
  diffEditorHTML?: string;
}

interface ToolInput {
  text?: string;
  oldHTML?: string;
  newHTML?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define your tools as before (example for updateSkillsTool)
const updateSkillsTool: FunctionTool<any> = {
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
      instructions: `You are an expert assistant skills editor.\n\nWhen returning oldEditorHTML, you must return it EXACTLY as you received it in the input, with no changes, reformatting, or normalization.\n\nWhen returning newEditorHTML and diffEditorHTML, you must return the entire HTML content you received as input, with the requested updates applied. Do not return only the changed part. All original HTML content must be preserved, except for the specific changes requested.\n\nFor example, if you receive <div>hello<p>good</p><p>morning</p></div> and you are asked to update only <p>morning</p>, your newEditorHTML must be <div>hello<p>good</p><p>[updated morning]</p></div>, not just <p>[updated morning]</p>.\n\nReturning Response (Must Follow this format):\n- Analyze the current skills/knowledge text\n- Make requested modifications\n- Return both the old content and the new content\n- Return a diff view if there are changes\n\nAlways return a structured response as a JSON object with:\n- response: Your explanation\n- oldEditorHTML: The original skills/knowledge text you received (before any changes) (MUST be returned exactly as received, with no changes)\n- newEditorHTML: (optional) The modified skills/knowledge text (after changes, without diff styling) (MUST be the full HTML, not just the changed part)\n- diffEditorHTML: (optional) If there are any changes, return a diff view (use style=\"color: rgb(255, 0, 0); font-family: Inter, sans-serif;\" for removed, style=\"color: rgb(0, 255, 0); font-family: Inter, sans-serif;\" for added) (MUST be the full HTML, not just the changed part)\n\nIMPORTANT: When adding color styling in HTML, always use rgb() format (e.g., color: rgb(0, 255, 0)) for color values and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color.\n\nWhen generating or updating HTML, always use inline styles for color in rgb() format and set font-family: Inter, sans-serif;. Do not use hex codes or named colors for color. Ensure all color styles are in rgb() format and font-family is set for compatibility with ProseMirror (Tiptap).\n\nIf there are no changes, return both oldEditorHTML and newEditorHTML as identical, and diffEditorHTML as null or empty.\n\nOutput must be a valid JSON object.`,
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

const updateExperienceTool: FunctionTool<any> = {
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
      instructions: `You are an expert resume experience editor.\n\nWhen returning oldEditorHTML, you must return it EXACTLY as you received it in the input, with no changes, reformatting, or normalization.\n\nWhen returning newEditorHTML and diffEditorHTML, you must return the entire HTML content you received as input, with the requested updates applied. Do not return only the changed part. All original HTML content must be preserved, except for the specific changes requested.\n\nFor example, if you receive <div>hello<p>good</p><p>morning</p></div> and you are asked to update only <p>morning</p>, your newEditorHTML must be <div>hello<p>good</p><p>[updated morning]</p></div>, not just <p>[updated morning]</p>.\n\nReturning Response (Must Follow this format):\n- Analyze the current HTML content\n- Make requested modifications\n- Return both the old content and the new content\n- Return a diff view if there are changes\n\nAlways return a structured response as a JSON object with:\n- response: Your explanation\n- oldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)\n- newEditorHTML: (optional) The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)\n- diffEditorHTML: (optional) If there are any changes, return a diff view (use style=\"color: rgb(255, 0, 0); font-family: Inter, sans-serif;\" for removed, style=\"color: rgb(0, 255, 0); font-family: Inter, sans-serif;\" for added) (MUST be the full HTML, not just the changed part)\n\nIMPORTANT: When adding color styling in HTML, always use rgb() format (e.g., color: rgb(0, 255, 0)) for color values and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color.\n\nWhen generating or updating HTML, always use inline styles for color in rgb() format and set font-family: Inter, sans-serif;. Do not use hex codes or named colors for color. Ensure all color styles are in rgb() format and font-family is set for compatibility with ProseMirror (Tiptap).\n\nIf there are no changes, return both oldEditorHTML and newEditorHTML as identical, and diffEditorHTML as null or empty.\n\nOutput must be a valid JSON object.`,
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

const updateEducationTool: FunctionTool<any> = {
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
      instructions: `You are an expert resume education section editor.\n\nWhen returning oldEditorHTML, you must return it EXACTLY as you received it in the input, with no changes, reformatting, or normalization.\n\nWhen returning newEditorHTML and diffEditorHTML, you must return the entire HTML content you received as input, with the requested updates applied. Do not return only the changed part. All original HTML content must be preserved, except for the specific changes requested.\n\nFor example, if you receive <div>hello<p>good</p><p>morning</p></div> and you are asked to update only <p>morning</p>, your newEditorHTML must be <div>hello<p>good</p><p>[updated morning]</p></div>, not just <p>[updated morning]</p>.\n\nReturning Response (Must Follow this format):\n- Analyze the current HTML content\n- Make requested modifications\n- Return both the old content and the new content\n- Return a diff view if there are changes\n\nAlways return a structured response as a JSON object with:\n- response: Your explanation\n- oldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)\n- newEditorHTML: (optional) The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)\n- diffEditorHTML: (optional) If there are any changes, return a diff view (use style=\"color: rgb(255, 0, 0); font-family: Inter, sans-serif;\" for removed, style=\"color: rgb(0, 255, 0); font-family: Inter, sans-serif;\" for added) (MUST be the full HTML, not just the changed part)\n\nIMPORTANT: When adding color styling in HTML, always use rgb() format (e.g., color: rgb(0, 255, 0)) for color values and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color.\n\nWhen generating or updating HTML, always use inline styles for color in rgb() format and set font-family: Inter, sans-serif;. Do not use hex codes or named colors for color. Ensure all color styles are in rgb() format and font-family is set for compatibility with ProseMirror (Tiptap).\n\nIf there are no changes, return both oldEditorHTML and newEditorHTML as identical, and diffEditorHTML as null or empty.\n\nOutput must be a valid JSON object.`,
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

const updateProjectsTool: FunctionTool<any> = {
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
      instructions: `You are an expert resume projects section editor.\n\nWhen returning oldEditorHTML, you must return it EXACTLY as you received it in the input, with no changes, reformatting, or normalization.\n\nWhen returning newEditorHTML and diffEditorHTML, you must return the entire HTML content you received as input, with the requested updates applied. Do not return only the changed part. All original HTML content must be preserved, except for the specific changes requested.\n\nFor example, if you receive <div>hello<p>good</p><p>morning</p></div> and you are asked to update only <p>morning</p>, your newEditorHTML must be <div>hello<p>good</p><p>[updated morning]</p></div>, not just <p>[updated morning]</p>.\n\nReturning Response (Must Follow this format):\n- Analyze the current HTML content\n- Make requested modifications\n- Return both the old content and the new content\n- Return a diff view if there are changes\n\nAlways return a structured response as a JSON object with:\n- response: Your explanation\n- oldEditorHTML: The original HTML content you received (before any changes) (MUST be returned exactly as received, with no changes)\n- newEditorHTML: (optional) The modified HTML content (after changes, without diff styling) (MUST be the full HTML, not just the changed part)\n- diffEditorHTML: (optional) If there are any changes, return a diff view (use style=\"color: rgb(255, 0, 0); font-family: Inter, sans-serif;\" for removed, style=\"color: rgb(0, 255, 0); font-family: Inter, sans-serif;\" for added) (MUST be the full HTML, not just the changed part)\n\nIMPORTANT: When adding color styling in HTML, always use rgb() format (e.g., color: rgb(0, 255, 0)) for color values and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color.\n\nWhen generating or updating HTML, always use inline styles for color in rgb() format and set font-family: Inter, sans-serif;. Do not use hex codes or named colors for color. Ensure all color styles are in rgb() format and font-family is set for compatibility with ProseMirror (Tiptap).\n\nIf there are no changes, return both oldEditorHTML and newEditorHTML as identical, and diffEditorHTML as null or empty.\n\nOutput must be a valid JSON object.`,
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

const runner = new Runner({ model: "gpt-4.1" });

export async function POST(req: Request) {
  try {
    const { messages, editorHTML, attachPartOfHTML } = await req.json();
    // For now, just log attachPartOfHTML to verify receipt
    console.log("attachPartOfHTML:", attachPartOfHTML);
    // TODO: Handle attachPartOfHTML in tool invocation logic if needed

    // Compose the prompt as before
    const conversation = Array.isArray(messages)
      ? messages.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
      : "";
    // Extract the latest user question
    const lastUserMessage = Array.isArray(messages)
      ? messages.filter((msg: any) => msg.role === "user").slice(-1)[0]
          ?.content || ""
      : "";
    // Make the prompt explicit about the latest user question
    let prompt = editorHTML
      ? `Editor Content:\n${editorHTML}\n\nConversation:\n${conversation}\n\nUser's latest question: ${lastUserMessage}`
      : `Conversation:\n${conversation}\n\nUser's latest question: ${lastUserMessage}`;
    if (
      attachPartOfHTML &&
      Array.isArray(attachPartOfHTML) &&
      attachPartOfHTML.length > 0
    ) {
      prompt += `\n\nUSER-ADDED HTML PARTS (attachPartOfHTML):\nThese are specific HTML sections that the user has added or highlighted.\nThe user may request changes specifically for these parts.\nWhen processing user requests, prioritize these HTML parts for targeted updates.\n\nUser-Added HTML Parts:\n${attachPartOfHTML
        .map((part, idx) => `Part ${idx + 1}:\n${part}`)
        .join("\n\n")}`;
    }

    // Build your agent
    const agent = new Agent({
      name: "Assistant",
      instructions: `
    IMPORTANT: When responding to the user, do NOT include or display any HTML code in your response. Only provide explanations, summaries, or answers in plain language. All HTML processing and code should be handled internally or via tools, but never shown directly to the user.
    IMPORTANT: When returning any HTML (oldEditorHTML, newEditorHTML, diffEditorHTML), always return only one root element (the innermost, stripped version, not unnecessary wrappers).

    You are a helpful assistant with access to special tools. 

      for each tool do not pass the whole html to the tool, strategically split the html of the section that is to be updated and pass it to the tool.
      When responding:\n\n
      1. If the request involves updating skills:\n   - Use the updateSkills tool\n  
      2. If the request involves updating experience:\n   - Use the updateExperience tool\n  , If the experience section has more then 2 then split it into each experience section and pass to updateExperience tool and call it for each experience section\n
      3. If the request involves updating education:\n   - Use the updateEducation tool\n  , If the education section has more then 2 then split it into each education section and pass to updateEducation tool and call it for each education section\n
      4. If the request involves updating projects:\n   - Use the updateProjects tool\n  , If the projects section has more then 2 then split it into each project section and pass to updateProjects tool and call it for each project section\n
      
      
      
      ADDITIONAL INSTRUCTION: When generating or updating HTML, always use inline styles for color in rgb() format (e.g., color: rgb(0, 255, 0)) and set font-family: Inter, sans-serif; in the style attribute. Do not use hex codes or named colors for color. Ensure both color and font-family are set in every relevant style attribute for compatibility with ProseMirror (Tiptap).\n\nIf you are returning HTML for the editor, ensure all color style attributes are in rgb() format and font-family is set to Inter, sans-serif.\n\n`,
      tools: [
        updateSkillsTool,
        updateExperienceTool,
        updateEducationTool,
        updateProjectsTool,
      ], // Add your tools here
    });

    // Run the agent with streaming enabled
    const stream = await runner.run(agent, prompt, { stream: true });
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          // Forward each event as SSE
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from OpenAI" },
      { status: 500 }
    );
  }
}
