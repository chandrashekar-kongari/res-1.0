const Features4 = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="z-10 mx-auto pb-8 sm:pb-12 lg:pb-16 flex max-w-4xl flex-col items-center gap-8 sm:gap-12 lg:gap-14 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 leading-tight">
              Write the way you code{" "}
              <span className="text-orange-500 font-bold">Tab Tab Tab</span>
            </h2>
            <p className="mx-auto max-w-lg sm:max-w-xl text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
              Know your resume and job description if you share in the chat.
            </p>
          </div>
        </div>

        <div className="transition-all duration-1000 delay-700 ease-in-out">
          <div className="mx-auto w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
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

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 sm:p-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>

              {/* Subtle corner accents */}
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
        </div>
      </div>
    </section>
  );
};

export { Features4 };
