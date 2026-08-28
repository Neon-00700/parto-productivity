import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';
import { playChime } from '../../utils/sound';
import { localizeDigits } from '../../utils/dateUtils';

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer() {
  const { t, lang } = useTranslation();
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    if (left <= 0 || !endRef.current) return undefined;
    const iv = setInterval(() => {
      const remain = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(iv);
        endRef.current = null;
        playChime();
        toast.success(t('rest.done'), { icon: '💪' });
      }
    }, 300);
    return () => clearInterval(iv);
  }, [left > 0, t]); // eslint-disable-line

  const startRest = (secs) => {
    endRef.current = Date.now() + secs * 1000;
    setTotal(secs);
    setLeft(secs);
  };

  const stop = () => { endRef.current = null; setLeft(0); };
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="card p-3.5 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-bold">⏲️ {t('rest.title')}:</span>
      {left > 0 ? (
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-[220px] h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="absolute inset-y-0 start-0 bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${(left / total) * 100}%` }} />
          </div>
          <span className="font-extrabold tabular-nums text-orange-500" dir="ltr">{localizeDigits(`${mm}:${ss}`, lang)}</span>
          <button onClick={stop} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><FiX size={15} /></button>
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => startRest(p)}
              className="chip bg-orange-500/10 text-orange-500 hover:bg-orange-500/25 transition-colors !px-3 !py-1.5 font-bold">
              {localizeDigits(p < 60 ? `${p}s` : `${p / 60}m`, lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
