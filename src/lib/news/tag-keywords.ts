/**
 * `app.py` の get_popular_news() で使っている tag_keywords_map をそのまま移植。
 *
 * 「ある DS タグ」が記事タイトル/本文に登場するかを判定する際の
 * 「タグ名そのもの」 + 「同義語・略語」リスト。
 */
export const tagKeywordsMap: Record<string, string[]> = {
  機械学習: [
    "機械学習",
    "machine learning",
    "ml",
    "ai",
    "人工知能",
    "機械学習モデル",
    "学習モデル",
  ],
  深層学習: [
    "深層学習",
    "deep learning",
    "ディープラーニング",
    "neural network",
    "ニューラルネットワーク",
  ],
  データ分析: ["データ分析", "data analysis", "データ解析", "分析", "analytics"],
  統計学: ["統計学", "statistics", "統計", "statistical"],
  Python: ["python", "パイソン", "py", "python3", "python2"],
  R: ["r言語", "r programming", "r language"],
  SQL: ["sql", "データベース言語", "query", "クエリ"],
  データベース: ["データベース", "database", "db", "dbms"],
  自然言語処理: [
    "自然言語処理",
    "natural language processing",
    "nlp",
    "言語処理",
  ],
  画像処理: [
    "画像処理",
    "image processing",
    "コンピュータビジョン",
    "cv",
    "画像認識",
  ],
  Web開発: [
    "web開発",
    "web development",
    "ウェブ開発",
    "web",
    "フロントエンド",
    "バックエンド",
  ],
  アルゴリズム: ["アルゴリズム", "algorithm", "algo"],
  データマイニング: ["データマイニング", "data mining", "マイニング"],
  ビッグデータ: ["ビッグデータ", "big data", "大規模データ"],
  "AI・人工知能": [
    "ai",
    "人工知能",
    "artificial intelligence",
    "artificial",
    "intelligence",
  ],
  データ可視化: [
    "データ可視化",
    "data visualization",
    "可視化",
    "visualization",
  ],
  クラウドコンピューティング: [
    "クラウド",
    "cloud computing",
    "cloud",
    "aws",
    "azure",
    "gcp",
  ],
  セキュリティ: [
    "セキュリティ",
    "security",
    "cybersecurity",
    "情報セキュリティ",
    "サイバーセキュリティ",
  ],
  ソフトウェアエンジニアリング: [
    "ソフトウェアエンジニアリング",
    "software engineering",
    "ソフトウェア開発",
    "開発",
    "engineering",
  ],
};
