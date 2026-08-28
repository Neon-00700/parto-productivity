import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { eventColors } from '../../themes/themes';

const empty = {
  title: '', date: '', allDay: false, startTime: '09:00', endTime: '10:00',
  color: eventColors[0].hex, description: '', repeat: 'none', reminder: 'none',
};

export default function EventModal({ open, onClose, event, defaultDate }) {
  const { addEvent, updateEvent, deleteEvent } = useApp();
  const { t } = useTranslation();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(event ? { ...empty, ...event } : { ...empty, date: defaultDate || '' });
      setError(false);
    }
  }, [open, event, defaultDate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { setError(true); return; }
    if (event) { updateEvent(event.id, form); toast.success(t('toast.eventUpdated')); }
    else { addEvent(form); toast.success(t('toast.eventAdded')); }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? t('calendar.editEvent') : t('calendar.addEvent')}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">{t('calendar.eventTitle')} *</label>
          <input autoFocus className={`input ${error && !form.title.trim() ? 'input-error' : ''}`} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('common.date')} *</label>
            <input type="date" className={`input ${error && !form.date ? 'input-error' : ''}`} value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.allDay} onChange={(e) => set('allDay', e.target.checked)} />
              {t('calendar.allDay')}
            </label>
          </div>
          {!form.allDay && (
            <>
              <div>
                <label className="label">{t('calendar.startTime')}</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('calendar.endTime')}</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div>
          <label className="label">{t('common.color')}</label>
          <div className="flex gap-2">
            {eventColors.map((c) => (
              <button key={c.id} type="button" onClick={() => set('color', c.hex)}
                className={`h-8 w-8 rounded-full transition-all ${form.color === c.hex ? 'ring-4 ring-offset-2 dark:ring-offset-slate-900 ring-primary/40 scale-110' : 'hover:scale-105'}`}
                style={{ background: c.hex }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('calendar.repeat')}</label>
            <select className="input" value={form.repeat} onChange={(e) => set('repeat', e.target.value)}>
              <option value="none">{t('calendar.noRepeat')}</option>
              <option value="daily">{t('calendar.daily')}</option>
              <option value="weekly">{t('calendar.weekly')}</option>
              <option value="monthly">{t('calendar.monthly')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('calendar.reminder')}</label>
            <select className="input" value={form.reminder} onChange={(e) => set('reminder', e.target.value)}>
              <option value="none">{t('calendar.noReminder')}</option>
              <option value="15min">{t('calendar.min15')}</option>
              <option value="1hour">{t('calendar.hour1')}</option>
              <option value="1day">{t('calendar.day1')}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">{t('common.description')}</label>
          <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-500">{t('common.requiredField')}</p>}
        <div className="flex justify-between gap-2">
          {event ? (
            <Button type="button" variant="danger" onClick={() => { deleteEvent(event.id); toast.success(t('toast.eventDeleted')); onClose(); }}>
              <FiTrash2 /> {t('common.delete')}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
