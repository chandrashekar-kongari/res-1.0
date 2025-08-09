"use client";

import React from "react";
import {
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { SIGNUP_URL } from "@/utils/constants";
import { TypeWriterInput } from "./TypeWriter";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

const Hero = () => {
  const [isMuted, setIsMuted] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      const container = document.getElementById("video-container");
      if (container) {
        container.style.backgroundColor = document.fullscreenElement
          ? "#FCFCFC"
          : "transparent";
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  return (
    <section className="h-[calc(100vh-120px)] relative">
      <div className="container px-4 sm:px-6 lg:px-8 relative h-full flex justify-center items-center">
        <div className="z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 sm:gap-12 lg:gap-6 text-center">
          <div className="space-y-4 sm:space-y-6">
            {/* <div className="flex justify-center">
              <a
                href="https://www.producthunt.com/products/memic?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-memic"
                target="_blank"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1002920&theme=light&t=1754609352606"
                  alt="Memic - Cursor&#0032;For&#0032;Resume&#0032;Building | Product Hunt"
                  style={{ height: "40px" }}
                />
              </a>
            </div> */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold text-gray-900 text-pretty leading-tight sm:leading-tight lg:leading-tight">
              AI For{" "}
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
            <p className="mx-auto max-w-lg sm:max-w-lg text-sm sm:text-base lg:text-xl text-black/70 leading-relaxed">
              We are not just building a resume builder, we are reimagining the
              way we build resumes.
            </p>
          </div>

          <TypeWriterInput
            sentences={[
              "Update resume to match above job description",
              "Rewrite experience section with metrics",
              "Update skills to match job description",
              "Add projects to match job description",
            ]}
            onButtonClick={() => {
              window.location.href = SIGNUP_URL;
            }}
          />

          {/* <div className="flex w-full flex-col items-center justify-center gap-4 sm:gap-6 lg:flex-row lg:gap-8">
            <div className="flex flex-col items-center gap-2 lg:items-center">
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
              className="w-full sm:w-auto sm:min-w-[200px] h-12 sm:h-14 text-sm sm:text-base rounded-2xl font-medium bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg border-none shadow-[#AD46FF]/25 hover:text-white"
            >
              Create Now
            </Button>
          </div> */}
        </div>

        {/* <div className="mt-12 sm:mt-16 lg:mt-24 duration-1000 ">
          <div className="relative rounded-xl overflow-hidden">
            <div className="relative" id="video-container">
              <video
                src="/memic.mp4"
                playsInline
                muted
                autoPlay
                loop
                className="rounded-xl w-full"
                id="hero-video"
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute bottom-2 right-2 flex gap-1.5 z-50">
                <button
                  onClick={() => {
                    const video = document.getElementById(
                      "hero-video"
                    ) as HTMLVideoElement;
                    if (video) {
                      video.muted = !video.muted;
                      setIsMuted(video.muted);
                    }
                  }}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
                >
                  {isMuted ? (
                    <SpeakerOffIcon className="w-4 h-4" />
                  ) : (
                    <SpeakerLoudIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    const container =
                      document.getElementById("video-container");
                    if (container) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        container.requestFullscreen();
                      }
                    }
                  }}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
                >
                  {isFullscreen ? (
                    <ExitFullScreenIcon className="w-4 h-4" />
                  ) : (
                    <EnterFullScreenIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
              Build your resume the same way you build code.
            </p>
          </div>
        </div> */}
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
