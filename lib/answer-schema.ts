import {z} from 'zod'
export const answerSchema=z.object({
 summary:z.string(), steps:z.array(z.string()), draft:z.string(),
 conflicts:z.array(z.object({topic:z.string(),detail:z.string()})),
 sources:z.array(z.object({title:z.string(),authority:z.string(),url:z.string()}))
})
