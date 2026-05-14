import Link from "next/link";
import type { ScoredMember } from "../_lib/match";

type Props = {
  member: ScoredMember;
};

export function MemberCard({ member }: Props) {
  const name = member.real_name?.trim() || "（名前未設定）";
  const initial = name.slice(0, 1);
  const sub = [member.department, member.grade].filter(Boolean).join(" / ");

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#667eea]/40 hover:shadow-md">
      <Link href={`/u/${member.id}`} className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-lg font-bold text-white shadow-sm">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 group-hover:text-[#667eea]">
            {name}
          </p>
          {sub ? (
            <p className="truncate text-xs text-slate-500">{sub}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-center text-[10px] font-semibold text-[#667eea] ring-1 ring-violet-200">
            💛 共通 {member.interestOverlap}
          </span>
          {member.researchOverlap > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-center text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
              🔬 共通 {member.researchOverlap}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="space-y-1.5">
        {member.interest_tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {member.interest_tags.slice(0, 4).map((t) => (
              <span
                key={`i-${t}`}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-[#667eea]"
              >
                {t}
              </span>
            ))}
            {member.interest_tags.length > 4 ? (
              <span className="text-[10px] text-slate-400">
                +{member.interest_tags.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}
        {member.research_fields.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {member.research_fields.slice(0, 4).map((t) => (
              <span
                key={`r-${t}`}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600"
              >
                🔬{t}
              </span>
            ))}
            {member.research_fields.length > 4 ? (
              <span className="text-[10px] text-slate-400">
                +{member.research_fields.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/chat/${member.id}`}
          className="shrink-0 rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:shadow-md hover:brightness-110"
        >
          💬 メッセージ
        </Link>
      </div>
    </div>
  );
}
