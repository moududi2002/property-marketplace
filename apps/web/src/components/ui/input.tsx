// 📍 /apps/web/src/components/ui/input.tsx
//
// Classic bordered input. No rounded pills, no shadows on focus —
// only a subtle border color change, matching the design language.

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border bg-card px-3 text-sm text-ink",
        "placeholder:text-ink-muted/70",
        "border-line focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid && "border-accent focus:border-accent focus:ring-accent/30",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);
Input.displayName = "Input";