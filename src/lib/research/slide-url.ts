export type SlidePresentationRef =
  | { kind: "standard"; id: string }
  | { kind: "published"; id: string };

/** 共有リンクからプレゼン ID を取り出す */
export function parseSlidePresentationRef(raw: string): SlidePresentationRef | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "docs.google.com" || !url.pathname.includes("/presentation/")) {
      return null;
    }

    const published = url.pathname.match(/\/presentation\/d\/e\/([^/]+)/);
    if (published) return { kind: "published", id: published[1] };

    const standard = url.pathname.match(/\/presentation\/d\/([^/]+)/);
    if (standard && standard[1] !== "e") {
      return { kind: "standard", id: standard[1] };
    }
  } catch {
    return null;
  }

  return null;
}

/** Google スライドを PDF としてエクスポートする URL（公開共有が必要） */
export function toSlidePdfExportUrl(raw: string): string | null {
  const ref = parseSlidePresentationRef(raw);
  if (!ref) return null;

  if (ref.kind === "published") {
    return `https://docs.google.com/presentation/d/e/${ref.id}/export/pdf`;
  }
  return `https://docs.google.com/presentation/d/${ref.id}/export/pdf`;
}

/** Google Slides / 公開プレゼン URL を iframe 用 embed URL に正規化する */
export function toSlideEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    const ref = parseSlidePresentationRef(trimmed);
    if (ref?.kind === "published") {
      return `https://docs.google.com/presentation/d/e/${ref.id}/embed`;
    }
    if (ref?.kind === "standard") {
      return `https://docs.google.com/presentation/d/${ref.id}/embed`;
    }

    if (host.endsWith("canva.com") && url.pathname.includes("/view")) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

export function isLikelySlideViewUrl(raw: string): boolean {
  return toSlideEmbedUrl(raw) !== null;
}
