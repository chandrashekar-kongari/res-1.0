import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Link as PDFLink,
  Image as PDFImage,
} from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  section: {
    marginBottom: 4, // Matches [&>*]:my-1 (4px)
    marginTop: 4, // Add top margin for consistent gap
  },
  paragraph: {
    fontSize: 14, // prose-sm base font size
    lineHeight: 1.5, // prose-sm line height
    marginBottom: 4, // Matches [&_p]:my-1 (4px)
    marginTop: 4, // Matches [&_p]:my-1 (4px)
    fontFamily: "Helvetica",
  },
  h1: {
    fontSize: 24, // prose-sm h1 size (1.75em * 14px ≈ 24px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 12, // Matches [&_h1]:mt-3 (12px)
    lineHeight: 1.2,
    fontFamily: "Helvetica",
  },
  h2: {
    fontSize: 20, // prose-sm h2 size (1.5em * 14px ≈ 20px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 8, // Matches [&_h2]:mt-2 (8px)
    lineHeight: 1.3,
    fontFamily: "Helvetica",
  },
  h3: {
    fontSize: 17, // prose-sm h3 size (1.25em * 14px ≈ 17px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 8, // Matches [&_h3]:mt-2 (8px)
    lineHeight: 1.4,
    fontFamily: "Helvetica",
  },
  h4: {
    fontSize: 14, // prose-sm h4 size (1em * 14px = 14px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 4,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
  },
  h5: {
    fontSize: 14, // prose-sm h5 size (1em * 14px = 14px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 4,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
  },
  h6: {
    fontSize: 14, // prose-sm h6 size (1em * 14px = 14px)
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 4,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
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
    marginBottom: 4,
    marginTop: 4,
  },
  listItem: {
    fontSize: 14, // prose-sm base font size
    lineHeight: 1.5, // prose-sm line height
    marginBottom: 2, // Tighter spacing for list items
    marginTop: 2, // Add top margin for consistency
    marginLeft: 20,
    fontFamily: "Helvetica",
  },
  orderedListItem: {
    fontSize: 14, // prose-sm base font size
    lineHeight: 1.5, // prose-sm line height
    marginBottom: 2, // Tighter spacing for list items
    marginTop: 2, // Add top margin for consistency
    marginLeft: 20,
    fontFamily: "Helvetica",
  },
  // Text alignment styles
  textAlignLeft: {
    textAlign: "left",
  },
  textAlignCenter: {
    textAlign: "center",
  },
  textAlignRight: {
    textAlign: "right",
  },
  textAlignJustify: {
    textAlign: "justify",
  },
  // Link styles
  link: {
    color: "#2563eb",
    textDecoration: "underline",
    fontFamily: "Helvetica",
    fontSize: 5,
    lineHeight: 0.5,
  },
  // Table styles
  table: {
    width: "100%",
    marginBottom: 4,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 14, // prose-sm base font size
    lineHeight: 1.5,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    fontFamily: "Helvetica",
  },
  tableHeader: {
    flex: 1,
    padding: 5,
    fontSize: 14, // prose-sm base font size
    lineHeight: 1.5,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    fontFamily: "Helvetica",
  },
  // Image styles
  image: {
    maxWidth: "100%",
    marginBottom: 4,
    marginTop: 4,
  },
});

// Helper function to get text alignment style
const getTextAlignStyle = (textAlign: string) => {
  switch (textAlign) {
    case "center":
      return styles.textAlignCenter;
    case "right":
      return styles.textAlignRight;
    case "justify":
      return styles.textAlignJustify;
    default:
      return styles.textAlignLeft;
  }
};

// Helper function to get font family
const getFontFamily = (fontFamily: string) => {
  if (fontFamily?.includes("Comic Sans")) {
    return "Helvetica"; // Fallback since PDF doesn't support Comic Sans
  }
  if (fontFamily?.includes("monospace")) {
    return "Courier";
  }
  return "Helvetica"; // Default font family
};

