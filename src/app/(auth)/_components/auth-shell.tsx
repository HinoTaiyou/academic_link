import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * /login と /signup で共通の見た目（ヘッダーバー + ヒーロー + 背景）。
 * 中央に置かれる children は、ヒーローに少し食い込むように負の margin で持ち上げる。
 */
export function AuthShell({ children }: Props) {
  return (
    <div className="relative min-h-screen bg-[linear-gradient(135deg,#f5f7fa_0%,#c3cfe2_100%)] flex flex-col">
      <header className="bg-[linear-gradient(135deg,#1f77b4_0%,#2c3e50_100%)] px-6 py-4 sm:px-10 shadow-md">
        <div className="flex items-center gap-2 text-white">
          <span className="text-2xl">🎓</span>
          <span className="text-lg font-bold tracking-wide sm:text-xl">
            Academic Link
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#667eea_0%,#1f77b4_50%,#2c3e50_100%)] px-6 pt-20 pb-32 text-center text-white sm:pt-24 sm:pb-40">
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_30%_20%,white_0,transparent_40%),radial-gradient(circle_at_70%_70%,white_0,transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-3xl font-black leading-tight tracking-wide drop-shadow-lg sm:text-5xl md:text-6xl">
            知の継承と技術マッチング
          </h1>
        </div>
      </section>

      <main className="relative z-20 -mt-24 px-4 pb-16 sm:-mt-28">
        <div className="mx-auto flex w-full max-w-md justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
