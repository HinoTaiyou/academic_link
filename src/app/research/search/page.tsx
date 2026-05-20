import ResearchSearch from "@/components/search/research-search";

export const metadata = { title: "研究検索 | Academic Link" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">研究検索</h1>
      <div className="mt-4">
        <ResearchSearch />
      </div>
    </div>
  );
}
