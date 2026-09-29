"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Reveal,
  paperEase,
  useReduceMotionSafe,
} from "@/components/marketing/motion";

const COLUMNS = [
  {
    label: "Need to apply",
    accent: "border-[#a8a29e]",
    cards: [{ company: "Northstar", role: "Backend intern" }],
  },
  {
    label: "Applied",
    accent: "border-[#7c9aab]",
    cards: [{ company: "Fieldnote", role: "Product designer" }],
  },
  {
    label: "Follow up",
    accent: "border-[#c4a15a]",
    cards: [],
  },
  {
    label: "Interviewing",
    accent: "border-[#b4533a]",
    cards: [{ company: "Harbor", role: "Staff engineer" }],
  },
  {
    label: "Offer",
    accent: "border-[#6a8f72]",
    cards: [],
  },
  {
    label: "Rejected",
    accent: "border-[#c48474]",
    cards: [{ company: "Ledger", role: "IT support" }],
  },
];

const FIELDS = [
  { label: "Name", value: "A. Candidate", source: "from resume" },
  { label: "City", value: "Binghamton, NY", source: "from resume" },
  { label: "Phone", value: "—", source: "needed" },
  { label: "Work authorization", value: "—", source: "needed" },
];

export function Desk() {
  const reduce = useReduceMotionSafe();

  return (
    <section id="desk" className="scroll-mt-20 border-t border-[#d9cfc0]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.22em] text-[#7c6a58] uppercase">
              After the posting
            </p>
            <h2 className="font-serif mt-3 max-w-xl text-3xl tracking-tight text-[#1c1917] sm:text-4xl">
              The board, and the card those forms ask for.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#57534e]">
              Track on a role saves the company, title, and link under Need to
              apply. Drag the card as the conversation moves. The profile is the
              rest of the form — filled from the resume where the page already
              says it.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/applications"
                className="inline-flex h-10 items-center rounded-full bg-[#1c1917] px-5 text-sm font-medium text-[#f6f1e8] hover:bg-[#1c1917]/85"
              >
                Open the board
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-10 items-center rounded-full border border-[#c4b6a4] px-5 text-sm font-medium text-[#1c1917] hover:bg-white/50"
              >
                Open your profile
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {COLUMNS.map((column, index) => (
              <motion.div
                key={column.label}
                className="flex min-w-0 flex-col gap-2 rounded-sm bg-[#efe6d6]/70 p-2 ring-1 ring-[#d9cfc0]"
                initial={reduce ? false : { y: 16 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.06,
                  ease: paperEase,
                }}
              >
                <p className="px-1 text-[10px] tracking-wide text-[#7c6a58] uppercase">
                  {column.label}
                </p>
                {column.cards.length === 0 ? (
                  <p className="px-1 py-3 text-[10px] text-[#a19382]">Empty</p>
                ) : (
                  column.cards.map((card) => (
                    <div
                      key={`${card.company}-${card.role}`}
                      className={`border-l-2 bg-[#fffaf3] px-2 py-2 shadow-[2px_3px_0_0_rgba(28,25,23,0.04)] ring-1 ring-[#d9cfc0] ${column.accent}`}
                    >
                      <p className="text-[11px] font-medium text-[#1c1917]">
                        {card.role}
                      </p>
                      <p className="text-[10px] text-[#7c6a58]">
                        {card.company}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            ))}
          </div>

          <motion.aside
            className="bg-[#fffaf3] p-5 shadow-[4px_8px_0_0_rgba(28,25,23,0.06)] ring-1 ring-[#d9cfc0]"
            initial={reduce ? false : { y: 18, rotate: 1.5 }}
            whileInView={{ y: 0, rotate: -0.6 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.12, ease: paperEase }}
          >
            <p className="text-[10px] tracking-[0.18em] text-[#9a3412] uppercase">
              Profile
            </p>
            <h3 className="font-serif mt-2 text-2xl text-[#1c1917]">
              Filled where the page already knows.
            </h3>
            <dl className="mt-5 divide-y divide-dashed divide-[#d9cfc0]">
              {FIELDS.map((field) => (
                <div
                  key={field.label}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <div>
                    <dt className="text-[10px] tracking-wide text-[#7c6a58] uppercase">
                      {field.label}
                    </dt>
                    <dd className="text-sm text-[#1c1917]">{field.value}</dd>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] tracking-wide uppercase ${
                      field.source === "needed"
                        ? "text-[#9a3412]"
                        : "text-[#7c6a58]"
                    }`}
                  >
                    {field.source}
                  </span>
                </div>
              ))}
            </dl>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
