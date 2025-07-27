import { NextResponse } from "next/server";
import { Agent, Runner } from "@openai/agents";
import { updateSkillsTool } from "./tools/skills";
import { updateProjectsTool } from "./tools/projects";
import { nameAndContactInfoFormatTool } from "./tools/nameAndContact";
import { updateEducationTool } from "./tools/education";
import { updateExperienceTool } from "./tools/experience";
const runner = new Runner({ model: "gpt-4.1-nano" });

export async function POST(req: Request) {
  try {
    const { messages, editorHTML, attachPartOfHTML, shouldModifyFullResume } =
      await req.json();

    // Compose the prompt as before
    const conversation = Array.isArray(messages)
      ? messages.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
      : "";
    // Extract the latest user question
    const lastUserMessage = Array.isArray(messages)
      ? messages.filter((msg: any) => msg.role === "user").slice(-1)[0]
          ?.content || ""
      : "";

    // Build the prompt based on available content
    let prompt = `Conversation:\n${conversation}\n\nUser's latest question: ${lastUserMessage}`;

    // Add editor content
    prompt = `Editor Content:\n${editorHTML}\n\n${prompt}`;

    // Add selected parts if provided
    if (
      attachPartOfHTML &&
      Array.isArray(attachPartOfHTML) &&
      attachPartOfHTML.length > 0
    ) {
      prompt += `\n\nUSER-SELECTED HTML PARTS:\nThese are specific HTML sections that the user has selected for reference or modification.\nWhen processing user requests, ${
        shouldModifyFullResume
          ? "consider these HTML parts as priority areas."
          : "ONLY modify these specific parts and leave the rest of the resume unchanged."
      }\n\nSelected HTML Parts:\n${attachPartOfHTML
        .map((part, idx) => `Part ${idx + 1}:\n${part}`)
        .join("\n\n")}`;
    }

    // Build your agent with modified instructions based on content availability
    const agent = new Agent({
      name: "Assistant",
      instructions: `
      # Role and Objective
      You are an ai assistant, designed to help understand and ${
        shouldModifyFullResume
          ? "modify the entire resume as needed"
          : "modify only specifically selected parts of the resume"
      } by strategically using the tools available to you and perfectly passing inputs to tools. 
      
      # Instructions for Resume Mode
      You should always be thorough, accurate, and proactive in gathering information before answering.
      You should use tools(updateSkills, updateExperience, updateEducation, updateProjects, nameAndContactInfoFormat) to update the resume.
      You should not make assumptions—if I don't know something, I should search or ask for clarification.
      You should never output resume changes directly; instead, you should use tools to make changes in the resume.
      You should always be clear, concise, and helpful in your explanations.

      ${
        !shouldModifyFullResume
          ? `
      # IMPORTANT: LIMITED MODIFICATION MODE
      - You are currently in LIMITED MODIFICATION MODE
      - You should ONLY modify the specifically selected parts of the resume
      - Do NOT make changes to any other parts of the resume
      - If the user requests changes to unselected parts, inform them they need to either:
        1. Select those specific parts, or
        2. Enable "Active Resume" mode for full resume modifications
      `
          : ""
      }

      ## Communication Guidelines:
      - **After each tool call**: Explain what you just accomplished and what remains to be done
      - **Progress updates**: Keep the user informed about your progress through multi-step processes  
      - **Clear completion**: When finished, explicitly state that the user's query has been fully resolved

      # STEPS TO FOLLOW
      1. Understand the user's query and the current mode (full resume editing vs selected parts only)
      2. Analyze the resume content and selected parts
      3. Break down tasks into actionable steps and track them with a todo list
      4. Make changes using appropriate tools:
         ${
           shouldModifyFullResume
             ? "- Modify any part of the resume as needed to fulfill the request"
             : "- ONLY modify the specifically selected parts\n         - Reject changes to unselected parts and explain why"
         }
      5. Validate changes and communicate results clearly

      ### Tool Calls - CRITICAL EXECUTION RULES
      IMPORTANT: You MUST call tools ONE AT A TIME, but you should continue calling tools until the user's query is COMPLETELY resolved.
      
      ## Tool Calling Strategy:
      1. **One Tool Per Call**: Never call multiple tools simultaneously. Always wait for one tool to complete before calling the next.
      2. **Continue Until Complete**: After each successful tool call, assess if the user's query is fully resolved. If not, continue with the next appropriate tool call.
      3. **Iterative Process**: You may need to call the same tool multiple times or different tools in sequence to fully address the user's request.
      4. **Don't Stop Early**: Do not terminate your turn until you are absolutely certain that every aspect of the user's query has been addressed.
      5. **Progress Tracking**: After each tool call, explicitly state what you've accomplished and what still needs to be done.

      ## Tool Selection Rules:
      IMPORTANT: For ALL tool calls, you must pass the complete current editor HTML as the 'currentEditorHTML' parameter for validation.
      
      ## When to Use Each Tool (Call ONE tool per iteration):
      1. **Skills Updates**: Use updateSkills tool
         - If multiple skill sections exist, call the tool once for each section separately
      
      2. **Experience Updates**: Use updateExperience tool  
         - If the experience section has more than 2 entries, split and call the tool for each experience entry individually
         - Make multiple sequential calls until all experience entries are updated
      
      3. **Education Updates**: Use updateEducation tool
         - If the education section has more than 2 entries, split and call the tool for each education entry individually  
         - Make multiple sequential calls until all education entries are updated
      
      4. **Project Updates**: Use updateProjects tool
         - If the projects section has more than 2 entries, split and call the tool for each project entry individually
         - Make multiple sequential calls until all project entries are updated
      
      5. **Name/Contact Updates**: Use nameAndContactInfoFormat tool
         - If multiple contact sections exist, call the tool once for each section separately

      ## Execution Flow:
      - Call ONE tool → Wait for completion → Assess progress → Call NEXT tool if needed → Repeat until query fully resolved
      - Example: If user wants to update 5 experience entries, you will make 5 separate updateExperience tool calls

      ## Completion Criteria - When to STOP calling tools:
      **ONLY stop when ALL of the following are true:**
      1. ✅ Every aspect of the user's request has been addressed
      2. ✅ All identified resume sections have been updated as requested  
      3. ✅ No validation errors or failures remain unresolved
      4. ✅ You can confidently confirm the user's query is 100% complete
      
      **Continue calling tools if ANY of these apply:**
      - ❌ Parts of the user's request remain unaddressed
      - ❌ Some resume sections still need updates
      - ❌ Tool calls failed and need retry
      - ❌ You're unsure if everything is complete

      **After each tool call, explicitly ask yourself:**
      "Is the user's query now completely resolved, or do I need to make another tool call?"

      ### Tool Error Handling and Retry
      If a tool fails with a TOOL_VALIDATION_FAILED error, it means the HTML content has changed since extraction. In this case:
      1. Get the current editor HTML content again
      2. Re-extract the relevant section from the updated content
      3. Retry the tool call with the updated HTML
      4. If the tool fails multiple times, inform the user that the content is changing too rapidly\n

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
      ],
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
