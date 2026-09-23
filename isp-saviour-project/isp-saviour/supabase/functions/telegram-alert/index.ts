// ============================================================================
// ISP SAVIOUR — Phase 4: Telegram Alert Edge Function
//
// Invoked by the `trg_notify_node_status_change` Postgres trigger
// (see supabase/migrations/0004_telegram_trigger.sql) whenever a node's
// status changes to 'offline' or 'wire_down' and the current notification
// preference allows it.
//
// Required secrets (set with `supabase secrets set ...`):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID
//
// SUPABASE_SERVICE_ROLE_KEY is NOT something you set yourself — Supabase
// automatically injects it (along with SUPABASE_URL / SUPABASE_ANON_KEY)
// into every Edge Function's environment. We read it back here purely to
// verify the caller (see isAuthorizedServiceRole below).
//
// Deploy with:  supabase functions deploy telegram-alert
// (do NOT pass --no-verify-jwt — the whole point is that only a request
// carrying a valid Supabase JWT reaches this code at all; the extra check
// below narrows that further to "service role only").
// ============================================================================

interface NodePayload {
  id: string;
  name: string;
  type: string;
  status: string;
  pon_port?: string | null;
  olt_name?: string | null;
}

interface TriggerPayload {
  old: NodePayload;
  new: NodePayload;
}

function isAuthorizedServiceRole(req: Request): boolean {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return Boolean(serviceRoleKey) && token === serviceRoleKey;
}

function formatAlertMessage(newNode: NodePayload): string {
  const isWireDown = newNode.status === 'wire_down';
  const icon = isWireDown ? '🚨' : '⚠️';
  const statusLabel = isWireDown ? 'WIRE DOWN' : newNode.status.replace('_', ' ').toUpperCase();
  const typeLabel = (newNode.type ?? 'NODE').toUpperCase();
  const oltPart = newNode.olt_name ? ` on ${newNode.olt_name}` : '';
  const ponPart = newNode.pon_port ? ` -> PON ${newNode.pon_port}` : '';

  return `${icon} *NETWORK ALERT:*\n${typeLabel} '${newNode.name}' is *${statusLabel}*${oltPart}${ponPart}!`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // "Secure the webhook route" + "Use Supabase service role verification" —
  // reject anything not carrying the project's own service role key, so
  // this function can't be used by an arbitrary anon/authenticated caller
  // to spam the configured Telegram chat.
  if (!isAuthorizedServiceRole(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: TriggerPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!payload?.new?.name || !payload?.new?.status) {
    return new Response(JSON.stringify({ error: 'Missing "new" node data in payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.error('[telegram-alert] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret.');
    return new Response(JSON.stringify({ error: 'Server not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CORRECTED ENDPOINT — see the Phase 4 delivery note / README for why
  // this differs from the URL originally specified in the project brief
  // (`https://telegram.org<token>/sendMessage`, which is not a real
  // Telegram Bot API endpoint).
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const message = formatAlertMessage(payload.new);

    const tgResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const tgResult = await tgResponse.json();

    if (!tgResponse.ok || !tgResult.ok) {
      console.error('[telegram-alert] Telegram API rejected the message:', tgResult);
      return new Response(JSON.stringify({ error: 'Telegram send failed', details: tgResult }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[telegram-alert] Unexpected error sending Telegram message:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
