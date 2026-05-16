import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const contact = defineAction({
  accept: 'form',
  input: z.object({
    name: z.string().min(1).max(100),
    email: z.email(),
    message: z.string().min(10).max(2000),
    turnstileToken: z.string().min(1),
  }),
  handler: async (input) => {
    const turnstileSecret = import.meta.env.TURNSTILE_SECRET;
    const resendApiKey = import.meta.env.RESEND_API_KEY;

    // 環境変数が未設定の場合は明示的にエラーを返す（本番デプロイ前の検知用）
    if (!turnstileSecret || !resendApiKey) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'サーバ設定エラー：環境変数 (TURNSTILE_SECRET / RESEND_API_KEY) が設定されていません。',
      });
    }

    // Cloudflare Turnstile 検証（siteverify は form-urlencoded を期待する）
    const verifyParams = new URLSearchParams({
      secret: turnstileSecret,
      response: input.turnstileToken,
    });

    let verifyData: { success: boolean; 'error-codes'?: string[] };
    try {
      const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyParams,
      });
      verifyData = (await verifyRes.json()) as typeof verifyData;
    } catch (_err) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'スパム判定サービスへの接続に失敗しました。時間をおいて再度お試しください。',
      });
    }

    if (!verifyData.success) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message:
          'スパム判定に失敗しました。ページを再読み込みしてから再度お試しください。',
      });
    }

    // メール送信
    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: 'noreply@example.com', // 実ドメイン認証後に置き換え
      to: 'contact@example.com',
      replyTo: input.email,
      subject: `お問い合わせ：${input.name} 様より`,
      text: `差出人: ${input.name} <${input.email}>\n\n${input.message}`,
    });

    if (sendError) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'メール送信に失敗しました。時間をおいて再度お試しください。',
      });
    }

    return { ok: true };
  },
});
