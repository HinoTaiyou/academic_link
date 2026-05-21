"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { AppSidebar, type SidebarProfile } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/client";

type Props = {
  profile: SidebarProfile;
  active?: "dashboard" | "profile" | "members" | "research" | "research_search" | "chat" | "bookmarks";
  quickProjects?: Array<{ id: string; name: string; pinned?: boolean }>;
  children: React.ReactNode;
};

export function AppShell({ profile, active, quickProjects, children }: Props) {
  const [open, setOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    // fetch unread count for chat and subscribe to message changes
    const supabase = createClient();
    let mounted = true;

    async function refresh() {
      try {
        const res = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("to_id", profile.id)
          .is("read_at", null);
        if (mounted) setChatUnreadCount(res.count ?? 0);
      } catch (e) {
        // ignore
      }
    }

    refresh();

    const channel = supabase
      .channel(`chat-unread-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          refresh();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  return (
    <div className="al-page-mesh min-h-screen">
      <div className="fixed inset-y-0 left-0 z-20 hidden w-60 sm:block">
        <AppSidebar profile={profile} active={active} quickProjects={quickProjects} />
      </div>

      <div className="flex min-h-screen flex-col sm:pl-60">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:hidden">
          <button
            type="button"
            aria-label="メニューを開く"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <GraduationCap className="h-4 w-4 text-[var(--al-accent)]" strokeWidth={1.75} aria-hidden />
            <span>Academic Link</span>
          </span>
          <span className="w-9" aria-hidden />
        </header>

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex sm:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative z-10 flex h-full w-72 max-w-[80%]">
            <AppSidebar profile={profile} active={active} quickProjects={quickProjects} />
            <button
              type="button"
              aria-label="メニューを閉じる"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 rounded-md p-1 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
