# customization.md — 自社サイトへの置き換え手順

このリポは FEEL-FLOW（架空の AI コンサルティング会社）をテーマにしたサンプルです。自社のホームページとして使う場合の置き換え手順をまとめます。

書籍 第 5 章「自社向けにカスタマイズする」と連動しています。

---

## 全体の流れ

1. [リポを自分の GitHub に持ってくる](#1-リポを自分の-github-に持ってくる)
2. [社名・サイト URL を差し替える](#2-社名サイト-url-を差し替える)
3. [ロゴ・配色を変える](#3-ロゴ配色を変える)
4. [サンプルコンテンツを自社のものに置き換える](#4-サンプルコンテンツを自社のものに置き換える)
5. [お問い合わせフォームの送信先を変える](#5-お問い合わせフォームの送信先を変える)
6. [独自ドメインを設定する](#6-独自ドメインを設定する)
7. [Vercel プロジェクトをリネーム](#7-vercel-プロジェクトをリネーム)

所要時間の目安は **2〜4 時間**（コンテンツ作成を含まない）。

---

## 1. リポを自分の GitHub に持ってくる

### A. フォーク（推奨）

サンプルリポの履歴を残しつつ自社に持ってくる方法。Upstream のアップデートを取り込めます。

```bash
# GitHub UI でフォーク後
git clone https://github.com/<your-org>/chat-driven-website-sample.git
cd chat-driven-website-sample
```

### B. テンプレートとしてコピー（フォーク履歴不要）

```bash
git clone --depth=1 https://github.com/feel-flow/chat-driven-website-sample.git my-company-site
cd my-company-site
rm -rf .git
git init
git remote add origin https://github.com/<your-org>/my-company-site.git
```

> 後者の場合は upstream のセキュリティアップデートが自動では入りません。定期的にサンプルリポの diff を確認することを推奨します。

---

## 2. 社名・サイト URL を差し替える

### `src/config/site.ts`

サイトの中央設定ファイルです。

```ts
// 例
export const site = {
  name: '株式会社○○',
  url: 'https://your-company.com',
  description: '○○業界向けに××を支援する○○の会社です。',
  // ...
} as const;
```

`site.name` は **全ページのヘッダー・フッター・OGP title** に反映されます。

### `astro.config.mjs`

```js
export default defineConfig({
  site: 'https://your-company.com',   // ← 本番ドメインに差し替え
  // ...
});
```

### SEO への影響

`src/components/SEOHead.astro` は `site.ts` の値から JSON-LD（Organization スキーマ）を生成します。社名を変えるだけで構造化データも同時に追従します。

> **注意**: 検索エンジンに対する影響が大きいため、本番デプロイ直前にまとめて変更するのが安全です。

---

## 3. ロゴ・配色を変える

### ロゴ

`public/images/logo.svg`（または `.png`）を差し替えます。`src/components/Header.astro` から参照されています。

```bash
cp ~/your-logo.svg public/images/logo.svg
```

ヘッダーに表示されるサイズを大きく変える場合は `Header.astro` の `<img>` タグの幅 / 高さも調整してください。

### 配色

このリポは Astro の CSS をベースに、いくつかのコンポーネント固有スタイルを定義しています。配色のメインは:

| 場所 | 何を変えるか |
|------|------------|
| `src/styles/global.css`（または `src/layouts/Base.astro` の `<style is:global>`） | プライマリ色・アクセント色の CSS 変数 |
| 各コンポーネントの `<style>` ブロック | 個別のホバー色など |

CSS 変数を使っている場合は `--color-primary` 等を 1 箇所変えるだけで全体が追従します。

### ファビコン

`public/favicon.svg` を差し替えてください。ブラウザのタブに表示されるアイコンです。

---

## 4. サンプルコンテンツを自社のものに置き換える

### ニュース

`src/content/news/` のサンプル記事を削除または編集します。

```bash
# 削除して新規追加に切り替える例
rm src/content/news/launch.md
rm src/content/news/new-service.md
```

その後、`/update-news` Skill または `/write-blog` Skill で自社のニュースを追加していきます（詳細は [`docs/how-to-update.md`](how-to-update.md)）。

### サービスページ

`src/content/services/ai-consulting.md` / `web-development.md` も同様に削除 → 自社サービスを追加します。

```bash
rm src/content/services/ai-consulting.md
rm src/content/services/web-development.md
```

新規追加は `/add-service-page` Skill が便利です。

### トップページ（LP）

`src/pages/index.astro` のヒーロー見出し・サブコピー・特徴セクションを自社向けに書き換えます。LP のコピーは「自社の強み」と「顧客の悩み」を 1 文ずつ載せるだけでも十分に機能します（書籍 5-3 章で詳述）。

### About ページ

`src/pages/about.astro` の代表挨拶・会社概要を差し替えます。会社情報（住所・電話・代表者名）は最小限でかまいません。

---

## 5. お問い合わせフォームの送信先を変える

`.env`（およびそれに対応する Vercel の Environment Variables）の以下 2 つを更新します:

| 変数 | 説明 |
|------|------|
| `RESEND_FROM_ADDRESS` | 送信元アドレス（Resend で verify したドメインのもの） |
| `CONTACT_TO_ADDRESS` | フォームの送信を受け取るアドレス |

例:

```env
RESEND_FROM_ADDRESS=noreply@your-company.com
CONTACT_TO_ADDRESS=info@your-company.com
```

### Resend のドメイン認証

自社ドメインから送信する場合、Resend ダッシュボードで以下を設定します:

1. Domains > Add Domain
2. 表示された DNS レコード（SPF / DKIM）を自社ドメインの DNS に追加
3. 認証完了後、`RESEND_FROM_ADDRESS` をそのドメインのアドレスに変更

詳細は [`docs/external-services-setup.md`](external-services-setup.md)（Issue #355 で整備）を参照してください。

---

## 6. 独自ドメインを設定する

### Vercel 側

1. Vercel プロジェクト > Settings > Domains
2. 「Add」から `your-company.com` を入力
3. 表示された A レコード（または CNAME）を自社ドメインの DNS に追加
4. SSL 証明書は Vercel が Let's Encrypt で自動発行

### コード側

`src/config/site.ts` と `astro.config.mjs` の `site` プロパティを `https://your-company.com` に更新します（§2 で実施済みなら追加作業なし）。

サイトマップ（`/sitemap-index.xml`）と OGP の URL が新ドメインに自動で追従します。

---

## 7. Vercel プロジェクトをリネーム

サンプル名のままだと混乱の元になるので、自社用にリネームします。

1. Vercel プロジェクト > Settings > General > Project Name
2. `my-company-site` 等にリネーム
3. Vercel が払い出すサブドメイン（`*.vercel.app`）も同時に変わります

---

## 仕上げチェックリスト

- [ ] `src/config/site.ts` の `name` / `url` / `description` が自社の値
- [ ] `astro.config.mjs` の `site` が本番ドメイン
- [ ] ロゴ・ファビコンが自社のもの
- [ ] サンプルのニュース・サービス記事がすべて削除されたか、自社向けに置き換え済み
- [ ] トップページ・About ページのコピーが自社向け
- [ ] `.env` の `RESEND_FROM_ADDRESS` / `CONTACT_TO_ADDRESS` が自社のもの
- [ ] Resend のドメイン認証完了
- [ ] Vercel に独自ドメインを設定済み・SSL 有効
- [ ] `pnpm astro check` / `pnpm build` が 0 errors
- [ ] Vercel Production deploy 後、お問い合わせフォーム送信テストで自社アドレスにメールが届く

このチェックリストがすべて埋まれば、自社サイトとして公開できます。日々の更新は [`docs/how-to-update.md`](how-to-update.md) を参照してください。
