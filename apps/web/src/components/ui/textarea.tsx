// 📍 /apps/web/src/components/ui/textarea.tsx

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-md border bg-card px-3 py-2 text-sm text-ink",
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
Textarea.displayName = "Textarea";