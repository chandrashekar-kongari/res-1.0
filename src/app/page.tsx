import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Pricing } from "./components/Pricing";
import { Features1 } from "./components/Features1";
import { SomeMoreFeatures } from "./components/SomeMoreFeatures";
import { BottomCall } from "./components/BottomCall";
import { Features2 } from "./components/Features2";
import { Features3 } from "./components/Feature3";
import { Features4 } from "./components/Feature4";
import { HeroScrollDemo } from "./components/HeroScrollDemo";

export default async function Page() {
  // SSR: Check if user is logged in
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });
  if (user) {
    redirect("/app");
  }

  return (
    <div className=" min-h-screen bg-[#FCFCFC] w-full relative mx-auto flex flex-col items-center justify-center">
      <Navbar />
      <Hero />
      <HeroScrollDemo />
      <div className=" w-full relative max-w-4xl ">
        <div className="flex flex-col items-center justify-center w-full relative z-0">
          <div id="features">
            <Features1 />
            <Features2 />
            <Features3 />

            <Features4 />
          </div>
        </div>

        <div id="pricing">
          <Pricing />
        </div>
      </div>

      <BottomCall />
    </div>
  );
}
