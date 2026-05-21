/** Storage アップロード失敗をユーザー向けメッセージに変換 */
export function pdfStorageErrorMessage(error: unknown): string {
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : error instanceof Error
        ? error.message
        : "不明なエラー";

  const lower = msg.toLowerCase();

  if (lower.includes("bucket") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return [
      "Storage バケット「research-pdfs」がありません。",
      "Supabase ダッシュボード → Storage → New bucket → 名前を research-pdfs（Private）で作成してください。",
      "作成後、supabase/storage-research-pdfs.sql を SQL Editor で実行してください。",
    ].join(" ");
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("violates") ||
    lower.includes("403") ||
    lower.includes("unauthorized")
  ) {
    return [
      "PDF の保存権限がありません（Storage のポリシー未設定の可能性）。",
      "Supabase → SQL Editor で supabase/storage-research-pdfs.sql を実行してください。",
      `詳細: ${msg}`,
    ].join(" ");
  }

  if (lower.includes("payload too large") || lower.includes("entity too large")) {
    return "PDF が大きすぎます。15MB 以下のファイルを選んでください。";
  }

  return `PDF の保存に失敗しました: ${msg}`;
}
