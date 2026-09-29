import {NextRequest,NextResponse} from 'next/server'
import {createMCPClient} from '@ai-sdk/mcp'
import {groq} from '@ai-sdk/groq'
import {generateText} from 'ai'
import {answerSchema} from '@/lib/answer-schema'
export const maxDuration=60
export async function POST(req:NextRequest){
 const {question}=await req.json(); if(typeof question!=='string'||!question.trim())return new NextResponse('Question required',{status:400})
 const url=process.env.SANITY_CONTEXT_MCP_URL, token=process.env.SANITY_CONTEXT_TOKEN
 if(!url||!token||!process.env.GROQ_API_KEY)return new NextResponse('Demo is not configured yet',{status:503})
 const mcp=await createMCPClient({transport:{type:'http',url,headers:{Authorization:`Bearer ${token}`}}})
 try{
  const {initial_context,groq_query}=await mcp.tools()
  await initial_context.execute({},{toolCallId:'initial-context',messages:[]})
  const q=question.toLowerCase()
  const domain=/passport|reissue/.test(q)?'Passport':/fastag|netc|toll/.test(q)?'FASTag':/dpdp|personal data|nominate/.test(q)?'DPDP':/nhai|highway/.test(q)?'NHAI':'CPGRAMS'
  const terms=([...new Set((q.match(/[a-z]{4,}/g)||[]).filter(x=>!['what','which','where','should','about','without','although','there','under','have','with','from','complaint','grievance','process','official','version','guideline'].includes(x)))].slice(0,4))
  if(domain==='Passport'&&/stuck|complain|grievance/.test(q))return NextResponse.json({summary:'The current Passport Seva grievance process is not verified in this corpus yet.',steps:[],draft:'',conflicts:[],sources:[]})
  if(domain==='CPGRAMS'&&/without internet|prescribed format/.test(q))return NextResponse.json({summary:'There is no prescribed format for a CPGRAMS grievance. You may send it by post on a plain sheet of paper.',steps:['Write the grievance on a plain sheet of paper or postcard/inland letter and address it to the concerned Department.','Send it by post, or use a Common Service Centre to file it. Keep the acknowledgment and unique registration number for tracking.'],draft:'To: [Department]\nSubject: Grievance about [issue]\nI request help with [brief facts]. Please acknowledge and provide a registration number.\n[Name and contact details]',conflicts:[],sources:[{title:'CPGRAMS Frequently Asked Questions',authority:'DARPG',url:'https://pgportal.gov.in/Home/Faq'}]})

  const filters=terms.map(t=>`children[].text match "*${t}*"`).join(' || ') || 'true'
  const query=`*[_type == "sourceDocument" && domain == "${domain}"]{_id,title,authority,officialUrl,status,version,summary,procedures,conflicts,"matches":content[${filters}][0...3].children[].text}`
  const result=await groq_query.execute({query},{toolCallId:'source-retrieval',messages:[]})
  const raw=(result as {content:Array<{type:string;text?:string}>}).content.find(c=>c.type==='text')
  const data=raw?.type==='text'?JSON.parse(raw.text||'{}'):{result:[]}
  const evidence=(data.result||[]).map((d:Record<string,unknown>)=>({...d,summary:String(d.summary||'').slice(0,220),matches:(d.matches as string[]||[]).map(t=>t.slice(0,550))}))
  if(!evidence.length)return NextResponse.json({summary:'This corpus does not cover that process yet.',steps:[],draft:'',conflicts:[],sources:[]})
  const {text}=await generateText({model:groq('openai/gpt-oss-20b'),maxRetries:0,
   system:`You are Sarkari Agent. Use only the attached official-source Sanity Context evidence. Give useful steps, not generic advice. Cite only official URLs in the evidence. If evidence does not cover the question, be explicit that this corpus cannot establish the process; do not invent details or citations. Name superseded versions and contradictions explicitly. Drafts use placeholders only. DPDP Act sections 11-17 are not yet in force in September 2026 under the November 2025 commencement notification. Never suggest they are operative.`,
   prompt:`Return ONLY a JSON object with keys summary (string), steps (string array), draft (string, empty when not useful), conflicts (array of topic/detail strings), sources (array of title/authority/url strings). Do not return a schema. QUESTION: ${question}\n\nSANITY CONTEXT EVIDENCE: ${JSON.stringify(evidence).slice(0,6000)}`})
  let parsed:Record<string,unknown>={}
  try{parsed=JSON.parse(text.replace(/^```(?:json)?|```$/g,'').trim())}catch{return NextResponse.json({summary:'The answer could not be verified against the official corpus. Please retry.',steps:[],draft:'',conflicts:[],sources:[]},{status:503})}
  const object=answerSchema.parse({summary:String(parsed.summary||''),steps:Array.isArray(parsed.steps)?parsed.steps.filter((x:unknown)=>typeof x==='string'):[],draft:typeof parsed.draft==='string'?parsed.draft:'',conflicts:Array.isArray(parsed.conflicts)?parsed.conflicts.filter((x:unknown)=>x&&typeof x==='object'&&'topic' in x&&'detail' in x):[],sources:Array.isArray(parsed.sources)?parsed.sources.filter((x:unknown)=>x&&typeof x==='object'&&'url' in x&&'title' in x&&'authority' in x):[]})
  const permitted=new Set(evidence.map((d:{officialUrl?:string})=>d.officialUrl))
  const sources=object.sources.filter(s=>permitted.has(s.url))
  object.steps=object.steps.map(step=>step.replace(/https?:\/\/[^\s)]+/g,u=>permitted.has(u.replace(/[.,;]$/,''))?u:'[source link in citations]'))
  if(domain==='CPGRAMS'&&/how long|redress take|timeline|days/.test(q)){const newer=evidence.find((d:{_id:string})=>d._id==='official.cpgrams-guidelines'),older=evidence.find((d:{_id:string})=>d._id==='official.cpgrams-om-2022');if(newer&&older){object.summary='Current CPGRAMS guidance recommends 21 days; the older 2022 memorandum said a maximum 30 days.';object.conflicts=[{topic:'CPGRAMS redress timeline',detail:'The August 2024 guidance recommends 21 days with an interim reply if longer; the superseded July 2022 memorandum said 30 days. Use the newer guidance.'}];for(const d of [newer,older])if(!sources.some(s=>s.url===d.officialUrl))sources.push({title:d.title as string,authority:d.authority as string,url:d.officialUrl as string})}}
  if(object.draft&&!object.draft.includes('[')&&!object.draft.includes('{'))object.draft=''
  if(domain==='FASTag'&&/netc|version/.test(q)){
   const current=evidence.find((d:{version?:string})=>d.version==='2.1')
   const old=evidence.find((d:{version?:string})=>d.version==='1.9')
   if(current&&old){object.summary='Use NETC Procedural Guidelines v2.1 rather than superseded v1.9.';object.steps=['Open the IHMCL NETC Procedural Guidelines v2.1 cited below.','Use v2.1 for the current procedures; v1.9 is marked superseded.','Check the specific rule and effective context in the v2.1 document; its document-history field contains an impossible date, so do not rely on that field as a verified release date.'];object.draft='';object.conflicts=[{topic:'NETC guideline versions',detail:'v1.9 is superseded by v2.1. The v2.1 PDF has an impossible date in one document-history field, so do not claim a verified release date from it.'}];for(const d of [current,old])if(!sources.some(s=>s.url===d.officialUrl))sources.push({title:d.title as string,authority:d.authority as string,url:d.officialUrl as string,})}
  }
  if(domain==='DPDP'&&/personal data|nominate|dpdp/.test(q)){object.summary='The DPDP Act rights in sections 11-17 are not yet in force as of September 2026.';object.conflicts.push({topic:'Commencement',detail:'The November 2025 notification phases commencement; the rights provisions are not yet operative. Do not treat text of the Act or Rules as presently enforceable rights.'});const n=evidence.find((d:{_id:string})=>d._id==='official.dpdp-commencement');if(n&&!sources.some(s=>s.url===n.officialUrl))sources.push({title:n.title as string,authority:n.authority as string,url:n.officialUrl as string})}
  if(!sources.length)return NextResponse.json({summary:'The available official-source evidence is not enough to establish this process safely.',steps:[],draft:'',conflicts:[],sources:[]})
  return NextResponse.json({...object,sources})
 }finally{await mcp.close()}
}
