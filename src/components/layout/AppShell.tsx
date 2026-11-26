import React from "react";

interface AppShellProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export function AppShell({ header, children, bottomNav }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-[var(--k-bg)] flex justify-center">
      <div className="w-full max-w-[480px] min-h-[100dvh] bg-[var(--k-bg)] flex flex-col overflow-x-clip md:border-x md:border-[#FFE0EC] md:k-shadow">
        {header ? <header className="shrink-0 pt-safe">{header}</header> : null}
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
        {bottomNav ?? null}
      </div>
    </div>
  );
}
