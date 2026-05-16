# chat-driven-website-sample

書籍「**生成AI ホームページ運用 ―『外注なし』『コスト1/100』『更新5秒』の Codex × Astro 入門**」のサンプルリポジトリです。

経営者・Web 担当者が Codex CLI（または Claude Code）に「この URL を記事化して」「サービスページを追加して」と話しかけるだけで、AI が記事を書き、PR を作り、Vercel にデプロイされる、というワークフローを実装した OSS テンプレートです。

## 書籍との対応

| 書籍 | 該当章 |
|------|--------|
| 第 1 章「チャットだけで更新する、ある一日」 | リポ全体の運用フロー |
| 第 2 章「5 秒で記事を 1 本追加する」 | `.claude/skills/write-blog`、`update-news` |
| 第 3 章「サービスページを増やす」 | `.claude/skills/add-service-page` |
| 第 4 章「SEO を最低限担保する」 | `.claude/skills/seo-review`、`src/components/SEOHead.astro` |
| 第 5 章「自社向けにカスタマイズする」 | [`docs/customization.md`](docs/customization.md) |
| 付録 F「コスト試算」 | [`docs/cost-calculation.md`](docs/cost-calculation.md) |

## 起動

```bash
pnpm install
pnpm dev
```

ブラウザで `http://localhost:4321/` を開くと、ローカルプレビューが表示されます。

初回セットアップ（Vercel 連携・環境変数・外部サービス）は [`docs/setup.md`](docs/setup.md) を参照してください。

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [`docs/setup.md`](docs/setup.md) | クローンから初回 Vercel デプロイまで |
| [`docs/how-to-update.md`](docs/how-to-update.md) | 「ニュース追加」「サービス追加」「LP 修正」の Skills 使用フロー |
| [`docs/customization.md`](docs/customization.md) | 自社サイトに置き換える手順（社名・配色・コンテンツ等） |
| [`docs/cost-calculation.md`](docs/cost-calculation.md) | 外注見積もり相場 vs 本書スタック月額試算（付録 F） |
| [`AGENTS.md`](AGENTS.md) | サイト構造・コンテンツモデル・文体ガイドライン（AI エージェント共通） |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code 固有のルール（Skill フォーマット等） |

## 運用フロー（手動マージ）

このリポは **手動マージ運用** を前提にしています。AI が PR を作るところまでは自動化しますが、本番反映の最終確認は人間が行います。

```text
1. Codex / Claude Code に依頼（例: 「この URL を記事化して」）
2. AI が feature ブランチで PR を作成
3. ローカル または CI で検証
   pnpm verify       # = pnpm astro check + pnpm build（注 1）
4. Vercel Deploy Preview を開いて表示確認
5. 問題なければ merge
   gh pr merge <PR番号> --squash --delete-branch
6. Vercel Production に自動デプロイ
```

> **注 1**: `pnpm verify` script は別 PR（#344）で追加されます。それ以前は `pnpm astro check && pnpm build` を個別に実行してください。

低リスク変更（ニュース 1 件追加、サービス 1 件追加、LP コピー修正）は AI が PR を出した時点で「読むだけ」のレビューでマージできます。レイアウト改修や `astro.config.mjs` の変更など、影響範囲が広い PR はマージ前に内容を精査してください（詳細は [`AGENTS.md`](AGENTS.md) の「PR / レビューの方針」を参照）。

## 関連リンク

- 書籍（Amazon KDP）: 刊行後にリンク予定
- 著者: [株式会社フィールフロウ](https://feelflow.net/)
- 解説リポ（ai-books）: [feel-flow/ai-books](https://github.com/feel-flow/ai-books)
- サンプルサイト本番: `https://chat-driven-website-sample.vercel.app/`（Phase 1 完了後に有効化）

## ライセンス

[MIT License](LICENSE) — Copyright (c) 2026 Feel Flow Inc.

サンプルコード・ドキュメントとも MIT で配布します。フォークして自社サイトに転用してかまいません。
