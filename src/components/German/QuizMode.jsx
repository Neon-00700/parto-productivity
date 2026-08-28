import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRotateCcw, FiVolume2 } from 'react-icons/fi';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import { useApp } from '../../contexts/AppContext';
import { GERMAN_VOCABULARY } from '../../data/germanVocabularyExpanded';
import { ALL_GRAMMAR_LESSONS } from '../../data/germanGrammar';
import { speak, canSpeak } from '../../utils/speech';

function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

export default function QuizMode({ onExit=()=>{} }) {
  const { addXp, addGermanTestResult } = useApp();
  const [type,setType]=useState('vocab');
  const [level,setLevel]=useState('A1');
  const [questions,setQuestions]=useState([]);
  const [idx,setIdx]=useState(0); const [picked,setPicked]=useState(null); const [score,setScore]=useState(0); const [finished,setFinished]=useState(false); const [started,setStarted]=useState(false);
  const makeQuestions=useCallback(()=>{
    if(type==='grammar'){
      const pool=ALL_GRAMMAR_LESSONS.filter(x=>x.level.startsWith(level));
      return shuffle(pool.length?pool:ALL_GRAMMAR_LESSONS).slice(0,10).map(x=>({id:x.id,level:x.level,prompt:x.question,options:shuffle(x.options),answer:x.answer,label:x.title,term:x.term,kind:'grammar'}));
    }
    const pool=GERMAN_VOCABULARY.filter(x=>level==='A1'?x.level.startsWith('A1'):x.level===level);
    const source=pool.length?pool:GERMAN_VOCABULARY;
    return shuffle(source).slice(0,10).map(card=>{const others=shuffle(source.filter(x=>x.id!==card.id)).slice(0,3);return {id:card.id,level:card.level,prompt:`معنی «${card.word}» چیست؟`,options:shuffle([card.persian,...others.map(x=>x.persian)]),answer:card.persian,label:card.word,term:card.topic,kind:'vocab',word:card.word};});
  },[type,level]);
  const start=()=>{const qs=makeQuestions();setQuestions(qs);setIdx(0);setPicked(null);setScore(0);setFinished(false);setStarted(true);};
  const pick=(option)=>{if(picked!==null)return;setPicked(option);if(option===questions[idx].answer){setScore(s=>s+1);addXp(2);}setTimeout(()=>{if(idx+1>=questions.length){setFinished(true);}else{setIdx(i=>i+1);setPicked(null);}},650);};
  useEffect(()=>{ if(started && !questions.length) start(); },[]);
  const current=questions[idx];
  useEffect(()=>{ if(finished && questions.length){ const finalScore=score + (picked===current?.answer?1:0); addGermanTestResult({type,level,score:finalScore,total:questions.length,percent:Math.round(finalScore/questions.length*100)}); } },[finished]);
  if(!started) return <div className="max-w-2xl mx-auto card p-6 space-y-5"><div><Badge tone="primary">آزمون زبان</Badge><h2 className="text-2xl font-black mt-3">آزمون آلمانی</h2><p className="text-sm text-slate-500 mt-2">نتیجه هر آزمون در آمار زبان ذخیره می‌شود و با Local/Cloud Sync همراه است.</p></div><div className="grid sm:grid-cols-2 gap-2">{[['vocab','🧠 واژگان'],['grammar','📖 گرامر']].map(([id,l])=><button key={id} onClick={()=>setType(id)} className={`btn ${type===id?'bg-primary text-white':'bg-slate-100 dark:bg-slate-800'}`}>{l}</button>)}</div><div><div className="text-sm font-bold mb-2">سطح آزمون</div><div className="flex flex-wrap gap-2">{['A1','A2','B1','B2','C1'].map(l=><button key={l} onClick={()=>setLevel(l)} className={`btn !text-xs ${level===l?'bg-primary text-white':'bg-slate-100 dark:bg-slate-800'}`}>{l}</button>)}</div></div><div className="flex gap-2"><Button onClick={start}>شروع آزمون</Button><Button variant="ghost" onClick={onExit}>بازگشت</Button></div></div>;
  if(finished){const finalScore=score;const pct=Math.round(finalScore/questions.length*100);return <div className="max-w-md mx-auto card p-8 text-center space-y-4"><div className="text-6xl">{pct>=80?'🏆':pct>=60?'💪':'📚'}</div><h3 className="text-xl font-black">نتیجه آزمون</h3><div className="text-4xl font-black text-primary">{finalScore}/{questions.length}</div><div className="text-sm text-slate-500">{pct}% · {type==='grammar'?'گرامر':'واژگان'} · {level}</div><div className="flex gap-2 justify-center"><Button variant="ghost" onClick={onExit}>بازگشت</Button><Button onClick={start}><FiRotateCcw/> دوباره</Button></div></div>}
  return <div className="max-w-lg mx-auto space-y-4"><div className="flex items-center justify-between text-xs text-slate-400"><button className="underline" onClick={onExit}>بازگشت</button><span>{idx+1}/{questions.length} · امتیاز: {score}</span></div><div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${((idx+(picked!==null?1:0))/questions.length)*100}%`}}/></div><div className="card p-7 text-center space-y-3"><Badge tone="primary">{current.level} · {current.label}</Badge><div className="text-xl font-black" dir="ltr">{current.prompt}</div>{current.kind==='vocab'&&canSpeak()&&<button onClick={()=>speak(current.word,'de-DE',0.8)} className="mx-auto p-2 rounded-xl bg-primary/10 text-primary"><FiVolume2/></button>}</div><div className="grid gap-2">{current.options.map(o=>{const correct=o===current.answer;const chosen=picked===o;let cls='border-slate-200 dark:border-slate-800 hover:border-primary/60';if(picked!==null){if(correct)cls='border-green-500 bg-green-500/10 text-green-600';else if(chosen)cls='border-red-500 bg-red-500/10 text-red-600';else cls='border-slate-200 dark:border-slate-800 opacity-50';}return <button key={o} onClick={()=>pick(o)} className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-start ${cls}`} dir="ltr">{o}</button>})}</div></div>;
}
