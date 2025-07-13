import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Check } from "lucide-react";
import ChatInput from "./ChatInput";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  newEditorHTML?: string;
  diffEditorHTML?: string;
}
interface ChatInputProps {
  messages: ChatMessage[];
  isLoading: boolean;
  showingDiff: boolean;
  handleRejectChanges: () => void;
  handleAcceptChanges: () => void;
  handleSendMessage: (message: string) => void;
}
const ChatUI = ({
  messages,
  isLoading,
  showingDiff,
  handleRejectChanges,
  handleAcceptChanges,
  handleSendMessage,
}: ChatInputProps) => {
  return (
    <div className="w-[400px] flex flex-col overflow-hidden rounded-lg border shadow-sm bg-background">
      <div className="p-4 border-b bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions about your document
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl ${
                message.role === "user"
                  ? "bg-blue-500 text-white px-4 py-3 rounded-br-md"
                  : "bg-gray-100 text-gray-800 px-4 py-3 rounded-bl-md"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="py-1 bg-gray-50/50">
        {showingDiff && (
          <div className="flex items-center justify-end gap-1 py-1 px-2 ">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
              onClick={handleRejectChanges}
            >
              <X className="w-3 h-3" />
              Reject
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-0.5 text-xs h-6 min-h-0 px-2"
              onClick={handleAcceptChanges}
            >
              <Check className="w-3 h-3" />
              Accept
            </Button>
          </div>
        )}
        <ChatInput onSend={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatUI;
