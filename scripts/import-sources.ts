/** Import a curated, bounded official corpus; excludes personal records. */
import {createClient} from '@sanity/client'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import path from 'node:path'

async function main(){
const docs=JSON.parse(await readFile('data/sources/manifest.json','utf8')) as Array<{id:string;domain:string;title:string;authority:string;url:string;type:string;status:string;version?:string}>
const client=createClient({projectId:process.env.SANITY_PROJECT_ID!,dataset:process.env.SANITY_DATASET||'production',apiVersion:'2026-09-01',token:process.env.SANITY_API_WRITE_TOKEN,useCdn:false})
const limits:Record<string,number>={'fastag-netc-v21':210_000,'fastag-netc-v19':125_000,'dpdp-rules':180_000}
const clean=(s:string)=>s.replace(/\u0000/g,'').replace(/[ \t]{3,}/g,' ').replace(/\n{3,}/g,'\n\n').trim()
await mkdir('data/import-audit',{recursive:true})
for(const source of docs){
 try{
  const r=await fetch(source.url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'SarkariAgent/1.0 (official public source research)'}})
  if(!r.ok)throw new Error(`HTTP ${r.status}`)
  let text:string;const bytes=Buffer.from(await r.arrayBuffer())
  if(r.headers.get('content-type')?.includes('pdf')||source.url.endsWith('.pdf')){
   const file=path.join('/tmp',`sarkari-${source.id}.pdf`);await writeFile(file,bytes)
   text=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8',maxBuffer:4*1024*1024})
  } else {
   const {load}=await import('cheerio');const $=load(bytes.toString('utf8'))
   $('script,style,nav,header,footer,aside').remove();text=$('main').text()||$('body').text()
  }
  text=clean(text)
  if(text.length<150)throw new Error('Insufficient extracted text')
  const hash=createHash('sha256').update(bytes).digest('hex')
  const cap=limits[source.id]||75_000
  const chunks=(text.slice(0,cap).match(/[\s\S]{1,3500}/g)||[]).map((part,i)=>({_key:`p${i}`, _type:'block',style:'normal',children:[{_key:`s${i}`,_type:'span',text:part,marks:[]}],markDefs:[]}))
  const doc={_id:`official.${source.id}`,_type:'sourceDocument',title:source.title,slug:{_type:'slug',current:source.id},domain:source.domain,authority:source.authority,sourceType:source.type,officialUrl:source.url,status:source.status,version:source.version||undefined,content:chunks,contentHash:hash,retrievedAt:new Date().toISOString(),summary:`Official ${source.authority} ${source.type}; status ${source.status}. Source URL ${source.url}.`}
  if(source.id==='cpgrams-guidelines') (doc as any).procedures=[{_key:'appeal',_type:'procedure',issue:'Closed grievance not resolved',steps:[{_key:'step1',_type:'object',order:1,action:'Use the registration number to open the disposed grievance and submit feedback that the problem remains.',channel:'CPGRAMS'},{_key:'step2',_type:'object',order:2,action:'File an appeal through the portal or feedback call centre; keep the registration number and disposal response.',channel:'CPGRAMS appeal',deadline:'Appeal disposal maximum 30 days under 2024 guidance'}],escalation:'Nodal Appellate Authority reviews independently.'},{_key:'timeline',_type:'procedure',issue:'Ordinary grievance redress timeline',steps:[{_key:'step1',_type:'object',order:1,action:'Current August 2024 guidance recommends redress within 21 days of registration.',channel:'CPGRAMS',deadline:'21 days'},{_key:'step2',_type:'object',order:2,action:'If longer, provide an interim reply with a reason and expected date.',channel:'CPGRAMS'}],escalation:'The July 2022 memorandum said 30 days; the 2024 guidance is newer.'}]
  if(source.id==='fastag-faq') (doc as any).procedures=[{_key:'wrong-debit',_type:'procedure',issue:'FASTag debit without crossing',steps:[{_key:'step1',_type:'object',order:1,action:'Check the transaction date, plaza and amount, then raise a dispute with the FASTag issuer bank using the transaction details.',channel:'Issuer bank'},{_key:'step2',_type:'object',order:2,action:'Keep the bank reference and supporting evidence; call 1033 for plaza issues.',channel:'Issuer bank / 1033'}]}]
  if(source.id==='nhai-complaint-policy') (doc as any).procedures=[{_key:'highway-hazard',_type:'procedure',issue:'Unsafe national highway conditions',steps:[{_key:'step1',_type:'object',order:1,action:'Submit a complaint with location and description of the hazard using the channels in NHAI complaint policy.',channel:'NHAI'},{_key:'step2',_type:'object',order:2,action:'Keep acknowledgment for follow-up.',channel:'NHAI'}]}]
  if(source.id==='passport-application-booklet') (doc as any).summary='Passport Seva official instruction booklet. For damaged passport reissue, consult Table 2-II: recognizable damage and damage beyond recognition require different documents; bring originals and self-attested copies. Verify current document advisor and local Passport Office requirements before applying. The booklet has older contradictory expiry-window wording; do not use it to answer an expiry-window question without a current source.'
  if(source.id==='fastag-netc-v21') (doc as any).supersedes={_type:'reference',_ref:'official.fastag-netc-v19'}
  if(source.id==='cpgrams-guidelines') (doc as any).supersedes={_type:'reference',_ref:'official.cpgrams-om-2022'}
  await client.createOrReplace(doc)
  console.log(`OK ${source.id}: ${text.length} extracted chars, ${chunks.length} blocks`)
 }catch(e){console.error(`FAIL ${source.id}: ${e instanceof Error?e.message:e}`);process.exitCode=1}
}
await client.patch('official.cpgrams-guidelines').set({conflicts:[{_key:'cpgrams-timeline-2022-v-2024',_type:'conflict',topic:'CPGRAMS ordinary redress timeline',otherSource:{_type:'reference',_ref:'official.cpgrams-om-2022'},thisClaim:'2024 DARPG memorandum recommends 21 days, with interim reply if longer.',otherClaim:'2022 DARPG memorandum sets a maximum 30 days.',resolution:'Use later August 2024 memorandum and current CPGRAMS FAQ (21 days); retain older 30-day source for audit.',confidence:'high'}]}).commit()
}
main().catch(e=>{console.error(e);process.exit(1)})
