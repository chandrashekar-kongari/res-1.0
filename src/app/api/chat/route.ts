import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";

export async function POST(req: Request) {
  try {
    const { messages, editorHTML } = await req.json();

    // Combine all user and assistant messages into a single string for the agent
    const conversation = messages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Include the editorHTML in the context with instructions about modifying it
    const prompt = editorHTML
      ? `Editor Content:
${editorHTML}

If you need to modify the editor content, return a JSON object with both 'response' and 'newEditorHTML' fields.
If no modifications are needed, just return your response as text.

Conversation:
${conversation}`
      : conversation;

    const agent = new Agent({
      name: "Assistant",
      instructions: `You are a helpful assistant. Respond to the user's request based on the conversation and, if provided, the editor's HTML content.

When the user's request involves modifying the editor content:
1. Analyze the current HTML content
2. Make the requested modifications
3. Return a JSON object with:
   - response: Your explanation of what changes were made
   - newEditorHTML: The complete modified HTML content

If no modifications are needed, simply return your response as text.`,
      model: "gpt-4.1",
    });

    const result = await run(agent, prompt);

    // Check if the response is JSON containing newEditorHTML
    let response;
    try {
      // Ensure we have a string before parsing
      const output = result.finalOutput || "";
      const jsonResponse = JSON.parse(output);
      if (jsonResponse.response && jsonResponse.newEditorHTML) {
        response = {
          role: "assistant",
          content: jsonResponse.response,
          newEditorHTML: jsonResponse.newEditorHTML,
        };
      }
    } catch {
      // If not JSON or doesn't have required fields, treat as regular response
      response = {
        role: "assistant",
        content: result.finalOutput || "",
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from OpenAI" },
      { status: 500 }
    );
  }
}
