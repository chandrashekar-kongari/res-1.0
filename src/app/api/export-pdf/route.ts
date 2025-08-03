import { NextRequest, NextResponse } from "next/server";

const PDF_SERVICE_URL = "https://pdf-service-production-9e48.up.railway.app";

export const POST = async (req: NextRequest) => {
  try {
    const { html, filename = "resume.pdf" } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
    }

    // Call external PDF service
    const response = await fetch(`${PDF_SERVICE_URL}/api/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "PDF generation failed",
          details: errorData.details || "Unknown error",
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    console.error("PDF service error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
