/**
 * Supabase `profiles` の興味タグ・研究分野がまだ空ならオンボーディングが必要。
 * （サインアップ直後はトリガで行があるが、どちらも配列が空のことが多い）
 */
export function isOnboardingIncomplete(profile: {
  interest_tags: string[] | null;
  research_fields: string[] | null;
} | null): boolean {
  if (!profile) return true;
  const i = profile.interest_tags?.length ?? 0;
  const r = profile.research_fields?.length ?? 0;
  return i === 0 && r === 0;
}
