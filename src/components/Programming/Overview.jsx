import React, { useMemo } from 'react';
import {
  TechnologyIcon, ProjectIcon, ActivityIcon, SkillTreeIcon, ClockIcon, PlusIcon, ChevronDownIcon,
} from '../icons';
import EmptyState from '../Common/EmptyState';
import { useProgramming } from '../../hooks/useProgramming';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { todayKey, fmtShort, localizeDigits, minutesToHuman } from '../../utils/dateUtils';
import { TECH_STATUS, labelOf, formatDuration } from '../../data/programming/model';
import { SKILL_BRANCHES, SKILL_NODES, SKILL_BY_ID } from '../../data/programming/skillTree';

export default function Overview({ onTab }) {
  const { t, lang } = useTranslation();
  const { technologies, projects, activities, goalOrder } = useProgramming();
  const { data } = useApp();

  const stats = useMemo(() => {
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      week.push(d.toISOString().slice(0, 10));
    }
    const weekMin = activities.filter((a) => week.includes(a.date)).reduce((s, a) => s + (Number(a.minutes) || 0), 0);
    const totalMin = activities.reduce((s, a) => s + (Number(a.minutes) || 0), 0);
    return {
      weekMin, totalMin,
      learning: technologies.filter((x) => x.status === 'learning').length,
      activeProjects: projects.filter((p) => p.status === 'in_progress').length,
      doneNodes: goalOrder.filter((id) => {
        const g = (data.programming?.goalEntries || {})[id];
        return g?.status === 'done';
      }).length,
    };
  }, [activities, technologies, projects, goalOrder, data.programming]);

  const techById = useMemo(() => Object.fromEntries(technologies.map((x) => [x.id, x])), [technologies]);
  const recent = useMemo(() => [...activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [activities]);

  const learningTechs = technologies.filter((x) => x.status === 'learning');
  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const goalEntries = data.programming?.goalEntries || {};

  return (
    <div className="space-y-5">
      {/* quick log */}
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-sky-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">{t('prog.quickLog')}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('prog.timerHint')}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onTab('activities')} className="btn-soft btn">
              <ActivityIcon size={15} /> {t('prog.logActivity')}
            </button>
            <button onClick={() => onTab('skills')} className="btn-ghost btn">
              <SkillTreeIcon size={15} /> {t('prog.tabs.skills')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<ClockIcon size={18} />} label={t('prog.minutesThisWeek')} value={minutesToHuman(stats.weekMin, lang, t)} tone="sky" />
        <Stat icon={<TechnologyIcon size={18} />} label={t('prog.learningNow')} value={localizeDigits(stats.learning, lang)} tone="indigo" />
        <Stat icon={<ProjectIcon size={18} />} label={t('prog.activeProjects')} value={localizeDigits(stats.activeProjects, lang)} tone="emerald" />
        <Stat icon={<SkillTreeIcon size={18} />} label={`${t('prog.goalTitle')} · ${t('prog.done')}`} value={`${localizeDigits(stats.doneNodes, lang)} / ${localizeDigits(goalOrder.length, lang)}`} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* learning technologies */}
        <div className="card p-4 sm:p-5">
          <Header icon={<TechnologyIcon size={16} />} title={t('prog.techStatus')} onAll={() => onTab('technologies')} />
          {learningTechs.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('prog.noTechYet')}</p>
          ) : (
            <div className="space-y-2.5 mt-3">
              {learningTechs.slice(0, 4).map((tech) => {
                const done = (tech.milestones || []).filter((m) => m.done).length;
                const total = (tech.milestones || []).length;
                return (
                  <div key={tech.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{tech.name}</div>
                      {total > 0 && (
                        <div className="h-1.5 mt-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                      {total > 0 ? `${localizeDigits(done, lang)}/${localizeDigits(total, lang)}` : labelOf(TECH_STATUS, tech.status, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* active projects */}
        <div className="card p-4 sm:p-5">
          <Header icon={<ProjectIcon size={16} />} title={t('prog.activeProjects')} onAll={() => onTab('projects')} />
          {activeProjects.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">{t('prog.noActiveProjects')}</p>
          ) : (
            <div className="space-y-2.5 mt-3">
              {activeProjects.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {(p.techIds || []).map((id) => techById[id]?.name).filter(Boolean).join(' · ') || t('prog.noRelatedProjects')}
                    </div>
                  </div>
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-sky-500 shrink-0"><ProjectIcon size={15} /></a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* recent activities */}
      <div className="card p-4 sm:p-5">
        <Header icon={<ActivityIcon size={16} />} title={t('prog.recentActivities')} onAll={() => onTab('activities')} />
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('prog.noActivities')}</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((a) => {
              const tech = techById[a.technologyId];
              const proj = projects.find((p) => p.id === a.projectId);
              return (
                <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                    <ClockIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {tech?.name || t('prog.activityType')} · {labelOf([{ id: 'coding', fa: 'کد زدن', en: 'Coding' }, { id: 'study', fa: 'مطالعه', en: 'Study' }, { id: 'video', fa: 'ویدیو', en: 'Video' }, { id: 'practice', fa: 'تمرین', en: 'Practice' }, { id: 'project', fa: 'پروژه', en: 'Project' }, { id: 'other', fa: 'دیگر', en: 'Other' }], a.type, lang)}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{[proj?.name, a.date === todayKey() ? t('prog.today') : fmtShort(a.date, lang)].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-300 shrink-0 tabular-nums">{formatDuration(a.minutes, lang)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* goal path */}
      {goalOrder.length > 0 && (
        <div className="card p-4 sm:p-5">
          <Header icon={<SkillTreeIcon size={16} />} title={t('prog.goalPath')} onAll={() => onTab('skills')} />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {goalOrder.slice(0, 8).map((id, i) => {
              const node = SKILL_BY_ID[id];
              const done = goalEntries[id]?.status === 'done';
              return (
                <React.Fragment key={id}>
                  {i > 0 && <ChevronDownIcon size={12} className="text-slate-300 dark:text-slate-700 rotate-[-90deg]" />}
                  <span className={`chip ${done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {node?.name?.[lang] || id}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ icon, title, onAll }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <span className="text-slate-400">{icon}</span>{title}
      </h3>
      <button onClick={onAll} className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1">
        {t('prog.viewAll')}
      </button>
    </div>
  );
}

const TONES = {
  sky: 'bg-sky-500/12 text-sky-500',
  indigo: 'bg-indigo-500/12 text-indigo-500',
  emerald: 'bg-emerald-500/12 text-emerald-500',
  violet: 'bg-violet-500/12 text-violet-500',
};
function Stat({ icon, label, value, tone }) {
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="font-extrabold text-base leading-tight truncate">{value}</div>
        <div className="text-[11px] text-slate-400 truncate">{label}</div>
      </div>
    </div>
  );
}
