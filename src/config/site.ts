// サイト全体で参照する基本メタ情報の中央集約ポイント。
// SEOHead / Footer / Header などのコンポーネントから import して使う。
// TODO: 実際のサイト公開時にサイト名・会社名・URL を本番値に置き換える
//   例: name: 'サンプル株式会社', url: 'https://example.com'
export const siteConfig = {
  name: 'chat-driven-website-sample',
  url: 'https://chat-driven-website-sample.vercel.app',
} as const;
