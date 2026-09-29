'use client'
import {FormEvent, useState} from 'react'
const samples = [
  'My FASTag was charged although I never crossed the toll plaza. What should I do?',
  'My CPGRAMS railway complaint was closed without fixing the issue. What is the appeal process?',
  'How do I ask an app to correct my personal data under the DPDP Act?',
  'My passport application has been stuck for weeks. Where can I complain?'
]
type Answer={summary:string; steps:string[]; draft?:string; conflicts?:{topic:string;detail:string}[]; sources:{title:string;authority:string;url:string;version?:string}[]}
export default function Home(){
 const [question,setQuestion]=useState(samples[0]); const [answer,setAnswer]=useState<Answer|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState('')
 async function ask(e:FormEvent){e.preventDefault();setLoading(true);setError('');setAnswer(null);try{const r=await fetch('/api/ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question})});if(!r.ok)throw new Error(await r.text());setAnswer(await r.json())}catch(e){setError(e instanceof Error?e.message:'Request failed')}finally{setLoading(false)}}
 return <main>
  <header><div className="mark">SA</div><div><h1>Sarkari Agent</h1><p>Official process, exact steps, cited sources.</p></div><span className="badge">Sample data only</span></header>
  <section className="hero"><p className="eyebrow">INDIA'S PUBLIC-PROCESS GUIDE</p><h2>Ask how to fix it.<br/>Get the official route.</h2><p className="lede">Sarkari Agent reads structured government sources through Sanity Context, flags disagreements, and drafts the text you need.</p></section>
  <section className="workspace">
   <form onSubmit={ask}><label htmlFor="q">What happened?</label><textarea id="q" value={question} onChange={e=>setQuestion(e.target.value)} rows={4}/><div className="actions"><button disabled={loading||!question.trim()}>{loading?'Checking official sources…':'Find the official process'}</button><span>No personal details needed for this demo.</span></div></form>
   <div className="samples"><b>Try a sample</b>{samples.map(s=><button key={s} onClick={()=>setQuestion(s)}>{s}</button>)}</div>
  </section>
  {error&&<div className="error">{error}</div>}
  {answer&&<section className="answer"><div className="answerHead"><span>GROUNDED ANSWER</span><h3>{answer.summary}</h3></div><div className="grid"><article><h4>What to do</h4><ol>{answer.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>{answer.draft&&<><h4>Draft text</h4><pre>{answer.draft}</pre></>}</article><aside>{answer.conflicts?.length?<div className="conflict"><h4>Official sources disagree</h4>{answer.conflicts.map((c,i)=><p key={i}><b>{c.topic}:</b> {c.detail}</p>)}</div>:null}<h4>Sources</h4>{answer.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><b>{s.title}</b><span>{s.authority}{s.version?` · ${s.version}`:''}</span></a>)}</aside></div></section>}
  <footer>Built for the DEV Sanity Challenge · Answers are informational, not legal advice.</footer>
 </main>
}
