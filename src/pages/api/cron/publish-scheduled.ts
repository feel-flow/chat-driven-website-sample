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
    console.error('[cron/publish-scheduled] DEPLOY_HOOK_URL is not configured');
    return new Response(JSON.stringify({ error: 'Service misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(deployHookUrl, { method: 'POST' });
    if (!response.ok) {
      console.error(
        `[cron/publish-scheduled] Deploy hook returned ${response.status}`,
      );
    }
    return new Response(
      JSON.stringify({
        triggered: response.ok,
        timestamp: new Date().toISOString(),
      }),
      {
        status: response.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[cron/publish-scheduled] Failed to trigger deploy hook', error);
    return new Response(JSON.stringify({ error: 'Deploy hook unreachable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
