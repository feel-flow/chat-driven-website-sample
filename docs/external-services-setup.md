# 外部サービスセットアップ手順

このドキュメントは、本サンプルサイトの Contact フォームを動作させるために必要な外部サービスのセットアップ手順を、汎用的な手順としてまとめたものです。

Contact フォームは以下 2 つの外部サービスに依存しています。

- **Resend** — メール送信 API（フォーム送信内容を運用者宛に届ける）
- **Cloudflare Turnstile** — スパム/ボット対策（CAPTCHA の代替）

最後に、これらの認証情報を **Vercel** に環境変数として登録すれば、Preview / Production の両方でフォームが動作します。

> **本書を実機で動かす読者の方へ**：以下の手順を上から順に実施すれば、ご自身のドメインとアカウントで Contact フォームを稼働させられます。各サービスのアカウントは無料枠で開始できます。

---

## 1. 概要：必要な環境変数

`.env.example` で定義されている 5 つの環境変数を、後工程で取得した値で埋めていきます。

| 変数名 | 用途 | 公開可否 |
|---|---|---|
| `RESEND_API_KEY` | Resend API への認証トークン | サーバ専用（秘匿） |
| `RESEND_FROM_ADDRESS` | 送信元アドレス（Resend で verified なドメイン配下） | サーバ専用 |
| `CONTACT_TO_ADDRESS` | フォーム送信を受け取る運用者アドレス | サーバ専用 |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile widget をブラウザに表示するためのキー | クライアント bundle に同梱（公開可） |
| `TURNSTILE_SECRET` | Turnstile siteverify API 用のシークレット | サーバ専用（秘匿） |

> **重要**: `PUBLIC_` プレフィックスがついた変数は Astro のクライアント bundle に同梱されます。Site Key 以外の秘匿値を絶対に `PUBLIC_` プレフィックス付きで設定しないでください。

---

## 2. Resend セットアップ

### 2-1. アカウント作成

