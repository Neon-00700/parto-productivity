import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiClock } from 'react-icons/fi';
import { playChime } from '../../../../utils/sound';
import { localizeDigits } from '../../../../utils/dateUtils';
import { gymT } from '../lib/i18n';

// Rest timer shown during a workout. Controlled from the outside via `trigger` (ms epoch).
export default function RestTimer({ lang, trigger, restSec }) {
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    if (!trigger) return undefined;
    const secs = restSec || 90;
    endRef.current = trigger + secs * 1000;
    setTotal(secs);
    setLeft(secs);
    return undefined;
  }, [trigger, restSec]);

  useEffect(() => {
    if (left <= 0 || !endRef.current) return undefined;
    const iv = setInterval(() => {
      const remain = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(iv);
        endRef.current = null;
        playChime();
        toast.success(gymT(lang, 'restTimer done'), { icon: '💪' });
      }
    }, 300);
    return () => clearInterval(iv);
  }, [left > 0, lang]); // eslint-disable-line

  const stop = () => { endRef.current = null; setLeft(0); };
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="card p-3.5 flex items-center gap-3" style={{ background: 'rgb(var(--c-primary) / 0.08)' }}>
      <span className="h-9 w-9 grid place-items-center rounded-xl" style={{ background: 'rgb(var(--c-primary) / 0.15)', color: 'rgb(var(--c-primary))' }}><FiClock size={17} /></span>
      {left > 0 ? (
        <>
          <div className="relative flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="absolute inset-y-0 start-0 rounded-full transition-all duration-300" style={{ width: `${(left / total) * 100}%`, background: 'rgb(var(--c-primary))' }} />
          </div>
          <span className="font-extrabold tabular-nums text-lg" dir="ltr" style={{ color: 'rgb(var(--c-primary))' }}>{localizeDigits(`${mm}:${ss}`, lang)}</span>
          <button onClick={stop} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><FiX size={16} /></button>
        </>
      ) : (
        <span className="text-sm text-slate-400">{gymT(lang, 'resting')}</span>
      )}
    </div>
  );
}
