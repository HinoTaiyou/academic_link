/** app.py の DS_PROGRAMMING_TAGS と同等 */
export const dsProgrammingTags = [
  "機械学習",
  "深層学習",
  "データ分析",
  "統計学",
  "Python",
  "R",
  "SQL",
  "データベース",
  "自然言語処理",
  "画像処理",
  "Web開発",
  "アルゴリズム",
  "データマイニング",
  "ビッグデータ",
  "AI・人工知能",
  "データ可視化",
  "クラウドコンピューティング",
  "セキュリティ",
  "ソフトウェアエンジニアリング",
] as const;

export const departmentOptions = [
  "データサイエンス学科",
] as const;

export const gradeOptions = [
  "B1",
  "B2",
  "B3",
  "B4",
  "卒業生",
] as const;

export type Department = (typeof departmentOptions)[number];
export type Grade = (typeof gradeOptions)[number];
