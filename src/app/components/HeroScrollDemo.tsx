"use client";
import React from "react";
import {
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EnterFullScreenIcon,
  ExitFullScreenIcon,
} from "@radix-ui/react-icons";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

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
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll titleComponent={<></>}>
        <div className="relative" id="hero-scroll-video-container">
          <video
            src="/demo2.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full rounded-2xl object-cover"
            id="hero-scroll-video"
          />
          <div className="absolute bottom-2 right-2 flex gap-1.5 z-50">
            <button
              onClick={() => {
                const video = document.getElementById(
                  "hero-scroll-video"
                ) as HTMLVideoElement;
                if (video) {
                  video.muted = !video.muted;
                  setIsMuted(video.muted);
                }
              }}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
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
                  "hero-scroll-video-container"
                );
                if (container) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    container.requestFullscreen();
                  }
                }
              }}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              {isFullscreen ? (
                <ExitFullScreenIcon className="w-4 h-4" />
              ) : (
                <EnterFullScreenIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