// Helper function to render text content with marks
const renderTextWithMarks = (
  textNode: any,
  key?: string
): React.ReactElement => {
  if (!textNode.marks || textNode.marks.length === 0) {
    return <Text key={key}>{textNode.text}</Text>;
  }

  let style: any = {};
  let isHighlighted = false;
  let highlightColor = "#fef08a"; // Default yellow highlight
  let isLink = false;
  let linkHref = "";

  textNode.marks.forEach((mark: any) => {
    switch (mark.type) {
      case "bold":
        style.fontWeight = "bold";
        break;
      case "italic":
        style.fontStyle = "italic";
        break;
      case "underline":
        style.textDecoration = "underline";
        break;
      case "textStyle":
        if (mark.attrs?.color) {
          style.color = mark.attrs.color;
        }
        if (mark.attrs?.fontFamily) {
          style.fontFamily = getFontFamily(mark.attrs.fontFamily);
        }
        break;
      case "highlight":
        isHighlighted = true;
        if (mark.attrs?.color) {
          highlightColor = mark.attrs.color;
        }
        break;
      case "link":
        isLink = true;
        linkHref = mark.attrs?.href || "";
        style.color = "#2563eb";
        style.textDecoration = "underline";
        break;
    }
  });

  if (isHighlighted) {
    style.backgroundColor = highlightColor;
  }

  const textElement = (
    <Text key={key} style={style}>
      {textNode.text}
    </Text>
  );

  if (isLink && linkHref) {
    return (
      <PDFLink key={key} src={linkHref} style={styles.link}>
        {textElement}
      </PDFLink>
    );
  }

  return textElement;
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

// Helper function to render table
const renderTable = (node: any, key: string): React.ReactElement => {
  if (!node.content) return <View key={key}></View>;

  return (
    <View key={key} style={styles.table}>
      {node.content.map((row: any, rowIndex: number) => (
        <View key={`row-${rowIndex}`} style={styles.tableRow}>
          {row.content?.map((cell: any, cellIndex: number) => {
            const isHeader = cell.type === "tableHeader";
            const cellStyle = isHeader ? styles.tableHeader : styles.tableCell;

            return (
              <View key={`cell-${cellIndex}`} style={cellStyle}>
                {cell.content?.map((cellContent: any, contentIndex: number) => {
                  if (cellContent.type === "paragraph") {
                    return (
                      <Text
                        key={`cell-content-${contentIndex}`}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.5,
                          fontFamily: "Helvetica",
                        }}
                      >
                        {cellContent.content?.map(
                          (textNode: any, textIndex: number) =>
                            renderTextWithMarks(
                              textNode,
                              `cell-text-${textIndex}`
                            )
                        )}
                      </Text>
                    );
                  }
                  return renderNode(
                    cellContent,
                    `cell-content-${contentIndex}`
                  );
                })}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// Main function to render individual nodes
const renderNode = (node: any, key: string): React.ReactElement => {
  switch (node.type) {
    case "doc":
      return <View key={key}>{renderNodeContent(node)}</View>;

    case "paragraph":
      const textAlign = node.attrs?.textAlign || "left";
      const alignStyle = getTextAlignStyle(textAlign);

      return (
        <View key={key} style={styles.section}>
          <Text style={[styles.paragraph, alignStyle]}>
            {node.content?.map((textNode: any, textIndex: number) =>
              renderTextWithMarks(textNode, `text-${textIndex}`)
            )}
          </Text>
        </View>
      );

    case "heading":
      const level = node.attrs?.level || 1;
      const headingTextAlign = node.attrs?.textAlign || "left";
      const headingStyle = styles[`h${level}` as keyof typeof styles];
      const headingAlignStyle = getTextAlignStyle(headingTextAlign);

      return (
        <View key={key} style={styles.section}>
          <Text style={[headingStyle, headingAlignStyle]}>
            {node.content?.map((textNode: any, textIndex: number) =>
              renderTextWithMarks(textNode, `heading-text-${textIndex}`)
            )}
          </Text>
        </View>
      );

    case "bulletList":
      return (
        <View key={key} style={styles.listContainer}>
          {node.content?.map((listItem: any, listIndex: number) => (
            <View key={`bullet-${listIndex}`} style={styles.listItem}>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: "Helvetica",
                }}
              >
                •{" "}
                {listItem.content?.map(
                  (itemContent: any, itemIndex: number) => {
                    if (itemContent.type === "paragraph") {
                      return itemContent.content?.map(
                        (textNode: any, textIndex: number) =>
                          renderTextWithMarks(
                            textNode,
                            `bullet-text-${textIndex}`
                          )
                      );
                    }
                    return renderNode(
                      itemContent,
                      `bullet-content-${itemIndex}`
                    );
                  }
                )}
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
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: "Helvetica",
                }}
              >
                {listIndex + 1}.{" "}
                {listItem.content?.map(
                  (itemContent: any, itemIndex: number) => {
                    if (itemContent.type === "paragraph") {
                      return itemContent.content?.map(
                        (textNode: any, textIndex: number) =>
                          renderTextWithMarks(
                            textNode,
                            `ordered-text-${textIndex}`
                          )
                      );
                    }
                    return renderNode(
                      itemContent,
                      `ordered-content-${itemIndex}`
                    );
                  }
                )}
              </Text>
            </View>
          ))}
        </View>
      );

    case "listItem":
      return <View key={key}>{renderNodeContent(node)}</View>;

    case "text":
      return renderTextWithMarks(node, key);

    case "image":
      const src = node.attrs?.src;
      const alt = node.attrs?.alt || "";
      if (src) {
        return <PDFImage key={key} src={src} style={styles.image} />;
      }
      return <View key={key}></View>;

    case "table":
      return renderTable(node, key);

    case "tableRow":
      return <View key={key}>{renderNodeContent(node)}</View>;

    case "tableCell":
    case "tableHeader":
      return <View key={key}>{renderNodeContent(node)}</View>;

    default:
      // Handle any unknown node types by rendering their content
      return <View key={key}>{renderNodeContent(node)}</View>;
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
