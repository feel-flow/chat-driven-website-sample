import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const deployHookUrl = import.meta.env.DEPLOY_HOOK_URL;
  if (!deployHookUrl) {
    return new Response(
      JSON.stringify({
        error: 'DEPLOY_HOOK_URL is not configured',
        hint: 'Create a Deploy Hook in Vercel: Project Settings → Git → Deploy Hooks',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const response = await fetch(deployHookUrl, { method: 'POST' });
    const vercelResponse = await response.json().catch(() => ({}));
    return new Response(
      JSON.stringify({
        triggered: response.ok,
        status: response.status,
        timestamp: new Date().toISOString(),
        vercelResponse,
      }),
      {
        status: response.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to trigger deploy hook',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
