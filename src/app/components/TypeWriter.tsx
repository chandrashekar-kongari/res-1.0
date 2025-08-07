"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "@radix-ui/react-icons";

interface TypeWriterInputProps {
  sentences: string[];
  inputClassName?: string;
  typewriterClassName?: string;
  cursorClassName?: string;
  onButtonClick?: () => void;
  buttonText?: string;
}

export const TypeWriterInput: React.FC<TypeWriterInputProps> = ({
  sentences,
  inputClassName,
  typewriterClassName,
  cursorClassName,
  onButtonClick,
  buttonText,
}) => {
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typing, setTyping] = useState(true);
  const typingSpeed = 70;
  const deletingSpeed = 30;
  const pauseBetween = 1200;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!typing) return;
    const currentSentence = sentences[currentSentenceIdx];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayedText.length < currentSentence.length) {
      timeout = setTimeout(() => {
        setDisplayedText(currentSentence.slice(0, displayedText.length + 1));
      }, typingSpeed);
    } else if (isDeleting && displayedText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayedText(currentSentence.slice(0, displayedText.length - 1));
      }, deletingSpeed);
    } else if (!isDeleting && displayedText.length === currentSentence.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseBetween);
    } else if (isDeleting && displayedText.length === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentSentenceIdx((prev) => (prev + 1) % sentences.length);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentSentenceIdx, sentences, typing]);

  // Optionally, focus input when animation completes
  useEffect(() => {
    if (!typing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [typing]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[600px] px-4 sm:px-6 md:px-8">
      <div className={cn("relative w-full", typewriterClassName)}>
        <span className="absolute left-3 px-1 top-1/2 -translate-y-1/2 pointer-events-none select-none text-black/70 font-semibold">
          {displayedText}
          <span
            className={cn(
              "inline-block w-[2px] h-5 bg-white align-middle animate-blink ml-0.5",
              cursorClassName
            )}
          ></span>
        </span>
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            className={cn(
              "bg-transparent text-white py-8 px-5 pr-[120px] rounded-2xl dark:text-white relative z-10",
              inputClassName
            )}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={onButtonClick}
            autoFocus={false}
          />
          <Button
            onClick={onButtonClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm sm:text-base rounded-full font-medium bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-full border-none shadow-[#AD46FF]/25 hover:text-white w-10 h-10 flex items-center justify-center z-20"
            variant="secondary"
          >
            <ArrowUpIcon className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Utility for demo usage
export const TypeWriterInputDemo = () => (
  <TypeWriterInput
    sentences={[
      "Write your next big idea...",
      "Collaborate with your team in real-time.",
      "Experience the future of productivity.",
    ]}
  />
);

// Tailwind animation for blinking cursor
// Add this to your global CSS if not present:
// @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
// .animate-blink { animation: blink 1s steps(2, start) infinite; }
