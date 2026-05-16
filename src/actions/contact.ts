import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { Resend } from 'resend';

// NOTE: 本サンプルは rate limit を実装していません。
// production では Vercel KV / Upstash 等で IP/Email ベースの leaky bucket を入れてください。
// NOTE: 本サンプルは Turnstile siteverify の hostname / action 検証を省略しています。
// production では verifyData.hostname / verifyData.action を期待値と照合してください。

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// 設定エラーをユーザーに直接見せないための generic 文言
const GENERIC_CONFIG_ERROR =
  '設定エラーです。お手数ですが管理者にお問い合わせください。';

// Turnstile siteverify の error-codes のうち、サーバ設定起因のもの
// （ユーザーが再試行しても解決しない）
const SERVER_SIDE_TURNSTILE_ERROR_CODES = new Set([
  'missing-input-secret',
  'invalid-input-secret',
]);

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

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
    const fromAddress = import.meta.env.RESEND_FROM_ADDRESS;
    const toAddress = import.meta.env.CONTACT_TO_ADDRESS;

    // 環境変数が未設定の場合は、ユーザーには generic な文言を返し、
    // どの変数が欠けているかはサーバログに残す（情報漏えい防止）
    const missingEnv: string[] = [];
    if (!turnstileSecret) missingEnv.push('TURNSTILE_SECRET');
    if (!resendApiKey) missingEnv.push('RESEND_API_KEY');
    if (!fromAddress) missingEnv.push('RESEND_FROM_ADDRESS');
    if (!toAddress) missingEnv.push('CONTACT_TO_ADDRESS');
    if (missingEnv.length > 0) {
      console.error(
        `[contact] missing required env vars: ${missingEnv.join(', ')}`,
      );
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: GENERIC_CONFIG_ERROR,
      });
    }

    // Cloudflare Turnstile 検証（siteverify は form-urlencoded を期待する）
    const verifyParams = new URLSearchParams({
      secret: turnstileSecret,
      response: input.turnstileToken,
    });

    let verifyData: TurnstileVerifyResponse;
    try {
      const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyParams,
      });
      if (!verifyRes.ok) {
        console.error(
          `[contact] turnstile siteverify HTTP ${verifyRes.status}`,
        );
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            'スパム判定サービスへの接続に失敗しました。時間をおいて再度お試しください。',
        });
      }
      verifyData = (await verifyRes.json()) as TurnstileVerifyResponse;
    } catch (err) {
      // 既に ActionError として throw 済みのものはそのまま再 throw
      if (err instanceof ActionError) throw err;
      console.error('[contact] turnstile siteverify network error', err);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'スパム判定サービスへの接続に失敗しました。時間をおいて再度お試しください。',
      });
    }

    if (!verifyData.success) {
      const errorCodes = verifyData['error-codes'] ?? [];
      const isServerConfigError = errorCodes.some((code) =>
        SERVER_SIDE_TURNSTILE_ERROR_CODES.has(code),
      );
      if (isServerConfigError) {
        console.error(
          `[contact] turnstile server-side config error: ${errorCodes.join(', ')}`,
        );
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: GENERIC_CONFIG_ERROR,
        });
      }
      throw new ActionError({
        code: 'BAD_REQUEST',
        message:
          'スパム判定に失敗しました。ページを再読み込みしてから再度お試しください。',
      });
    }

    // メール送信
    const resend = new Resend(resendApiKey);
    try {
      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: toAddress,
        replyTo: input.email,
        subject: `お問い合わせ：${input.name} 様より`,
        text: `差出人: ${input.name} <${input.email}>\n\n${input.message}`,
      });

      if (sendError) {
        console.error('[contact] resend API error', sendError);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'メール送信に失敗しました。時間をおいて再度お試しください。',
        });
      }
    } catch (err) {
      if (err instanceof ActionError) throw err;
      console.error('[contact] resend network error', err);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'メール送信サービスへの接続に失敗しました。時間をおいて再度お試しください。',
      });
    }

    return { ok: true };
  },
});
