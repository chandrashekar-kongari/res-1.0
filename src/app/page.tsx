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
        <div id="features">
          <Features1 />
          <Features2 />
          <Features3 />
          {/* <Features4 /> */}
        </div>

        <div id="pricing">
          <Pricing />
        </div>
      </div>

      <BottomCall />
    </div>
  );
}
