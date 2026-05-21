import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  FlaskConical,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  Search,
  User,
} from "lucide-react";
import type { SidebarProject } from "@/lib/projects/load-sidebar-projects";
import { SidebarProjects } from "@/components/layout/sidebar-projects";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export type SidebarProfile = { id: string };

export type SidebarNavKey =
  | "dashboard"
  | "profile"
  | "members"
  | "research"
  | "research_search"
  | "chat"
  | "bookmarks";

type Props = {
  profile: SidebarProfile;
  active?: SidebarNavKey;
  className?: string;
  quickProjects?: SidebarProject[];
  chatUnreadCount?: number;
};

function navItems(profileId: string): Array<{
  key: SidebarNavKey;
  href: string;
  label: string;
  icon: LucideIcon;
}> {
  return [
    { key: "dashboard", href: "/dashboard", label: "ホーム", icon: Home },
    { key: "research", href: "/research/new", label: "研究登録", icon: FlaskConical },
    { key: "members", href: "/members", label: "メンバー検索", icon: Search },
    { key: "research_search", href: "/research/search", label: "研究検索", icon: Search },
    { key: "bookmarks", href: "/bookmarks", label: "保存", icon: Bookmark },
    { key: "profile", href: `/u/${profileId}`, label: "プロフィール", icon: User },
    { key: "chat", href: "/chat", label: "チャット", icon: MessageSquare },
  ];
}

export function AppSidebar({
  profile,
  active,
  className,
  quickProjects = [],
  chatUnreadCount = 0,
}: Props) {
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
        {navItems(profile.id).map((item) => (
          <NavItem
            key={item.key}
            href={item.href}
            icon={item.icon}
            active={active === item.key}
            badgeCount={item.key === "chat" ? chatUnreadCount : undefined}
          >
            {item.label}
          </NavItem>
        ))}

        <SidebarProjects projects={quickProjects} />
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
  children,
  badgeCount,
}: {
  href: string;
  icon: LucideIcon;
  active?: boolean;
  children: React.ReactNode;
  badgeCount?: number;
}) {
  const base =
    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors";
  const stateCls = active
    ? "bg-white font-medium text-[var(--al-ink)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))]"
    : "font-normal text-[var(--al-muted)] hover:bg-white/80 hover:text-[var(--al-ink)]";

  return (
    <Link href={href} className={cn(base, stateCls)}>
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="flex items-center gap-2">
        <span>{children}</span>
        {badgeCount && badgeCount > 0 ? (
          <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--al-accent)] px-2 text-xs font-semibold text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
