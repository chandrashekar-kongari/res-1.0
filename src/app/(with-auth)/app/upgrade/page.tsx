"use client";

import { CheckoutButton } from "@/components/ui/checkout-button";

const UpgradePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Upgrade to Pro</h1>
      <p className="text-lg mb-8 text-center max-w-2xl">
        Get access to all premium features and take your resume to the next
        level.
      </p>
      <CheckoutButton className="w-full max-w-md" />
    </div>
  );
};

export default UpgradePage;
