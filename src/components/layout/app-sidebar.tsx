import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export type SidebarProfile = {
  id: string;
  realName: string | null;
  department: string | null;
  grade: string | null;
  interestTags: string[];
  email: string | null;
};

type NavKey = "dashboard" | "profile" | "members" | "research" | "chat";

type Props = {
  profile: SidebarProfile;
  active?: NavKey;
  /** モバイルドロワー利用時：閉じる用に追加クラスを指定可 */
  className?: string;
};

export function AppSidebar({ profile, active, className }: Props) {
  const displayName =
    profile.realName?.trim() || profile.email || "ユーザー";
  const initial = displayName.slice(0, 1).toUpperCase();
  const sub = [profile.department, profile.grade].filter(Boolean).join(" / ");

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col gap-4 bg-[linear-gradient(180deg,#1f1147_0%,#2b1a5a_100%)] p-5 text-slate-100",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-base font-bold text-white"
      >
        <span className="text-xl">🎓</span>
        <span>Academic Link</span>
      </Link>

      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-base font-bold text-white shadow">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            {sub ? (
              <p className="truncate text-[11px] text-slate-300">{sub}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            興味タグ
          </p>
          {profile.interestTags.length === 0 ? (
            <p className="mt-1 text-[11px] text-slate-400">未設定</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.interestTags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10.5px] font-medium text-white"
                >
                  #{t.replace(/^#/, "")}
                </span>
              ))}
              {profile.interestTags.length > 8 ? (
                <span className="text-[10.5px] text-slate-300">
                  +{profile.interestTags.length - 8}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          メニュー
        </p>
        <NavItem href="/dashboard" icon="🏠" active={active === "dashboard"}>
          ホーム
        </NavItem>
        <NavItem
          href="/research/new"
          icon="📝"
          active={active === "research"}
        >
          研究を登録
        </NavItem>
        <NavItem href="/chat" icon="💬" active={active === "chat"}>
          チャット
        </NavItem>
        <NavItem href="/members" icon="🔍" active={active === "members"}>
          メンバー検索
        </NavItem>
        <NavItem
          href={`/u/${profile.id}`}
          icon="👤"
          active={active === "profile"}
        >
          プロフィール
        </NavItem>
        
      </nav>

      <div className="mt-auto pt-4">
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full border-white/20 bg-white/0 text-white hover:bg-white/10 hover:text-white"
          >
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  active,
  disabled,
  hint,
  children,
}: {
  href?: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const base =
    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors";
  const stateCls = disabled
    ? "cursor-not-allowed text-slate-400"
    : active
      ? "bg-white/15 font-semibold text-white"
      : "text-slate-200 hover:bg-white/10 hover:text-white";

  const content = (
    <>
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none">
          {icon}
        </span>
        <span>{children}</span>
      </span>
      {hint ? (
        <span className="text-[10px] uppercase tracking-wider text-slate-400">
          {hint}
        </span>
      ) : null}
    </>
  );

  if (disabled || !href) {
    return (
      <div className={cn(base, stateCls)} aria-disabled>
        {content}
      </div>
    );
  }
  return (
    <Link href={href} className={cn(base, stateCls)}>
      {content}
    </Link>
  );
}
