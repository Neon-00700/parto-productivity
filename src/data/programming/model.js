// Programming module data model, constants and helpers.
// Design principle: one source of truth. Skill-node status is DERIVED from
// Technologies / Goal Tree; it is never duplicated.

import { v4 as uuid } from 'uuid';
import { todayKey } from '../../utils/dateUtils';
import { SKILL_BY_ID } from './skillTree';

export const TECH_STATUS = [
  { id: 'later', fa: 'بعداً', en: 'Later' },
  { id: 'todo', fa: 'باید یاد بگیرم', en: 'Want to Learn' },
  { id: 'learning', fa: 'در حال یادگیری', en: 'Learning' },
  { id: 'done', fa: 'یاد گرفتم', en: 'Learned' },
  { id: 'stopped', fa: 'متوقف شده', en: 'Paused' },
];

export const PROJECT_STATUS = [
  { id: 'not_started', fa: 'هنوز شروع نکردم', en: 'Not Started' },
  { id: 'in_progress', fa: 'در حال توسعه', en: 'In Progress' },
  { id: 'done', fa: 'تکمیل شده', en: 'Completed' },
  { id: 'stopped', fa: 'متوقف شده', en: 'On Hold' },
];

export const ACTIVITY_TYPES = [
  { id: 'coding', fa: 'کد زدن', en: 'Coding' },
  { id: 'study', fa: 'مطالعه', en: 'Study' },
  { id: 'video', fa: 'ویدیو آموزشی', en: 'Video' },
  { id: 'practice', fa: 'تمرین', en: 'Practice' },
  { id: 'project', fa: 'کار روی پروژه', en: 'Project' },
  { id: 'other', fa: 'دیگر', en: 'Other' },
];

export const SKILL_STATE = {
  LOCKED: 'locked', AVAILABLE: 'available', LEARNING: 'learning',
  DONE: 'done', STOPPED: 'stopped',
};

export const TECH_STATUS_TONE = {
  later: 'neutral', todo: 'primary', learning: 'primary',
  done: 'high', stopped: 'medium',
};
// Badge tones in this app: high=green-ish per Badge.jsx mapping (done=green)
export const STATUS_BADGE_TONE = {
  later: 'neutral', todo: 'medium', learning: 'primary',
  done: 'high', stopped: 'low',
  not_started: 'neutral', in_progress: 'primary',
};

export const labelOf = (list, id, lang) => {
  const f = list.find((x) => x.id === id);
  return f ? f[lang] : id;
};

// ---- factories (light payloads; no files/images, URLs as strings) ----
export function newTechnology(p = {}) {
  return {
    id: uuid(), name: '', status: 'todo', startDate: todayKey(), goal: '',
    notes: '', milestones: [], createdAt: new Date().toISOString(), ...p,
  };
}
export function newMilestone(title) {
  return { id: uuid(), title, done: false };
}
export function newProject(p = {}) {
  return {
    id: uuid(), name: '', status: 'not_started', techIds: [], description: '',
    githubUrl: '', demoUrl: '', docUrl: '', otherUrls: [], notes: '',
    createdAt: new Date().toISOString(), ...p,
  };
}
export function newActivity(p = {}) {
  return {
    id: uuid(), date: todayKey(), minutes: 0, type: 'coding',
    technologyId: '', projectId: '', notes: '', createdAt: new Date().toISOString(), ...p,
  };
}

// ---- duration parsing: "2h 30m", "45m", "1h", "90" ----
export function parseDuration(input) {
  if (!input) return 0;
  const str = String(input).trim().toLowerCase();
  const direct = Number(str);
  if (!Number.isNaN(direct) && str !== '' && /^[\d.]+$/.test(str)) return Math.round(direct * 60);
  let mins = 0;
  const h = str.match(/(\d+(?:\.\d+)?)\s*h/);
  const m = str.match(/(\d+(?:\.\d+)?)\s*m(?!s)/);
  if (h) mins += parseFloat(h[1]) * 60;
  if (m) mins += parseFloat(m[1]);
  return Math.max(0, Math.round(mins));
}

export function formatDuration(minutes, lang) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0 && rem > 0) return lang === 'fa' ? `${toFa(h)} ساعت و ${toFa(rem)} دقیقه` : `${h}h ${rem}m`;
  if (h > 0) return lang === 'fa' ? `${toFa(h)} ساعت` : `${h}h`;
  return lang === 'fa' ? `${toFa(rem)} دقیقه` : `${rem}m`;
}
const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ---- single source of truth: derive skill node state ----
// 1. explicit goal-tree status (manual override) wins for goal nodes
// 2. else if a Technology with the same name exists, use its status
// 3. else if prerequisites are all DONE/LEARNING -> available
// 4. else locked (advisory only)
export function deriveSkillState(skillId, { technologies = [], goalEntries = {} } = {}) {
  const node = SKILL_BY_ID[skillId];
  if (!node) return SKILL_STATE.LOCKED;
  const goal = goalEntries[skillId];
  if (goal?.status === 'done') return SKILL_STATE.DONE;
  if (goal?.status === 'learning') return SKILL_STATE.LEARNING;
  if (goal?.status === 'stopped') return SKILL_STATE.STOPPED;
  if (goal?.status === 'todo') return SKILL_STATE.AVAILABLE;

  if (node.tech) {
    const tech = technologies.find((t) => t.name.trim().toLowerCase() === node.tech.toLowerCase());
    if (tech) {
      if (tech.status === 'done') return SKILL_STATE.DONE;
      if (tech.status === 'learning') return SKILL_STATE.LEARNING;
      if (tech.status === 'stopped') return SKILL_STATE.STOPPED;
      if (tech.status === 'todo') return SKILL_STATE.AVAILABLE;
    }
  }
  const prereqs = node.prereqs || [];
  const ok = prereqs.every((p) => {
    const s = deriveSkillState(p, { technologies, goalEntries });
    return s === SKILL_STATE.DONE || s === SKILL_STATE.LEARNING;
  });
  return ok ? SKILL_STATE.AVAILABLE : SKILL_STATE.LOCKED;
}

export function prereqsMet(skillId, ctx) {
  const node = SKILL_BY_ID[skillId];
  if (!node?.prereqs?.length) return true;
  return node.prereqs.every((p) => deriveSkillState(p, ctx) === SKILL_STATE.DONE);
}
