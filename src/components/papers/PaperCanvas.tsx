import React from "react";
import type { PaperTemplateId } from "@/types/models";
import { getPaperTemplate } from "./paper-templates";

interface PaperCanvasProps {
  templateId: PaperTemplateId;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

function CornerAccent({ templateId }: { templateId: PaperTemplateId }) {
  if (templateId === "sakura-dashed") {
    return (
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <g transform="translate(16,16)">
          <ellipse cy="-6.5" rx="3.5" ry="5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.4" />
          <ellipse cy="-6.5" rx="3.5" ry="5" fill="#FFC5D9" stroke="#4A2C3A" strokeWidth="1.4" transform="rotate(72)" />
          <ellipse cy="-6.5" rx="3.5" ry="5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.4" transform="rotate(144)" />
          <ellipse cy="-6.5" rx="3.5" ry="5" fill="#FFC5D9" stroke="#4A2C3A" strokeWidth="1.4" transform="rotate(216)" />
          <ellipse cy="-6.5" rx="3.5" ry="5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.4" transform="rotate(288)" />
          <circle r="2.6" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.2" />
        </g>
      </svg>
    );
  }
  if (templateId === "piggy-plaid") {
    return (
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <path d="M6 12 Q5 5 12 9" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M26 12 Q27 5 20 9" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.4" strokeLinejoin="round" />
        <ellipse cx="16" cy="18" rx="10" ry="8" fill="#FFC8DC" stroke="#4A2C3A" strokeWidth="1.5" />
        <ellipse cx="16" cy="19.5" rx="4" ry="2.6" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.2" />
        <circle cx="11.5" cy="16" r="1.2" fill="#4A2C3A" />
        <circle cx="20.5" cy="16" r="1.2" fill="#4A2C3A" />
      </svg>
    );
  }
  if (templateId === "cloud-frame") {
    return (
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <path
          d="M7 22 Q4 22 4 18 Q4 14 8.5 14 Q10 9 16 10 Q21 9 23 14 Q28 14 28 18.5 Q28 22 24 22 Z"
          fill="#FFF5F8"
          stroke="#4A2C3A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (templateId === "botanical-garden") {
    return (
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <path d="M6 25 Q14 17 25 7" fill="none" stroke="#4A2C3A" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="12" cy="14" rx="5" ry="2.6" transform="rotate(-38 12 14)" fill="#BFE8CC" stroke="#4A2C3A" strokeWidth="1.3" />
        <ellipse cx="19" cy="18" rx="5" ry="2.6" transform="rotate(20 19 18)" fill="#A5E0B9" stroke="#4A2C3A" strokeWidth="1.3" />
      </svg>
    );
  }
  if (templateId === "strawberry-stripe") {
    return (
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <path d="M16 27 C9 25 7 16 10 11 C13 8 19 8 22 11 C25 16 23 25 16 27 Z" fill="#FF6F9C" stroke="#4A2C3A" strokeWidth="1.5" />
        <path d="M11 10.5 Q16 6.5 21 10.5 Q18 13 16 11 Q14 13 11 10.5 Z" fill="#8CD6A4" stroke="#4A2C3A" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-5 h-5 pointer-events-none shrink-0"
      aria-hidden="true"
    >
      <path
        d="M16 26 C8 21 6 15 6 12 A5.5 5.5 0 0 1 16 9 A5.5 5.5 0 0 1 26 12 C26 15 24 21 16 26 Z"
        fill="#FF8FB8"
        stroke="#4A2C3A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaperCanvas({
  templateId,
  children,
  className = "",
  innerClassName = "",
}: PaperCanvasProps) {
  const tpl = getPaperTemplate(templateId);

  return (
    <div
      data-paper-template={tpl.id}
      className={`rounded-[22px] p-2 k-shadow ${tpl.outerClass} ${className}`}
    >
      <div
        className={`rounded-[17px] p-3 relative overflow-hidden ${tpl.innerClass} ${innerClassName}`}
      >
        <div className="absolute top-2 right-2 z-0 opacity-85 pointer-events-none">
          <CornerAccent templateId={tpl.id} />
        </div>
        <div className="relative z-10 h-full">{children}</div>
      </div>
    </div>
  );
}
