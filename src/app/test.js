const handleDownloadPDF = async () => {
  const editor = editorRef.current?.getEditor();
  if (editor) {
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.createElement("div");

    element.innerHTML = editor.getHTML();
    element.className = "prose prose-sm max-w-none p-4";

    const opt = {
      margin: 0, // Remove margins since we handle them in the editor
      filename: "tiptap-content.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        width: 794, // A4 width in pixels
        height: 1123, // A4 height in pixels
      },
      jsPDF: {
        unit: "px",
        format: [794, 1123], // A4 dimensions
        orientation: "portrait",
      },
    };

    await html2pdf().set(opt).from(element).save();
  }
};
