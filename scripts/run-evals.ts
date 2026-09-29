import cases from '../data/evals/cases.json'
const base=process.env.EVAL_BASE_URL||'http://localhost:3000'
let passed=0
for(const tc of cases){const r=await fetch(`${base}/api/ask`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:tc.question})});const text=await r.text();const ok=r.ok&&tc.mustMention.every(x=>text.toLowerCase().includes(x.toLowerCase()))&&(!tc.expectsConflict||text.includes('conflicts'));console.log(`${ok?'PASS':'FAIL'} ${tc.id}`);if(ok)passed++}
console.log(`${passed}/${cases.length} passed`);process.exitCode=passed===cases.length?0:1
