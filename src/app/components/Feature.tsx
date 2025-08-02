"use client";

import { Button } from "@/components/ui/button";
import { SIGNUP_URL } from "@/utils/constants";

const Feature = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-gray-50/30 to-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div
          className={`grid items-center gap-8 sm:gap-12 lg:gap-16 xl:gap-20 lg:grid-cols-2`}
        >
          {/* Image Section */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl shadow-xl">
              <img
                src="sample.png"
                alt="AI-powered resume builder interface showing intelligent content suggestions"
                className="w-full h-64 sm:h-80 lg:h-96 xl:h-[28rem] object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent"></div>

              {/* Subtle decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-[#AD46FF]/30 to-transparent rounded-full blur-md"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-tr from-[#00C950]/20 to-transparent rounded-full blur-lg"></div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-7xl xl:text-8xl font-medium text-gray-900 text-balance leading-tight">
                Try Memic
              </h2>
              <p className="max-w-xl text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                We believe this is the final app you need.
              </p>
            </div>

            <div className="flex w-full flex-col justify-center gap-3 sm:gap-4 sm:flex-row lg:justify-start pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.location.href = SIGNUP_URL;
                }}
                className="w-full sm:w-auto sm:min-w-[140px] h-11 sm:h-12 text-sm sm:text-base font-medium border-[#AD46FF] bg-[#F3EBFD] text-[#AD46FF] shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80"
              >
                Start for free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Feature };
