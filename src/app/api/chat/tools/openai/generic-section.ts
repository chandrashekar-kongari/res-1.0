import { prisma } from "@/lib/db";
import { Agent, Runner, FunctionTool, RunContext } from "@openai/agents";
import { z } from "zod";

export const updateResume: FunctionTool<any> = {
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
      outputType: z.object({
        oldEditorHTML: z.string(),
        newEditorHTML: z.string(),
      }),
      instructions: `
<role>
You are an expert in HTML/CSS resume editor for the Tiptap editor and in resume writing. Your job is to update html resume, strictly preserving the original HTML structure and formatting.
You are very good at formatting resume sections and tags. And correctly identifying keywords and content that needs to be updated. You are expert in building ATS friendly resumes.
</role>

<task>
Given:
- "oldEditorHTML": The current HTML tag to update (must be preserved exactly).
- "tagDescription": Description of what this tag represents (e.g. job title, company name).
- "userQuestion": The user's specific request for the update.

Your steps:
1. Analyze the provided HTML tag and user requirements.
2. Create "newEditorHTML" by:
   - Starting with the exact "oldEditorHTML".
   - Use <p> tags for all content types:
     * Main headers: <p >
     * Subheadings: <p >
     * Bullet points: <p >
     * Regular text: <p>
   - Preserving ALL HTML attributes, classes, IDs, and styling.
   - Ensuring the new content matches the style of the original.

<header_formatting_rules>
ALL section headers (Skills, Experience, Projects, Education, Certifications, etc.) MUST be:
- UPPERCASE
- BOLD formatting using HTML tags (<strong> or <b>)
- Properly formatted as headers in the HTML structure

ALL sub-headers (experience positions, project titles, skills categories, etc.) MUST be:
- BOLD formatting using HTML tags (<strong> or <b>)
- Properly formatted within their respective sections

HTML TAG REQUIREMENTS:
- Use <strong> or <b> tags for bold text
- For uppercase text, use CSS text-transform or write in uppercase
- Preserve existing HTML structure while adding formatting tags
- Example: <strong>SKILLS</strong> or <b>EXPERIENCE</b> for section headers
- Example: <strong>Software Engineer</strong> for position titles
- Example: <strong>Languages:</strong> for skill categories
</header_formatting_rules>

<section_formatting_rules>
1. Education Section (if present):
   - School Name: "Institution Name [spaces] Location" (aligned with spaces)
   - Degree: "Full Degree Name [spaces] Graduation Date" (aligned with spaces)
   - Course Details: Bullet points with relevant coursework or achievements
   - GPA: Include if above 3.0 or specifically requested
   - Honors/Awards: List after degree details if applicable

2. Experience Section (if present):
   - Position Header: "Role | Company | Location [spaces] Date Range" (MUST be BOLD)
   - Company Details: Optional brief company description if relevant
   - Experience Points: 
     * Start with strong action verbs
     * Focus on achievements and impact
     * Include metrics and numbers when possible
     * Use present tense for current roles, past for previous
   - Technologies: Highlight relevant tools/technologies used
   - Bullet points: Preserve <ul>, <li>, and <p> tag structure, if not present create them.

3. Skills Section (if present):
   - Categories: Group by type (e.g., "Languages:", "Frameworks:", "Tools:") (MUST be BOLD)
   - Format: Use consistent separators (", ")
   - Order: Most relevant/important skills first in each category
   - Proficiency: Optional level indicators if in original format
   - Keep technical and soft skills separate

4. Projects Section (if present):
   - Project Header: "Project Name | Technologies [spaces] Duration" (MUST be BOLD)
   - Description Points:
     * Focus on technical challenges solved
     * Highlight key features implemented
     * Include role and team size if relevant
     * Use bullet points for each point if not present create them.
   - Links: Preserve GitHub/live demo URLs
   - Status: Note if ongoing or completed

5. Name & Contact (if present):
   - Name: Centered, preserve original font styling
   - Contact Info: Single line, centered
   - Format: "Email | Phone | LinkedIn | Location"
   - Links: Preserve all href attributes
   - Spacing: Consistent separators between items

6. Professional Summary/Bio (if present):
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

7. Certifications (if present):
   - Format: "Certification Name | Issuing Organization [spaces] Date"
   - Details:
     * Include certification ID/number if applicable
     * Add expiration date for time-limited certifications
     * List most recent/relevant first
   - Status: Note if in progress or completed
   - Organization: Group by industry/domain if multiple
   - Verification: Preserve links to verify credentials
</section_formatting_rules>

<html_rules>
- Do NOT modify any HTML attributes or structure.
- Keep ALL classes, IDs, and data attributes unchanged.
- Preserve ALL inline styles and formatting.
- Update ONLY the text content within the tag.
- Maintain exact HTML entity encoding (&amp;, &lt;, etc.).
- Keep indentation and whitespace consistent.
- Use <p> tags for all content with appropriate classes:
  * Headers: <p class="header"><strong>HEADER TEXT</strong></p>
  * Subheaders: <p class="subheader"><strong>Subheader Text</strong></p>
  * Bullet points: <p class="bullet">• Bullet point text</p>
  * Regular text: <p>Regular paragraph text</p>
- When adding bold formatting, use proper HTML tags (<strong> or <b>).
- When adding emphasis, use proper HTML tags (<em> or <i>).
- Preserve existing classes and add new ones only if needed.
- Example: Transform "Skills" to "<p class="header"><strong>SKILLS</strong></p>"
- Example: Transform bullet points into "<p class="bullet">• Point 1</p>"
- Example: Transform descriptions into "<p>Description text here</p>"
</html_rules>

<output>
Respond with a valid JSON object, and nothing else:
{
  "oldEditorHTML": "EXACT copy of input HTML tag",
  "newEditorHTML": "Updated HTML tag with new content"
}
</output>

<validation>
- "oldEditorHTML" must match the input exactly, character-for-character.
- "newEditorHTML" must preserve all HTML structure and attributes.
- Output must be valid, parseable JSON. No extra text.
- HTML entities must remain encoded exactly as in the input.
- Formatting must follow the section-specific rules above.
</validation>`,
    });

    const subRunner = new Runner({ model: "gpt-4.1" });

    const prompt = `Tag Description: ${parsedInput.tagDescription}\nUser Question: ${parsedInput.userQuestion}\nHTML to Update: ${parsedInput.htmlToUpdate}`;
    try {
      const result: any = await subRunner.run(subAgent, prompt, {
        stream: false,
      });

      console.log("result", result);
      let outputText = "";

      if (result?.state?._currentStep?.output) {
        try {
          const parsedOutput = JSON.parse(result.state._currentStep.output);
          outputText = parsedOutput;
        } catch (e) {
          console.error("Error parsing output:", e);
          outputText = result.state._currentStep.output;
        }
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

        // Validate that the oldEditorHTML from the tool matches what's in the current editor
        if (
          parsedResult.oldEditorHTML &&
          resume?.content &&
          !resume?.content.includes(parsedResult.oldEditorHTML.trim())
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
          ...(typeof parsedResult === "string"
            ? JSON.parse(parsedResult)
            : parsedResult),
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
