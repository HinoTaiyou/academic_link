"use client";

import { useState, type ReactNode } from "react";
import {
  ExternalLink,
  FileText,
  FileUp,
  Presentation,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "original" | "summary";

type Props = {
  summary: string;
  tags?: string[];
  slideViewUrl?: string | null;
  pdfUrl?: string | null;
  /** 記録されているファイル名（PDF 未保存のときの案内用） */
  fileName?: string | null;
  sourceType?: string;
  className?: string;
};

export function ResearchMaterialPanel({
  summary,
  tags = [],
  slideViewUrl,
  pdfUrl,
  fileName,
  sourceType,
  className,
}: Props) {
  const hasPdf = Boolean(pdfUrl);
  const hasSlide = Boolean(slideViewUrl?.trim());
  const hasOriginal = Boolean(hasSlide || hasPdf || sourceType === "text");
  const hasSummary = Boolean(summary?.trim());
  const [tab, setTab] = useState<TabId>(hasSummary ? "summary" : "original");

  if (!hasOriginal && !hasSummary) {
    return (
      <p className={cn("text-sm text-[var(--al-muted)]", className)}>
        表示できる内容がありません。
      </p>
    );
  }

  const showTabs = hasOriginal && hasSummary;

  function handleOriginalTab() {
    setTab("original");
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showTabs ? (
        <div
          role="tablist"
          aria-label="資料の表示切替"
          className="inline-flex rounded-lg bg-[var(--al-surface)] p-1 ring-1 ring-[var(--al-border)]"
        >
          <TabButton
            active={tab === "original"}
            onClick={handleOriginalTab}
            icon={FileText}
          >
            原本を表示
          </TabButton>
          <TabButton
            active={tab === "summary"}
            onClick={() => setTab("summary")}
            icon={Sparkles}
          >
            AI要約
          </TabButton>
        </div>
      ) : (
        <p className="text-xs font-medium text-[var(--al-muted)]">
          {hasOriginal ? "原本" : "AI要約"}
        </p>
      )}

      {tab === "original" && hasOriginal ? (
        <OriginalPane
          slideViewUrl={slideViewUrl}
          pdfUrl={pdfUrl}
          fileName={fileName}
          sourceType={sourceType}
        />
      ) : null}

      {tab === "summary" && hasSummary ? (
        <SummaryPane summary={summary} tags={tags} />
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-white text-[var(--al-ink)] shadow-sm ring-1 ring-[var(--al-border)]"
          : "text-[var(--al-muted)] hover:text-[var(--al-ink)]",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {children}
    </button>
  );
}

function OriginalPane({
  slideViewUrl,
  pdfUrl,
  fileName,
  sourceType,
}: {
  slideViewUrl?: string | null;
  pdfUrl?: string | null;
  fileName?: string | null;
  sourceType?: string;
}) {
  const slideHref = slideViewUrl?.trim() || null;
  const isSlideMaterial = Boolean(slideHref);
  const pdfFileLabel = fileName?.trim() || "原本のPDF";
  const showPdfMissing = !pdfUrl && !isSlideMaterial && sourceType === "text";

  return (
    <div className="space-y-3">
      {pdfUrl && !isSlideMaterial ? (
        <OriginalOpenLink
          href={pdfUrl}
          icon={FileUp}
          label={`${pdfFileLabel}を開く`}
          description="クリックすると新しいタブで PDF が開きます。"
        />
      ) : null}

      {showPdfMissing ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <p className="font-medium">原本の PDF が保存されていません</p>
          <p className="mt-2 text-xs text-amber-900/90">
            テキストだけで登録された資料です。長文は「AI要約」タブで確認するか、研究登録の
            <strong> テキスト </strong>
            モードで同じ内容と<strong> 原本の PDF（任意） </strong>
            を添付して登録し直してください。
          </p>
          {fileName ? (
            <p className="mt-2 text-xs text-amber-800">
              記録されているファイル名: {fileName}
            </p>
          ) : null}
        </section>
      ) : null}

      {slideHref ? (
        <OriginalOpenLink
          href={slideHref}
          icon={Presentation}
          label="スライドを開く"
          description="Google スライドを新しいタブで表示します。"
        />
      ) : null}

      {(pdfUrl && !isSlideMaterial) || slideHref ? (
        <p className="text-[11px] leading-relaxed text-[var(--al-muted)]">
          {isSlideMaterial
            ? "下のボタンでスライドを開けます。要点は「AI要約」タブをご利用ください。"
            : "下のボタンで PDF を開けます。要点は「AI要約」タブをご利用ください。"}
        </p>
      ) : null}
    </div>
  );
}

function OriginalOpenLink({
  href,
  icon: Icon,
  label,
  description,
  variant = "primary",
}: {
  href: string;
  icon: typeof FileUp;
  label: string;
  description: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 transition",
        variant === "primary"
          ? "border-[color-mix(in_srgb,var(--al-accent)_30%,var(--al-border))] bg-[var(--al-accent-soft)]/40 hover:bg-[var(--al-accent-soft)]/70"
          : "border-[var(--al-border)] bg-white hover:bg-[var(--al-surface)]",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
          variant === "primary"
            ? "bg-white text-[var(--al-accent)] ring-[var(--al-border)]"
            : "bg-[var(--al-surface)] text-[var(--al-muted)] ring-[var(--al-border)]",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--al-ink)]">
          {label}
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--al-accent)]" aria-hidden />
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-[var(--al-muted)]">
          {description}
        </span>
      </span>
    </a>
  );
}

function SummaryPane({ summary, tags }: { summary: string; tags: string[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--al-accent)_18%,var(--al-border))] bg-[linear-gradient(165deg,var(--al-accent-soft)_0%,#fff_45%)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--al-border)]/80 px-3 py-2">
        <Sparkles
          className="h-3.5 w-3.5 text-[var(--al-accent)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="text-[11px] font-medium text-[var(--al-ink)]">AI要約</span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--al-ink)]">
          {summary}
        </p>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--al-border)]/60 pt-3">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-[var(--al-accent)] ring-1 ring-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))]"
              >
                #{t.replace(/^#/, "")}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

