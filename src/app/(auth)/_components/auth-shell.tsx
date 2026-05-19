import type { ReactNode } from "react";
import { AuthVisualPanel } from "./auth-visual-panel";

type Props = {
  children: ReactNode;
};

/**
 * /login と /signup 共通：画面フル幅の2カラム（左ビジュアル / 右フォーム）
 */
export function AuthShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(160deg,var(--al-panel)_0%,var(--al-panel-deep)_100%)] lg:min-h-screen">
        <AuthVisualPanel />
      </div>

      <div className="flex flex-1 flex-col justify-center bg-[var(--al-surface-elevated)] px-6 py-10 sm:px-12 sm:py-14 lg:min-h-screen lg:px-16 lg:py-16 xl:px-20 2xl:px-28">
        <div className="mb-8 flex items-center gap-2.5 lg:mb-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--al-accent-soft)] text-xl">
            🎓
          </span>
          <span className="text-base font-semibold text-[var(--al-ink)]">
            Academic Link
          </span>
        </div>
        <div className="w-full max-w-xl lg:mx-0 2xl:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
