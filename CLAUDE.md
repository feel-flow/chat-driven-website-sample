# CLAUDE.md — Claude Code 用 運用ルール

このファイルは Claude Code 用の運用ルールです。
**基本ルールはすべて [`AGENTS.md`](./AGENTS.md) に集約**してあるため、まずそちらを読んでください。
本ファイルでは **Claude Code 固有の事情**（Skill フォーマット、画像生成、ローカルツール）だけを記載します。

---

## 共通ルール

[`AGENTS.md`](./AGENTS.md) を参照してください。

- このリポの目的
- サイト構造 / コンテンツモデル（news / services）
- 文体ガイドライン（です・ます調 / 一文 60〜80 字 / 数値の根拠併記）
- ニュース・サービスページの追加手順
- SEO の最低ライン
- PR / レビュー / 自動マージの方針
- 検証コマンド（`pnpm astro check` / `pnpm build`）

Codex 用に書かれていますが、Claude Code でもそのまま適用します。サイト構造・文体・PR 方針は **エージェントの種類に依存しない** ためです。

---

## Claude Code 固有のルール

### Skill の場所と起動

Skill は `.claude/skills/<skill-name>/SKILL.md` に配置されています。
Claude Code は `/skill-name` の形で起動できます（Skill の `name` フィールドに準拠）。

利用可能な Skill:

| Skill | 用途 |
|-------|------|
| `write-blog` | URL を受け取って Markdown ブログ記事化 + PR 作成 |
| `add-service-page` | サービス名 + 概要 → `src/content/services/*.md` を追加 |
| `update-news` | ニュース 1 件を `src/content/news/*.md` に追加 |
| `seo-review` | 既存ページ または PR 全体を SEO 観点でレビュー |

### 画像生成

サービスページや記事に画像を添える場合、Claude Code には専用の画像生成 Skill / プラグインを使ってください（プロジェクトごとに利用可能なものは変わります）。

- 生成した画像は `public/images/` 配下に配置する
- Markdown では `![alt](/images/<file>.png)` の絶対パスで参照する
- `alt` 属性は **必ず** 付ける（SEO とアクセシビリティの両面で必須）
- 横幅は 1200px 以下を推奨（Vercel の Edge Network で十分に高速配信される）

Codex 環境では別経路（OpenAI 画像 API 等）になりますが、**生成後のファイル配置・参照方法は共通** です。記事側のコードは差異が出ないように書いてください。

### ローカル CLI 開発

- `pnpm dev` は **必要時のみ** 起動する。Skill 動作確認は基本 `pnpm astro check` + `pnpm build` で済ませる
- 他の作業ブランチで `pnpm dev` が動いている場合があるため、ポート競合を避ける（Astro は 4321 デフォルト）

### ファイル編集の優先順位

新規ファイル作成より、**既存ファイルへの追記** を優先します。
特に以下のファイルは「新規追加 OK」「既存改修は要相談」のルールに従ってください:

| ファイル / ディレクトリ | 追加 | 改修 |
|--------------------|------|------|
| `src/content/news/*.md` | OK | 既存記事の修正は要相談 |
| `src/content/services/*.md` | OK | 既存サービスの改修は要相談 |
| `public/images/*` | OK | — |
| `.claude/skills/*` | OK | 既存 Skill の改修は要相談 |
| `src/components/*` | 要相談 | 要相談 |
| `src/layouts/*` | 要相談 | 要相談 |
| `src/pages/*` | 要相談 | 要相談 |
| `src/config/site.ts` | — | 本番公開時のみ |
| `astro.config.mjs` | — | 本番公開時のみ |

「要相談」= ユーザーに「これとこれを変更します」と一言入れてから着手する、の意。

---

## トラブル時の対処

| 症状 | 対処 |
|------|------|
| `pnpm astro check` で type error | frontmatter のスキーマ違反が大半。`src/content.config.ts` の zod スキーマを確認 |
| `pnpm build` で `getStaticPaths` エラー | `[slug].astro` 系で `prerender = true` を消していないか確認 |
| サーバ Action で 500 | `RESEND_API_KEY` / `TURNSTILE_SECRET` が未設定の可能性。`.env.example` を見直す |
| 画像が 404 | パスを `/images/...` の絶対パスに統一しているか、`public/images/` 配下に置いているか確認 |

問題が再現する最小手順をまとめ、ユーザーに報告してから対応します。
