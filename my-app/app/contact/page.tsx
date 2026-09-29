import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { Reveal } from "@/components/marketing/motion";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Contact · Memic",
  description:
    "Write to Memic about the product. Resume rewrites belong in the editor chat.",
};

export default function ContactPage() {
  return (
    <div className="min-h-full bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.22em] text-[#7c6a58] uppercase">
              A note to the desk
            </p>
            <h1 className="font-serif mt-4 text-4xl tracking-tight text-[#1c1917] sm:text-5xl">
              Write us a letter.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#57534e]">
              We read every note. This page is for product questions — access,
              the jobs list, the board. Paste a job description in the editor
              chat when you want a rewrite.
            </p>
          </Reveal>
          <div className="mt-10 bg-[#fffaf3] p-6 shadow-[4px_8px_0_0_rgba(28,25,23,0.06)] ring-1 ring-[#d9cfc0]">
            <ContactForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
