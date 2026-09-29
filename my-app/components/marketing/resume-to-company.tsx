"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useReduceMotionSafe } from "@/components/marketing/motion";

export function ResumeToCompany() {
  const reduce = useReduceMotionSafe();
  const { scrollYProgress } = useScroll();
  const progress = useMotionValue(0);
  const locked = useRef(false);

  const apply = (value: number) => {
    if (locked.current) return;
    const next = Math.min(1, Math.max(0, value));
    if (next >= 0.98) {
      locked.current = true;
      progress.set(1);
      return;
    }
    progress.set(next);
  };

  useMotionValueEvent(scrollYProgress, "change", apply);

  useEffect(() => {
    const fromWindow = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      apply(max <= 0 ? 0 : window.scrollY / max);
    };
    fromWindow();
    window.addEventListener("scroll", fromWindow, { passive: true });
    return () => window.removeEventListener("scroll", fromWindow);
  }, []);

  const top = useTransform(progress, [0, 1], ["0%", "100%"]);
  const scale = useTransform(progress, [0, 0.9, 1], [1, 0.92, 0.28]);
  const rotate = useTransform(progress, [0, 1], [-7, 2]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-16 right-20 bottom-0 z-20 hidden w-16 xl:block"
    >
      <div className="relative h-full [--resume-w:4rem]">
        <div className="absolute top-6 bottom-[7.75rem] left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-[#c4b6a4] via-[#c4b6a4]/70 to-transparent" />

        <div className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2">
          <CompanyIcon />
        </div>

        <div className="absolute inset-x-0 top-6 bottom-[7.6rem]">
          {reduce ? (
            <div className="absolute top-full left-1/2 ml-[calc(var(--resume-w)/-2)] origin-bottom scale-[0.28]">
              <ResumeIcon />
            </div>
          ) : (
            <motion.div
              className="absolute left-1/2 ml-[calc(var(--resume-w)/-2)] origin-bottom will-change-[top,transform]"
              style={{ top, scale, rotate }}
            >
              <ResumeIcon />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeIcon() {
  return (
    <svg
      viewBox="0 0 64 80"
      className="h-20 w-16 drop-shadow-[0_12px_20px_rgba(28,25,23,0.16)]"
    >
      <rect
        x="4"
        y="2"
        width="56"
        height="76"
        rx="3"
        fill="#fffaf3"
        stroke="#1c1917"
        strokeWidth="1.5"
      />
      <path d="M40 2v14h16" fill="#efe6d6" stroke="#1c1917" strokeWidth="1.5" />
      <path d="M40 2l16 16" fill="none" stroke="#1c1917" strokeWidth="1.5" />
      <path
        d="M14 26h28M14 34h36M14 42h32M14 50h24"
        fill="none"
        stroke="#7c6a58"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="14"
        y="60"
        width="18"
        height="6"
        rx="3"
        fill="#f3e4d4"
        stroke="#b4533a"
      />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg viewBox="0 0 80 96" className="h-24 w-[4.5rem]">
      <path d="M32 4h16v18H32z" fill="#1c1917" />
      <path d="M38 4h4v8h-4z" fill="#f6f1e8" />
      <path
        fillRule="evenodd"
        d="M10 20h60v72H10z M28 62h24v30H28z"
        fill="#1c1917"
      />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={18 + col * 16}
            y={28 + row * 11}
            width="8"
            height="6"
            fill="#f6f1e8"
          />
        )),
      )}
      <rect
        x="28"
        y="62"
        width="24"
        height="30"
        fill="none"
        stroke="#b4533a"
        strokeWidth="1.75"
      />
    </svg>
  );
}
