// 📍 /apps/web/src/app/[locale]/(auth)/layout.tsx
//
// Centered card layout for login / register.
// Route group `(auth)` doesn't affect the URL.

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="container-page py-16">
      <div className="mx-auto w-full max-w-md rounded-md border border-line bg-card p-8 shadow-card">
        {children}
      </div>
    </section>
  );
}