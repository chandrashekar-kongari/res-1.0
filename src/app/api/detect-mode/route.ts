import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    // Simple heuristic for now - can be replaced with more sophisticated AI logic
    const shouldReplace =
      text.match(/\b(fix|correct|improve|better|change)\b/i) !== null;

    return NextResponse.json({
      mode: shouldReplace ? "replace" : "replace",
      confidence: 0.8, // Mock confidence score
    });
  } catch (error) {
    console.error("Error in detect-mode:", error);
    return NextResponse.json(
      { error: "Failed to detect mode" },
      { status: 500 }
    );
  }
}
