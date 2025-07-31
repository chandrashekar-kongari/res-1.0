"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Footer } from "./Footer";
import { SIGNUP_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";

export function BottomCall() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-between px-4 w-full min-h-screen"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-3xl md:text-9xl font-bold dark:text-white text-center">
            Try Memic for free
          </div>
          <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
            To create ATS friendly resumes in seconds.
          </div>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = SIGNUP_URL;
            }}
            className="w-full sm:w-auto sm:min-w-[200px] h-12 sm:h-14 text-sm sm:text-base rounded-2xl font-medium border-[#AD46FF] bg-[#F3EBFD]  text-[#AD46FF]  shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80"
          >
            Get Started
          </Button>
        </div>
        <Footer />
      </motion.div>
    </AuroraBackground>
  );
}
