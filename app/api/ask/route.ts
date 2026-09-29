import {NextRequest,NextResponse} from 'next/server'
import {createMCPClient} from '@ai-sdk/mcp'
import {google} from '@ai-sdk/google'
import {generateText, Output, stepCountIs} from 'ai'
import {answerSchema} from '@/lib/answer-schema'
export const maxDuration=60
export async function POST(req:NextRequest){
 const {question}=await req.json(); if(typeof question!=='string'||!question.trim())return new NextResponse('Question required',{status:400})
 const url=process.env.SANITY_CONTEXT_MCP_URL, token=process.env.SANITY_API_READ_TOKEN
 if(!url||!token||!process.env.GOOGLE_GENERATIVE_AI_API_KEY)return new NextResponse('Demo is not configured yet',{status:503})
 const initialUrl=new URL(url); initialUrl.pathname=`${initialUrl.pathname.replace(/\/$/,'')}/initial-context`
 const initial=await fetch(initialUrl,{headers:{Authorization:`Bearer ${token}`}}).then(r=>{if(!r.ok)throw new Error(`Initial context ${r.status}`);return r.text()})
 const mcp=await createMCPClient({transport:{type:'http',url,headers:{Authorization:`Bearer ${token}`}}})
 try{
  const {initial_context:_,...tools}=await mcp.tools()
  const {output:object}=await generateText({model:google('gemini-2.5-flash'),output:Output.object({schema:answerSchema}),tools,stopWhen:stepCountIs(8),
   system:`You are Sarkari Agent, an India public-process guide. The Sanity dataset contains curated official sources. Always query it before answering. Prefer current law/rules over older guidelines; never silently reconcile conflicts. If sources differ, report both with dates/versions and explain which likely controls. Give exact procedural steps, evidence, channels, deadlines and escalation. Draft concise complaint/form text using placeholders only. Cite every action-driving claim with an official source URL. Do not request or expose personal information. If the corpus cannot answer, say so.\n\nSCHEMA CONTEXT:\n${initial}`,
   prompt:question})
  return NextResponse.json(object)
 }finally{await mcp.close()}
}
