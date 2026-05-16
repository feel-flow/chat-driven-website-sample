# chat-driven-website-sample

書籍「生成AI ホームページ運用 ―『外注なし』『コスト1/100』『更新5秒』の Codex × Astro 入門」のサンプルリポジトリ。

## 起動

```bash
pnpm install
pnpm dev
```

## 詳細

`docs/setup.md` を参照。

## Forker 向け：Vercel プロジェクトの再リンク

このリポをフォークまたはクローンして自分の Vercel に接続する場合、コミット済みの `.vercel/project.json`（メンテナの Vercel プロジェクト ID）を一度削除してから `vercel link` で自分のプロジェクトに繋ぎ直してください。

```bash
rm -rf .vercel
vercel link
```

`.vercel/project.json` は `orgId` / `projectId` のみで秘密情報は含みませんが、メンテナの Vercel チームを指しているため、そのまま `vercel deploy` を実行するとあなたの Vercel トークンの権限不足で失敗します。`vercel link` で自分のプロジェクトに紐付け直せば解消します。

GitHub Actions 等の CI から使う場合は `.vercel/project.json` を commit せず、`VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` を GitHub Secrets として渡すパターンも選択可能です（Vercel 公式ドキュメント参照）。
