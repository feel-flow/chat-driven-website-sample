# AGENTS.md — Codex 用 運用ルール

このリポジトリは書籍「**生成AI ホームページ運用 ―『外注なし』『コスト1/100』『更新5秒』の Codex × Astro 入門**」のサンプルリポジトリです。
読者（経営者・Web 担当者）が Codex CLI と対話しながらホームページを更新する、「**設定の壁さえ越えれば、ホームページ運用に人間の手は 5 秒しか奪われない**」というワークフローを実装した OSS テンプレートです。

Codex（および Claude Code）はこのファイルを読み、以下のルールに従ってサイトを更新してください。

---

## このリポの目的

- 書籍 1〜2 章の完成形と 1:1 対応したサンプルサイト
- 経営者または Web 担当者が、URL を貼って「これをブログ記事化して、ここを深掘り」と指示するだけで、AI が記事を書き、PR を作り、自動マージ → Vercel デプロイされる
- 人間の操作時間は **5 秒**（URL を貼って深掘り指示を書くだけ）
- 制作・運用コストを従来比 1/100 まで圧縮する構成例として参照される

---

## サイト構造

```
src/
├── config/site.ts            # サイト名・URL の中央集約
├── content.config.ts         # Content Collections のスキーマ
├── content/
│   ├── news/*.md             # ニュース記事（公開順に表示）
│   └── services/*.md         # サービスページ
├── components/
│   ├── SEOHead.astro         # title / description / OGP / JSON-LD
│   ├── ContactForm.astro     # Resend + Turnstile フォーム
│   ├── Header.astro / Footer.astro
│   ├── CTA.astro / ServiceCard.astro
├── layouts/
│   ├── Base.astro            # 全ページ共通レイアウト
│   └── Article.astro         # ニュース等の記事用
├── pages/
│   ├── index.astro / about.astro / contact.astro
│   ├── news/index.astro      # ニュース一覧
│   ├── news/[slug].astro     # ニュース詳細（getStaticPaths + prerender）
│   ├── services/index.astro  # サービス一覧
│   └── services/[slug].astro # サービス詳細
└── actions/
    ├── contact.ts            # Astro Server Actions（Resend 送信）
    └── index.ts              # actions のエントリ
```

設定:

- フレームワーク: **Astro 6.x**（`output: 'server'`、Vercel アダプタ）
- コンテンツ: Markdown + Content Collections (`glob` ローダ)
- フォーム: **Astro Server Actions** + Resend + Cloudflare Turnstile
- デプロイ: Vercel（develop マージで自動）

---

## コンテンツモデル

### `news` コレクション（`src/content/news/*.md`）

```yaml
---
title: string             # 記事タイトル（30〜60 字推奨）
description: string       # 一覧 / メタディスクリプション（80〜120 字推奨）
publishedAt: YYYY-MM-DD   # 公開日（ISO 日付）
tags: [string, ...]       # 任意の分類タグ。defaults to []
---
```

ファイル名は kebab-case の slug（例: `launch.md` → URL は `/news/launch`）。本文の見出しは `##` から始める（`#` は `title` で出力済みのため使わない）。

### `services` コレクション（`src/content/services/*.md`）

```yaml
---
title: string         # サービス名
summary: string       # 一覧カード用の短い説明（60〜100 字）
icon: string?         # 任意の絵文字またはアイコン文字
order: number         # 一覧での並び順（小さいほど先頭）。defaults to 0
---
```

スラッグ = ファイル名（例: `ai-consulting.md` → `/services/ai-consulting`）。

---

## 文体ガイドライン

- 全文 **「です・ます調」** で統一（既存記事と揃える）
- 一文は 60〜80 字程度。長くなる場合は読点や改行で区切る
- 専門用語は初出時に一言補足する（例: 「Resend（メール配信 API）」）
- 見出しは「名詞句」または「動詞 + 目的語」。煽り表現は避ける
- 数字・効果は誇張せず、根拠を併記する（例: 「2〜4 週間」ではなく「2〜4 週間（PoC 標準）」）
- 絵文字は装飾用途では使わない。サービス frontmatter の `icon` のみ可
- 一人称は「弊社」または「私たち」。「我々」は避ける

---

## 「ニュース記事を追加して」と言われたときの手順

1. ユーザーから受け取った情報を整理する
   - 元 URL（あれば fetch して内容を要約）
   - 深掘りポイント（強調すべきテーマ）
   - 想定読者（経営者向け / Web 担当者向け / 一般顧客向け）
2. `src/content/news/<slug>.md` を新規作成
   - slug は記事内容を表す英小文字 + ハイフン（例: `2026-codex-launch`、`new-pricing-plan`）
   - `publishedAt` は当日（`YYYY-MM-DD`）
   - `description` は 80〜120 字、検索結果に表示される文を意識
   - 本文は `##` 見出しから開始、500〜1500 字を目安
3. 既存記事（`launch.md` / `new-service.md`）の構成・文体を踏襲する
4. リンクは絶対パス（`/services/ai-consulting`、`/contact` など）で書く
5. 検証
   - `pnpm astro check` でスキーマ違反 / 型エラーが出ないこと
   - `pnpm build` が通ること
