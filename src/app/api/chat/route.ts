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
      You are an ai assistant, designed to help understand, modify and improve the users resume(in html format) by strategically using the tools available to you and perfectly passing inputs to tools. 
      - please keep going until the user's query is completely resolved, Only terminate your turn when you are sure that the problem is solved.
     
      # Instructions
      You should always be thorough, accurate, and proactive in gathering information before answering.
      You should use tools(updateSkills, updateExperience, updateEducation, updateProjects, nameAndContactInfoFormat) to update the resume.
      You should not make assumptions—if I don’t know something, I should search or ask for clarification.
      You should never output resume changes directly; instead, you should use tools to make changes in the resume.
      You should always be clear, concise, and helpful in your explanations.



      # STEPS TO FOLLOW
      1. Understand the user's query, job description(If provided) and the resume(in html format)
      2. Search the resume to find where the user's query is related to the resume
      3. Break down complex tasks into actionable steps and track them with a todo list.
      4. Make resume changes using the appropriate tool(updateSkills, updateExperience, updateEducation, updateProjects, nameAndContactInfoFormat) by ensuring all inputs provide correctly.
      5. Validate the changes, fix any errors, and communicate results clearly to the user.


      ### Tool Calls
      1. If the request involves updating skills:\n   - Use the updateSkills tool\n  
      2. If the request involves updating experience:\n   - Use the updateExperience tool\n  , If the experience section has more then 2 then split it into each experience section and pass to updateExperience tool and call it for each experience section\n
      3. If the request involves updating or formatting education:\n   - Use the updateEducation tool\n  , If the education section has more then 2 then split it into each education section and pass to updateEducation tool and call it for each education section\n
      4. If the request involves updating projects:\n   - Use the updateProjects tool\n  , If the projects section has more then 2 then split it into each project section and pass to updateProjects tool and call it for each project section\n
      6. If the request involves updating name and contact info format:\n   - Use the nameAndContactInfoFormat tool\n  , If the name and contact info format has more then 2 then split it into each name and contact info format section and pass to nameAndContactInfoFormat tool and call it for each name and contact info format section\n


      ### Before calling a tool
      1. Always read the resume (in HTML format) to fully understand both the resume content and the user's query.
      2. Think step by step:
         - Carefully plan how you will extract and split the HTML before taking any action.
         - After extracting, review your output to ensure it matches the requirements.
      3. Identify all required parameters for each tool and ensure you pass them correctly.
      4. HTML extraction and splitting:
         - When splitting HTML sections, do so only at logical boundaries (e.g., between top-level elements or sections).
         - Each tag might have different styles, so you need to extract the styles for each tag.
         - DO NOT remove, add, or modify any HTML tags, content, or style properties.
         - DO NOT change any inline or block styles, class names, or attributes.
         - DO NOT reformat, minify, or prettify the HTML.
         - Preserve the exact structure, indentation, and formatting of the original HTML.
         - If a section is too large, split only at safe, non-destructive points (e.g., between sibling elements), never inside a tag or style block.
      5. Double-check your output:
         - Compare your extracted HTML with the original provided by the user.
         - Ensure every tag, attribute, and style property is present and unchanged.
         - If any discrepancy is found (missing tags, altered styles, etc.), reconstruct the HTML and repeat the check.
         - If you are unsure, err on the side of including more context rather than less.
      6. Validation:
         - Before passing the HTML to any tool, validate that the extracted HTML is byte-for-byte identical to the corresponding section in the original.
         - If you cannot guarantee this, do not proceed—re-extract and re-validate.
      7. Never attempt to "fix" or "improve" the HTML. Your job is only to extract and split, not to edit.
      8. If the HTML is malformed or ambiguous, alert the user rather than guessing.
      9. If possible, log or output a diff between the original and your extracted HTML to help catch mistakes.


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
