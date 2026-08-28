import React, { useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { randomQuote } from '../../data/quotes';
import { useTranslation } from '../../hooks/useTranslation';

export default function QuoteWidget() {
  const { t, lang } = useTranslation();
  const [quote, setQuote] = useState(randomQuote);

  const refresh = useCallback(() => setQuote(randomQuote()), []);

  return (
    <div className="card p-5 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-primary mb-2">✨ {t('dashboard.quoteTitle')}</div>
          <p className="text-sm font-medium leading-relaxed">«{quote[lang]}»</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/60 text-slate-400 shrink-0" title={t('common.next')}>
          <FiRefreshCw size={15} />
        </button>
      </div>
    </div>
  );
}
