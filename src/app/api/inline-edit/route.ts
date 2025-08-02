import { OpenAIChatCompletionsModel } from "@openai/agents";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, context, position, fullResumeContent } = await request.json();

    const jobDescription = `About Your Contributions

About your contributions:
Work in a full-stack web development environment consisting of html, javascript, css, and java.
Integrate and develop mobile application ad solutions using ReactNative, iOS SDK and Android SDK technologies.
Build out ad-tech integrations for our server-rendered sites, and mobile applications, partnering with consumer facing teams to develop innovative advertising solutions to increase user engagement and drive revenue.
Integrate audience and content intelligence platforms to explore new avenues of engagement and growth.
Experiment with upcoming ad technologies; use metrics and data analytics to make informed recommendations to the business.

About You

2+ years of experience with Javascript is required, with a preference for vanilla Javascript (ES6+). Experience with Java and NodeJS is a plus.
Experience with mobile-development technologies, including ReactNative, Swift (iOS), and Kotlin (Android).
1+ years of experience in the programmatic advertising ecosystem; with IAB Standards such as OpenRTB, OpenDirect, and VAST; and with industry concepts like header bidding.
Experience with mobile-development technologies, including ReactNative, IOS SDK, and Android SDK, PostgreSQL, MongoDB, Redis, is preferred but not required.
Demonstrated ability in working with APIs, and integration of APIs into backend and frontend solutions.
Experience with Agile/Scrum methodologies and tools, including Git, Jira, planning poker, etc.`;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Use fullResumeContent if available, otherwise fall back to context
    const completeResumeText = fullResumeContent || context || text;

    // Detect if this is a bullet point or list item
    const isBulletPoint =
      /^[\s]*[-•*]\s/.test(text) || /^[\s]*\d+\.\s/.test(text);
    const isIncompleteText =
      text.trim().length > 0 &&
      !text.trim().endsWith(".") &&
      !text.trim().endsWith("!") &&
      !text.trim().endsWith("?");
    const isVeryShort = text.trim().length < 5;
    const isJustBulletSymbol =
      /^[\s]*[-•*]\s*$/.test(text) || /^[\s]*\d+\.\s*$/.test(text);

    const prompt = `
    
You are an Resume writing assistant. You suggest improvements based on the job description and the resume. Be EXTREMELY MINIMAL - suggest only the specific word or phrase that needs to be changed. Never rewrite entire sentences unless absolutely necessary.

Current text being edited: "${text}"
Full resume content: "${completeResumeText}"
Is bullet point: ${isBulletPoint}
Is incomplete: ${isIncompleteText}
Job description: "${jobDescription}"

CRITICAL RULES - BE MINIMAL AND AVOID DUPLICATES:
1. If text is fine, return "NO_SUGGESTION"
2. If only ONE WORD is wrong (spelling, grammar), suggest ONLY that word
3. If only a PHRASE needs completing, suggest ONLY the missing phrase
4. NEVER rewrite entire sentences when only part needs fixing
5. For bullet points, only suggest the missing/wrong part, not the whole bullet
6. Suggest the SHORTEST possible improvement
7. NEVER suggest keywords, skills, or technologies that ALREADY EXIST elsewhere in the resume
8. NEVER suggest company names, job titles, or specific experiences that are already mentioned in the resume
9. If a skill or technology from the job description is already mentioned anywhere in the resume, DO NOT suggest it again
10. Only suggest additions if they are truly missing and would add unique value
11. Before suggesting anything, check if it's already present in the full resume content
12. Prioritize grammar/spelling fixes over content additions
13. If the current text already contains relevant keywords from the job description, focus only on grammar/style improvements

DUPLICATE CHECK INSTRUCTIONS:
- Before suggesting any skill, technology, or keyword, scan the full resume content to ensure it's not already mentioned
- If suggesting a completion or addition, ensure the content doesn't duplicate existing information
- Focus on improving what's there rather than adding redundant content


Response format options:

1. WORD_REPLACEMENT (for single word fixes):
   Format: "TYPE:WORD_REPLACEMENT\nORIGINAL_WORD:wrong_word\nSUGGESTION:correct_word"

2. PHRASE_COMPLETION (for completing incomplete thoughts):
   Format: "TYPE:PHRASE_COMPLETION\nSUGGESTION:missing_phrase"

3. PHRASE_REPLACEMENT (for fixing a specific phrase):
   Format: "TYPE:PHRASE_REPLACEMENT\nORIGINAL_PHRASE:wrong_phrase\nSUGGESTION:correct_phrase"

4. NO_SUGGESTION (when nothing needs fixing):
   Format: "NO_SUGGESTION"

Examples:

Text: "I am good at programing"
Response: TYPE:WORD_REPLACEMENT\nORIGINAL_WORD:programing\nSUGGESTION:programming

Text: "• Experienced in"
Response: TYPE:PHRASE_COMPLETION\nSUGGESTION:web development

Text: "The project went very good"
Response: TYPE:WORD_REPLACEMENT\nORIGINAL_WORD:good\nSUGGESTION:well

Text: "I graduated from Stanford."
Response: NO_SUGGESTION

Text: "• "
Response: NO_SUGGESTION

Be extremely conservative and minimal!`;

    const external_client = new OpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://api.anthropic.com/v1/",
    });

    const completion = await external_client.chat.completions.create({
      model: "claude-3-5-haiku-20241022",
      messages: [
        {
          role: "system",
          content:
            "You are a minimal writing assistant. Suggest only the specific word or phrase that needs fixing. Be extremely conservative and precise.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.1, // Very low temperature for precise, minimal suggestions
    });

    const response = completion.choices[0]?.message?.content?.trim() || "";

    // Check if AI decided not to suggest anything
    if (response === "NO_SUGGESTION" || response.includes("NO_SUGGESTION")) {
      return NextResponse.json({
        suggestion: "",
        type: "addition",
        originalText: text,
        success: true,
      });
    }

    // Parse the response
    const lines = response.split("\n");
    const typeLine = lines.find((line) => line.startsWith("TYPE:"));

    if (!typeLine) {
      return NextResponse.json({
        suggestion: "",
        type: "addition",
        originalText: text,
        success: true,
      });
    }

    const responseType = typeLine.replace("TYPE:", "").trim();

    if (responseType === "WORD_REPLACEMENT") {
      const originalWordLine = lines.find((line) =>
        line.startsWith("ORIGINAL_WORD:")
      );
      const suggestionLine = lines.find((line) =>
        line.startsWith("SUGGESTION:")
      );

      if (!originalWordLine || !suggestionLine) {
        return NextResponse.json({
          suggestion: "",
          type: "addition",
          originalText: text,
          success: true,
        });
      }

      const originalWord = originalWordLine
        .replace("ORIGINAL_WORD:", "")
        .trim();
      const suggestion = suggestionLine.replace("SUGGESTION:", "").trim();

      // Find the position of the word to replace
      const wordIndex = text.toLowerCase().indexOf(originalWord.toLowerCase());
      if (wordIndex === -1) {
        return NextResponse.json({
          suggestion: "",
          type: "addition",
          originalText: text,
          success: true,
        });
      }

      return NextResponse.json({
        suggestion,
        type: "word_replacement",
        originalText: text,
        originalWord,
        wordStartIndex: wordIndex,
        wordEndIndex: wordIndex + originalWord.length,
        success: true,
      });
    } else if (responseType === "PHRASE_REPLACEMENT") {
      const originalPhraseLine = lines.find((line) =>
        line.startsWith("ORIGINAL_PHRASE:")
      );
      const suggestionLine = lines.find((line) =>
        line.startsWith("SUGGESTION:")
      );

      if (!originalPhraseLine || !suggestionLine) {
        return NextResponse.json({
          suggestion: "",
          type: "addition",
          originalText: text,
          success: true,
        });
      }

      const originalPhrase = originalPhraseLine
        .replace("ORIGINAL_PHRASE:", "")
        .trim();
      const suggestion = suggestionLine.replace("SUGGESTION:", "").trim();

      // Find the position of the phrase to replace
      const phraseIndex = text
        .toLowerCase()
        .indexOf(originalPhrase.toLowerCase());
      if (phraseIndex === -1) {
        return NextResponse.json({
          suggestion: "",
          type: "addition",
          originalText: text,
          success: true,
        });
      }

      return NextResponse.json({
        suggestion,
        type: "phrase_replacement",
        originalText: text,
        originalPhrase,
        phraseStartIndex: phraseIndex,
        phraseEndIndex: phraseIndex + originalPhrase.length,
        success: true,
      });
    } else if (responseType === "PHRASE_COMPLETION") {
      const suggestionLine = lines.find((line) =>
        line.startsWith("SUGGESTION:")
      );

      if (!suggestionLine) {
        return NextResponse.json({
          suggestion: "",
          type: "addition",
          originalText: text,
          success: true,
        });
      }

      const suggestion = suggestionLine.replace("SUGGESTION:", "").trim();

      return NextResponse.json({
        suggestion,
        type: "phrase_completion",
        originalText: text,
        success: true,
      });
    }

    // If we get here, format wasn't recognized
    return NextResponse.json({
      suggestion: "",
      type: "addition",
      originalText: text,
      success: true,
    });
  } catch (error) {
    console.error("Error generating inline edit suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
