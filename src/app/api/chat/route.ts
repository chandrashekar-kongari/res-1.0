import { NextResponse } from "next/server";
import { Agent, Runner } from "@openai/agents";
import { updateSkillsTool } from "./tools/skills";
import { updateProjectsTool } from "./tools/projects";
import { nameAndContactInfoFormatTool } from "./tools/nameAndContact";
import { updateEducationTool } from "./tools/education";
import { updateExperienceTool } from "./tools/experience";
const runner = new Runner({ model: "gpt-4.1" });

export async function POST(req: Request) {
  try {
    const { messages, editorHTML, attachPartOfHTML } = await req.json();

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
      # Role and Objective
      You are an agent you will be tasked to solve the user's query about updating resume(in html format) by strategically using the tools available to you and perfectly passing inputs to tools. - please keep going until the user's query is completely resolved, Only terminate your turn when you are sure that the problem is solved.
     
      # Instructions
      When responding to the user, do NOT include or display any HTML code in your response. Only provide explanations, summaries, or answers in plain language. All HTML processing and code should be handled internally or via tools, but never shown directly to the user.
      Only call one tool at a time.

      ## Before calling a tool
      Your thinking should be thorough and you can think step by step before and after each function call, and contruct inputs for each tool. DO NOT send overlapping html to the tool, split the html into smaller parts and correctly pass to the tool, strategically split the html of the section that is to be updated and pass it to the tool.




      ### Tool Calls
      1. If the request involves updating skills:\n   - Use the updateSkills tool\n  
      2. If the request involves updating experience:\n   - Use the updateExperience tool\n  , If the experience section has more then 2 then split it into each experience section and pass to updateExperience tool and call it for each experience section\n
      3. If the request involves updating or formatting education:\n   - Use the updateEducation tool\n  , If the education section has more then 2 then split it into each education section and pass to updateEducation tool and call it for each education section\n
      4. If the request involves updating projects:\n   - Use the updateProjects tool\n  , If the projects section has more then 2 then split it into each project section and pass to updateProjects tool and call it for each project section\n
      6. If the request involves updating name and contact info format:\n   - Use the nameAndContactInfoFormat tool\n  , If the name and contact info format has more then 2 then split it into each name and contact info format section and pass to nameAndContactInfoFormat tool and call it for each name and contact info format section\n
      
      
      

      `,

      tools: [
        updateSkillsTool,
        updateExperienceTool,
        updateEducationTool,
        updateProjectsTool,
        nameAndContactInfoFormatTool,
      ], // Add your tools here
    });

    // Run the agent with streaming enabled
    const stream = await runner.run(agent, prompt, { stream: true });
    const encoder = new TextEncoder();

    // Simplified readable stream
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Process stream events
          for await (const event of stream) {
            try {
              // Forward each event as SSE
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            } catch (error) {
              console.error("Error forwarding event:", error);
              break;
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Stream processing failed",
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },

      cancel() {
        console.log("Client cancelled the stream");
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
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
