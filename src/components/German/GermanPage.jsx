import React, { useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiCheck, FiChevronDown, FiClock, FiFileText, FiHeadphones, FiLock, FiMic, FiPlay, FiPlus, FiTarget, FiUpload, FiVolume2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Flashcards from './Flashcards';
import QuizMode from './QuizMode';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { GERMAN_LEVELS, SKILLS } from '../../data/germanCourse';
import { GERMAN_GRAMMAR } from '../../data/germanGrammar';
import { GERMAN_VOCABULARY, VOCABULARY_SOURCES } from '../../data/germanVocabularyExpanded';
import { deleteGermanFile, getGermanFile, listGermanFiles, saveGermanFile } from '../../utils/germanFiles';
import { speak } from '../../utils/speech';

const levelOrder = GERMAN_LEVELS.map(x => x.id);
const skillIcons = { Vocabulary: FiBookOpen, Grammar: FiFileText, Listening: FiHeadphones, Speaking: FiMic, Reading: FiBookOpen, Writing: FiFileText };

function ProgressBar({ value }) { return <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function Pill({ children }) { return <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{children}</span>; }

function Overview({ german, onStartTimer }) {
  const completed = Object.keys(german.completedUnits || {}).length;
  const a11 = GERMAN_LEVELS[0].units.length;
  const overall = Math.round((completed / 70) * 100);
  const weekly = (german.studyLog || []).filter(x => Date.now() - new Date(x.createdAt).getTime() < 7*86400000).reduce((a,x)=>a+Number(x.minutes||0),0);
  return <div className="space-y-5">
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
      <div className="card p-5 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div><div className="text-xs text-slate-500">مسیر شخصی زبان</div><h1 className="text-2xl font-black mt-1">🇩🇪 آلمانی از صفر تا B2</h1><p className="text-sm text-slate-500 mt-2">مسیر آموزشی با ساختار موضوعی Menschen؛ محتوای داخل اپ برای تمرین، اصل و غیرکپی است.</p></div><div className="text-4xl">🎯</div>
        </div>
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 p-3"><div className="text-xs text-slate-500">سطح فعلی</div><div className="text-xl font-black">{german.currentLevel || 'A1.1'}</div></div>
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 p-3"><div className="text-xs text-slate-500">هدف</div><div className="text-xl font-black">{german.goalLevel || 'B2'}</div></div>
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 p-3"><div className="text-xs text-slate-500">مطالعه این هفته</div><div className="text-xl font-black">{weekly} دقیقه</div></div>
        </div>
        <div className="mt-5"><div className="flex justify-between text-xs mb-2"><span>پیشرفت مسیر</span><b>{overall}%</b></div><ProgressBar value={overall}/></div>
        <button className="btn btn-primary mt-4" onClick={onStartTimer}><FiClock/> شروع مطالعه امروز</button>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2 font-bold"><FiTarget/> هدف مهاجرتی</div>
        <p className="text-sm text-slate-500 mt-2">اول B2 را باز کن؛ بعد از رسیدن به B2، مسیر C1 هم قابل فعال‌سازی است.</p>
        <div className="space-y-2 mt-4">{['A1.1','A1.2','A2.1','A2.2','B1.1','B1.2','B2','C1'].map((l,i)=>{ const current=l===german.currentLevel; const unlocked=i===0 || levelOrder.indexOf(l)<=levelOrder.indexOf(german.currentLevel); return <div key={l} className={`flex items-center gap-3 p-2.5 rounded-xl ${current?'bg-primary/10':''}`}><div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${unlocked?'bg-primary text-white':'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>{unlocked?<FiCheck/>:<FiLock/>}</div><span className="font-semibold">{l}</span>{current&&<Pill>فعلی</Pill>}</div>})}</div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {SKILLS.map(skill=>{const Icon=skillIcons[skill]; const mins=Number(german.skillMinutes?.[skill]||0); return <div key={skill} className="card p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><Icon/> {skill}</div><span className="text-xs text-slate-400">{mins} دقیقه</span></div><div className="mt-3"><ProgressBar value={Math.min(100, mins/6)}/></div></div>})}
    </div>
    <div className="card p-5"><h2 className="font-black text-lg">از امروز این ترتیب را برو</h2><div className="grid md:grid-cols-4 gap-3 mt-4">{[['🧠','لغت','15–20 دقیقه'],['📖','گرامر','20 دقیقه'],['🎧','شنیداری','15 دقیقه'],['🗣️','صحبت/نوشتن','15 دقیقه']].map(([e,a,b])=><div key={a} className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4"><div className="text-2xl">{e}</div><div className="font-bold mt-2">{a}</div><div className="text-xs text-slate-500 mt-1">{b}</div></div>)}</div></div>
  </div>;
}

function LearningPath({ german, setDone }) {
  const currentIndex = Math.max(0, levelOrder.indexOf(german.currentLevel || 'A1.1'));
  const [open, setOpen] = useState(german.currentLevel || 'A1.1');
  return <div className="space-y-4">{GERMAN_LEVELS.map((level, idx)=>{
    const unlocked = idx <= currentIndex;
    const doneCount = level.units.filter(u=>german.completedUnits?.[`${level.id}:${u[0]}`]).length;
    return <div key={level.id} className={`card overflow-hidden ${!unlocked?'opacity-70':''}`}>
      <button disabled={!unlocked} onClick={()=>setOpen(open===level.id?'':level.id)} className="w-full p-4 flex items-center gap-3 text-start"><div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black ${unlocked?'bg-primary text-white':'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>{unlocked?<FiBookOpen/>:<FiLock/>}</div><div className="flex-1"><div className="font-black">{level.title}</div><div className="text-xs text-slate-500">{unlocked?`${doneCount} / ${level.units.length} بخش تکمیل شده`:'بعداً باز می‌شود'}</div></div>{unlocked&&<FiChevronDown className={`transition-transform ${open===level.id?'rotate-180':''}`}/>}</button>
      {open===level.id && unlocked && <div className="px-4 pb-4 space-y-2">{level.units.map(u=>{const key=`${level.id}:${u[0]}`; const done=!!german.completedUnits?.[key]; return <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3"><button onClick={()=>setDone(level.id,u[0],!done)} className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border ${done?'bg-primary text-white border-primary':'border-slate-300 dark:border-slate-600'}`}>{done&&<FiCheck/>}</button><div className="flex-1"><div className="font-bold text-sm">درس {u[0]} · {u[1]}</div><div className="text-xs text-slate-500">{u[2]}</div><div className="text-[11px] text-slate-400 mt-1">{u[3]}</div></div><Pill>{level.id}</Pill></div>})}</div>}
    </div>
  })}</div>;
}

function Vocabulary({ addStudy, german, updateGerman, addCard }) {
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const progress = german.vocabProgress || {};
  const topics = [...new Set(GERMAN_VOCABULARY.map(x => x.topic))];
  const filtered = useMemo(() => GERMAN_VOCABULARY.filter(x =>
    (level === 'all' || x.level === level) &&
    (topic === 'all' || x.topic === topic) &&
    (!search.trim() || `${x.word} ${x.persian} ${x.example}`.toLowerCase().includes(search.toLowerCase()))
  ), [level, topic, search]);
  const current = filtered.length ? filtered[index % filtered.length] : null;
  const knownCount = Object.values(progress).filter(v => v === 'known').length;
  const hardCount = Object.values(progress).filter(v => v === 'hard').length;

  useEffect(() => { setIndex(0); setShowAnswer(false); }, [level, topic, search]);

  const rate = (status) => {
    if (!current) return;
    updateGerman({ vocabProgress: { ...progress, [current.id]: status } });
    addStudy('Vocabulary', 2);
    setShowAnswer(true);
  };
  const addToFlashcards = () => {
    if (!current) return;
    addCard({
      german: current.word,
      persian: current.persian,
      english: current.english || '',
      example: current.example,
      category: current.level,
      difficulty: 'medium',
    });
    toast.success('به فلش‌کارت‌های شخصی اضافه شد');
  };
  const next = () => { addStudy('Vocabulary', 2); setIndex(i => i + 1); setShowAnswer(false); };

  return <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="card p-3"><div className="text-xs text-slate-500">کل واژه‌های این بسته</div><div className="text-xl font-black mt-1">{GERMAN_VOCABULARY.length}</div></div>
      <div className="card p-3"><div className="text-xs text-slate-500">یادگرفته‌شده</div><div className="text-xl font-black mt-1 text-green-500">{knownCount}</div></div>
      <div className="card p-3"><div className="text-xs text-slate-500">سخت</div><div className="text-xl font-black mt-1 text-red-500">{hardCount}</div></div>
      <div className="card p-3"><div className="text-xs text-slate-500">سطح هدف</div><div className="text-xl font-black mt-1">B2/C1</div></div>
    </div>

    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {['all','A1','A2','B1','B2','C1'].map(x => <button key={x} onClick={()=>setLevel(x)} className={`btn !text-xs ${level===x?'bg-primary text-white':'bg-slate-100 dark:bg-slate-800'}`}>{x==='all'?'همه سطوح':x}</button>)}
      </div>
      <div className="grid md:grid-cols-[1fr_220px] gap-2">
        <input className="input" placeholder="🔎 جست‌وجوی آلمانی یا فارسی..." value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="input" value={topic} onChange={e=>setTopic(e.target.value)}><option value="all">همه موضوع‌ها</option>{topics.map(x=><option key={x}>{x}</option>)}</select>
      </div>
    </div>

    {current ? <div className="card p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap justify-between gap-2"><Pill>{current.level}</Pill><Pill>{current.topic}</Pill></div>
      <div className="text-xs text-slate-400 mt-4">واژه {Math.min(index + 1, filtered.length)} از {filtered.length}</div>
      <div className="text-4xl md:text-5xl font-black mt-5" dir="ltr">{current.word}</div>
      {current.article && <div className="text-sm text-primary font-bold mt-2" dir="ltr">{current.article} · {current.plural || '—'}</div>}
      <button className="btn mx-auto mt-4" onClick={()=>speak(current.word, 'de-DE', 0.78)}><FiVolume2/> پخش تلفظ آلمانی</button>
      <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5">
        <button onClick={()=>setShowAnswer(!showAnswer)} className="text-sm font-bold text-primary">{showAnswer?'پنهان کردن معنی':'نمایش معنی و مثال'}</button>
        {showAnswer && <div className="mt-4 space-y-3"><div className="text-2xl font-bold" dir="rtl">🇮🇷 {current.persian}</div><div dir="ltr" className="text-lg font-semibold">{current.example}</div><div dir="rtl" className="text-sm text-slate-500">{current.exampleFa}</div></div>}
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        <button onClick={()=>rate('hard')} className="btn">🔴 سخت</button>
        <button onClick={()=>rate('learning')} className="btn">🟡 در حال یادگیری</button>
        <button onClick={()=>rate('known')} className="btn btn-primary">🟢 بلدم</button>
        <button onClick={addToFlashcards} className="btn">➕ فلش‌کارت شخصی</button>
      </div>
      <div className="flex justify-center gap-2 mt-4"><button className="btn" onClick={()=>{setIndex(i=>Math.max(0,i-1));setShowAnswer(false)}}>قبلی</button><button className="btn btn-primary" onClick={next}>بعدی</button></div>
    </div> : <div className="card p-8 text-center text-slate-500">واژه‌ای با این فیلتر پیدا نشد.</div>}

    <div className="card p-5">
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-lg">📚 بسته واژگان</h3><p className="text-sm text-slate-500 mt-1">از واژه‌های پایه تا واژگان مهاجرت، دانشگاه و B2/C1.</p></div><span className="text-xs text-slate-400">{GERMAN_VOCABULARY.length} واژه آماده</span></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">{filtered.slice(0,80).map(x=><button key={x.id} onClick={()=>{setIndex(filtered.findIndex(y=>y.id===x.id));setShowAnswer(true)}} className={`text-start p-3 rounded-xl border ${progress[x.id]==='known'?'border-green-500/30 bg-green-500/5':progress[x.id]==='hard'?'border-red-500/30 bg-red-500/5':'border-slate-200 dark:border-slate-800'}`}><div className="font-bold" dir="ltr">{x.word}</div><div className="text-xs text-slate-500 mt-1" dir="rtl">{x.persian}</div><div className="text-[10px] text-slate-400 mt-1">{x.level} · {x.topic}</div></button>)}</div>
    </div>

    <div className="card p-5">
      <h3 className="font-black">🌐 منابعی که برای گسترش بسته در نظر گرفته شده‌اند</h3>
      <p className="text-xs text-slate-500 mt-1">این لینک‌ها منابع مکمل هستند؛ متن کامل کتاب Menschen داخل پروژه کپی نشده است.</p>
      <div className="grid md:grid-cols-2 gap-2 mt-3">{VOCABULARY_SOURCES.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary"><div className="font-bold text-sm">{s.name}</div><div className="text-xs text-slate-500 mt-1">{s.note}</div></a>)}</div>
    </div>
  </div>;
}
function Grammar({ addStudy }) {
  const [level, setLevel] = useState('A1.1');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const group = GERMAN_GRAMMAR.find(x => x.level === level) || GERMAN_GRAMMAR[0];
  const lesson = group.lessons[lessonIndex % group.lessons.length];
  const [title, term, explanation, example, question, options, answer] = lesson;
  useEffect(() => { setLessonIndex(0); setSelected(null); setShowExplanation(false); }, [level]);
  const choose = (option) => { setSelected(option); setShowExplanation(true); if (option === answer) addStudy('Grammar', 5); };
  const next = () => { setLessonIndex(i => (i + 1) % group.lessons.length); setSelected(null); setShowExplanation(false); };
  const prev = () => { setLessonIndex(i => (i - 1 + group.lessons.length) % group.lessons.length); setSelected(null); setShowExplanation(false); };
  return <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {GERMAN_GRAMMAR.map(g => <button key={g.level} onClick={() => setLevel(g.level)} className={`btn !text-xs ${level===g.level?'bg-primary text-white':'bg-slate-100 dark:bg-slate-800'}`}>{g.level}</button>)}
    </div>
    <div className="card p-6">
      <div className="flex flex-wrap justify-between gap-3 items-start"><div><Pill>{level} · {lessonIndex+1}/{group.lessons.length}</Pill><h2 className="text-2xl font-black mt-3">{title}</h2><div className="text-sm text-primary font-semibold mt-1">{term}</div></div><div className="text-4xl">📖</div></div>
      <p className="text-slate-600 dark:text-slate-300 mt-5 leading-8">{explanation}</p>
      <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60" dir="ltr"><div className="text-xs text-slate-400 mb-2">مثال</div><div className="font-semibold text-lg">{example}</div></div>
      <div className="mt-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="font-bold mb-3">تمرین</div><div className="text-lg font-semibold" dir="ltr">{question}</div>
        <div className="grid sm:grid-cols-3 gap-2 mt-4">{options.map(o => <button key={o} onClick={()=>choose(o)} className={`p-3 rounded-xl border text-sm font-semibold ${selected===o ? (o===answer?'border-green-500 bg-green-500/10 text-green-600':'border-red-500 bg-red-500/10 text-red-600') : 'border-slate-200 dark:border-slate-700 hover:border-primary'}`} dir="ltr">{o}</button>)}</div>
        {showExplanation && <div className={`mt-4 p-3 rounded-xl text-sm ${selected===answer?'bg-green-500/10 text-green-600':'bg-red-500/10 text-red-600'}`}>{selected===answer?'✓ درست است.':'✗ پاسخ درست: '+answer}</div>}
      </div>
      <div className="flex flex-wrap gap-2 mt-6"><button className="btn" onClick={prev}>← مبحث قبلی</button><button className="btn btn-primary" onClick={next}>مبحث بعدی →</button></div>
    </div>
    <div className="grid md:grid-cols-2 gap-3">{group.lessons.map((x,i)=><button key={i} onClick={()=>{setLessonIndex(i);setSelected(null);setShowExplanation(false)}} className={`text-start card p-4 ${i===lessonIndex?'ring-2 ring-primary':''}`}><div className="text-xs text-slate-400">{i+1}</div><div className="font-bold mt-1">{x[0]}</div><div className="text-xs text-slate-500 mt-1">{x[1]}</div></button>)}</div>
  </div>;
}
function Timer({ onClose, addStudy }) { const [seconds,setSeconds]=useState(0); const [running,setRunning]=useState(false); useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(id)},[running]); const m=Math.floor(seconds/60),s=seconds%60; return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="card p-6 w-full max-w-md"><div className="flex justify-between"><h3 className="font-black text-lg">⏱ مطالعه آلمانی</h3><button onClick={onClose}><FiX/></button></div><div className="text-5xl font-black text-center my-10 font-mono">{String(Math.floor(m/60)).padStart(2,'0')}:{String(m%60).padStart(2,'0')}:{String(s).padStart(2,'0')}</div><div className="flex justify-center gap-2"><button className="btn btn-primary" onClick={()=>setRunning(!running)}>{running?<><FiClock/> توقف</>:<><FiPlay/> شروع</>}</button><button className="btn" onClick={()=>{if(seconds>=60)addStudy('Vocabulary',Math.round(seconds/60));onClose()}}>ذخیره و بستن</button></div></div></div> }

function Files() { const [files,setFiles]=useState([]); const [loading,setLoading]=useState(true); const refresh=()=>listGermanFiles().then(x=>{setFiles(x);setLoading(false)}).catch(()=>setLoading(false)); useEffect(refresh,[]); const upload=async e=>{const f=e.target.files?.[0]; if(!f)return; try{await saveGermanFile(f,{level:'A1.1',category:'German'});toast.success('فایل ذخیره شد');refresh()}catch(err){toast.error('ذخیره فایل انجام نشد')} e.target.value=''}; const remove=async id=>{await deleteGermanFile(id);refresh()}; const open=async id=>{const rec=await getGermanFile(id);if(!rec)return;const url=URL.createObjectURL(rec.blob);window.open(url,'_blank');setTimeout(()=>URL.revokeObjectURL(url),60000)}; return <div className="space-y-4"><div className="card p-5 border-dashed border-2"><label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-8"><FiUpload size={30}/><b>آپلود فایل آموزشی</b><span className="text-xs text-slate-500">PDF، عکس، صوت، TXT و فایل‌های دیگر؛ فایل‌ها روی همین مرورگر ذخیره می‌شوند.</span><input hidden type="file" multiple onChange={upload}/></label></div>{loading?<div className="card p-5">در حال بارگذاری...</div>:files.length===0?<div className="card p-8 text-center text-slate-500">هنوز فایلی اضافه نکرده‌ای.</div>:<div className="grid md:grid-cols-2 gap-3">{files.map(f=><div key={f.id} className="card p-4 flex items-center gap-3"><FiFileText className="text-primary"/><div className="flex-1 min-w-0"><div className="font-bold truncate">{f.name}</div><div className="text-xs text-slate-500">{Math.round(f.size/1024)} KB · {new Date(f.createdAt).toLocaleDateString('fa-IR')}</div></div><button className="btn !p-2" onClick={()=>open(f.id)}>باز کردن</button><button className="btn !p-2" onClick={()=>remove(f.id)}><FiX/></button></div>)}</div>}</div> }

function SpeakingPractice({ german, updateGerman, addStudy }) {
  const exercises = [
    { id: 'intro', title: 'خودت را معرفی کن', prompt: 'Stell dich bitte vor.', target: 'Hallo, ich heiße Yasin. Ich komme aus Iran. Ich lerne Deutsch.' },
    { id: 'family', title: 'درباره خانواده صحبت کن', prompt: 'Erzähl kurz über deine Familie.', target: 'Meine Familie ist klein. Ich habe eine Mutter, einen Vater und einen Bruder.' },
    { id: 'daily', title: 'روزت را توضیح بده', prompt: 'Was machst du heute?', target: 'Heute lerne ich Deutsch. Danach arbeite ich und am Abend lese ich.' },
  ];
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');
  const [silent, setSilent] = useState(false);
  const recognitionRef = React.useRef(null);
  const ex = exercises[index % exercises.length];
  const skipped = german.speakingSkipped || {};
  const done = german.speakingDone || {};
  const later = german.speakingLater || {};

  const finish = (status) => {
    const key = ex.id;
    if (status === 'done') updateGerman({ speakingDone: { ...done, [key]: true }, speakingSkipped: { ...skipped, [key]: false }, speakingLater: { ...later, [key]: false } });
    if (status === 'skip') updateGerman({ speakingSkipped: { ...skipped, [key]: true }, speakingLater: { ...later, [key]: false } });
    if (status === 'later') updateGerman({ speakingLater: { ...later, [key]: true }, speakingSkipped: { ...skipped, [key]: false } });
    addStudy('Speaking', status === 'done' ? 5 : 0);
    setMessage(status === 'done' ? 'تمرین Speaking ثبت شد.' : status === 'skip' ? 'فعلاً رد شد؛ این تمرین برای بعد باقی می‌ماند.' : 'برای بعد ذخیره شد.');
  };

  const startRecognition = () => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMessage('مرورگر شما Speech Recognition را پشتیبانی نمی‌کند. Chrome/Edge را امتحان کن.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.lang = 'de-DE';
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.onstart = () => { setListening(true); setMessage('دارم گوش می‌دهم... به آلمانی صحبت کن.'); };
    r.onresult = (e) => {
      const text = Array.from(e.results).map(x => x[0]?.transcript || '').join(' ').trim();
      setTranscript(text);
      const normalize = x => x.toLowerCase().replace(/[^a-zäöüß ]/gi, ' ').replace(/\s+/g, ' ').trim();
      const targetWords = new Set(normalize(ex.target).split(' ').filter(Boolean));
      const saidWords = normalize(text).split(' ').filter(Boolean);
      const matched = saidWords.filter(w => targetWords.has(w)).length;
      const score = Math.round((matched / Math.max(targetWords.size, 1)) * 100);
      setMessage(`تشخیص متن: ${score}% شباهت واژگانی. این عدد نمره واقعی تلفظ نیست.`);
    };
    r.onerror = (e) => { setListening(false); setMessage(`خطای تشخیص صدا: ${e.error || 'unknown'}`); };
    r.onend = () => setListening(false);
    try { r.start(); } catch { setListening(false); }
  };

  const stopRecognition = () => { try { recognitionRef.current?.stop(); } catch {} setListening(false); };

  return <div className="space-y-4">
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Pill>Speaking · اختیاری</Pill><h2 className="text-2xl font-black mt-3">🗣️ {ex.title}</h2><p className="text-sm text-slate-500 mt-2">{ex.prompt}</p></div>
        <button className="btn" onClick={()=>speak(ex.target, 'de-DE', 0.82)}><FiVolume2/> شنیدن تلفظ صحیح</button>
      </div>
      <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-lg font-semibold">{ex.target}</div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={listening ? stopRecognition : startRecognition}>{listening ? '⏹ توقف ضبط' : '🎙 شروع ضبط'}</button>
        <button className="btn" onClick={()=>setSilent(!silent)}>{silent ? '🔇 حالت بی‌صدا فعال' : '🔊 حالت بی‌صدا'}</button>
        <button className="btn" onClick={()=>finish('skip')}>⏭ فعلاً رد کن</button>
        <button className="btn" onClick={()=>finish('later')}>🔖 انجام در زمان دیگر</button>
        <button className="btn btn-primary" onClick={()=>finish('done')}>✓ انجام شد</button>
      </div>
      {silent && <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800"><b>حالت بی‌صدا</b><p className="text-sm text-slate-500 mt-1">اگر جایی هستی که نمی‌توانی حرف بزنی، جمله را بخوان و تلفظ صحیح را گوش بده؛ بعد تمرین را بدون ضبط به‌صورت دستی انجام‌شده ثبت کن.</p></div>}
      {transcript && <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800"><b>چیزی که مرورگر شنید:</b><p className="mt-2">{transcript}</p></div>}
      {message && <div className="mt-4 text-sm text-slate-500">{message}</div>}
    </div>
    <div className="card p-5">
      <h3 className="font-black">وضعیت تمرین‌های Speaking</h3>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        {exercises.map((x, i) => <button key={x.id} onClick={()=>{setIndex(i);setTranscript('');setMessage('')}} className={`text-start p-3 rounded-2xl border ${i===index?'border-primary bg-primary/5':'border-slate-200 dark:border-slate-800'}`}>
          <div className="font-bold">{x.title}</div>
          <div className="text-xs text-slate-500 mt-1">{done[x.id]?'✓ انجام شد':skipped[x.id]?'⏭ رد شده':later[x.id]?'🔖 برای بعد':'باز'}</div>
        </button>)}
      </div>
    </div>
  </div>;
}

function Stats({ german }) {
  const completed = Object.keys(german.completedUnits || {}).length;
  const totalMinutes = Object.values(german.skillMinutes || {}).reduce((a,b)=>a+Number(b||0),0);
  const vocab = german.vocabProgress || {};
  const known = Object.values(vocab).filter(v=>v==='known').length;
  const hard = Object.values(vocab).filter(v=>v==='hard').length;
  const tests = german.testHistory || [];
  const avg = tests.length ? Math.round(tests.reduce((a,x)=>a+Number(x.percent||0),0)/tests.length) : 0;
  const weekly = (german.studyLog || []).filter(x => Date.now()-new Date(x.createdAt).getTime() < 7*86400000).reduce((a,x)=>a+Number(x.minutes||0),0);
  const skillRows = Object.entries(german.skillMinutes || {});
  return <div className="space-y-4">
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {[['📚','درس‌های تکمیل‌شده',completed],['⏱️','کل مطالعه',`${totalMinutes} دقیقه`],['🧠','لغات مسلط',known],['📝','میانگین آزمون',`${avg}%`]].map(([e,l,v])=><div className="card p-5" key={l}><div className="text-2xl">{e}</div><div className="text-xs text-slate-500 mt-2">{l}</div><div className="text-2xl font-black mt-1">{v}</div></div>)}
    </div>
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card p-5"><h3 className="font-black text-lg">⏱️ زمان هر مهارت</h3><div className="space-y-4 mt-4">{skillRows.map(([skill,min])=><div key={skill}><div className="flex justify-between text-sm"><b>{skill}</b><span>{min} دقیقه</span></div><ProgressBar value={Math.min(100,Number(min)/6)}/></div>)}</div><div className="mt-5 p-3 rounded-xl bg-primary/10 text-sm">این هفته: <b>{weekly} دقیقه</b></div></div>
      <div className="card p-5"><h3 className="font-black text-lg">🧠 وضعیت واژگان</h3><div className="grid grid-cols-3 gap-2 mt-4"><div className="p-3 rounded-xl bg-green-500/10"><div className="text-xs">مسلط</div><b className="text-xl">{known}</b></div><div className="p-3 rounded-xl bg-yellow-500/10"><div className="text-xs">در حال یادگیری</div><b className="text-xl">{Object.values(vocab).filter(v=>v==='learning').length}</b></div><div className="p-3 rounded-xl bg-red-500/10"><div className="text-xs">سخت</div><b className="text-xl">{hard}</b></div></div><p className="text-xs text-slate-500 mt-4">واژه‌های سخت را بیشتر مرور کن؛ وضعیت‌ها در Local و Cloud ذخیره می‌شوند.</p></div>
    </div>
    <div className="card p-5"><h3 className="font-black text-lg">📝 تاریخچه آزمون‌ها</h3>{tests.length===0?<p className="text-sm text-slate-500 mt-3">هنوز آزمونی ثبت نشده. از تب «آزمون» شروع کن.</p>:<div className="space-y-2 mt-4">{[...tests].reverse().slice(0,10).map(t=><div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span className="font-bold">{t.type==='grammar'?'گرامر':'واژگان'} · {t.level}</span><span className="ms-auto font-black">{t.score}/{t.total} ({t.percent}%)</span><span className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</span></div>)}</div>}</div>
    <div className="card p-5"><h3 className="font-black text-lg">🗣️ Speaking</h3><div className="grid sm:grid-cols-3 gap-3 mt-4"><div><div className="text-xs text-slate-500">انجام‌شده</div><b className="text-xl">{Object.values(german.speakingDone||{}).filter(Boolean).length}</b></div><div><div className="text-xs text-slate-500">ردشده</div><b className="text-xl">{Object.values(german.speakingSkipped||{}).filter(Boolean).length}</b></div><div><div className="text-xs text-slate-500">برای بعد</div><b className="text-xl">{Object.values(german.speakingLater||{}).filter(Boolean).length}</b></div></div></div>
  </div>;
}
export default function GermanPage() {
  const { t } = useTranslation(); const { data, setGermanUnitDone, addGermanStudy, updateGerman, addCard } = useApp();
  const [tab,setTab]=useState('overview'); const [timer,setTimer]=useState(false); const german=data.german||{currentLevel:'A1.1',goalLevel:'B2',completedUnits:{},skillMinutes:{}};
  const tabs=[['overview','🏠','نمای کلی'],['path','🛣️','مسیر یادگیری'],['vocab','🧠','لغات'],['grammar','📖','گرامر'],['skills','🎧','مهارت‌ها'],['quiz','📝','آزمون'],['files','📂','فایل‌های من'],['stats','📊','آمار']];
  const addStudy=(skill,minutes)=>addGermanStudy({skill,minutes});
  return <div className="space-y-4">
    <div className="card p-4"><div className="flex flex-col xl:flex-row xl:items-center gap-3"><div className="flex flex-wrap gap-1 flex-1">{tabs.map(([id,icon,label])=><button key={id} onClick={()=>setTab(id)} className={`btn !text-xs ${tab===id?'bg-primary text-white':'bg-slate-100 dark:bg-slate-800'}`}>{icon} {label}</button>)}</div><div className="flex items-center gap-2 text-xs"><span>سطح فعلی</span><span className="px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold">{german.currentLevel||'A1.1'}</span><span>هدف</span><select value={german.goalLevel||'B2'} onChange={e=>updateGerman({goalLevel:e.target.value})} className="input !py-2"><option>B2</option><option>C1</option></select></div></div></div>
    {tab==='overview'&&<Overview german={german} onStartTimer={()=>setTimer(true)}/>} {tab==='path'&&<LearningPath german={german} setDone={setGermanUnitDone}/>} {tab==='vocab'&&<Vocabulary addStudy={addStudy} german={german} updateGerman={updateGerman} addCard={addCard}/>} {tab==='grammar'&&<Grammar addStudy={addStudy}/>} {tab==='skills'&&<div className="space-y-5"><SpeakingPractice german={german} updateGerman={updateGerman} addStudy={addStudy}/><div className="grid md:grid-cols-2 gap-4">{SKILLS.filter(skill=>skill!=='Speaking').map(skill=>{const Icon=skillIcons[skill];return <div key={skill} className="card p-5"><Icon size={24} className="text-primary"/><h3 className="font-black mt-3">{skill}</h3><p className="text-sm text-slate-500 mt-2">برای این مهارت، هر روز یک جلسه کوتاه ثبت کن. تایمر و مطالعه دستی هر دو در آمار ذخیره می‌شوند.</p><button className="btn btn-primary mt-4" onClick={()=>setTimer(true)}>شروع جلسه</button></div>})}</div></div>} {tab==='quiz'&&<QuizMode onExit={()=>setTab('overview')}/>} {tab==='files'&&<Files/>} {tab==='stats'&&<Stats german={german}/>} {timer&&<Timer onClose={()=>setTimer(false)} addStudy={addStudy}/>} 
  </div>;
}
