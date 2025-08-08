"use client";

import React from "react";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import {
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from "@radix-ui/react-icons";

const Features2 = () => {
  const [isMuted, setIsMuted] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="z-10 mx-auto pb-8 sm:pb-12 lg:pb-16 flex max-w-4xl flex-col items-center gap-8 sm:gap-12 lg:gap-14 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Get{" "}
              <PointerHighlight
                containerClassName="mx-2 inline-flex"
                rectangleClassName="bg-white/10"
              >
                <span className="text-yellow-500 font-bold">ATS</span>
              </PointerHighlight>{" "}
              ready resumes
            </h2>
            <p className="mx-auto max-w-lg sm:max-w-xl text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
              Download perfect resume in seconds.
            </p>
          </div>
        </div>

        {/* <div className="transition-all duration-1000 delay-700 ease-in-out">
          <div className="mx-auto w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative" id="feature2-video-container">
                <video
                  src="/demo2.mp4"
                  playsInline
                  muted
                  autoPlay
                  loop
                  className="h-full w-full object-cover sm:object-contain"
                  id="feature2-video"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-2 right-2 flex gap-1.5 z-50">
                  <button
                    onClick={() => {
                      const video = document.getElementById(
                        "feature2-video"
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
                      const container = document.getElementById(
                        "feature2-video-container"
                      );
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

              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#AD46FF]/20 to-transparent"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#00C950]/15 to-transparent"></div>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
                Watch how our AI agent helps you craft the perfect resume in
                real-time
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export { Features2 };
