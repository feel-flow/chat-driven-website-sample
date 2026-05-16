---
name: seo-review
description: ページ 1 枚または PR 全体を SEO 観点でレビューするスキル。title / description の長さ、見出し階層、内部リンク、JSON-LD、画像 alt を一通り確認する。「この記事を SEO レビューして」「PR の SEO チェックして」と言われたときに使用する。
allowed-tools: Read, Bash, Grep, Glob
---

# seo-review

ページ 1 枚（`.md` または `.astro`）または PR 全体に対し、SEO の基本観点でレビューする。
目的は **検索流入を取りこぼさない最低ラインを満たす** こと。完璧を目指すのではなく、頻発する漏れを潰す。

---

## 受け取る入力

ユーザーから以下のいずれかを受け取る:

- **ファイルパス**: 例 `src/content/news/launch.md`、`src/pages/about.astro`
- **PR 番号**: 例 `#42`（その PR で変更されたページすべてが対象）
- **対象指定なし**: 直近の変更を対象に `git diff develop...HEAD` で変更ファイル一覧を抽出してレビュー

---

## チェック項目（必須）

### 1. title / description の長さ

| 項目 | 推奨値 | 検出方法 |
|------|--------|----------|
| `title` | 30〜60 字（全角換算） | frontmatter または `<title>` |
| `description` | 80〜120 字（全角換算） | frontmatter または `<meta name="description">` |

- `title` が 60 字超 → 検索結果で truncate される
- `description` が 120 字超 → スニペットで省略される
- いずれも 30 字 / 80 字未満は内容が薄い印象を与える可能性

### 2. 見出し階層

- `h1` はページに **1 つだけ**（レイアウト側の `<h1>{title}</h1>` が該当する）
- 本文は `##` (h2) から開始
- `h2` → `h3` → `h4` の順で深くする（飛ばさない、戻らない）
- 連続する見出しの間に本文がない（h2 直下に即 h3 が続く等）と SEO 評価が下がる

検出例:

```bash
grep -nE '^#{1,6} ' <file>
```

### 3. 内部リンク

- 記事 / サービスページには **内部リンク 1 つ以上**（`/services/...` または `/contact` または他のニュース）
- 外部リンクは目的に応じて使う。元ネタへの参照リンクは 1〜2 個まで
- リンクテキストが `こちら` だけで完結している箇所がないか（アクセシビリティ + SEO）

### 4. JSON-LD

- `Organization` JSON-LD は `src/components/SEOHead.astro` が **全ページに自動付与** している
- 記事ページが `Article` 構造化データを必要とする場合は別途追加検討（現状未実装。指摘するのみで本スキルから自動追加はしない）

### 5. 画像 alt 属性

- Markdown: `![alt](path)` の alt が空文字でないか
- Astro: `<img>` / `<Image>` で `alt` 属性が必ず付いているか

検出例:

```bash
grep -nE '!\[\]\(' <file>   # 空 alt の検出
grep -nE '<img[^>]*>' <file> | grep -v 'alt='
```

### 6. canonical / OGP

- 個別ページで canonical を上書きしている場合（`<SEOHead canonical={...} />`）、本当に必要か確認
- `ogImage` を指定する場合、画像が `public/images/` 配下に存在するか確認

### 7. publishedAt（ニュースのみ）

- 未来日付になっていないか（`publishedAt > today` は NG）
- `YYYY-MM-DD` 形式になっているか
- 過去記事の `publishedAt` を黙って書き換えていないか（履歴改ざんの可能性、要確認）

### 8. URL / slug

- slug が英小文字 + ハイフンになっているか（日本語 slug / 大文字 / アンダースコアは NG）
- 既存 slug と衝突していないか

---

## 手順

### Step 1: 対象ファイルの特定

入力に応じて分岐:

- 単一ファイル指定 → そのまま対象
- PR 番号指定 → `gh pr view <number> --json files --jq '.files[].path'` で変更ファイル一覧
- 指定なし → `git diff --name-only develop...HEAD`

`.md` と `.astro` を対象とし、それ以外（`.ts` / `.json` / 画像）は除外する。

### Step 2: 各ファイルをチェック

上記 1〜8 を順に確認する。**漏れなくチェックリスト化** し、各項目に対し以下を判定:

- ✅ OK
- ⚠️ 改善推奨（マージは止めない）
- ❌ 修正必須（Critical: マージ前に直す）

### Step 3: レポート出力

以下の形式で出力:

```markdown
# SEO レビュー結果

対象: <ファイル / PR>

## サマリ

- ❌ Critical: <件数>
- ⚠️ Warning: <件数>
- ✅ OK: <件数>

## 詳細

### <ファイルパス 1>

- ✅ title: 42 字（30〜60 字 OK）
- ⚠️ description: 145 字（120 字超過。要短縮）
- ❌ 画像 alt: `images/foo.png` の alt が空（修正必須）
- ✅ 内部リンク: /services/ai-consulting, /contact
- ...

### <ファイルパス 2>

...

## 推奨アクション

1. <Critical の修正項目>
2. <Warning の対応項目>
```

### Step 4: 自動修正は行わない

このスキルは **レビュー専門**。修正は別 Skill (`write-blog` / `update-news` / `add-service-page`) または手動で行う。

ただし、ユーザーから明示的に「直しといて」と指示された場合は、対象ファイルを編集する（ただし変更内容は PR 上で人間が読める粒度に留める）。

---

## 補助コマンド

文字数カウント（日本語は全角換算 = 文字数そのまま）:

```bash
# title / description の文字数を確認
grep -m1 '^title:' <file> | sed 's/^title: *//' | awk '{print length($0)" 字"}'
grep -m1 '^description:' <file> | sed 's/^description: *//' | awk '{print length($0)" 字"}'
```

PR の変更ファイル取得:

```bash
gh pr view <PR番号> --json files --jq '.files[].path' | grep -E '\.(md|astro)$'
```

---

## やってはいけないこと

- 「完璧な SEO」を求めて些末な指摘を大量に出す（**ユーザーが疲弊する**）
- 自動修正で `title` / `description` を勝手に書き換える（**著者の意図と異なる**可能性）
- 過去記事の `publishedAt` を黙って書き換える
- Critical と Warning を混同する（マージブロックの判断ができなくなる）

---

## 完了の合図

- レビュー対象ファイル数
- Critical / Warning / OK の件数
- Critical があった場合は、対応方針（自動修正 or 手動修正）