6. PR 作成（後述「PR / レビューの方針」）

### ニュース追加の最小サンプル

```markdown
---
title: 新サービス「○○」を開始しました
description: ○○向けに、△△を支援する新サービスを開始しました。初期相談は無料で、××週間の PoC から始められます。
publishedAt: 2026-05-16
tags:
  - service
  - announcement
---

このたび、新サービス「○○」を開始しました。

## 想定するお客様

- ...

## ご相談の流れ

1. **無料相談（30 分）**
2. **PoC 提案**
3. **本格導入支援**

詳細は [サービスページ](/services/○○) をご覧ください。
```

---

## 「サービスページを追加して」と言われたときの手順

1. サービス名 / 想定顧客 / 標準プラン / 価格レンジ をユーザーから受け取る
2. `src/content/services/<slug>.md` を新規作成
   - slug は英小文字 + ハイフン（例: `ai-consulting`、`web-development`）
   - `order` は既存ファイルを見て末尾に追加（最大値 + 1）
   - `icon` は 1 文字の絵文字（任意）
3. 本文構成は既存の `ai-consulting.md` / `web-development.md` を踏襲
   - 「こんな方におすすめ」 or 「主な支援メニュー」
   - 「標準プラン」テーブル
   - 末尾に「お問い合わせは [お問い合わせフォーム](/contact) からお願いします。」のような descriptive な anchor の内部リンクを置く（`こちら` だけの anchor は避ける）
4. サービス一覧ページ (`src/pages/services/index.astro`) は Content Collections から自動生成されるため、ファイル追加だけで反映される
5. 検証 → `pnpm astro check` / `pnpm build`
6. PR 作成

---

## ページ全体に関わる変更（ヘッダー・フッター・トップ）

- `src/components/Header.astro` / `Footer.astro` / `CTA.astro` の改修は **デザイン上の影響範囲が広い** ため、変更前に「どこに何を追加するか」を簡潔に説明してからファイルを編集する
- `src/config/site.ts`（サイト名・URL）の変更は全ページの SEO に影響する。本番公開直前など、明確な必要がない限り触らない
- `astro.config.mjs` の `site` を変える場合は、必ず Vercel の本番ドメインに合わせる

---

## SEO 上の最低ライン

新規ページ / 記事追加時は以下を満たすこと:

- `title`: 30〜60 字、ページ内容を端的に表現
- `description`: 80〜120 字、検索結果のスニペット品質を意識
- 見出し階層: `h1` はレイアウト側で 1 つ、本文は `h2` → `h3` の順で深くする
- 内部リンク: 関連サービス / お問い合わせを 1 つ以上含める
- 画像を使う場合: `alt` 属性を必ず付ける

JSON-LD の `Organization` は `SEOHead.astro` で全ページに自動付与されるため、個別記事側で書き足す必要はありません。

---

## PR / レビューの方針

### 基本フロー

1. ブランチ作成: `feature/#<issue>-<short-slug>`（Issue 番号を必ず含める。`docs:` / `feat:` / `fix:` のいずれの PR でもこの命名で統一する）
2. 変更ファイルは原則 **1 PR 1 トピック**（ニュース 1 件、サービス 1 件、など）
3. PR タイトルは `docs:` / `feat:` / `fix:` プレフィックス + 内容を 70 字以内で
4. PR 本文に以下を含める
   - 変更概要（何を、なぜ）
   - スクリーンショット または プレビュー URL（あれば）
   - 検証コマンドの結果（`pnpm astro check` / `pnpm build`）

### 自動マージの条件

ニュース / サービス追加など低リスク変更は、以下を満たした時点で squash merge してよい:

- `pnpm astro check` が 0 errors
- `pnpm build` が 0 errors
- 既存ページの design / layout 改変なし
- 個人情報 / API キー / `.env` が含まれていない

### 確認を入れるべき変更

以下はマージ前にユーザー確認を取る:

- `astro.config.mjs` / `package.json` / `tsconfig.json` の変更
- `src/config/site.ts` の本番値変更
- `src/actions/` の編集（フォーム挙動）
- 既存ニュース / サービスの **削除**
- 10 ファイル以上 または 500 行以上の変更

---

## 検証コマンド（暗記推奨）

```bash
pnpm install              # 依存導入
pnpm astro check          # 型・スキーマ検証
pnpm build                # 本番ビルド（Vercel と同等の出力）
pnpm dev                  # 開発サーバ（人間が見るときのみ）
```

---

## Skills の場所

- `.claude/skills/write-blog/` — URL → ブログ記事化 + PR 作成
- `.claude/skills/add-service-page/` — サービス名 + 概要 → サービスページ追加
- `.claude/skills/update-news/` — ニュース 1 件追加
- `.claude/skills/seo-review/` — ページ or PR の SEO レビュー

Codex は `.claude/skills/<skill-name>/SKILL.md` を読み込んで各 Skill の手順に従ってください。
