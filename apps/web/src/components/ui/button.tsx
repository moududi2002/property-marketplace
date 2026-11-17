// 📍 /apps/web/src/components/ui/button.tsx
//
// Small shared button used by forms outside the design-system
// primitives we already have.

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
        variant === "primary" &&
          "bg-brand text-white hover:bg-brand-hover disabled:opacity-60",
        variant === "secondary" &&
          "border border-line bg-card text-ink hover:bg-surface disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";