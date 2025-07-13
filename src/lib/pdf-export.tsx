import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  section: {
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  h3: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
  },
  h4: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
  },
  h5: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 8,
  },
  h6: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecoration: "underline",
  },
  listContainer: {
    marginBottom: 8,
  },
  listItem: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 20,
  },
  orderedListItem: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 20,
  },
});

// Helper function to render text content with marks
const renderTextWithMarks = (
  textNode: any,
  key?: string
): React.ReactElement => {
  if (!textNode.marks || textNode.marks.length === 0) {
    return <Text key={key}>{textNode.text}</Text>;
  }

  let style = {};
  textNode.marks.forEach((mark: any) => {
    if (mark.type === "bold") {
      style = { ...style, fontWeight: "bold" };
    } else if (mark.type === "italic") {
      style = { ...style, fontStyle: "italic" };
    } else if (mark.type === "underline") {
      style = { ...style, textDecoration: "underline" };
    }
  });

  return (
    <Text key={key} style={style}>
      {textNode.text}
    </Text>
  );
};

// Helper function to render node content
const renderNodeContent = (
  node: any
): React.ReactElement | React.ReactElement[] => {
  if (!node.content) return [];

  return node.content.map((childNode: any, index: number) => {
    return renderNode(childNode, `node-${index}`);
  });
};

// Main function to render individual nodes
const renderNode = (node: any, key: string): React.ReactElement => {
  switch (node.type) {
    case "doc":
      return <View key={key}>{renderNodeContent(node)}</View>;

    case "paragraph":
      return (
        <View key={key} style={styles.section}>
          <Text style={styles.paragraph}>
            {node.content?.map((textNode: any, textIndex: number) =>
              renderTextWithMarks(textNode, `text-${textIndex}`)
            )}
          </Text>
        </View>
      );

    case "heading":
      const level = node.attrs?.level || 1;
      const headingStyle = styles[`h${level}` as keyof typeof styles];
      return (
        <View key={key} style={styles.section}>
          <Text style={headingStyle}>
            {node.content
              ?.map((textNode: any, textIndex: number) => textNode.text || "")
              .join("")}
          </Text>
        </View>
      );

    case "bulletList":
      return (
        <View key={key} style={styles.listContainer}>
          {node.content?.map((listItem: any, listIndex: number) => (
            <View key={`bullet-${listIndex}`} style={styles.listItem}>
              <Text>
                •{" "}
                {listItem.content?.[0]?.content
                  ?.map((textNode: any) => textNode.text)
                  .join("") || ""}
              </Text>
            </View>
          ))}
        </View>
      );

    case "orderedList":
      return (
        <View key={key} style={styles.listContainer}>
          {node.content?.map((listItem: any, listIndex: number) => (
            <View key={`ordered-${listIndex}`} style={styles.orderedListItem}>
              <Text>
                {listIndex + 1}.{" "}
                {listItem.content?.[0]?.content
                  ?.map((textNode: any) => textNode.text)
                  .join("") || ""}
              </Text>
            </View>
          ))}
        </View>
      );

    case "listItem":
      return <View key={key}>{renderNodeContent(node)}</View>;

    case "text":
      return renderTextWithMarks(node, key);

    default:
      return <View key={key}></View>;
  }
};

// Main PDF document component
const PDFDocument = ({ content }: { content: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {renderNodeContent(content)}
    </Page>
  </Document>
);

// Export function to generate and download PDF
export const exportToPDF = async (
  editorJSON: any,
  filename: string = "document.pdf"
) => {
  try {
    const blob = await pdf(<PDFDocument content={editorJSON} />).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
};
