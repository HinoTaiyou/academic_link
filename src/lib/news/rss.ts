import { XMLParser } from "fast-xml-parser";

export type RawRssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  source?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

/**
 * Google News などの RSS XML を取得して item の配列にする。
 * Next.js の fetch キャッシュを利用して revalidate 秒ごとにだけ実体取得する。
 */
export async function fetchRss(
  url: string,
  revalidateSeconds: number,
): Promise<RawRssItem[]> {
  let xml: string;
  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: {
        // Google News は UA を見て XML を返さないことがある
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) AcademicLink/1.0",
      },
    });
    if (!res.ok) {
      console.warn("rss fetch non-200", url, res.status);
      return [];
    }
    xml = await res.text();
  } catch (err) {
    console.warn("rss fetch failed", url, err);
    return [];
  }

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch (err) {
    console.warn("rss parse failed", url, err);
    return [];
  }

  const channel = (parsed as { rss?: { channel?: unknown } } | undefined)?.rss
    ?.channel;
  const itemsRaw = (channel as { item?: unknown } | undefined)?.item;
  if (!itemsRaw) return [];
  const itemArray = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

  return itemArray.map(toRawRssItem).filter((x): x is RawRssItem => x !== null);
}

function toRawRssItem(node: unknown): RawRssItem | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  const title = readText(obj.title);
  const link = readText(obj.link);
  if (!title || !link) return null;

  return {
    title,
    link,
    description: readText(obj.description) ?? "",
    pubDate: readText(obj.pubDate) ?? undefined,
    source: readText(obj.source) ?? undefined,
  };
}

function readText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const t = (value as Record<string, unknown>)["#text"];
    if (typeof t === "string") return t;
    if (typeof t === "number") return String(t);
  }
  return null;
}
