import React from "react";

export type AppTabId = "home" | "editor" | "draw" | "tree";

interface BottomNavProps {
  activeTab: AppTabId;
  onSelectTab: (tab: AppTabId) => void;
}

const NAV_ITEMS: {
  id: AppTabId;
  label: string;
  renderIcon: () => React.ReactElement;
}[] = [
  {
    id: "home",
    label: "Ghi chú",
    renderIcon: () => (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    id: "editor",
    label: "Viết mới",
    renderIcon: () => (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    id: "draw",
    label: "Vẽ tay",
    renderIcon: () => (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 20l4.2-1 9.8-9.8a2.2 2.2 0 0 0-3.1-3.1L5 15.9 4 20z" />
      </svg>
    ),
  },
  {
    id: "tree",
    label: "Cây ước",
    renderIcon: () => (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 14v7M9 21h6" />
        <circle cx="12" cy="9" r="5" />
      </svg>
    ),
  },
];

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="sticky bottom-0 shrink-0 bg-white/95 backdrop-blur-sm border-t-2 border-[#FFE0EC] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around relative z-20"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            type="button"
            data-bnav={item.id}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelectTab(item.id)}
            className={`btn-press cursor-pointer flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-2xl px-2.5 py-1.5 transition ${
              isActive
                ? "text-[#D63D76] bg-[#FFF0F5]"
                : "text-[#8C5A6E] hover:text-[#4A2C3A]"
            }`}
          >
            {item.renderIcon()}
            <span className="text-[11px] font-extrabold mt-0.5 leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
