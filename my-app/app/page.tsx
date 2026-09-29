import type { Metadata } from "next";
import { Desk } from "@/components/marketing/desk";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { JobRibbon } from "@/components/marketing/job-ribbon";
import { ProductSplit } from "@/components/marketing/product-split";
import { ResumeToCompany } from "@/components/marketing/resume-to-company";
import { Reviews } from "@/components/marketing/reviews";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Memic",
  description:
    "Upload a resume PDF, accept line-by-line rewrites, track the roles you open, and keep the answers those forms ask for.",
};

export default function Home() {
  return (
    <div className="relative min-h-full bg-background text-foreground">
      <SiteHeader />
      <ResumeToCompany />
      <main>
        <Hero />
        <JobRibbon />
        <Reviews />
        <HowItWorks />
        <ProductSplit />
        <Desk />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
