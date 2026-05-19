import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** テラコッタ系フォルダ（--al-accent ベース） */
const FOLDER_PALETTES = [
  { back: "#a85538", front: "#e8b89a" },
  { back: "#b85e42", front: "#edc9b0" },
  { back: "#c96b4a", front: "#f2d4c4" },
] as const;

/** ホバーで飛び出すプレビュー用紙（白地） */
const PAPER_THEME = {
  fill: "#ffffff",
  stroke: "rgba(201, 107, 74, 0.22)",
  accent: "#c96b4a",
  line: "rgba(201, 107, 74, 0.28)",
} as const;

const SIZE_STYLES = {
  md: {
    icon: "block h-[6.5rem] w-[8.25rem] shrink-0",
    label: "max-w-[8.25rem] text-sm",
    column: "w-[8.25rem]",
    tileIcon: "block h-[5.5rem] w-[6.75rem] shrink-0",
  },
  sm: {
    icon: "block h-[5.25rem] w-[6.5rem] shrink-0",
    label: "max-w-[6.5rem] text-sm",
    column: "w-[6.5rem]",
    tileIcon: "block h-[5rem] w-[6.25rem] shrink-0",
  },
} as const;

export type FolderCardProps = {
  title: string;
  fileCount: number;
  href?: string;
  className?: string;
  footer?: ReactNode;
  index?: number;
  pinned?: boolean;
  size?: keyof typeof SIZE_STYLES;
  /** カード型（プロフィールの資料グリッド向け） */
  layout?: "inline" | "tile";
};

function FolderIcon({
  index,
  iconClass,
}: {
  index: number;
  iconClass: string;
}) {
  const { back, front } = FOLDER_PALETTES[index % FOLDER_PALETTES.length];
  const paper = PAPER_THEME;

  return (
    <div className="al-folder-icon-wrap relative shrink-0 overflow-visible">
      <svg
        viewBox="0 0 120 96"
        preserveAspectRatio="xMidYMid meet"
        className={cn(
          "overflow-visible drop-shadow-[0_3px_8px_rgba(168,85,56,0.15)]",
          iconClass,
        )}
        aria-hidden
      >
        <path
          fill={back}
          d="M8 24V14c0-3.3 2.7-6 6-6h24c2.6 0 4.9 1.7 5.7 4.2L49 22h55c4.4 0 8 3.6 8 8v50c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V24z"
        />

        <g className="al-folder-paper al-folder-paper-1">
          <rect
            x="18"
            y="17"
            width="50"
            height="36"
            rx="3"
            fill={paper.fill}
            stroke={paper.stroke}
            strokeWidth="1"
          />
          <circle cx="28" cy="27" r="2.5" fill={paper.accent} />
          <circle cx="36" cy="27" r="2.5" fill={paper.accent} opacity={0.7} />
          <circle cx="44" cy="27" r="2.5" fill={paper.accent} opacity={0.45} />
        </g>

        <g className="al-folder-paper al-folder-paper-2">
          <rect
            x="28"
            y="12"
            width="52"
            height="40"
            rx="3"
            fill={paper.fill}
            stroke={paper.stroke}
            strokeWidth="1"
          />
          <rect x="36" y="22" width="36" height="8" rx="2" fill={paper.accent} opacity={0.85} />
          <line
            x1="36"
            y1="34"
            x2="68"
            y2="34"
            stroke={paper.line}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        <g className="al-folder-paper al-folder-paper-3">
          <rect
            x="36"
            y="10"
            width="48"
            height="42"
            rx="3"
            fill={paper.fill}
            stroke={paper.stroke}
            strokeWidth="1"
          />
          <rect
            x="42"
            y="16"
            width="36"
            height="20"
            rx="2"
            fill={paper.accent}
            opacity={0.35}
          />
          <line
            x1="42"
            y1="40"
            x2="72"
            y2="40"
            stroke={paper.line}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        <path
          d="M8 35c0-4.4 3.6-8 8-8h88c4.4 0 8 3.6 8 8v43c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V35z"
          fill="rgba(0,0,0,0.07)"
        />

        <path
          className="al-folder-front"
          fill={front}
          d="M8 37c0-4.4 3.6-8 8-8h88c4.4 0 8 3.6 8 8v41c0 4.4-3.6 8-8 8H16c-4.4 0-8-3.6-8-8V37z"
        />
      </svg>
    </div>
  );
}

export function FolderCard({
  title,
  href,
  className,
  footer,
  index = 0,
  pinned = false,
  size = "md",
  layout = "inline",
}: FolderCardProps) {
  const interactive = Boolean(href);
  const display = (pinned ? title : title).trim() || "Untitled";
  const sizeStyle = SIZE_STYLES[size];
  const isTile = layout === "tile";
  const iconClass = isTile ? sizeStyle.tileIcon : sizeStyle.icon;

  const titleClass = isTile
    ? "mt-3 line-clamp-2 w-full text-center text-sm font-semibold leading-snug tracking-tight text-[var(--al-ink)]"
    : cn(
        "line-clamp-2 text-left font-medium leading-snug text-[var(--al-ink)]",
        sizeStyle.label,
      );

  const inner = (
    <>
      <FolderIcon index={index} iconClass={iconClass} />
      <p className={titleClass}>{display}</p>
    </>
  );

  const shellClass = cn(
    isTile
      ? "flex w-full flex-col items-center overflow-visible"
      : "flex w-fit min-w-0 flex-col items-start gap-1.5 overflow-visible",
    interactive &&
      "al-folder-card-group cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent)]",
    !footer ? className : isTile ? undefined : className,
  );

  const card = href ? (
    href.startsWith("http") ? (
      <a href={href} target="_blank" rel="noreferrer" className={shellClass}>
        {inner}
      </a>
    ) : (
      <Link href={href} className={shellClass}>
        {inner}
      </Link>
    )
  ) : (
    <div className={shellClass}>{inner}</div>
  );

  if (!footer) {
    if (isTile) {
      return (
        <div className={cn("al-folder-tile w-full", className)}>{card}</div>
      );
    }
    return card;
  }

  if (isTile) {
    return (
      <article className={cn("al-folder-tile flex w-full flex-col gap-3", className)}>
        {card}
        <div className="w-full min-w-0 pt-0.5">{footer}</div>
      </article>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 overflow-visible",
        sizeStyle.column,
        className,
      )}
    >
      {card}
      <div className="w-full min-w-0">{footer}</div>
    </div>
  );
}
