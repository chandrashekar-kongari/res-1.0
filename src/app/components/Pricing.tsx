"use client";

import { CircleCheck, Sparkles, Zap, Crown, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SIGNUP_URL } from "@/utils/constants";

const Pricing = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:gap-12 lg:gap-14 text-center">
          {/* Header Section */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-gray-900 text-pretty leading-tight">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-[#AD46FF] to-[#ca92f7] bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Start free and upgrade when you're ready for premium AI features
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl">
            {/* Free Plan */}
            <Card className="group relative w-full border border-gray-200/60 shadow-lg shadow-gray-900/5 bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-500">
              <CardHeader className="space-y-4 sm:space-y-6 pt-8">
                <div className="space-y-2">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-gray-900">
                    Free Plan
                  </CardTitle>
                  <p className="text-sm sm:text-base text-gray-600">
                    Everything you need to get started
                  </p>
                </div>

                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-medium text-gray-900">
                    $0
                  </span>
                  <span className="text-xl sm:text-2xl font-medium text-gray-500 mb-2">
                    /mo
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-[#00C950] rounded-full"></div>
                  <span>No credit card required</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 sm:space-y-8">
                {/* Features */}
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Limited AI agent chats",
                    "Limited Tab completion",
                    "Standard AI response time",
                    "Unlimited resumes",
                    "Unlimited PDF downloads",
                  ].map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm sm:text-base"
                    >
                      <CircleCheck className="size-5 text-[#00C950] flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    window.location.href = SIGNUP_URL;
                  }}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium border-[#AD46FF] bg-[#F3EBFD] text-[#AD46FF] shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80 transition-all duration-300"
                >
                  Start Free Trial
                </Button>
              </CardContent>

              {/* Subtle decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-[#00C950]/20 to-transparent rounded-full blur-sm opacity-60"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-tr from-gray-400/20 to-transparent rounded-full blur-sm opacity-60"></div>
            </Card>

            {/* Pro Plan */}
            <Card className="group relative w-full border border-[#AD46FF]/30 shadow-2xl shadow-[#AD46FF]/10 bg-gradient-to-br from-white/90 to-[#AD46FF]/3 backdrop-blur-sm overflow-visible hover:shadow-2xl hover:shadow-[#AD46FF]/15 transition-all duration-500">
              {/* Enhanced Coming Soon Badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className="bg-gradient-to-r from-[#AD46FF] to-[#ca92f7] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg shadow-[#AD46FF]/30 transform rotate-12 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Coming Soon</span>
                  </div>
                </div>
              </div>

              <CardHeader className="space-y-4 sm:space-y-6 pt-8">
                <div className="space-y-2">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-gray-900 flex items-center justify-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-[#AD46FF]/10 to-[#ca92f7]/5 rounded-lg">
                      <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#AD46FF]" />
                    </div>
                    Magic Plan
                  </CardTitle>
                  <p className="text-sm sm:text-base text-gray-600">
                    Supercharge your resume with AI magic
                  </p>
                </div>

                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-medium bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    $$
                  </span>
                  <span className="text-xl sm:text-2xl font-medium text-gray-500 mb-2">
                    /mo
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-[#AD46FF]">
                  <div className="w-2 h-2 bg-[#AD46FF] rounded-full"></div>
                  <span>Premium AI features</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 sm:space-y-8">
                {/* Features */}
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "Everything in Free Plan",
                    "Unlimited AI agent chats",
                    "Lightning-fast AI responses",
                    "Advanced resume optimization",
                    "Real-time ATS score tracking",
                    "Priority customer support",
                    "and more...",
                  ].map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm sm:text-base"
                    >
                      {index === 0 ? (
                        <div className="p-0.5 bg-gradient-to-br from-[#AD46FF]/10 to-[#ca92f7]/5 rounded-full mt-0.5">
                          <Star className="size-4 text-[#AD46FF] flex-shrink-0" />
                        </div>
                      ) : (
                        <CircleCheck className="size-5 text-[#00C950] flex-shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* Enhanced decorative elements */}
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-br from-[#AD46FF]/20 to-transparent rounded-full blur-md opacity-70"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-tl from-[#ca92f7]/15 to-transparent rounded-full blur-lg opacity-60"></div>
              <div className="absolute top-1/2 -left-2 w-3 h-3 bg-gradient-to-r from-[#00C950]/20 to-transparent rounded-full blur-sm opacity-50"></div>
            </Card>
          </div>

          {/* Enhanced Additional Information */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-gray-500">
              <div className="group flex items-center gap-2 hover:text-gray-700 transition-colors duration-300">
                <div className="w-2 h-2 bg-[#00C950] rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                <span>No setup fees</span>
              </div>
            </div>

            <div className="relative">
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Join thousands of professionals who've landed their dream jobs
                with our AI-powered resume builder.
              </p>

              {/* Subtle background accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing };
