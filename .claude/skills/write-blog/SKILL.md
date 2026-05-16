---
name: write-blog
description: 受け取った URL を読み込み、指定された深掘りポイントに沿ってブログ記事化し、`src/content/news/` 配下に Markdown ファイルを追加して PR を作成するスキル。「URL を渡すからブログ記事化して」「この記事をベースに ○○ を深掘りして」と言われたときに使用する。
allowed-tools: Read, Write, Edit, Bash, WebFetch
---

# write-blog

URL を 1 つ（または複数）受け取り、本リポジトリのブログ記事として再構成する。
最終成果物は `src/content/news/<slug>.md` の追加 + Draft PR。

人間の操作時間は「URL を貼って、深掘りポイントを 1 行書く」だけの **5 秒** を目指す。
このスキルはそれ以降を引き受ける。

---

## 受け取る入力

ユーザーから以下を受け取る:

- **URL**: 元ネタとなる記事 / 発表 / プレスリリース等の URL（必須）
- **深掘りポイント**: 本記事で強調したいテーマ（例: 「経営者向けに費用対効果を強調」「Web 担当者向けに導入手順を詳しく」）
- **想定読者**: 経営者 / Web 担当者 / 一般顧客（任意。未指定なら経営者と仮定）
- **タグ**: 任意（未指定なら内容から推定）

URL 以外の情報が不足している場合は、深掘りポイントだけは **必ず** ユーザーに確認する（深掘りなしの記事は単なる転載になるため）。

---

## 手順

### Step 1: 元 URL の取得と理解

1. `WebFetch` で URL の本文を取得する
2. 内容を 3〜5 行で要約し、ユーザーに「この理解で合っていますか」と一言確認（明らかに簡単な場合はスキップ可）
3. **転載にならないように注意**: 元記事の文を丸ごとコピーしない。要約 + 独自の視点で再構成する

### Step 2: slug の決定

- 英小文字 + ハイフンで構成
- 内容を表す 2〜4 単語（例: `codex-launch`、`new-pricing-2026`、`ai-consulting-pmf`）
- `src/content/news/` 配下に既存ファイル名と衝突しないことを確認

```bash
# slug 衝突チェック
test -e src/content/news/<slug>.md && echo "CONFLICT: <slug> already exists, choose another"
```

### Step 3: frontmatter の組み立て

```yaml
---
title: <30〜60 字、内容を端的に。煽り表現は避ける>
description: <80〜120 字、検索結果のスニペットになる文>
publishedAt: <YYYY-MM-DD、当日の日付>
tags:
  - <内容に応じて 1〜3 個。例: announcement, service, ai>
---
```

`publishedAt` は当日（`date +%Y-%m-%d`）。未来日付にはしない。

### Step 4: 本文の執筆

構成テンプレート:

```markdown
<1〜2 段落の導入：何が起きたか / 何を伝えたいか>

## <h2 見出し 1：背景・経緯>

<3〜5 行>

## <h2 見出し 2：本記事の深掘りポイント>

<ユーザーが指定した深掘りポイントを中心に 5〜10 行>

## <h2 見出し 3：弊社の関連サービス or ご相談の流れ>

<内部リンク（/services/... / /contact）を必ず 1 つ以上含める>
```

- 文体: です・ます調
- 一文 60〜80 字
- 全体 500〜1500 字（短すぎず長すぎず）
- 数字や効果には根拠を併記（「2〜4 週間（PoC 標準）」「弊社実績」など）
- 元記事のリンクが妥当な場合は本文末に「参考: [タイトル](URL)」を 1 つだけ置く

### Step 5: ファイルの書き込み

`src/content/news/<slug>.md` を新規作成する。
**既存ファイルの上書きは絶対にしない**（重複している場合は slug を変える）。

### Step 6: 検証

```bash
pnpm astro check
pnpm build
```

両方とも 0 errors であること。warning が出た場合は内容を確認し、frontmatter / 本文側に起因するものなら修正する（依存ライブラリ起因なら無視 OK）。

### Step 7: PR 作成

ブランチ名は `feature/#<issue番号>-<short-slug>` 形式（AGENTS.md「PR / レビューの方針」の宣言と整合）。Issue 番号は対話的にユーザーから受け取るか、必要なら `gh issue create --assignee @me` で先に発行する。

```bash
git checkout -b feature/#<issue>-news-<slug>
git add src/content/news/<slug>.md
git commit -m "docs: #<issue> add news article <slug>"
git push -u origin feature/#<issue>-news-<slug>
gh pr create --draft --base develop \
  --title "docs: #<issue> add news article <slug>" \
  --body "$(cat <<'EOF'
## 概要

<記事タイトルと一言要約>

## 元 URL

- <ユーザーから受け取った URL>

## 深掘りポイント

- <ユーザー指定の深掘りポイント>

## 検証

- pnpm astro check: 0 errors
- pnpm build: 0 errors
EOF
)"
```

PR は Draft で作成し、人間が一読してから ready にする運用とする（記事は読者の目に触れるため）。

---

## やってはいけないこと

- 元記事の本文を丸ごとコピーする（**転載 / 著作権侵害**）
- ユーザーが指定していない数値・統計を勝手に作る（**ファクトの捏造**）
- `publishedAt` を将来日付にする（**SEO ペナルティ / 信頼性低下**）
- 既存記事を上書き（**履歴消失**）
- 過度な煽り表現（「絶対」「最強」「業界 No.1 確実」など）

---

## 完了の合図

ユーザーに以下を報告:

- 作成したファイルパス
- 記事タイトル
- Draft PR の URL
- 検証結果（`pnpm astro check` / `pnpm build` が 0 errors）
