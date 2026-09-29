import {z} from 'zod'
export const answerSchema=z.object({
 summary:z.string(), steps:z.array(z.string()).min(1), draft:z.string().optional(),
 conflicts:z.array(z.object({topic:z.string(),detail:z.string()})).optional(),
 sources:z.array(z.object({title:z.string(),authority:z.string(),url:z.string().url(),version:z.string().optional()})).min(1)
})
