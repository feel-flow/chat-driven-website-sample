# setup.md — 初回セットアップ

このリポジトリをクローンしてから、自分の Vercel に初回デプロイされるまでの手順です。所要時間は **30〜60 分**（外部サービスの登録待ちを含む）。

書籍 第 0 章「環境を整える 30 分」と対応します。

---

## 0. 必要なもの

| ツール | バージョン | 用途 |
|--------|----------|------|
| Node.js | 22.12.0 以上 | Astro の実行環境 |
| pnpm | 10.x 推奨 | パッケージマネージャ |
| Git | 2.40 以上 | バージョン管理 |
| GitHub アカウント | — | リポジトリホスティング |
| Vercel アカウント | — | デプロイ先（Hobby プランで OK） |
| Resend アカウント | — | お問い合わせフォームのメール送信 |
| Cloudflare アカウント | — | Turnstile（スパム対策） |

> **外部サービス（Resend / Cloudflare Turnstile）の詳細手順** は別ファイル [`docs/external-services-setup.md`](external-services-setup.md) を参照してください（このファイルは Issue #355 で整備されます）。

---

## 1. Node.js と pnpm の準備

### macOS

```bash
# Homebrew で Node.js を入れる
brew install node@22

# pnpm を有効化（Corepack 経由）
corepack enable
corepack prepare pnpm@latest --activate
```

### Windows

[Volta](https://volta.sh/) または [fnm](https://github.com/Schniz/fnm) で Node.js 22 をインストール後、

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

### 確認

```bash
node --version   # v22.12.0 以上
pnpm --version   # 10.x
```

---

## 2. リポジトリをクローン

```bash
git clone https://github.com/feel-flow/chat-driven-website-sample.git
cd chat-driven-website-sample
pnpm install
```

ローカル動作確認:

```bash
pnpm dev
```

`http://localhost:4321/` を開いて、サンプルサイトが表示されれば OK。Ctrl+C で停止。

---

## 3. 環境変数を準備

`.env.example` を `.env` にコピー:

```bash
cp .env.example .env
```

`.env` を開いて、以下の値を設定します（実際の値の取得手順は [`docs/external-services-setup.md`](external-services-setup.md) を参照）:

| 変数 | 取得元 | 備考 |
|------|--------|------|
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) | `re_` で始まる文字列 |
| `RESEND_FROM_ADDRESS` | Resend で verify したドメインのアドレス | 例: `noreply@your-domain.com` |
| `CONTACT_TO_ADDRESS` | 自分の受信用メールアドレス | 例: `info@your-domain.com` |
| `PUBLIC_TURNSTILE_SITE_KEY` | [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) | サイトキー（公開可） |
| `TURNSTILE_SECRET` | Cloudflare Turnstile | シークレットキー（**絶対に公開しない**） |

> `PUBLIC_` プレフィックスがついた変数だけがクライアントバンドルに同梱されます。それ以外はサーバ専用です。

ローカル動作確認:

```bash
pnpm dev
# /contact ページを開いてフォームから送信できるか確認
```

---

## 4. Vercel プロジェクトを作る

### 4-1. GitHub にプッシュ

このリポをフォーク、または自社用のリポを新規作成して push します。

```bash
# 自社リポにする場合
git remote set-url origin https://github.com/<your-org>/<your-repo>.git
git push -u origin develop
```

### 4-2. Vercel に連携

1. [Vercel ダッシュボード](https://vercel.com/new) を開く
2. 「Import Git Repository」から先ほど push したリポを選択
3. Framework Preset: **Astro** が自動検出される
4. Build Command: `pnpm build`
5. Install Command: `pnpm install`
6. Output Directory: **空欄のまま**（Astro Vercel adapter が `.vercel/output` を自動生成・自動検出します。UI で明示すると Override 扱いになり想定外の挙動につながるため）

### 4-3. Vercel 側に環境変数を登録

Vercel プロジェクト > Settings > Environment Variables で、`.env` と同じ 5 つの変数を登録します。

- Environment: **Production** と **Preview** の両方にチェック
- `TURNSTILE_SECRET` などサーバ専用変数は Plain text のままで OK（Vercel が暗号化保存）

### 4-4. デプロイ

`develop` ブランチを push すると Vercel が自動でデプロイします。

```bash
git push origin develop
```

Vercel ダッシュボードで Deploy Preview URL を確認し、フォーム送信まで動作することを確認してください。

---

## 5. Forker 向け：既存の `.vercel/project.json` をクリア

このリポにはメンテナの Vercel プロジェクト ID がコミットされています。フォークして自分の Vercel に繋ぐ場合は、一度削除してから `vercel link` で繋ぎ直してください。

```bash
rm -rf .vercel
vercel link
```

`.vercel/project.json` には `orgId` / `projectId` のみが含まれており **秘密情報ではない** ですが、メンテナの Vercel チームを指しているため、そのまま `vercel deploy` を実行すると権限不足で失敗します。

GitHub Actions など CI から使う場合は `.vercel/project.json` を commit せず、`VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` を GitHub Secrets として渡すパターンも選択肢になります（[Vercel 公式ドキュメント](https://vercel.com/docs/deployments/git/vercel-for-github) 参照）。

---

## 6. 動作確認チェックリスト

ローカル:

- [ ] `pnpm astro check` が 0 errors
- [ ] `pnpm build` が success
- [ ] `pnpm dev` で `/` `/news` `/services` `/about` `/contact` が表示される
- [ ] `/contact` からテスト送信し、`CONTACT_TO_ADDRESS` にメールが届く

Vercel:

- [ ] Deploy Preview URL でも上記がすべて動く
- [ ] Production deploy が成功

ここまで通れば、Codex CLI または Claude Code を使った日々の更新フローに移れます。次は [`docs/how-to-update.md`](how-to-update.md) を参照してください。
