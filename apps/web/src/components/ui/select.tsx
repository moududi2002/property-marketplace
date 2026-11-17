// 📍 /apps/web/src/components/ui/select.tsx

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border bg-card px-3 text-sm text-ink",
        "border-line focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid && "border-accent focus:border-accent focus:ring-accent/30",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";