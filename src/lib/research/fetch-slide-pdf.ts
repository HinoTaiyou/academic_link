import { toSlidePdfExportUrl } from "./slide-url";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/** 公開 Google スライドから PDF を取得（リンクを知っている全員が閲覧可 が必要） */
export async function fetchPdfFromGoogleSlides(
  slideViewUrl: string,
): Promise<Uint8Array> {
  const exportUrl = toSlidePdfExportUrl(slideViewUrl);
  if (!exportUrl) {
    throw new Error("Google スライドの URL 形式ではありません。");
  }

  const res = await fetch(exportUrl, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AcademicLink/1.0; +https://github.com/HinoTaiyou/academic_link)",
    },
  });

  if (!res.ok) {
    throw new Error(
      `スライドから PDF を取得できませんでした（HTTP ${res.status}）。共有設定を確認してください。`,
    );
  }

  const bytes = new Uint8Array(await res.arrayBuffer());

  if (!isPdfBytes(bytes)) {
    throw new Error(
      "スライドから PDF を取得できませんでした。Google スライドの共有を「リンクを知っている全員が閲覧可」にし、ブラウザで PDF ダウンロードできるか確認してください。",
    );
  }

  if (bytes.length > MAX_PDF_BYTES) {
    throw new Error(
      `取得した PDF が大きすぎます（最大 ${Math.floor(MAX_PDF_BYTES / 1024 / 1024)}MB）。`,
    );
  }

  if (bytes.length < 200) {
    throw new Error("取得した PDF が空に近いです。スライドの内容を確認してください。");
  }

  return bytes;
}
