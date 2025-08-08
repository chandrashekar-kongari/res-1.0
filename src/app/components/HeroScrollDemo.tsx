"use client";
import React from "react";
import {
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from "@radix-ui/react-icons";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import ReactPlayer from "react-player";

export function HeroScrollDemo() {
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
    <div className="flex flex-col overflow-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-24 duration-1000">
        <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-lg sm:shadow-xl">
          <div
            className="relative aspect-video w-full min-h-[250px] xs:min-h-[300px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px]"
            id="video-container"
          >
            <ReactPlayer
              src="https://youtu.be/22q14TVRhCQ"
              controls
              width="100%"
              height="100%"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Build your resume the same way you build code.
          </p>
        </div>
      </div>
    </div>
  );
}
