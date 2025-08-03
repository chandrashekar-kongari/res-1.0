import { prisma } from "@/lib/db";
import {
  Agent,
  Runner,
  FunctionTool,
  RunContext,
  OpenAIChatCompletionsModel,
} from "@openai/agents";
import { z } from "zod";
import AsyncOpenAI from "openai";

export const updateGenericSectionTool: FunctionTool<any> = {
  type: "function",
  name: "updateGenericSection",
  description:
    "Updates a single HTML tag in the resume based on user's request",
  parameters: {
    type: "object",
    properties: {
      htmlToUpdate: {
        type: "string",
        description:
          "The HTML tag to update (must be a complete, valid HTML tag)",
      },
      tagDescription: {
        type: "string",
        description:
          "Description of what this tag represents (e.g. 'job title', 'company name', 'skill category')",
      },
      userQuestion: {
        type: "string",
        description: "The user's request/question about what to update",
      },
      resumeId: {
        type: "string",
        description: "The ID of the resume being edited",
      },
    },
    required: ["htmlToUpdate", "tagDescription", "userQuestion", "resumeId"],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  invoke: async (_context: RunContext<unknown>, input: string) => {
    const parsedInput = JSON.parse(input) as {
      htmlToUpdate: string;
      tagDescription: string;
      userQuestion: string;
      resumeId: string;
    };

    // Create a sub-agent for this tool
    const subAgent = new Agent({
      name: "GenericTagUpdater",
      instructions: `
<role>
You are an expert HTML/CSS resume editor for the Tiptap editor. Your job is to update a single HTML tag in a resume, strictly preserving the original HTML structure and formatting.
</role>

<task_overview>
You will receive HTML content and must:
1. Preserve the original HTML exactly as "oldEditorHTML"
2. Create an updated version as "newEditorHTML" with content modifications
</task_overview>

<input_requirements>
- Tag description: Context for what this tag represents
- User question: Specific request for the update
- HTML to update: The exact HTML content to modify
</input_requirements>

<modification_guidelines>
<section_formatting_rules>
1. Education Section:
   - School Name: "Institution Name [spaces] Location" (aligned with spaces)
   - Degree: "Full Degree Name [spaces] Graduation Date" (aligned with spaces)
   - Course Details: Bullet points with relevant coursework or achievements
   - GPA: Include if above 3.0 or specifically requested
   - Honors/Awards: List after degree details if applicable

2. Experience Section:
   - Position Header: "Role | Company | Location [spaces] Date Range"
   - Company Details: Optional brief company description if relevant
   - Experience Points: 
     * Start with strong action verbs
     * Focus on achievements and impact
     * Include metrics and numbers when possible
     * Use present tense for current roles, past for previous
   - Technologies: Highlight relevant tools/technologies used
   - Bullet points: Preserve <ul>, <li>, and <p> tag structure, if not present create them.

3. Skills Section:
   - Categories: Group by type (e.g., "Languages:", "Frameworks:", "Tools:")
   - Format: Use consistent separators (", ")
   - Order: Most relevant/important skills first in each category
   - Proficiency: Optional level indicators if in original format
   - Keep technical and soft skills separate

4. Projects Section:
   - Project Header: "Project Name | Technologies [spaces] Duration"
   - Description Points:
     * Focus on technical challenges solved
     * Highlight key features implemented
     * Include role and team size if relevant
     * Use bullet points for each point if not present create them.
   - Links: Preserve GitHub/live demo URLs
   - Status: Note if ongoing or completed

5. Name & Contact:
   - Name: Centered, preserve original font styling
   - Contact Info: Single line, centered
   - Format: "Email | Phone | LinkedIn | Location"
   - Links: Preserve all href attributes
   - Spacing: Consistent separators between items

6. Professional Summary/Bio:
   - Length: 2-4 concise sentences
   - Content Structure:
     * First part: Professional identity/current role
     * Middle: Key expertise and specializations
     * End: Career goals or value proposition
   - Style:
     * Write in first person
     * Use present tense
     * Avoid personal pronouns
   - Format: Single paragraph, no bullet points
   - Keywords: Include relevant industry terms
   - Tone: Professional and confident

7. Certifications:
   - Format: "Certification Name | Issuing Organization [spaces] Date"
   - Details:
     * Include certification ID/number if applicable
     * Add expiration date for time-limited certifications
     * List most recent/relevant first
   - Status: Note if in progress or completed
   - Organization: Group by industry/domain if multiple
   - Verification: Preserve links to verify credentials
</section_formatting_rules>

<html_structure_rules>
- Preserve all existing HTML structure and attributes
- Do NOT modify any HTML attributes or structure
- Keep ALL classes, IDs, and data attributes unchanged
- Preserve ALL inline styles and formatting
- Update ONLY the text content within the tag
- Maintain exact HTML entity encoding (&amp;, &lt;, etc.)
- Keep indentation and whitespace consistent
- For bullet points, preserve <ul>, <li>, and <p> tag structure
</html_structure_rules>
</modification_guidelines>

<step_by_step_process>
<step_1>
Carefully analyze the provided HTML content and user requirements.
Identify what needs to be updated based on the tag description and user question.
</step_1>

<step_2>
Create newEditorHTML by:
- Starting with the exact HTML content
- Updating ONLY the content within the tag based on user request
- Preserving ALL HTML attributes, classes, IDs, and styling
- Ensuring the new content matches the style of the original
</step_2>
</step_by_step_process>

<critical_constraints>
- oldEditorHTML MUST be returned exactly as received with zero modifications
- newEditorHTML MUST preserve all HTML structure and attributes
- Output MUST be valid, parseable JSON
- No explanatory text outside the JSON structure
- HTML entities must remain encoded exactly as in the input
- Formatting must follow the section-specific rules above
</critical_constraints>

<output_format>
Your response must be EXACTLY this JSON structure with no additional text:

{
  "oldEditorHTML": "EXACT copy of received HTML with no changes whatsoever",
  "newEditorHTML": "Updated HTML tag with new content"
}
</output_format>

<quality_checks>
Before outputting, verify:
1. oldEditorHTML matches input exactly (character-for-character)
2. newEditorHTML preserves all HTML structure and attributes
3. JSON is valid and parseable
4. No content is lost or corrupted in any version
5. HTML entities remain encoded exactly as in the input
</quality_checks>

CRITICAL: Output only the JSON object. No reasoning, explanations, or additional text.
`,
    });

    const external_client = new AsyncOpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://api.anthropic.com/v1/",
    });
    const runner = new Runner({
      model: new OpenAIChatCompletionsModel(
        external_client,
        "claude-3-5-sonnet-20241022"
      ),
    });

    const prompt = `Tag Description: ${parsedInput.tagDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result: any = await runner.run(subAgent, prompt, {
        stream: false,
      });

      let outputText = "";

      // Handle Claude's specific output structure
      if (result?.state?._currentStep?.output) {
        outputText = result.state._currentStep.output;
      } else if (result && typeof result === "object" && "output" in result) {
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

      // Get current resume content from database
      const resume = await prisma.resume.findUnique({
        where: {
          id: parsedInput.resumeId,
        },
        select: {
          content: true,
        },
      });

      // Parse the result to validate oldEditorHTML
      try {
        const parsedResult = outputText as any;

        // Parse the Claude output (should be a JSON string from _currentStep.output)
        let res;
        try {
          res =
            typeof parsedResult === "string"
              ? JSON.parse(parsedResult)
              : parsedResult;
        } catch (parseErr: any) {
          console.error("Failed to parse Claude output:", parseErr);
          throw new Error(
            `Invalid JSON from Claude: ${
              parseErr.message || "Unknown parsing error"
            }`
          );
        }

        // Validate that the oldEditorHTML from the tool matches what's in the current editor
        if (
          res.oldEditorHTML &&
          resume?.content &&
          !resume?.content.includes(res.oldEditorHTML.trim())
        ) {
          // Tool failed - return failure response with current resume content
          return JSON.stringify({
            success: false,
            oldEditorHTML: parsedInput.htmlToUpdate,
            newEditorHTML: parsedInput.htmlToUpdate,
            error: `TOOL_VALIDATION_FAILED: The HTML tag to be updated was not found in the current editor. This likely means the editor content has changed since the tool was called. 

RETRY REQUIRED: Use the currentResumeContent provided below to find the correct tag and retry the tool call.

Current Resume Content: ${resume?.content}
`,
            retryInstructions:
              "Find the target tag in currentResumeContent and retry the updateGenericSection tool with: 1) htmlToUpdate = tag from currentResumeContent, 2) same tagDescription and userQuestion",
            currentResumeContent: resume?.content || "",
          });
        }

        // Success case - add success flag and current resume content
        const successResult = {
          success: true,
          ...res,
          currentResumeContent: resume?.content || "",
        };

        return JSON.stringify(successResult);
      } catch (parseError: any) {
        // Return failure response with current resume content
        return JSON.stringify({
          success: false,
          oldEditorHTML: parsedInput.htmlToUpdate,
          newEditorHTML: parsedInput.htmlToUpdate,
          error: `Failed to parse tool output: ${parseError.message}. RETRY REQUIRED: Use the currentResumeContent below and retry the tool call.`,
          retryInstructions:
            "Find the target tag in currentResumeContent and retry the updateGenericSection tool with: 1) htmlToUpdate = tag from currentResumeContent, 2) same tagDescription and userQuestion",
          currentResumeContent: resume?.content || "",
        });
      }
    } catch (error: any) {
      // Get current resume content even in error case
      let currentResumeContent = "";
      try {
        const resume = await prisma.resume.findUnique({
          where: {
            id: parsedInput.resumeId,
          },
          select: {
            content: true,
          },
        });
        currentResumeContent = resume?.content || "";
      } catch (dbError) {}

      // Return error response instead of throwing
      return JSON.stringify({
        success: false,
        oldEditorHTML: parsedInput.htmlToUpdate,
        newEditorHTML: parsedInput.htmlToUpdate,
        error: `Generic section update tool failed: ${
          error.message || "Unknown error"
        }`,
        currentResumeContent: currentResumeContent,
      });
    }
  },
};
