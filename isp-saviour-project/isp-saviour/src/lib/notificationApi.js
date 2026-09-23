import { supabase } from './supabaseClient';

export const NOTIFICATION_PREFERENCES = ['all_logs', 'only_wire_down', 'muted'];

/**
 * Read the current (single-row) notification preference.
 * @returns {{id:string, preference:string, updated_at:string} | null}
 *          null if the table is unreachable/empty (caller should treat as demo mode).
 */
export async function fetchNotificationPreference() {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[fetchNotificationPreference] failed:', error);
    throw error;
  }

  return data;
}

/**
 * Update the stored preference. The Phase 4 Telegram trigger reads this
 * value to decide whether to send an alert (see
 * supabase/migrations/0004_telegram_trigger.sql).
 */
export async function updateNotificationPreference(id, preference) {
  if (!NOTIFICATION_PREFERENCES.includes(preference)) {
    throw new Error(`Invalid notification preference: "${preference}"`);
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .update({ preference })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateNotificationPreference] failed:', error);
    throw error;
  }

  return data;
}
