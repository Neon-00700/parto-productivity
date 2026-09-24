// University overview — a fast glance at today, not a second dashboard.
import React from 'react';
import {
  ClassIcon, ExamIcon, AssignmentIcon, LocationIcon, UserIcon, InfoIcon, UniversityIcon,
} from '../icons';
import { useUniversity } from '../../hooks/useUniversity';
import { useTranslation } from '../../hooks/useTranslation';
import { todayClasses, upcomingAssignments, nextExam, courseName, dueLabel, daysUntil } from './uniUtils';
import { currentWeekLabel } from '../../data/university/model';
import { fmtDate, fmtTime, localizeDigits } from '../../utils/dateUtils';

function SectionCard({ icon: Icon, title, action, children, tone = 'sky' }) {
  const tones = {
    sky: 'text-sky-500 bg-sky-500/10',
    violet: 'text-violet-500 bg-violet-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-8 w-8 rounded-xl flex items-center justify-center ${tones[tone]}`}>
            <Icon size={16} />
          </span>
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ClassRow({ cls, course, lang }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-16 shrink-0 text-center">
        <div className="text-sm font-bold tabular-nums">{fmtTime(cls.startTime, lang)}</div>
        <div className="text-[11px] text-slate-400 tabular-nums">{fmtTime(cls.endTime, lang)}</div>
      </div>
      <div className="w-0.5 self-stretch rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{course}</div>
        <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
          {cls.location && <span className="flex items-center gap-1"><LocationIcon size={11} /> {cls.location}</span>}
          {cls.teacher && <span className="flex items-center gap-1"><UserIcon size={11} /> {cls.teacher}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Overview({ onTab }) {
  const { t, lang } = useTranslation();
  const { courses, classes, exams, assignments, reference } = useUniversity();

  const today = todayClasses(classes, reference);
  const upcoming = upcomingAssignments(assignments, 3);
  const exam = nextExam(exams);
  const weekLabel = currentWeekLabel(reference);

  if (!courses.length && !classes.length) {
    return (
      <div className="card p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <UniversityIcon size={26} />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('uni.emptyOverview')}</p>
        <button
          onClick={() => onTab?.('courses')}
          className="btn-primary mt-4 inline-flex items-center gap-2 text-sm"
        >
          {t('uni.addCourse')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* today */}
      <SectionCard icon={ClassIcon} title={`${t('uni.today')} · ${t('uni.weekOf', { label: weekLabel })}`}>
        {today.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">{t('uni.noClassesToday')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 -my-1">
            {today.map((c) => (
              <ClassRow key={c.id} cls={c} course={courseName(courses, c.courseId)} lang={lang} />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* upcoming assignments */}
        <SectionCard icon={AssignmentIcon} title={t('uni.upcomingAssignments')} tone="violet">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">{t('uni.noUpcomingAssignments')}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{a.title}</div>
                    <div className="text-xs text-slate-400 truncate">{courseName(courses, a.courseId)}</div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${daysUntil(a.dueDate) <= 1 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {dueLabel(a.dueDate, lang, t)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* next exam */}
        <SectionCard icon={ExamIcon} title={t('uni.nextExam')} tone="amber">
          {!exam ? (
            <p className="text-sm text-slate-400 py-3">{t('uni.noExams')}</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{courseName(courses, exam.courseId)}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  {fmtDate(exam.date, lang, 'd MMM')}
                  {exam.time && <span>· {fmtTime(exam.time, lang)}</span>}
                  {exam.location && <span className="flex items-center gap-1"><LocationIcon size={11} /> {exam.location}</span>}
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-2xl font-black tabular-nums text-amber-500">
                  {localizeDigits(String(daysUntil(exam.date)), lang)}
                </div>
                <div className="text-[10px] text-slate-400">{t('uni.day')}</div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {reference.date && (
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <InfoIcon size={12} />
          <span>{t('uni.refWeekHint')}</span>
          <button onClick={() => onTab?.('classes')} className="text-primary font-medium hover:underline">
            {t('uni.changeRef')}
          </button>
        </div>
      )}
    </div>
  );
}
