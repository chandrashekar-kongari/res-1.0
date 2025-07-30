"use client";

import { Calendar } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { SIGNUP_URL } from "@/utils/constants";

const Hero = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 sm:gap-12 lg:gap-14 text-center">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium text-gray-900 text-pretty leading-tight sm:leading-tight lg:leading-tight">
              Cursor For{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #AD46FF 0%, #ca92f7 20%, #00C950 40%, #FE9900 60%, #FA2C37 80%, #AD46FF 100%)",
                  backgroundSize: "300% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "gradientFlow 10s ease-in-out infinite",
                }}
              >
                Resume
              </span>{" "}
              Building
            </h1>
            <p className="mx-auto max-w-lg sm:max-w-xl text-sm sm:text-base lg:text-lg text-black/70 leading-relaxed">
              We are not just building a resume builder, we are building a
              platform that every job seeker{" "}
              <span className="font-bold">trusts</span> throughout their
              journey.
            </p>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:gap-6 lg:flex-row lg:gap-8">
            <div className="flex flex-col items-center gap-2 lg:items-start">
              <p className="text-xs sm:text-sm text-black/80">
                Save your time from copy pasting
              </p>
              <div className="flex items-center gap-3 text-xs text-black/70">
                <div className="flex items-center gap-1">
                  <span> We are commited to make this perfect for you</span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                window.location.href = SIGNUP_URL;
              }}
              className="w-full sm:w-auto sm:min-w-[200px] h-12 sm:h-14 text-sm sm:text-base rounded-2xl font-medium border-[#AD46FF] bg-[#F3EBFD]  text-[#AD46FF]  shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80"
            >
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Build With Us
            </Button>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-24 transition-all duration-1000 delay-700 ease-in-out">
          <div className="relative">
            <Image
              src="/test.webp"
              alt="AI-powered resume builder interface showing professional resume templates"
              width={1920}
              height={1080}
              className="mx-auto aspect-video w-full max-w-7xl rounded-xl lg:rounded-2xl object-cover shadow-2xl transition-all duration-700 ease-in-out transform-gpu hover:shadow-3xl"
            />
            <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-t from-black/5 to-transparent"></div>

            {/* Subtle color accents around the image */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-[#AD46FF] to-transparent rounded-full opacity-60 blur-sm"></div>
            <div className="absolute -top-3 -right-4 w-6 h-6 bg-gradient-to-bl from-[#00C950] to-transparent rounded-full opacity-40 blur-sm"></div>
            <div className="absolute -bottom-2 -left-4 w-5 h-5 bg-gradient-to-tr from-[#FE9900] to-transparent rounded-full opacity-50 blur-sm"></div>
            <div className="absolute -bottom-2 -right-4 w-5 h-5 bg-gradient-to-tr from-[#FA2C37] to-transparent rounded-full opacity-50 blur-sm"></div>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
              Build your resume the same way you build code.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          20% {
            background-position: 25% 50%;
          }
          40% {
            background-position: 50% 50%;
          }
          60% {
            background-position: 75% 50%;
          }
          80% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) translateX(10px) rotate(1deg);
          }
          66% {
            transform: translateY(10px) translateX(-15px) rotate(-1deg);
          }
        }

        @keyframes float-reverse {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          33% {
            transform: translateY(15px) translateX(-10px) rotate(-1deg);
          }
          66% {
            transform: translateY(-10px) translateX(20px) rotate(1deg);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: float-reverse 25s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 15s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export { Hero };
