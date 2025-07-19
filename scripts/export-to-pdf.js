const puppeteer = require("puppeteer");

async function exportToPDF(url, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Go to the page you want to export (can be local or remote)
  await page.goto(url, { waitUntil: "networkidle0" });

  // Export to PDF
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true, // Ensures CSS backgrounds are rendered
  });

  await browser.close();
}

// Usage: node scripts/export-to-pdf.js http://localhost:3000/page output.pdf
const [, , url, outputPath] = process.argv;
if (!url || !outputPath) {
  console.error("Usage: node scripts/export-to-pdf.js <url> <outputPath>");
  process.exit(1);
}

exportToPDF(url, outputPath)
  .then(() => console.log("PDF exported:", outputPath))
  .catch((err) => {
    console.error("Error exporting PDF:", err);
    process.exit(1);
  });
