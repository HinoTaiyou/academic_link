import { cn } from "@/lib/utils";

/** ホーム（ニュース）と同じメインコンテンツ幅。サイドバー配下のページで共通利用 */
export const APP_MAIN_CLASS =
  "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function AppMain({ children, className }: Props) {
  return <div className={cn(APP_MAIN_CLASS, className)}>{children}</div>;
}
