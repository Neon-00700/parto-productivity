import { useState, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { getSupabase } from '../utils/supabaseClient';
import { getDeviceId, compressData, decompressData, defaultData } from '../utils/storageUtils';

export function useSupabase() {
  const { data, setData, setLastSync } = useApp();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const client = useCallback(() => getSupabase(data.settings.supabaseUrl?.trim(), data.settings.supabaseKey?.trim()), [data.settings.supabaseUrl, data.settings.supabaseKey]);
  const configured = !!(data.settings.supabaseUrl?.trim() && data.settings.supabaseKey?.trim());

  const testConnection = useCallback(async () => {
    const sb = client();
    if (!sb) return { ok: false, error: 'not-configured' };
    setStatus('loading');
    try {
      const { error: err } = await sb.from('user_data').select('device_id').limit(1);
      if (err) throw err;
      setStatus('success');
      return { ok: true };
    } catch (e) {
      setStatus('error');
      setError(e.message || String(e));
      return { ok: false, error: e.message || String(e) };
    }
  }, [client]);

  // Push: local wins — upsert everything to Supabase (compressed blobs)
  const pushToCloud = useCallback(async () => {
    const sb = client();
    if (!sb) return { ok: false, error: 'not-configured' };
    setStatus('loading');
    try {
      const deviceId = getDeviceId();
      const row = {
        device_id: deviceId,
        tasks: compressData(data.tasks),
        daily_tasks: compressData(data.dailyTasks || []),
        gym_program: compressData(data.gymProgram),
        habits: compressData(data.habits),
        calendar_events: compressData(data.calendar),
        pomodoro_history: compressData(data.pomodoro.history),
        pomodoro_settings: data.pomodoro.settings,
        flashcards: compressData(data.flashcards),
        games: compressData(data.games),
        german: compressData(data.german || {}),
        app_settings: {
          ...data.settings,
          supabaseKey: '',
          customTags: data.customTags,
          // new offline features packed into the same JSONB column (no schema change needed)
          extras: compressData({
            notes: data.notes || [], journal: data.journal || [], expenses: data.expenses || [],
            bodyLog: data.bodyLog || [], templates: data.templates || [],
            gamification: data.gamification || { xp: 0 }, frog: data.frog || {},
          }),
        },
        updated_at: new Date().toISOString(),
      };
      const { error: err } = await sb.from('user_data').upsert(row, { onConflict: 'device_id' });
      if (err) throw err;
      const now = new Date().toISOString();
      setLastSync(now);
      setStatus('success');
      return { ok: true, at: now };
    } catch (e) {
      setStatus('error');
      setError(e.message || String(e));
      return { ok: false, error: e.message || String(e) };
    }
  }, [client, data, setLastSync]);

  // Load: cloud wins — pull and replace local data
  const loadFromCloud = useCallback(async () => {
    const sb = client();
    if (!sb) return { ok: false, error: 'not-configured' };
    setStatus('loading');
    try {
      const deviceId = getDeviceId();
      const { data: rows, error: err } = await sb.from('user_data').select('*').eq('device_id', deviceId).limit(1);
      if (err) throw err;
      if (!rows || !rows.length) throw new Error('No cloud data found for this device');
      const row = rows[0];
      const base = defaultData();
      const cloudSettings = { ...(row.app_settings || {}) };
      const extras = cloudSettings.extras ? decompressData(cloudSettings.extras) : null;
      delete cloudSettings.extras;
      const next = {
        ...base,
        tasks: decompressData(row.tasks) || base.tasks,
        dailyTasks: decompressData(row.daily_tasks) || base.dailyTasks,
        gymProgram: decompressData(row.gym_program) || [],
        habits: decompressData(row.habits) || base.habits,
        calendar: decompressData(row.calendar_events) || [],
        pomodoro: {
          settings: { ...base.pomodoro.settings, ...(row.pomodoro_settings || {}) },
          history: decompressData(row.pomodoro_history) || [],
        },
        flashcards: decompressData(row.flashcards) || [],
        games: decompressData(row.games) || [],
        german: decompressData(row.german) || base.german,
        customTags: cloudSettings.customTags || base.customTags,
        notes: extras?.notes || [],
        journal: extras?.journal || [],
        expenses: extras?.expenses || [],
        bodyLog: extras?.bodyLog || [],
        templates: extras?.templates || [],
        gamification: extras?.gamification || { xp: 0 },
        frog: extras?.frog || base.frog,
        settings: {
          ...base.settings,
          ...cloudSettings,
          customTags: undefined,
          // keep local credentials — cloud never stores the key
          supabaseUrl: data.settings.supabaseUrl,
          supabaseKey: data.settings.supabaseKey,
        },
        lastSync: new Date().toISOString(),
      };
      delete next.settings.customTags;
      setData(next);
      setStatus('success');
      return { ok: true };
    } catch (e) {
      setStatus('error');
      setError(e.message || String(e));
      return { ok: false, error: e.message || String(e) };
    }
  }, [client, data.settings.supabaseUrl, data.settings.supabaseKey, setData]);

  return { configured, status, error, testConnection, pushToCloud, loadFromCloud, lastSync: data.lastSync };
}
