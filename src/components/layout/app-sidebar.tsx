import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  FlaskConical,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  Pin,
  Search,
  User,
} from "lucide-react";
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

type NavKey = "dashboard" | "profile" | "members" | "research" | "research_search" | "chat" | "bookmarks";

type Props = {
  profile: SidebarProfile;
  active?: NavKey;
  className?: string;
  quickProjects?: Array<{ id: string; name: string; pinned?: boolean }>;
};

const NAV_ITEMS: Array<{
  key: NavKey;
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "dashboard", href: "/dashboard", label: "ホーム", icon: Home },
  { key: "research_search", href: "/research/search", label: "研究検索", icon: Search },
  { key: "research", href: "/research/new", label: "研究を登録", icon: FlaskConical },
  { key: "bookmarks", href: "/bookmarks", label: "保存", icon: Bookmark },
  { key: "chat", href: "/chat", label: "チャット", icon: MessageSquare },
  { key: "members", href: "/members", label: "メンバー検索", icon: Search },
];

export function AppSidebar({ profile, active, className, quickProjects }: Props) {
  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-[color-mix(in_srgb,var(--al-accent)_18%,var(--al-border))] bg-[linear-gradient(180deg,#f8ebe6_0%,var(--al-accent-soft)_45%,#f5ebe6_100%)] px-4 pb-5 pt-8 text-[var(--al-ink)]",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="mt-1 flex items-center gap-2.5 px-2 text-[15px] font-semibold tracking-tight text-[var(--al-ink)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-[var(--al-accent)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--al-accent)_15%,var(--al-border))]">
          <GraduationCap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <span>Academic Link</span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <p className="mb-2 px-2 text-xs font-medium text-[var(--al-muted)]">
          一般
        </p>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            href={item.href}
            icon={item.icon}
            active={active === item.key}
          >
            {item.label}
          </NavItem>
        ))}
        <NavItem
          href={`/u/${profile.id}`}
          icon={User}
          active={active === "profile"}
        >
          プロフィール
        </NavItem>

        {quickProjects && quickProjects.length > 0 ? (
          <>
            <p className="mb-2 mt-6 px-2 text-xs font-medium text-[var(--al-muted)]">
              プロジェクト
            </p>
            {quickProjects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/research/new?projectId=${project.id}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-[var(--al-muted)] transition-colors hover:bg-white/80 hover:text-[var(--al-ink)]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[var(--al-accent)] opacity-70"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                {project.pinned ? (
                  <Pin
                    className="h-3.5 w-3.5 shrink-0 text-[var(--al-accent)]"
                    strokeWidth={1.75}
                    aria-label="ピン留め"
                  />
                ) : null}
              </Link>
            ))}
          </>
        ) : null}
      </nav>

      <div className="mt-4 border-t border-[color-mix(in_srgb,var(--al-accent)_12%,var(--al-border))] pt-4">
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start gap-2.5 px-2 text-sm font-normal text-[var(--al-muted)] hover:bg-white/80 hover:text-[var(--al-ink)]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  active,
  disabled,
  children,
}: {
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const base =
    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors";
  const stateCls = disabled
    ? "cursor-not-allowed text-[var(--al-muted)] opacity-50"
    : active
      ? "bg-white font-medium text-[var(--al-ink)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))]"
      : "font-normal text-[var(--al-muted)] hover:bg-white/80 hover:text-[var(--al-ink)]";

  const content = (
    <>
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <span>{children}</span>
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
