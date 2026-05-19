import { dsProgrammingTags } from "@/lib/constants/profile";
import { normTag, type MemberProfileRow } from "./match";

export type FilterTagOption = {
  tag: string;
  isMine: boolean;
  /** このタグを持つメンバー数 */
  memberCount: number;
};

export type FilterType = "interest" | "research";

function fieldFor(type: FilterType): "interest_tags" | "research_fields" {
  return type === "interest" ? "interest_tags" : "research_fields";
}

/** 絞り込みチップ用: 自分のタグ + 他メンバーが使っているタグ + 定番タグ */
export function buildFilterTagOptions(
  members: MemberProfileRow[],
  myTags: readonly string[],
  type: FilterType,
): FilterTagOption[] {
  const field = fieldFor(type);
  const counts = new Map<string, number>();

  for (const m of members) {
    const list = (m[field] ?? []) as string[];
    for (const raw of list) {
      const t = normTag(raw);
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const myNorm = new Set(
    myTags.map(normTag).filter(Boolean),
  );

  const union = new Set<string>([
    ...counts.keys(),
    ...myNorm,
    ...dsProgrammingTags,
  ]);

  const options: FilterTagOption[] = [...union].map((tag) => ({
    tag,
    isMine: myNorm.has(tag),
    memberCount: counts.get(tag) ?? 0,
  }));

  // 自分のタグ → 使われているタグ（多い順）→ 定番タグ
  options.sort((a, b) => {
    if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return a.tag.localeCompare(b.tag, "ja");
  });

  // 表示: 自分のタグは常に / 他は1人以上が持つ / 定番はメンバー0でも最大6件まで補完
  const visible = options.filter((o) => o.isMine || o.memberCount > 0);
  const visibleSet = new Set(visible.map((o) => o.tag));

  if (visible.length < 10) {
    for (const t of dsProgrammingTags) {
      if (visibleSet.has(t)) continue;
      visible.push({
        tag: t,
        isMine: myNorm.has(t),
        memberCount: counts.get(t) ?? 0,
      });
      visibleSet.add(t);
      if (visible.length >= 14) break;
    }
  }

  return visible.sort((a, b) => {
    if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return a.tag.localeCompare(b.tag, "ja");
  });
}

export function isAllowedFilterTag(
  tag: string,
  members: MemberProfileRow[],
  myInterest: readonly string[],
  myResearch: readonly string[],
  type: FilterType,
): boolean {
  const options = buildFilterTagOptions(
    members,
    type === "interest" ? myInterest : myResearch,
    type,
  );
  return options.some((o) => o.tag === normTag(tag));
}
