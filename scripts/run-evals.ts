import cases from '../data/evals/cases.json'
import {writeFileSync} from 'node:fs'
const base=process.env.EVAL_BASE_URL||'http://localhost:3000'
async function main(){
const results=[] as Array<{id:string;pass:boolean;status:number;reasons:string[];answer:unknown}>
for(const tc of cases){
 try{
  const r=await fetch(`${base}/api/ask`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:tc.question})})
  const raw=await r.text();let a:any;try{a=JSON.parse(raw)}catch{a={error:raw.slice(0,500)}}
  const text=JSON.stringify(a).toLowerCase()
  const reasons=[] as string[]
  if(!r.ok)reasons.push(`HTTP ${r.status}`)
  const expected=tc.id==='passport-01'?[]:tc.mustMention
  for(const x of expected)if(!text.includes(x.toLowerCase()))reasons.push(`Missing ${x}`)
  if(tc.id==='passport-01'){if(!/not verified|cannot establish|does not cover/.test(text))reasons.push('Needs honest unsupported response');if(a.sources?.length)reasons.push('Unsupported answer must not cite irrelevant sources')}
  else{
   if(!a.sources?.length)reasons.push('No official citations')
   for(const s of a.sources||[])if(!/^https:\/\//.test(s.url||''))reasons.push('Malformed citation')
   if(tc.expectsConflict&&!a.conflicts?.length)reasons.push('No conflict surfaced')
  }
  if(a.draft&&!/\[[^\]]+\]|\{[^}]+\}/.test(a.draft))reasons.push('Draft lacks placeholders')
  const pass=reasons.length===0;results.push({id:tc.id,pass,status:r.status,reasons,answer:a});console.log(`${pass?'PASS':'FAIL'} ${tc.id}${reasons.length?': '+reasons.join('; '):''}`)
 }catch(e){results.push({id:tc.id,pass:false,status:0,reasons:[String(e)],answer:null});console.log(`FAIL ${tc.id}: ${e}`)}
  if(process.env.EVAL_DELAY_MS)await new Promise(r=>setTimeout(r,Number(process.env.EVAL_DELAY_MS)))
}
const score=results.filter(r=>r.pass).length
writeFileSync('data/evals/results.json',JSON.stringify({runAt:new Date().toISOString(),score,total:results.length,results},null,2))
console.log(`${score}/${results.length} passed`);process.exitCode=score===results.length?0:1

}
main().catch(e=>{console.error(e);process.exitCode=1})
