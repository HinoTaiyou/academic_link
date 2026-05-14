/**
 * サーバーで PDF からテキストを抽出する。
 * unpdf は pdfjs-dist ベースの軽量ラッパで、ネイティブ依存なしで動く。
 */
export async function extractPdfText(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const doc = await getDocumentProxy(bytes);
  const result = await extractText(doc, { mergePages: true });
  const raw: string = Array.isArray(result.text)
    ? result.text.join("\n")
    : String(result.text);
  return raw
    .replace(/\u0000/g, "")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}
