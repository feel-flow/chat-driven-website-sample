---
name: update-news
description: 短いニュース 1 件を `src/content/news/` に追加するスキル。「お知らせを 1 つ追加して」「○○のニュースを書いて」と言われたときに使用する。URL を伴う「ブログ記事化」は write-blog スキルを使うこと。
allowed-tools: Read, Write, Edit, Bash
---

# update-news

短い 1 件のお知らせ（リリース告知 / イベント開催 / 価格改定 / 採用 / 受賞 等）を
`src/content/news/<slug>.md` に追加する。

`write-blog` との違い:

| 用途 | スキル |
|------|-------|
| URL を渡して長文の記事化（500〜1500 字） | `write-blog` |
| 1 件のお知らせ（200〜600 字） | `update-news`（本スキル） |

---

## 受け取る入力

- **お知らせの内容**（必須）: 何を、いつから、誰向けに
- **公開日**（任意）: 未指定なら当日
- **タグ**（任意）: 未指定なら内容から推定（`announcement`, `service`, `event`, `release` など）
- **関連リンク**（任意）: サービスページ / 外部リンク

不足している場合は「いつから」「誰向けに」を **必ず** ユーザーに確認する。

---

## 手順

### Step 1: 既存ニュースの確認

```bash
ls src/content/news/
```

- 重複・類似のお知らせがないか確認
- 直近の `publishedAt` を確認（同日付の複数追加は OK だが、内容が分かれているか確認）

### Step 2: slug の決定

- 英小文字 + ハイフン
- 内容を表す 2〜4 単語（例: `pricing-update-2026`、`spring-campaign`、`team-expansion`）
- 既存ファイルと衝突しないこと

### Step 3: frontmatter の組み立て

```yaml
---
title: <30〜50 字、お知らせの中核を 1 文で>
description: <80〜120 字、検索結果のスニペットになる文>
publishedAt: <YYYY-MM-DD>
tags:
  - announcement      # ほぼ必須
  - <内容に応じた追加タグ>
---
```

`publishedAt` は当日 (`date +%Y-%m-%d`) が原則。
**未来日付は使わない**（予約公開には対応していないため、未来日付は記事が「公開済みなのに古く見える」事故を招く）。

### Step 4: 本文の執筆

短いお知らせ用の構成（200〜600 字）:

```markdown
<1 段落で「何が・いつから・誰向けに」を述べる>

## <h2 見出し：詳細 or 想定される問い合わせ>

- <ポイント 1>
- <ポイント 2>
- <ポイント 3>

詳細は [サービスページ](/services/<slug>) または [お問い合わせ](/contact) からご確認ください。
```

- 文体: です・ます調
- 一文 60〜80 字
- 必要な情報（金額・期間・対象者）は箇条書きで明示
- 末尾に **必ず** 内部リンク（関連サービス / お問い合わせ）を 1 つ以上含める

### Step 5: ファイルの書き込み

`src/content/news/<slug>.md` を新規作成。既存ファイルの上書き禁止。

### Step 6: 検証

```bash
pnpm astro check
pnpm build
```

両方 0 errors であること。

### Step 7: 一覧表示への反映確認

ローカルで確認する場合（任意。基本は不要）:

```bash
pnpm dev
# http://localhost:4321/news で先頭に追加した記事が出ているか確認
```

`pnpm dev` は他作業とポート衝突する可能性があるため、ビルドが通ればスキップして構わない。Vercel デプロイ後に `/news` で実際の表示を確認するのが基本ルート。

### Step 8: PR 作成

ブランチ名は `feature/#<issue番号>-<short-slug>` 形式（AGENTS.md「PR / レビューの方針」の宣言と整合）。Issue 番号は対話的にユーザーから受け取るか、必要なら `gh issue create --assignee @me` で先に発行する。

```bash
git checkout -b feature/#<issue>-news-<slug>
git add src/content/news/<slug>.md
git commit -m "docs: #<issue> add news <slug>"
git push -u origin feature/#<issue>-news-<slug>
gh pr create --draft --base develop \
  --title "docs: #<issue> add news <slug>" \
  --body "$(cat <<'EOF'
## 概要

<お知らせのタイトル + 一言要約>

## 公開日

<YYYY-MM-DD>

## 内部リンク先

- <関連サービス / お問い合わせ>

## 検証

- pnpm astro check: 0 errors
- pnpm build: 0 errors
EOF
)"
```

ニュース追加は低リスクなので、本人が内容を確認すれば auto-merge してよい。

---

## やってはいけないこと

- 未来日付の `publishedAt`
- 既存ニュースの上書き
- 内部リンク（`/services/...` または `/contact`）の省略
- 「絶対」「業界 No.1」など根拠なき断定
- 1 ファイルに複数のお知らせを詰め込む（1 件 1 ファイルが原則）

---

## 完了の合図

- 作成したファイルパス
- タイトル / `publishedAt` / `tags`
- Draft PR の URL
- 検証結果（`pnpm astro check` / `pnpm build` が 0 errors）
- 一覧で先頭に出ることを期待できる旨（`publishedAt` 降順表示）
