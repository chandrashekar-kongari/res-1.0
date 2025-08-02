"use client";

import { useState } from "react";
import { CircleCheck, Crown, Sparkles, Star, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface PricingModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PricingModal({ open, setOpen }: PricingModalProps) {
  const { data: userInfo } = trpc.user.get.useQuery(undefined, {});
  const [copied, setCopied] = useState(false);

  const handleUpgrade = () => {
    window.location.href = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL!;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("JOBREADY25");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay className="backdrop-blur-lg" />
      <DialogContent className="max-w-[800px] mx-auto rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-gradient-to-br from-black/5 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 shadow-sm">
              <Crown className="w-6 h-6 text-[#AD46FF]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Choose Your Perfect Plan
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className=" p-6 pt-1 grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="overflow-hidden border border-black/10 dark:border-black/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-medium">
                <Star className="w-5 h-5 text-gray-500" />
                Free Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold tracking-tight">
                        $0
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Perfect to get started
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {[
                    "Basic Platform Access",
                    "30 Monthly Credits",
                    "Community Support",
                    "Core Features",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4" onClick={() => setOpen(false)}>
                <Button className="w-full bg-gray-600 text-white">
                  Current Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="overflow-hidden border border-black/10 dark:border-black/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-medium">
                <Sparkles className="w-5 h-5 text-[#AD46FF]  shadow-[#AD46FF]/25" />
                Early Bird Special
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl text-gray-500 dark:text-gray-400 line-through">
                        $19
                      </span>
                      <span className="text-5xl font-bold tracking-tight text-[#AD46FF]">
                        $9
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      for active job seekers
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {[
                    "Full Platform Access",
                    "300 Monthly Credits Forever",
                    "Email Support",
                    "All Future Feature Updates",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleUpgrade}
                  className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg shadow-[#AD46FF]/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none w-full transition-all duration-200 px-6"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
