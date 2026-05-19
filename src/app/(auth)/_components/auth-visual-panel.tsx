import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "PDF やテキストを登録",
    description: "卒論・スライド・メモをそのままアップロード",
  },
  {
    title: "AI が要約とタグを生成",
    description: "120字前後のあらすじと分野タグを自動で整理",
  },
  {
    title: "仲間に共有・質問・チャット",
    description: "プロジェクト単位で公開し、Q&A や DM でつながる",
  },
] as const;

function StepNumber({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        className,
      )}
      aria-hidden
    >
      {index + 1}
    </span>
  );
}

/** 左カラム：価値提案 + 3ステップ */
export function AuthVisualPanel() {
  return (
    <div className="relative w-full overflow-hidden p-6 sm:p-8 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:p-10 xl:p-14">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/5 blur-2xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-5 sm:gap-6 lg:mx-0 lg:max-w-lg lg:gap-8 xl:max-w-xl">
        <header className="space-y-3 lg:space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
            データサイエンス学科向け
          </p>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight xl:text-[2.35rem]">
            研究を登録して、
            <br />
            <span className="text-white/95">知識をつなぐ。</span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
            Academic Link は、研究の要点をわかりやすく残し、<br />
            学生同士で研究を共有するプラットフォームです。
          </p>
        </header>

        {/* モバイル：オレンジ上に半透明ステップ */}
        <ol className="space-y-3 lg:hidden">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-sm"
            >
              <StepNumber
                index={index}
                className="bg-white/20 text-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/75">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* デスクトップ：白カード */}
        <div className="al-auth-mock-card hidden w-full divide-y divide-[var(--al-border)]/80 lg:block">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex gap-4 p-5">
              <StepNumber
                index={index}
                className="bg-[var(--al-accent-soft)] text-[var(--al-accent)]"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-base font-semibold text-[var(--al-ink)]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--al-muted)]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
