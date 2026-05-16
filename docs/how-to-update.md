# how-to-update.md — Skills を使った日々の更新フロー

書籍 第 2〜5 章のサマリです。Codex CLI または Claude Code に対して、典型的な更新依頼を「どう話しかければよいか」をまとめます。

サイト構造・文体ガイドライン・コンテンツモデルの定義は [`AGENTS.md`](../AGENTS.md) に集約されているため、本ドキュメントは **依頼の型と Skill の使い分け** に絞ります。

---

## 利用可能な Skills

| Skill | 起動 | 用途 |
|-------|------|------|
| `write-blog` | `/write-blog` | URL を渡してブログ記事化 + PR 作成 |
| `update-news` | `/update-news` | ニュース 1 件を `src/content/news/*.md` に追加 |
| `add-service-page` | `/add-service-page` | サービス名 + 概要 → `src/content/services/*.md` を追加 |
| `seo-review` | `/seo-review` | 既存ページまたは PR の SEO レビュー |

Skill の詳細手順は `.claude/skills/<skill-name>/SKILL.md` に記載されています。

---

## ケース 1: ニュースを 1 本追加する（書籍 2 章）

### A. URL を貼って記事化する場合（5 秒運用）

> 「`https://example.com/news/xxx` をブログ記事化してください。深掘りポイントは『中小企業にとっての意味』です。」

`write-blog` Skill が:

1. URL を fetch して内容を要約
2. `src/content/news/<slug>.md` を新規作成
3. `feature/#<issue>-<slug>` ブランチで PR 作成

人間の作業は **URL を貼って深掘り指示を書くだけ**。所要時間 5 秒。

### B. お知らせ系（URL なし）の場合

> 「新サービス『○○』を開始した、というニュースを追加してください。対象は中小企業向け、料金は 30 万円〜です。」

`update-news` Skill が frontmatter とテンプレを埋めて PR を作ります。

### C. PR をマージ

Vercel Deploy Preview で表示確認 → `gh pr merge <PR番号> --squash --delete-branch`

---

## ケース 2: サービスページを追加する（書籍 3 章）

> 「サービスページ『AI 導入研修』を追加してください。想定顧客は中小企業の経営層、標準プランは 3 ヶ月 60 万円から、目的は『社内の AI 活用度を底上げする』です。」

`add-service-page` Skill が:

1. 既存の `ai-consulting.md` / `web-development.md` の構成を踏襲
2. `src/content/services/<slug>.md` を新規作成
3. `order` を既存の最大値 + 1 に設定
4. PR 作成

サービス一覧ページ (`src/pages/services/index.astro`) は Content Collections から自動生成されるため、**ファイル追加だけで反映** されます。

---

## ケース 3: LP（トップページ）のコピーを直す（書籍 4-1）

> 「トップページのヒーロー見出しを『AI で 5 秒運用』に変えてください。サブコピーは『外注なし、コスト 1/100』で。」

`src/pages/index.astro` を編集する変更です。レイアウト改修ではないため、自動で PR が作られます。マージ前に Vercel Deploy Preview で必ず見た目を確認してください。

> **注意**: `src/components/Header.astro` / `Footer.astro` / `CTA.astro` などコンポーネントを直す場合は、影響範囲が広いため AI に「どこを変えるか」を先に説明させてから着手させると安全です（[`AGENTS.md`](../AGENTS.md) 参照）。

---

## ケース 4: SEO レビュー（書籍 4-2 〜 4-5）

### 既存ページのレビュー

> 「`/news/launch` ページの SEO をレビューしてください。」

`seo-review` Skill が title・description・h1〜h3・内部リンク・画像 alt をチェックしてレポートを返します。

### PR 全体のレビュー

> 「この PR の SEO をレビューしてください。」

PR で追加・変更されたページすべてに対して同じチェックを実行します。

---

## ケース 5: 公開済み記事を直す（誤字・追記）

> 「`/news/new-service` の本文 3 段落目、『2 週間』を『2〜4 週間』に直してください。」

直接ファイル名 (`src/content/news/new-service.md`) を指定すると、AI が編集 → PR 作成します。

> **既存記事の編集は要相談ルール**: [`CLAUDE.md`](../CLAUDE.md) の「ファイル編集の優先順位」表に従い、AI から「`new-service.md` のここをこう直します」と一言入る運用を想定しています。

---

## 検証コマンド

どのケースでも、PR がマージされる前に以下が通っていることを確認してください:

```bash
pnpm astro check    # 型・スキーマ違反のチェック
pnpm build          # 本番ビルドと同等の出力を生成
```

両方が 0 errors なら、Vercel Deploy Preview の URL を開いて見た目を確認 → `gh pr merge --squash --delete-branch` でマージします。

---

## よくある追加パターン

| 依頼 | 使う Skill / 編集ファイル |
|------|------------------------|
| ニュース 1 本追加（URL あり） | `/write-blog` |
| ニュース 1 本追加（URL なし） | `/update-news` |
| サービスページ追加 | `/add-service-page` |
| LP コピー修正 | `src/pages/index.astro` を直接編集 |
| お問い合わせ送信先変更 | `.env` の `CONTACT_TO_ADDRESS` |
| サイト名・URL 変更 | `src/config/site.ts`（影響範囲広、要相談） |
| ヘッダー / フッター変更 | `src/components/Header.astro` 等（要相談） |
| SEO チェック | `/seo-review` |

---

## まとめ

- 単発の追加・修正は **Skill で完結**（URL を貼るか、依頼を一文で書くだけ）
- レイアウト・設定ファイルの改修は **要相談ルール** に従って AI から事前説明を受ける
- 検証 + Deploy Preview 確認 + squash merge の 3 ステップは省略しない

自社サイトに置き換える本格カスタマイズは [`docs/customization.md`](customization.md)、運用コスト試算は [`docs/cost-calculation.md`](cost-calculation.md) を参照してください。
