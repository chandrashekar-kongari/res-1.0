import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that rephrases text while maintaining its meaning but improving its clarity and style.",
        },
        {
          role: "user",
          content: `Please rephrase the following text: "${text}"`,
        },
      ],
      temperature: 0.7,
    });

    const rephrasedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ rephrasedText });
  } catch (error) {
    console.error("Error in rephrase API:", error);
    return NextResponse.json(
      { error: "Failed to rephrase text" },
      { status: 500 }
    );
  }
}
