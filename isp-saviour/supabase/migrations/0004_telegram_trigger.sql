-- ============================================================================
-- ISP SAVIOUR — Phase 4: Telegram Alert Trigger
--
-- Fires ONLY when a node's status column CHANGES to 'offline' or 'wire_down'
-- (not on every update, and not when it's already offline and stays offline).
-- Calls the `telegram-alert` Edge Function over HTTP via pg_net.
--
-- SECURITY: the Edge Function requires a valid Supabase-issued JWT by
-- default (verify_jwt is on unless explicitly disabled at deploy time — we
-- do NOT disable it). This trigger authenticates as the service role by
-- sending the project's service_role key as a Bearer token, and the Edge
-- Function additionally checks that the token matches
-- SUPABASE_SERVICE_ROLE_KEY exactly (see supabase/functions/telegram-alert
-- /index.ts) — satisfying "Use Supabase service role verification".
--
-- The service role key and the Edge Function's URL are NOT hardcoded here.
-- They are pulled from Supabase Vault at runtime — see supabase/README.md
-- "Phase 4 setup" for the one-time SQL commands to store them (they contain
-- your project's real secrets and must never be committed to git).
-- ============================================================================

create extension if not exists pg_net;
create extension if not exists supabase_vault;

create or replace function public.notify_node_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_edge_url      text;
  v_service_key   text;
  v_preference    notification_preference;
  v_should_send   boolean := false;
  v_payload       jsonb;
begin
  -- Only proceed if status actually changed AND landed on a monitored state.
  if new.status is distinct from old.status
     and new.status in ('offline', 'wire_down') then

    -- Read the current admin-configured preference (Phase 4.3).
    select preference into v_preference
    from public.notification_settings
    order by updated_at desc
    limit 1;

    v_preference := coalesce(v_preference, 'only_wire_down');

    if v_preference = 'muted' then
      v_should_send := false;
    elsif v_preference = 'only_wire_down' then
      v_should_send := (new.status = 'wire_down');
    elsif v_preference = 'all_logs' then
      v_should_send := true;
    end if;

    if not v_should_send then
      return new;
    end if;

    select decrypted_secret into v_edge_url
    from vault.decrypted_secrets
    where name = 'telegram_edge_function_url';

    select decrypted_secret into v_service_key
    from vault.decrypted_secrets
    where name = 'service_role_key';

    if v_edge_url is null or v_service_key is null then
      raise warning
        'notify_node_status_change: Vault secrets "telegram_edge_function_url" / "service_role_key" not configured — skipping Telegram alert. See supabase/README.md Phase 4 setup.';
      return new;
    end if;

    v_payload := jsonb_build_object(
      'old', jsonb_build_object(
        'id', old.id, 'name', old.name, 'type', old.type, 'status', old.status
      ),
      'new', jsonb_build_object(
        'id', new.id, 'name', new.name, 'type', new.type, 'status', new.status,
        'pon_port', new.metadata ->> 'pon_port',
        'olt_name', new.metadata ->> 'olt_name'
      )
    );

    -- Fire-and-forget async HTTP call — does not block the UPDATE.
    perform net.http_post(
      url     := v_edge_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body    := v_payload
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_node_status_change on public.nodes;
create trigger trg_notify_node_status_change
  after update on public.nodes
  for each row execute function public.notify_node_status_change();
