"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarProject } from "@/lib/projects/load-sidebar-projects";

export function SidebarProjects({ projects }: { projects: SidebarProject[] }) {
  const pathname = usePathname();
  const currentProjectId = pathname.startsWith("/projects/")
    ? pathname.split("/")[2]?.split("?")[0]
    : null;

  return (
    <div className="mt-6">
      <p className="mb-2 px-2 text-xs font-medium text-[var(--al-muted)]">プロジェクト</p>

      {projects.length === 0 ? (
        <p className="px-2 text-xs text-[var(--al-muted)]">まだありません</p>
      ) : (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto pr-0.5">
          {projects.map((project) => {
            const active = currentProjectId === project.id;
            return (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                    active
                      ? "bg-white font-medium text-[var(--al-ink)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--al-accent)_25%,var(--al-border))]"
                      : "text-[var(--al-muted)] hover:bg-white/80 hover:text-[var(--al-ink)]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <FolderOpen
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-[var(--al-accent)]" : "text-[var(--al-muted)]",
                    )}
                    strokeWidth={1.75}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
