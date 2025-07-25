import * as React from "react";

export function Avatar({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  children,
  className = "",
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`flex items-center justify-center w-full h-full text-gray-500 ${className}`}
    >
      {children}
    </span>
  );
}
