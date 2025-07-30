import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";

import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { Features1 } from "./components/Features1";
import { SomeMoreFeatures } from "./components/SomeMoreFeatures";
import { BottomCall } from "./components/BottomCall";

export default async function Page() {
  // SSR: Check if user is logged in
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });
  if (user) {
    redirect("/app");
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center ">
        <Navbar />
        <Hero />
        <Features1 />
        <SomeMoreFeatures />
        <Features />
        <Pricing />
      </div>

      <BottomCall />
    </div>
  );
}
