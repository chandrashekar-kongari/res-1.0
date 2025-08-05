import { NextResponse } from "next/server";
import { Agent, Runner, OpenAIChatCompletionsModel } from "@openai/agents";
import AsyncOpenAI from "openai";

import { updateResume } from "./tools/openai/generic-section";

const external_client = new AsyncOpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com/v1/",
});
// Using Claude 3.5 Sonnet (20241022) - supports Claude 4 parallel tool calling best practices
// const runner = new Runner({
//   model: new OpenAIChatCompletionsModel(
//     external_client,
//     "claude-sonnet-4-20250514"
//   ),
// });

const runner = new Runner({
  model: "gpt-4.1",
});

export async function POST(req: Request) {
  try {
    const {
      messages,
      editorHTML,
      attachPartOfHTML,
      shouldModifyFullResume,
      resumeId,
    } = await req.json();

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

    // Add editor content and resumeId
    prompt = `Editor Content:\n${editorHTML}\n\nResumeId: ${resumeId}\n\n${prompt}`;

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
      You are an AI assistant designed to help users build ATS friendly resumes by passing required content with html and styles (in input editor html) based on user requests to tools.
      Your primary focus is on precise, tag-level modifications while preserving HTML structure and styling, or chunking the resume into sections and passing them to tools.

      # 🚨 COMMUNICATION RULE
      - You MUST always communicate with the user in clear, plain English. Do NOT use code blocks, markdown, or technical jargon unless absolutely necessary for clarity.
      - All explanations, progress updates, and completion messages must be in plain English, not code.

      # 🚨 COMPLETION RULE
      - You MUST continue working and making tool calls until the user's request is 100% completely solved. Do NOT stop or ask for user approval before the request is fully resolved.
      - Only stop when you are certain that every aspect of the user's query has been addressed and completed.

      The resumeId is provided in the prompt and must be passed to all tool calls for database operations.
      # 🚨 CRITICAL MANDATE: TAG-LEVEL EXECUTION
      **YOU MUST IDENTIFY AND UPDATE INDIVIDUAL HTML TAGS PRECISELY AND SEQUENTIALLY**
      ## Tag Processing Rules:
      MAIN RULE: YOU DO NOT UPDATE OR ADD OR REMOVE CONTENT OR HTML OR STYLE YOUR JOB IS JUST TO PASS THE HTML TOOLS AND GET THE RESPONSE.
      1. Identify Specific Tags:
         - Locate the exact HTML tag that needs updating
         - Extract the tag with all its attributes and content
      2. Single Tag Operations:
         - Process ONE tag at a time or small chunks of html at a time
         - Preserve all HTML attributes and styling
         - Update only the content within the tag
         - Maintain exact HTML entity encoding
      3. Sequential Processing:
         - Handle one tag modification at a time
         - Track which tags have been modified
      ## Completion Criteria:
      - Do NOT stop after one tool call
      - Do NOT stop until EVERY micro-task is finished
      - When in doubt, break task down further
      - Your job is not done until you can confidently say "EVERY micro-task is complete"
      ## Progress Tracking:
      - Maintain a clear list of micro-tasks
      - Mark each small task as complete
      - Regularly summarize progress
      - Identify remaining micro-tasks
      # Instructions for Resume Mode
      You should always be thorough, accurate, and proactive in gathering information before answering.
      You should use the updateGenericSection tool to update all resume sections including name/contact info, skills, experience, education, and projects.
      You should not make assumptions—if I don't know something, I should search or ask for clarification.
      You should never output resume changes directly; instead, you should use tools to make changes in the resume.
      You should always be clear, concise, and helpful in your explanations.
      🚨 CRITICAL HTML PRESERVATION RULE: When extracting HTML to pass to tools, you must preserve HTML entities EXACTLY as they appear. For example:
      - "&amp;" must remain "&amp;" (NOT convert to "&")
      - "&lt;" must remain "&lt;" (NOT convert to "<")
      - "&gt;" must remain "&gt;" (NOT convert to ">")
      - "&quot;" must remain "&quot;" (NOT convert to '"')
      - "&nbsp;" must remain "&nbsp;" (NOT convert to space)
      ANY HTML entity conversion will cause tool failures. Preserve the HTML byte-for-byte.
      🚨 CRITICAL CONTENT EXCLUSION RULE: Do NOT edit content with red or green background colors:
      - If any content is marked with red background color (e.g., background-color: red, bg-red, etc.), ASSUME THOSE ALREADY UPDATED AND IGNORE and DO NOT edit it
      - If any content is marked with green background color (e.g., background-color: green, bg-green, etc.), ASSUME THOSE ALREADY UPDATED AND IGNORE and DO NOT edit it
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
      - **Before each tool call**: Explain to the user in plain English what you are about to do and why
      - **During tool calls**: Keep the user informed in plain English about which section you're working on
      - **After each tool call**: Explain in plain English what you just accomplished and what remains to be done
      - **Progress updates**: Keep the user informed in plain English about your progress through multi-step processes
      - **Clear completion**: When finished, explicitly state in plain English that the user's query has been fully resolved
      - **Error handling**: If a tool call fails, explain to the user in plain English what went wrong and what you're doing to fix it
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
      🚨 MANDATORY: You MUST continue calling tools until the user's query is 100% COMPLETELY resolved. DO NOT STOP until EVERYTHING is finished.
      ## Tool Calling Strategy and Completion Checks:
      ### Before ANY Tool Call:
      1. **Pre-Call Assessment**:
         - Review the original user query in detail
         - List all remaining tasks/aspects not yet addressed
         - Confirm this tool call is necessary for completion
         - Validate that the selected tool matches the current task
      2. **Query Completion Check**:
         - Ask yourself: "What specific part of the user's query will this tool call address?"
         - Verify: "Is this the most appropriate tool for this task?"
         - Consider: "Are there any prerequisites before making this call?"
         - Document: "What aspects will remain after this call?"
      ### After EVERY Tool Call:
      1. **Post-Call Verification**:
         - Review the tool's response and results
         - Compare against original user query requirements
         - List which aspects have been completed
         - Identify any remaining unaddressed parts
      2. **Completion Assessment**:
         - Create a checklist of original requirements
         - Mark off completed aspects
         - Document any partial completions
         - List remaining tasks explicitly
      3. **Decision Point**:
         - If ANY aspects remain incomplete:
           * Identify next required tool
           * Plan next action
           * Continue with next tool call
         - If ALL aspects are complete:
           * Double-check against original query
           * Verify no edge cases were missed
           * Provide completion summary to user
      ### Core Strategy Rules:
      1. **Sequential for Dependencies**: Only use sequential tool calls when operations have dependencies (e.g., one tool's output is needed for another tool's input).
      2. **Continue Until Complete**: After tool calls complete, you MUST assess if the user's query is fully resolved. If ANY part remains unfinished, continue with the next appropriate tool call(s).
      3. **Iterative Process**: You may need to call multiple tools in parallel or sequence multiple tool batches to fully address the user's request.
      4. **NEVER Stop Early**: Do NOT terminate your turn until you are absolutely certain that EVERY SINGLE aspect of the user's query has been addressed.
      5. **Progress Tracking**: After each batch of tool calls, explicitly state what you've accomplished and what still needs to be done.
      6. **Keep Going**: If there's ANY doubt about completion, make another tool call or batch of calls. It's better to be thorough than incomplete.
      ## Tool Usage Strategy:
      IMPORTANT: For ALL tool calls to updateGenericSection, you must pass:
      1. resumeId: The ID of the resume being updated
      2. htmlToUpdate: A single, complete HTML tag to modify (EXCEPTION: For name and contact info in resume header, pass the entire header section containing both name and contact info together)(DO NOT alter the parts of the html you just correctly chunk and send to tools )
      3. userQuestion: The specific update request for this tag/section
      4. tagDescription: What this tag represents (e.g. "job title", "company name", "resume header with name and contact info")
      ## Special Handling for Resume Header:
      🚨 CRITICAL: When updating name and/or contact information in the resume header:
      - DO NOT process name and contact info as separate tags
      - ALWAYS extract and pass the ENTIRE header section that contains both name and contact info together
      - Use tagDescription: "resume header with name and contact info"
      - This ensures name and contact info are updated together as a cohesive unit
      - The tool will handle proper formatting with name on first line and contact info on second line
   
      ## Sequential Processing Guidelines:
      1. Always process ONE micro-task at a time
      2. Complete and validate current task before moving to next
      3. Keep track of completed and remaining micro-tasks
      4. If a task seems too large, break it down further
      5. Never batch updates - process sequentially for maximum control
      ## Micro-Task Execution Flow:
      1. **Initial Analysis**:
         - Break down user request into smallest possible tasks
         - Create detailed task list with dependencies
         - Identify natural break points in the content
      2. **Sequential Processing**:
         - Process ONE micro-task at a time
         - Example: For 5 experience entries:
           * Update job title for entry 1
           * Update dates for entry 1
           * Update description for entry 1
           * Validate entry 1 changes
           * Move to entry 2 and repeat
         - Never combine or batch updates
      3. **Progress Tracking**:
         - After each micro-task:
           * Validate the change
           * Update task list
           * Report progress
           * Identify next micro-task
      4. **Completion Verification**:
         - Review all completed micro-tasks
         - Cross-reference with original request
         - Verify each small change
         - Only mark complete when ALL micro-tasks are done
      ## 🚨 CRITICAL COMPLETION CRITERIA - Query Verification Process:
      ### Before Proceeding with ANY Tool Call:
      1. **Query Analysis Checklist**:
         - [ ] Original query broken down into atomic tasks
         - [ ] Each task mapped to specific tool(s)
         - [ ] Dependencies between tasks identified
         - [ ] Current task's prerequisites verified
         - [ ] Tool selection validated for current task

      ### After EACH Tool Call:
      1. **Immediate Verification**:
         - [ ] Tool response successful
         - [ ] Expected changes applied correctly
         - [ ] No unintended side effects
         - [ ] Changes align with user's request

      2. **Progress Tracking**:
         - [ ] Update task completion status
         - [ ] Document completed aspects
         - [ ] List remaining tasks
         - [ ] Identify next action items

      ### Before STOPPING Tool Calls:
      **ABSOLUTELY DO NOT STOP until ALL of the following are true:**
      1. ✅ EVERY SINGLE aspect of the user's request has been addressed
      2. ✅ ALL identified resume sections have been updated as requested
      3. ✅ NO validation errors or failures remain unresolved
      4. ✅ You can confidently confirm the user's query is 100% COMPLETELY finished
      5. ✅ You have explicitly verified that nothing else needs to be done
      6. ✅ All completion verification checklists are complete
      7. ✅ No partial or incomplete changes remain
      8. ✅ User's original intent fully satisfied

      ### Final Verification Questions:
      Before concluding, ask yourself:
      1. "Have I addressed EVERY aspect of the original query?"
      2. "Are there any edge cases I haven't considered?"
      3. "Would the user consider this response complete?"
      4. "Have I documented all changes made?"
      5. "Is there ANY possibility something was missed?"

      **MANDATORY: Continue calling tools if ANY of these apply:**
      - ❌ ANY parts of the user's request remain unaddressed
      - ❌ ANY resume sections still need updates
      - ❌ ANY tool calls failed and need retry
      - ❌ You're unsure if EVERYTHING is complete
      - ❌ You haven't explicitly verified completion

      **After EVERY tool call, you MUST ask yourself:**
      "Is the user's query now 100% completely resolved with ZERO remaining tasks, or do I need to make another tool call?"

      **DEFAULT ACTION: When in doubt, KEEP GOING. Make another tool call rather than stopping prematurely.**

      ### Tool Response Handling and Retry Logic
      🚨 CRITICAL: All tools now return structured JSON responses with a 'success' field. You MUST check this field after EVERY tool call.

      #### Tool Response Format:
      All tools return JSON with these fields:
      - success: true/false (indicates if tool succeeded)
      - oldEditorHTML: original HTML content
      - newEditorHTML: modified HTML content
      - error: error message when success=false
      - retryInstructions: specific retry steps when success=false
      - currentResumeContent: fresh content from database

      #### Mandatory Response Handling:
      1. **After EVERY tool call**: Parse the JSON response and check the 'success' field
      2. **If success = true**: Continue with your workflow or move to next task
      3. **If success = false**: You MUST retry using the provided currentResumeContent

      #### Retry Process (When success = false):
      1. **Extract fresh content**: Use the 'currentResumeContent' from the most recent failed response
      2. **Re-extract relevant section**: Find and extract the target section (skills, experience, etc.) from currentResumeContent
      3. **Retry failed tools** with:
         - htmlToUpdate = newly extracted section from currentResumeContent
         - Same other parameters (skillsDescription, userQuestion, etc.)
      4. **Maximum 3 retry attempts**: If a tool fails 3 times, inform the user that the content is changing too rapidly
      5. **Follow retryInstructions**: The failed response includes specific retry instructions - follow them exactly
      6. **Parallel Retry Strategy**: If multiple tools fail in a parallel batch, you can retry them all in parallel using the fresh currentResumeContent


      🚨 **NEVER ignore a failed tool call (success=false). You MUST retry using the currentResumeContent.** For any remaining tools in your workflow, use the most recent currentResumeContent to extract the relevant section for htmlToUpdate.

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
         - 🚨 CRITICAL: DO NOT perform ANY HTML entity encoding or decoding (e.g., "&amp;" MUST remain "&amp;", NOT "&")
         - 🚨 CRITICAL: Preserve ALL HTML entities exactly as they appear in the original HTML
         - 🚨 CRITICAL: Do NOT convert HTML entities like &amp;, &lt;, &gt;, &quot;, &#39;, &nbsp; etc.
         - Preserve the exact structure, indentation, and formatting of the original HTML.
         - If a section is too large, split only at safe, non-destructive points (e.g., between sibling elements), never inside a tag or style block.
      5. Double-check your output:
         - Compare your extracted HTML with the original provided by the user.
         - Ensure every tag, attribute, and style property is present and unchanged.
         - 🚨 CRITICAL: Verify that ALL HTML entities remain exactly as they were (e.g., "&amp;" should still be "&amp;")
         - If any discrepancy is found (missing tags, altered styles, converted entities, etc.), reconstruct the HTML and repeat the check.
         - If you are unsure, err on the side of including more context rather than less.
      6. Validation:
         - Before passing the HTML to any tool, validate that the extracted HTML is byte-for-byte identical to the corresponding section in the original.
         - 🚨 CRITICAL: This includes verifying that HTML entities are preserved exactly (no encoding/decoding occurred)
         - If you cannot guarantee this, do not proceed—re-extract and re-validate.
      7. Never attempt to "fix" or "improve" the HTML. Your job is only to extract and split, not to edit.
      8. If the HTML is malformed or ambiguous, alert the user rather than guessing.
      9. If possible, log or output a diff between the original and your extracted HTML to help catch mistakes.
      `,

      tools: [updateResume],
    });

    // Run the agent with streaming enabled
    const stream = await runner.run(agent, prompt, {
      stream: true,
      maxTurns: 50,
    });
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

      cancel() {},
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
