import type { ReactNode } from "react";
import { logoutAction } from "@/lib/auth/actions";

type Props = {
  children: ReactNode;
};

/** オンボーディング専用：1カラム（左オレンジパネルなし） */
export function OnboardingShell({ children }: Props) {
  return (
    <div className="al-page-mesh flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:px-8 sm:py-12 lg:py-16">
        <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--al-accent-soft)] text-xl">
              🎓
            </span>
            <span className="text-base font-semibold text-[var(--al-ink)]">
              Academic Link
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-[var(--al-muted)] underline-offset-4 hover:text-[var(--al-accent)] hover:underline"
            >
              ログアウト
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}
