"use client";

import { Button } from "./button";

interface CheckoutButtonProps {
  className?: string;
}

export function CheckoutButton({ className }: CheckoutButtonProps) {
  const handleUpgrade = () => {
    window.location.href =
      "https://polar.sh/checkout/polar_c_vaoRkr2myq8MFHLERtpoCDDRAEdvrmWdORrxP1xGVon";
  };

  return (
    <Button onClick={handleUpgrade} className={className}>
      Upgrade to Pro
    </Button>
  );
}
