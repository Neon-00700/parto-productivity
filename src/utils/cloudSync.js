import { getSupabase } from './supabaseClient';
import { getDeviceId, compressData, decompressData, defaultData } from './storageUtils';

export function cloudConfigured(settings) {
  return !!(settings?.supabaseUrl?.trim() && settings?.supabaseKey?.trim());
}

function makeRow(data) {
  const deviceId = getDeviceId();
  return {
    device_id: deviceId,
    tasks: compressData(data.tasks),
    daily_tasks: compressData(data.dailyTasks || []),
    gym_program: compressData(data.gymProgram),
    habits: compressData(data.habits),
    calendar_events: compressData(data.calendar),
    pomodoro_history: compressData(data.pomodoro?.history || []),
    pomodoro_settings: data.pomodoro?.settings || {},
    flashcards: compressData(data.flashcards || []),
    games: compressData(data.games || []),
    german: compressData(data.german || {}),
    app_settings: {
      ...data.settings,
      supabaseKey: '',
      customTags: data.customTags || [],
      extras: compressData({
        notes: data.notes || [], journal: data.journal || [], expenses: data.expenses || [],
        bodyLog: data.bodyLog || [], templates: data.templates || [],
        gamification: data.gamification || { xp: 0 }, frog: data.frog || {},
      }),
    },
    updated_at: new Date().toISOString(),
  };
}

export async function pushDataToCloud(data) {
  if (!cloudConfigured(data.settings)) return { ok: false, error: 'not-configured' };
  const sb = getSupabase(data.settings.supabaseUrl.trim(), data.settings.supabaseKey.trim());
  if (!sb) return { ok: false, error: 'client-failed' };
  const row = makeRow(data);
  const { error } = await sb.from('user_data').upsert(row, { onConflict: 'device_id' });
  if (error) return { ok: false, error: error.message || String(error) };
  return { ok: true, at: row.updated_at };
}

export async function pullDataFromCloud(data) {
  if (!cloudConfigured(data.settings)) return { ok: false, error: 'not-configured' };
  const sb = getSupabase(data.settings.supabaseUrl.trim(), data.settings.supabaseKey.trim());
  if (!sb) return { ok: false, error: 'client-failed' };
  const { data: rows, error } = await sb.from('user_data').select('*').eq('device_id', getDeviceId()).limit(1);
  if (error) return { ok: false, error: error.message || String(error) };
  if (!rows?.length) return { ok: false, error: 'not-found' };
  const row = rows[0];
  const base = defaultData();
  const cloudSettings = { ...(row.app_settings || {}) };
  const extras = cloudSettings.extras ? decompressData(cloudSettings.extras) : null;
  delete cloudSettings.extras;
  const next = {
    ...base,
    tasks: decompressData(row.tasks) || base.tasks,
    dailyTasks: decompressData(row.daily_tasks) || base.dailyTasks,
    gymProgram: decompressData(row.gym_program) || base.gymProgram,
    habits: decompressData(row.habits) || base.habits,
    calendar: decompressData(row.calendar_events) || base.calendar,
    pomodoro: { settings: { ...base.pomodoro.settings, ...(row.pomodoro_settings || {}) }, history: decompressData(row.pomodoro_history) || [] },
    flashcards: decompressData(row.flashcards) || [],
    games: decompressData(row.games) || [],
    german: decompressData(row.german) || base.german,
    customTags: cloudSettings.customTags || base.customTags,
    notes: extras?.notes || [], journal: extras?.journal || [], expenses: extras?.expenses || [],
    bodyLog: extras?.bodyLog || [], templates: extras?.templates || [],
    gamification: extras?.gamification || { xp: 0 }, frog: extras?.frog || base.frog,
    settings: { ...base.settings, ...cloudSettings, supabaseUrl: data.settings.supabaseUrl, supabaseKey: data.settings.supabaseKey },
    lastSync: row.updated_at || new Date().toISOString(),
  };
  return { ok: true, data: next, updatedAt: row.updated_at };
}