1. [https://resend.com](https://resend.com) にアクセスし、サインアップします（GitHub / Google / メールアドレスで登録可能）。
2. 無料プランで月 3,000 通程度まで送信できます（送信上限・1 日あたりの制約は改訂されることがあるため、最新の枠は [Resend Pricing](https://resend.com/pricing) を確認してください）。

### 2-2. 送信ドメインの追加と verify

Resend は、`from` に指定するメールアドレスのドメインを事前に verify する必要があります。verified でないドメインを `from` に指定すると、API は 403 系のエラーを返します。

1. Resend ダッシュボードで **Domains → Add Domain** を選択。
2. ドメイン名を入力します。
   - 推奨は **サブドメイン**（例: `mail.example.com`）。トップレベルドメインを使うと既存のメール送受信に DNS 衝突する場合があります。
   - ルートドメインを既にメール送信に使っていなければ `example.com` のままでも構いません。
3. Resend が表示する **SPF（TXT）** および **DKIM（TXT）** レコードをドメインの DNS に追加します。
   - Cloudflare DNS / Route 53 / お名前.com など、ドメインを管理しているレジストラ/DNS サービスの管理画面で追加します。
   - 反映には数分〜数時間かかる場合があります。
4. Resend ダッシュボードで **Verify** ボタンを押し、ステータスが **Verified**（緑）になることを確認します。

> **トラブル時**: 24 時間経っても Verified にならない場合、TXT レコードの値が改行・空白で壊れていないか、レジストラ側で自動 URL エンコードされていないかを確認してください。

### 2-3. API Key の取得

1. ダッシュボードで **API Keys → Create API Key** を選択。
2. 名前（例: `chat-driven-website-prod`）と権限（**Sending access** で十分）を設定。
3. 生成されたキー（`re_xxxxxxxxxxxxxxxxxxxxxxxx` の形式）をコピーします。
   - **このタイミングでしか全文を表示できません**。すぐに後述の Vercel に登録するか、安全なパスワードマネージャに保存してください。

### 2-4. 環境変数の決め方

| 変数 | 入れる値の例 |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxxxxxx`（2-3 で取得した値） |
| `RESEND_FROM_ADDRESS` | `noreply@mail.example.com`（2-2 で verified にしたドメイン配下の任意ローカル部） |
| `CONTACT_TO_ADDRESS` | `contact@example.com`（運用者が普段読んでいるメールアドレス。`RESEND_FROM_ADDRESS` と同一ドメインである必要はない） |

> **注意**: `RESEND_FROM_ADDRESS` のドメインは必ず 2-2 で Verified にしたドメインと一致させてください。verified 外のドメインを設定するとサーバログに Resend API エラーが残り、ユーザーには汎用エラーが返ります（後述 6-2 参照）。

---

## 3. Cloudflare Turnstile セットアップ

Turnstile は Cloudflare が提供する無料の CAPTCHA 代替サービスです。Cloudflare アカウントは無料で作成でき、Turnstile 自体に課金は発生しません（本書執筆時点）。

### 3-1. Cloudflare アカウント作成

1. [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) からアカウント作成。
2. ドメインを Cloudflare に移管する必要は **ありません**（Turnstile はドメイン管理と独立して使えます）。

### 3-2. Turnstile サイトの追加

1. [https://dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) を開きます。
2. **Add site** を選択。
3. 入力項目：
   - **Site name**: 識別用の名前（例: `chat-driven-website`）
   - **Domain**: widget を表示するホスト名を **完全一致** で追加します（wildcard 不可、Turnstile UI で実際の表記を必ず確認してください）。
     - 本番ドメイン: `example.com`
     - ローカル開発: `localhost`（必要なら）
     - **Vercel Preview の扱い**: Vercel Preview の hostname (`<branch>-<hash>.vercel.app`) は PR ごとに変わるため、本番用 Site Key と同じものを使うと Preview で widget が "Error" になります。**Preview 用に別の Turnstile site を作成して別 site key を発行**するか、Production のみ Turnstile 保護する運用を推奨します。
   - **Widget mode**: `Managed`（推奨）。多くのユーザーは challenge なしで通過します。
4. 作成すると、**Site Key**（`0x4AAAAAAA...`）と **Secret Key**（`0x4AAAAAAA...`）が表示されます。
   - **Site Key** はブラウザに露出して問題ない公開キー
   - **Secret Key** はサーバ側の siteverify でのみ使う秘匿キー

> **重要**: Site Key 発行時に登録した **Domain** に含まれていないホストからリクエストが来ると、widget は "Error" 状態になります。デプロイ後にこのエラーが出たら、まずこのドメイン登録を見直してください。

### 3-3. 環境変数の決め方

| 変数 | 入れる値の例 |
|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAAAxxxxxxxxxxxxxxxx`（3-2 で取得した Site Key） |
| `TURNSTILE_SECRET` | `0x4AAAAAAAyyyyyyyyyyyyyyyy`（3-2 で取得した Secret Key） |

---

## 4. Vercel 環境変数の登録

5 つの環境変数を **Production / Preview / Development の 3 環境すべて** に登録します（合計 15 枠）。

### 4-1. CLI で登録する場合（推奨：速い）

事前準備：

```bash
# プロジェクトを Vercel にリンク済みであること
vercel link
```

対話モードで 1 つずつ登録：

```bash
vercel env add RESEND_API_KEY production
# プロンプトで値を貼り付け
```

非対話モード（シェルから流し込み）：

```bash
echo "re_xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add RESEND_API_KEY production
echo "re_xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add RESEND_API_KEY preview
echo "re_xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add RESEND_API_KEY development
```

5 変数 × 3 環境 = 15 回繰り返します。シェルスクリプトでループ化すると楽です。

```bash
# 例: 同じ値を 3 環境に登録するヘルパー
register_env() {
  local name="$1"
  local value="$2"
  for env in production preview development; do
    echo "$value" | vercel env add "$name" "$env"
  done
}

register_env RESEND_API_KEY            "re_xxxxxxxxxxxxxxxxxxxxxxxx"
register_env RESEND_FROM_ADDRESS       "noreply@mail.example.com"
register_env CONTACT_TO_ADDRESS        "contact@example.com"
register_env PUBLIC_TURNSTILE_SITE_KEY "0x4AAAAAAAxxxxxxxxxxxxxxxx"
register_env TURNSTILE_SECRET          "0x4AAAAAAAyyyyyyyyyyyyyyyy"
```

> Production と Preview / Development で値を変えたい場合（例: 本番用と検証用で Turnstile キーを分ける）は、環境ごとに別の値を登録してください。

### 4-2. ダッシュボードから登録する場合

1. [https://vercel.com/dashboard](https://vercel.com/dashboard) からプロジェクトを開く。
2. **Settings → Environment Variables** を選択。
3. **Add New** で 1 つずつ追加。**Environments** チェックボックスで `Production` / `Preview` / `Development` のうち適用先を選びます（3 つ全部にチェックすれば 1 回の登録で 3 環境カバーできます）。

### 4-3. 既存ダミー値の差し替え

`#343` でダミー値を登録済みの場合は、既存値を削除してから再登録します：

```bash
vercel env rm RESEND_API_KEY production --yes
echo "re_xxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add RESEND_API_KEY production
```

ダッシュボードからは該当行の **...** メニュー → **Edit** で値だけ書き換えられます。

---

## 5. 動作確認

### 5-1. Preview デプロイをトリガー

任意のブランチをリモートに push するか、`vercel deploy` を直接実行します。Vercel ダッシュボードに表示される Preview URL（`https://*.vercel.app`）を控えます。

### 5-2. /contact ページで送信テスト

1. Preview URL の `/contact` を開く。
2. ページに **Cloudflare Turnstile の widget**（チェックボックス、または何も操作不要で勝手に completed になる UI）が表示されることを確認。
   - Widget が "Error" 表示なら → 3-2 のドメイン登録を確認。
3. 名前 / メール / メッセージ（10 文字以上）を入力して送信。
4. サンクスメッセージが画面に出ることを確認。
5. `CONTACT_TO_ADDRESS` 宛にメールが届くことを確認。
6. Resend ダッシュボード **Emails** タブで送信ログを確認（`Delivered` ステータスになっていれば成功）。

### 5-3. ネガティブケース（任意だが推奨）

- **Turnstile token 無しのリクエスト**：DevTools で widget を消してから submit すると `BAD_REQUEST` で弾かれることを確認。
- **`RESEND_FROM_ADDRESS` を verified 外ドメインに設定** → submit すると、ユーザー側は汎用エラー、サーバログ（Vercel Logs）には Resend API エラーの詳細が記録されることを確認。

---

## 6. トラブルシューティング

### 6-1. Turnstile widget が "Error" 表示になる

| 原因 | 対処 |
|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` の値が間違っている | Cloudflare ダッシュボードの Site Key と完全一致させる |
| デプロイ先のホストが Turnstile の Domain 登録に含まれていない | 3-2 で `*.vercel.app` および本番ドメインを登録 |
| Site Key と Secret Key を逆に設定している | `PUBLIC_` 付きが Site Key、無しが Secret Key |

### 6-2. メールが届かない

1. **Resend ダッシュボードの Emails タブを最初に見る**。`Bounced` / `Rejected` のステータス理由が表示されます。
2. ステータスが「ドメイン未 verified」系なら 2-2 をやり直し。
3. ステータスが `Delivered` なのに届かない場合、受信側のスパムフォルダを確認。`CONTACT_TO_ADDRESS` を別ドメインのアドレスに変えて切り分けます。
4. Vercel Logs（**Deployments → Logs**）で `[contact] resend API error` のような行が出ていないか確認。

### 6-3. 「設定エラーです」とユーザーに表示される（ACE-100 由来の落とし穴）

このサンプルは、サーバ側の設定不備をユーザーに直接見せない設計になっています。具体的には、以下のいずれかが発生すると **ユーザーには汎用の "設定エラーです" としか表示されません**。

- 環境変数が未設定 / 空文字 / placeholder ダミー値のまま
- `RESEND_FROM_ADDRESS` のドメインが Resend で verified されていない
- `TURNSTILE_SECRET` が Cloudflare の secret と一致しない

**見分け方**: ユーザー画面には情報がないので、**必ず Vercel Logs を見る**こと。`src/actions/contact.ts` が以下のようなログを残します。

```
[contact] missing required env vars: TURNSTILE_SECRET, RESEND_API_KEY
[contact] turnstile server-side config error: invalid-input-secret
[contact] resend API error { ... }
```

ログメッセージに従って、欠けている変数や verify 状態を修正してください。「Preview デプロイで動かない」「`.env` の本値を入れたのに動かない」と感じたときは、**まず Vercel Logs を確認する** のが最短経路です。

**placeholder のまま登録されている典型パターン**: Vercel Logs に `[contact] resend API error` の行が出ているのに、**Resend ダッシュボードの Logs には該当時刻のリクエストが何も残っていない** 場合、API key 自体が Resend に到達していない可能性が高いです。これは `re_xxxxxxxxxxxxxxxxxxxxxxxx` などの `.env.example` の placeholder 値そのままを Vercel に登録してしまった典型ケースです。本値で上書き登録し直してください。

### 6-4. ローカル開発で `.env` の本値が反映されない

ローカル開発で `.env` に本値を入れているのに動かない場合は、`vercel env pull` で Vercel 側の値を取り込んだ `.env.local` が `.env` を上書きしていないか確認してください。Astro / Vite は `.env.local` を `.env` より優先して読み込むため、`.env.local` に Vercel の placeholder 値が入っているとそちらが採用されます。

`vercel env pull` を実行するときは、本値登録後にもう一度実行して `.env.local` を更新するか、ローカル専用の値を `.env` ではなく `.env.local` に直接書く運用に統一してください。

---

## 関連ファイル

- `.env.example` — 環境変数の定義一覧
- `src/actions/contact.ts` — Contact フォームのサーバアクション本体（エラーハンドリング含む）
- `src/pages/contact.astro` — Contact ページ（Turnstile widget を含む）
