import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Get the last incomplete word or phrase
    const lastWord = text.split(/[.!?\s]+/).pop() || "";
    if (lastWord.length < 2) {
      return NextResponse.json({ suggestion: "" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "Suggest only if required, otherwise return empty string. Do not return additional text. Just return the suggestion. You are a helpful assistant that completes text naturally. Provide only the completion part, not the entire sentence. Keep it concise.",
        },
        {
          role: "user",
          content: `Complete this text naturally. Only provide the completion, not the full text: "${text}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 30,
    });

    const suggestion = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestion" },
      { status: 500 }
    );
  }
}
