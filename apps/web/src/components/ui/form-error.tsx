// 📍 /apps/web/src/components/ui/form-error.tsx
//
// Two flavors:
//   • <FieldError>   — inline under a single input
//   • <FormAlert>    — banner at the top of the form

import { cn } from "@/lib/utils";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-accent">{children}</p>;
}

interface FormAlertProps {
  variant?: "error" | "info";
  children: React.ReactNode;
}

export function FormAlert({ variant = "error", children }: FormAlertProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "error" && "border-accent/40 bg-accent/5 text-accent",
        variant === "info" && "border-line bg-brand-light text-brand",
      )}
    >
      {children}
    </div>
  );
}