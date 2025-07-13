import { NextResponse } from "next/server";
import { Agent, run, FunctionTool, RunContext } from "@openai/agents";
import { diffChars } from "diff";
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

// Tool definitions for the agent
const updateSkillsTool: FunctionTool<ToolInput> = {
  type: "function",
  name: "updateSkills",
  description: "Updates the assistant's skills and knowledge using GPT-4",
  parameters: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text containing new skills/knowledge to be processed",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    try {
      const params = JSON.parse(input) as ToolInput;
      if (!params.text) throw new Error("Text is required");

      // Use GPT-4 to process and enhance the skills update
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content:
              "You are a skill assessment expert. Given some text about skills or knowledge, analyze it and provide a structured, enhanced version of those skills. Focus on clarity, relevance, and actionable insights.",
          },
          {
            role: "user",
            content: params.text,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const enhancedSkills =
        completion.choices[0]?.message?.content || params.text;
      return `Updated and enhanced skills:\n${enhancedSkills}`;
    } catch (error) {
      console.error("Error in updateSkills tool:", error);
      throw new Error("Failed to process skills update");
    }
  },
};

const createHTMLDiffTool: FunctionTool<ToolInput> = {
  type: "function",
  name: "createHTMLDiff",
  description:
    "Creates an intelligent diff view of HTML changes with styling and explanations using GPT-4",
  parameters: {
    type: "object",
    properties: {
      oldHTML: {
        type: "string",
        description: "The original HTML content",
      },
      newHTML: {
        type: "string",
        description: "The modified HTML content",
      },
    },
    required: ["oldHTML", "newHTML"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    try {
      const params = JSON.parse(input) as ToolInput;
      if (!params.oldHTML || !params.newHTML)
        throw new Error("Both oldHTML and newHTML are required");

      // First create basic diff
      const diff = diffChars(params.oldHTML, params.newHTML);
      let styledHTML = "";

      // Create a summary of changes for GPT-4 analysis
      const changes = diff
        .map((part) => {
          if (part.added) return `Added: "${part.value}"`;
          if (part.removed) return `Removed: "${part.value}"`;
          return null;
        })
        .filter(Boolean)
        .join("\n");

      // Use GPT-4 to analyze the changes and provide intelligent formatting
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing HTML changes. Given a set of changes, provide clear styling suggestions and explanations for the modifications. Focus on readability and visual clarity.",
          },
          {
            role: "user",
            content: `Analyze these HTML changes and suggest styling:\n${changes}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const analysis = completion.choices[0]?.message?.content || "";

      // Apply the styling with the original diff
      diff.forEach((part) => {
        if (part.added) {
          styledHTML += `<span style="color: #22c55e; opacity: 0.5;" title="Added content">${part.value}</span>`;
        } else if (part.removed) {
          styledHTML += `<span style="color: #ef4444; text-decoration: line-through;" title="Removed content">${part.value}</span>`;
        } else {
          styledHTML += part.value;
        }
      });

      // Add the analysis as a comment
      return `<!-- ${analysis} -->\n${styledHTML}`;
    } catch (error) {
      console.error("Error in createHTMLDiff tool:", error);
      throw new Error("Failed to create HTML diff");
    }
  },
};

export async function POST(req: Request) {
  try {
    const { messages, editorHTML } = await req.json();

    // Combine all user and assistant messages into a single string for the agent
    const conversation = messages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const agent = new Agent({
      name: "Assistant",
      instructions: `You are a helpful assistant with access to special tools. When responding:

1. If the request involves updating skills or knowledge:
   - Use the updateSkills tool
   - Return the updated information

2. If the request involves modifying editor content:
   - Analyze the current HTML content
   - Make requested modifications
   - Use createHTMLDiff tool to generate diff-styled HTML
   - Return both the new content and diff view

Always return a structured response as a JSON object with:
- response: Your explanation
- newEditorHTML: (optional) The modified content without diff styling
- diffEditorHTML: (optional) The content with diff styling showing changes`,
      model: "gpt-4.1",
      tools: [
        updateSkillsTool,
        createHTMLDiffTool,
      ] as FunctionTool<ToolInput>[],
    });

    const result = await run(
      agent,
      editorHTML
        ? `Editor Content:\n${editorHTML}\n\nConversation:\n${conversation}`
        : conversation
    );

    // Parse and structure the response
    try {
      const output = result.finalOutput || "";
      const jsonResponse = JSON.parse(output);

      const response: AssistantResponse = {
        role: "assistant",
        content: jsonResponse.response,
      };

      // Add HTML content if present
      if (jsonResponse.newEditorHTML) {
        response.newEditorHTML = jsonResponse.newEditorHTML;
        response.diffEditorHTML = jsonResponse.diffEditorHTML;
      }

      return NextResponse.json(response);
    } catch {
      // If not JSON, return as regular response
      return NextResponse.json({
        role: "assistant",
        content: result.finalOutput || "",
      } as AssistantResponse);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from OpenAI" },
      { status: 500 }
    );
  }
}
