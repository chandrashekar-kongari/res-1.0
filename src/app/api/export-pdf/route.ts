import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const POST = async (req: NextRequest) => {
  const { html, filename = "document.pdf" } = await req.json();

  if (!html) {
    return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
  }

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
  });

  await browser.close();

  // Convert to Buffer for NextResponse
  const buffer = Buffer.from(pdfBuffer);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
};
