"use client";

import { Calendar, Sparkles, Zap, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SIGNUP_URL } from "@/utils/constants";

const Features = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="z-10 mx-auto pb-8 sm:pb-12 lg:pb-16 flex max-w-4xl flex-col items-center gap-8 sm:gap-12 lg:gap-14 text-center">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-gray-900 text-pretty leading-tight sm:leading-tight lg:leading-tight">
              Build Your Perfect Resume in{" "}
              <span className="bg-gradient-to-r from-[#00C950] to-[#4ade80] bg-clip-text text-transparent">
                Minutes
              </span>
            </h2>
            <p className="mx-auto max-w-lg sm:max-w-xl text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
              Our AI-powered resume builder helps you create professional
              resumes that get noticed by recruiters and hiring managers.
            </p>
          </div>
        </div>

        <div className="transition-all duration-1000 delay-700 ease-in-out">
          <div className="mx-auto w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl relative">
            <div className="relative aspect-video bg-[#00C950]/5 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg border border-white/20">
              <video
                src="samplevideo.mp4"
                poster="tab-video-dark.webp"
                className="h-full w-full object-cover sm:object-contain"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>

            <div className="mt-4 sm:mt-6 text-center space-y-4">
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
                Watch how our AI assistant helps you craft the perfect resume in
                real-time
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  window.location.href = SIGNUP_URL;
                }}
                className="w-full sm:w-auto sm:min-w-[200px] h-12 sm:h-14 text-sm sm:text-base rounded-2xl font-medium border-[#AD46FF] bg-[#F3EBFD] text-[#AD46FF] shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Features };
