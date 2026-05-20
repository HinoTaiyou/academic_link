"use client";

import { useState } from "react";
import Link from "next/link";

type ProfileBookmark = { id: string; real_name: string | null; department: string | null; grade: string | null };
type ResearchBookmark = { id: string; title: string; summary: string | null };
type ProjectBookmark = { id: string; name: string; description: string | null };
type FileBookmark = { id: string; title: string; summary: string | null; project_id: string };

export default function BookmarkTabs({
  profiles,
  posts,
  projects,
  files,
}: {
  profiles: ProfileBookmark[];
  posts: ResearchBookmark[];
  projects: ProjectBookmark[];
  files: FileBookmark[];
}) {
  const tabs = [
    { key: "profiles", label: "研究者", count: profiles.length },
    { key: "research", label: "研究", count: posts.length },
    { key: "projects", label: "プロジェクト", count: projects.length },
    { key: "files", label: "資料", count: files.length },
  ] as const;

  const [active, setActive] = useState<typeof tabs[number]["key"]>("profiles");

  return (
    <div>
      <nav className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1 text-sm rounded-md ${active === t.key ? "bg-white text-[var(--al-ink)] shadow-sm" : "text-[var(--al-muted)] hover:bg-white/80"}`}
          >
            {t.label} {t.count > 0 ? <span className="ml-1 text-xs">({t.count})</span> : null}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {active === "profiles" ? (
          <div className="space-y-3">
            {profiles.length === 0 ? (
              <p className="text-sm text-[var(--al-muted)]">フォロー中の研究者はいません。</p>
            ) : (
              profiles.map((p) => (
                <article key={p.id} className="al-project-card">
                  <h3 className="text-lg font-semibold">{p.real_name ?? "（名前未設定）"}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{[p.department, p.grade].filter(Boolean).join(" ・ ") || "所属情報なし"}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <Link href={`/u/${p.id}`} className="text-sm text-[var(--al-accent)]">プロフィール</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {active === "research" ? (
          <div className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-sm text-[var(--al-muted)]">ブックマークされた研究がありません。</p>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="al-project-card">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{p.summary}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <Link href={`/research/${p.id}`} className="text-sm text-[var(--al-accent)]">表示</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {active === "projects" ? (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-[var(--al-muted)]">ブックマークされたプロジェクトはありません。</p>
            ) : (
              projects.map((pr) => (
                <article key={pr.id} className="al-project-card">
                  <h3 className="text-lg font-semibold">{pr.name}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{pr.description}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <Link href={`/projects/${pr.id}`} className="text-sm text-[var(--al-accent)]">表示</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}

        {active === "files" ? (
          <div className="space-y-3">
            {files.length === 0 ? (
              <p className="text-sm text-[var(--al-muted)]">ブックマークされた資料はありません。</p>
            ) : (
              files.map((f) => (
                <article key={f.id} className="al-project-card">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-[var(--al-muted)]">{f.summary}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <Link href={`/projects/${f.project_id}`} className="text-sm text-[var(--al-accent)]">表示</Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
