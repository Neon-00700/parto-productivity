import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useTranslation } from '../../hooks/useTranslation';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={title || t('common.confirmDeleteTitle')}>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{message || t('common.confirmDeleteMsg')}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.(); }}>
          {t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
