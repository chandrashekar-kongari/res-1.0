import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import {
  uploadToS3,
  generateDownloadUrl,
  generateFileKey,
} from "@/lib/blob-storage";
import { stackServerApp } from "@/stack";

export const POST = async (req: NextRequest) => {
  let browser;

  try {
    // Get the authenticated user
    const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, filename = "document.pdf" } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
    }

    // Generate PDF with Puppeteer
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    // Generate unique filename for blob storage
    const fileName = generateFileKey(user.id, filename);

    // Upload PDF to Vercel Blob (returns direct download URL)
    const downloadUrl = await uploadToS3(
      Buffer.from(pdfBuffer),
      fileName,
      "application/pdf"
    );

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
};
