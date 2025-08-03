import {
  FontBoldIcon,
  FontItalicIcon,
  FontSizeIcon,
  Link2Icon,
  ListBulletIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  UnderlineIcon,
  TextAlignBottomIcon,
  TextAlignTopIcon,
  LineHeightIcon,
  BorderBottomIcon,
} from "@radix-ui/react-icons";
import {
  DownloadIcon,
  PaletteIcon,
  BrushIcon,
  ArrowUpFromLineIcon,
  ArrowDownFromLineIcon,
  Trash2Icon,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { Toggle } from "./ui/toggle";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface TooltipWrapperProps {
  children: React.ReactNode;
  content: string;
}

function TooltipWrapper({ children, content }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent sideOffset={5} className="text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface TiptapToolbarProps {
  editor: Editor | null;
  isLoading?: boolean;
  onExportPDF?: () => void;
  onSetLink?: () => void;
}

export function TiptapToolbar({
  editor,
  isLoading = false,
  onExportPDF,
  onSetLink,
}: TiptapToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10  justify-center flex flex-row">
      <div className="p-[2px] flex flex-wrap gap-[2px] items-center">
        <TooltipWrapper content="Bold">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <FontBoldIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Italic">
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <FontItalicIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Underline">
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>

        {/* Color Dropdown */}

        <DropdownMenu>
          <TooltipWrapper content="Text Color">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <PaletteIcon
                  className="h-4 w-4"
                  style={{
                    color: editor.getAttributes("textStyle").color || "#000",
                  }}
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start" className="w-fit p-1">
            <div className="flex gap-1">
              {[
                "#000000", // Black
                "#6b7280", // Gray
                "#3b82f6", // Blue
                "#10b981", // Green
                "#ef4444", // Red
                "#8b5cf6", // Purple
              ].map((color) => (
                <DropdownMenuItem
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="p-0 h-auto w-auto cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="p-0 h-auto w-auto cursor-pointer"
              >
                <Trash2Icon className="w-4 h-4 text-gray-500" />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight Dropdown */}

        <DropdownMenu>
          <TooltipWrapper content="Highlight Color">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <BrushIcon
                  className="h-4 w-4"
                  style={{
                    color: editor.isActive("highlight")
                      ? editor.getAttributes("highlight").color || "#ffd700"
                      : "currentColor",
                  }}
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start" className="w-fit p-1">
            <div className="flex gap-1">
              {[
                "#ffd700", // Yellow
                "#ffc078", // Orange
                "#8ce99a", // Green
                "#74c0fc", // Blue
                "#b197fc", // Purple
                "#ffa8a8", // Red
              ].map((color) => (
                <DropdownMenuItem
                  key={color}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color }).run()
                  }
                  className="p-0 h-auto w-auto cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                disabled={!editor.isActive("highlight")}
                className="p-0 h-auto w-auto cursor-pointer"
              >
                <Trash2Icon className="w-4 h-4 text-gray-500" />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipWrapper content="Border Bottom">
          <Toggle
            size="sm"
            pressed={editor.getAttributes("paragraph").borderBottom}
            onPressedChange={() =>
              editor.chain().focus().toggleBorderBottom().run()
            }
          >
            <BorderBottomIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>

        {/* Font Size Quick Toggles */}
        {["14px", "18px", "21px"].map((size) => (
          <Toggle
            key={size}
            size="sm"
            className={cn(
              editor.getAttributes("fontSize").size === size ? "bg-accent" : "",
              "text-xs"
            )}
            pressed={editor.getAttributes("fontSize").size === size}
            onPressedChange={() =>
              editor.chain().focus().setFontSize(size).run()
            }
          >
            {size}
          </Toggle>
        ))}

        {/* Font Size Dropdown */}

        <DropdownMenu>
          <TooltipWrapper content="Font Size">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <FontSizeIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Font Size</DropdownMenuLabel>
            {["12px", "14px", "16px", "18px", "21px"].map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => editor.chain().focus().setFontSize(size).run()}
                className={cn(
                  editor.getAttributes("fontSize").size === size
                    ? "bg-accent"
                    : ""
                )}
              >
                {size}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetFontSize().run()}
            >
              Remove Font Size
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipWrapper content="Add Link">
          <Toggle
            size="sm"
            pressed={editor.isActive("link")}
            onPressedChange={onSetLink}
          >
            <Link2Icon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>

        {/* Lists */}
        <TooltipWrapper content="Bullet List">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <ListBulletIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Numbered List">
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M5.75024 3.5H4.71733L3.25 3.89317V5.44582L4.25002 5.17782L4.25018 8.5H3V10H7V8.5H5.75024V3.5ZM10 4H21V6H10V4ZM10 11H21V13H10V11ZM10 18H21V20H10V18ZM2.875 15.625C2.875 14.4514 3.82639 13.5 5 13.5C6.17361 13.5 7.125 14.4514 7.125 15.625C7.125 16.1106 6.96183 16.5587 6.68747 16.9167L6.68271 16.9229L5.31587 18.5H7V20H3.00012L2.99959 18.8786L5.4717 16.035C5.5673 15.9252 5.625 15.7821 5.625 15.625C5.625 15.2798 5.34518 15 5 15C4.67378 15 4.40573 15.2501 4.37747 15.5688L4.3651 15.875H2.875V15.625Z" />
            </svg>
          </Toggle>
        </TooltipWrapper>

        {/* Text Alignment */}
        <TooltipWrapper content="Align Left">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
          >
            <TextAlignLeftIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Align Center">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
          >
            <TextAlignCenterIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Align Right">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
          >
            <TextAlignRightIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>
        <TooltipWrapper content="Justify">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
          >
            <TextAlignJustifyIcon className="h-4 w-4" />
          </Toggle>
        </TooltipWrapper>

        {/* Line Height */}

        <DropdownMenu>
          <TooltipWrapper content="Line Height">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <LineHeightIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">
              Line Height
            </DropdownMenuLabel>
            {[
              "0.10",
              "0.20",
              "0.25",
              "0.50",
              "0.75",
              "1",
              "1.25",
              "1.5",
              "1.75",
              "1.80",
              "2",
            ].map((lh) => (
              <DropdownMenuItem
                key={lh}
                onClick={() => editor.chain().focus().setLineHeight(lh).run()}
                className={cn(
                  editor.getAttributes("paragraph").lineHeight === lh ||
                    editor.getAttributes("heading").lineHeight === lh
                    ? "bg-accent"
                    : ""
                )}
              >
                {lh}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Margin Top */}

        <DropdownMenu>
          <TooltipWrapper content="Margin Top">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ArrowUpFromLineIcon className="h-[10px] text-black/80 w-[10px]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">
              Margin Top
            </DropdownMenuLabel>
            {[
              "0.10",
              "0.20",
              "0.25",
              "0.50",
              "0.75",
              "1",
              "1.25",
              "1.5",
              "1.75",
              "1.80",
              "2",
            ].map((mt) => (
              <DropdownMenuItem
                key={mt}
                onClick={() => {
                  editor.commands.focus();
                  (editor.commands as any).setMarginTop(mt + "em");
                }}
                className={cn(
                  editor.getAttributes("paragraph").marginTop === mt + "em" ||
                    editor.getAttributes("heading").marginTop === mt + "em"
                    ? "bg-accent"
                    : ""
                )}
              >
                {mt}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Margin Bottom */}

        <DropdownMenu>
          <TooltipWrapper content="Margin Bottom">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ArrowDownFromLineIcon className="h-4 w-4 text-black/80" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipWrapper>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">
              Margin Bottom
            </DropdownMenuLabel>
            {[
              "0.10",
              "0.20",
              "0.25",
              "0.50",
              "0.75",
              "1",
              "1.25",
              "1.5",
              "1.75",
              "1.80",
              "2",
            ].map((mb) => (
              <DropdownMenuItem
                key={mb}
                onClick={() => {
                  editor.commands.focus();
                  (editor.commands as any).setMarginBottom(mb + "em");
                }}
                className={cn(
                  editor.getAttributes("paragraph").marginBottom ===
                    mb + "em" ||
                    editor.getAttributes("heading").marginBottom === mb + "em"
                    ? "bg-accent"
                    : ""
                )}
              >
                {mb}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export PDF */}
        <TooltipWrapper content="Export to PDF">
          <button
            onClick={onExportPDF}
            disabled={isLoading || editor.isEmpty}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Badge
              variant="outline"
              className="cursor-pointer bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 py-[3px] flex items-center gap-1"
            >
              <DownloadIcon className="h-4 w-4 text-white" /> pdf
            </Badge>
          </button>
        </TooltipWrapper>
      </div>
    </div>
  );
}
