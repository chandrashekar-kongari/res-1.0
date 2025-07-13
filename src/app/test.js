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


 ExportDocx.configure({
          onCompleteExport: (
            result: string | Buffer<ArrayBufferLike> | Blob | Stream
          ) => {
            try {
              let blob: Blob;

              if (result instanceof Blob) {
                blob = result;
              } else if (typeof result === "string") {
                blob = new Blob([result], {
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });
              } else if (Buffer.isBuffer(result)) {
                blob = new Blob([new Uint8Array(result)], {
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });
              } else {
                // Handle Stream or other types by converting to Uint8Array
                blob = new Blob([new Uint8Array(result as any)], {
                  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });
              }

              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "export.docx";
              a.click();
              URL.revokeObjectURL(url);
              setIsLoading(false);
            } catch (error: unknown) {
              console.error("Export error:", error);
              setError(
                error instanceof Error ? error.message : "Unknown export error"
              );
              setIsLoading(false);
            }
          },
          styleOverrides: {
            // Match heading styles from globals.css
            h1: {
              size: 24, // text-3xl
              bold: true,
              spacing: { before: 8, after: 16 }, // mt-2, mb-4
            },
            h2: {
              size: 20, // text-2xl
              bold: true,
              spacing: { before: 8, after: 12 }, // mt-2, mb-3
            },
            h3: {
              size: 16, // text-xl
              bold: true,
              spacing: { before: 8, after: 8 }, // mt-2, mb-2
            },
            h4: {
              size: 14, // text-lg
              bold: true,
              spacing: { before: 8, after: 8 }, // mt-2, mb-2
            },
            h5: {
              size: 12, // text-base
              bold: true,
              spacing: { before: 8, after: 4 }, // mt-2, mb-1
            },
            h6: {
              size: 10, // text-sm
              bold: true,
              spacing: { before: 8, after: 4 }, // mt-2, mb-1
            },
            // Default paragraph styles
            p: {
              size: 12,
              lineHeight: 1.5,
              spacing: { after: 8 },
            },
            // List styles
            ul: {
              indent: 24,
            },
            ol: {
              indent: 24,
            },
          } as any, // Type assertion to bypass type checking
        }),
