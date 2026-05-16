---
name: add-service-page
description: サービス名と概要を受け取って `src/content/services/` 配下にサービスページを追加するスキル。「○○というサービスページを追加して」「新サービスのページを作って」と言われたときに使用する。
allowed-tools: Read, Write, Edit, Bash
---

# add-service-page

新しいサービスを表すページを `src/content/services/<slug>.md` として追加する。
一覧ページ (`/services`) と詳細ページ (`/services/<slug>`) は Content Collections から自動生成されるため、Markdown を 1 ファイル追加するだけで反映される。

---

## 受け取る入力

ユーザーから以下を受け取る:

- **サービス名**（必須）: 例 「AI コンサルティング」「Web 制作」
- **概要 / 説明**（必須）: 何を提供するサービスか、想定顧客は誰か
- **標準プラン**（任意）: 期間、価格、含まれるもの。未指定なら「お見積もり」とする
- **icon**（任意）: 1 文字の絵文字（例: 🤖、🛠、📊）
- **想定する効果 / 実績**（任意）

最低限「サービス名」と「概要」があれば着手可能。ただし、空っぽのテンプレを量産しないよう、想定顧客は **必ず** 確認する。

---

## 手順

### Step 1: 既存ファイルの確認

```bash
ls src/content/services/
```

- 同名・類似名のサービスが既にないか確認
- `order` フィールドの最大値を確認（新規追加時は最大値 + 1 を使う）

### Step 2: slug の決定

- 英小文字 + ハイフン（例: `ai-consulting`、`web-development`、`seo-audit`）
- サービス名の英訳または通称をベースにする
- 2〜3 単語以内に収める

### Step 3: frontmatter の組み立て

```yaml
---
title: <サービス名>
summary: <60〜100 字。一覧カードに表示される短い説明>
icon: <絵文字 1 文字、任意>
order: <既存サービスの最大 order + 1>
---
```

`summary` は **一覧ページのカード本文** になるため、サービスの中核価値が 1〜2 文で伝わる文にする。

### Step 4: 本文の執筆

構成テンプレート（既存 `ai-consulting.md` / `web-development.md` を参考に）:

```markdown
<1〜2 段落の導入：誰のためのサービスか、何が解決できるか>

## こんな方におすすめ

- <ペルソナ 1>
- <ペルソナ 2>
- <ペルソナ 3>

## 主な支援メニュー（or 含まれるもの）

- **<メニュー 1>**: <一言説明>
- **<メニュー 2>**: <一言説明>
- **<メニュー 3>**: <一言説明>

## 想定する効果（任意）

- <効果 1：数値を併記する場合は根拠も>
- <効果 2>

## 標準プラン

| プラン | 期間 | 内容 |
|--------|------|------|
| <プラン名> | <期間> | <内容> |

お問い合わせは [こちら](/contact) からお願いします。
```

- 文体: です・ます調
- 一文 60〜80 字
- 効果に数値を入れる場合は **必ず** 根拠（実績ベース、業界平均 等）を付ける。捏造禁止
- 末尾の `/contact` リンクは **必ず** 残す（CV 動線）

### Step 5: ファイルの書き込み

`src/content/services/<slug>.md` を新規作成。
既存ファイルの上書きは禁止。重複時は slug を変える。

### Step 6: 検証

```bash
pnpm astro check
pnpm build
```

両方 0 errors であること。

### Step 7: PR 作成

```bash
git checkout -b feature/add-service-<slug>
git add src/content/services/<slug>.md
git commit -m "feat: add service page <slug>"
git push -u origin feature/add-service-<slug>
gh pr create --draft --base develop \
  --title "feat: add service page <slug>" \
  --body "$(cat <<'EOF'
## 概要

新サービス「<サービス名>」のページを追加。

## 含む内容

- <要点 1>
- <要点 2>
- <要点 3>

## 一覧表示への反映

`src/content/services/` への追加で `/services` 一覧と `/services/<slug>` 詳細が自動生成される。

## 検証

- pnpm astro check: 0 errors
- pnpm build: 0 errors
EOF
)"
```

サービスページはサイトの「商品棚」に当たるため、Draft で人間レビューを 1 回入れる運用を推奨。

---

## 関連コンポーネントが必要な場合

サービス内容に応じて、以下の追加が必要になることがある（**通常は不要**）:

- 専用 CTA: `src/components/CTA.astro` を拡張するか、新規 CTA コンポーネントを作る
- 申し込みフォーム: `src/actions/` に新規 action を追加（要相談）
- 価格テーブルなど共通 UI: `src/components/` に追加

これらは **影響範囲が広い** ため、ユーザーに「サービスページ単体で完結させるか、共通コンポーネントを足すか」を確認してから着手する。

---

## やってはいけないこと

- 既存サービスファイルの上書き
- `order` の重複（ソート結果が不定になる）
- 捏造した実績数値
- `/contact` リンクの省略
- `src/pages/services/[slug].astro` の編集（Content Collections で自動生成されるため不要）

---

## 完了の合図

- 作成したファイルパス
- サービス名 / slug / order
- Draft PR の URL
- 検証結果（`pnpm astro check` / `pnpm build` が 0 errors）
- 一覧 (`/services`) と詳細 (`/services/<slug>`) で表示されることを確認した旨
