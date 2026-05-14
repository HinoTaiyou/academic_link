export type MemberProfileRow = {
  id: string;
  real_name: string | null;
  department: string | null;
  grade: string | null;
  interest_tags: string[] | null;
  research_fields: string[] | null;
};

export type ScoredMember = Omit<
  MemberProfileRow,
  "interest_tags" | "research_fields"
> & {
  interest_tags: string[];
  research_fields: string[];
  interestOverlap: number;
  researchOverlap: number;
};

function normTag(t: string): string {
  return t.replace(/^#/, "").trim();
}

export function countOverlap(a: string[], b: string[]): number {
  const setB = new Set(b.map(normTag));
  return a.filter((x) => setB.has(normTag(x))).length;
}

export function scoreMember(
  myInterest: string[],
  myResearch: string[],
  row: MemberProfileRow,
): ScoredMember {
  const interests = row.interest_tags ?? [];
  const research = row.research_fields ?? [];
  return {
    ...row,
    interest_tags: interests,
    research_fields: research,
    interestOverlap: countOverlap(myInterest, interests),
    researchOverlap: countOverlap(myResearch, research),
  };
}

export function sortMembers(a: ScoredMember, b: ScoredMember): number {
  if (b.interestOverlap !== a.interestOverlap) {
    return b.interestOverlap - a.interestOverlap;
  }
  if (b.researchOverlap !== a.researchOverlap) {
    return b.researchOverlap - a.researchOverlap;
  }
  const an = (a.real_name ?? "").trim() || "zzz";
  const bn = (b.real_name ?? "").trim() || "zzz";
  return an.localeCompare(bn, "ja");
}
