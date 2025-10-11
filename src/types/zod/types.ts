import {z} from 'zod'
export const loginBodySchema=z.object({
    email:z.email({error:"Enter a valid email Id"}).toLowerCase(),
    password:z.string().min(8, {error:'Password should be a min length of 8'})
})
export const signupBodySchema=z.object({
    email:z.email({error:"Enter a valid email Id"}).toLowerCase(),
    password:z.string().min(8, {error:'Password should be a min length of 8'}),
    name:z.string()
})
export const searchQuery=z.object({
    sentiment:z.string().optional(),
    time:z.string().optional(),
    industry:z.string().optional(),
    sentimentScoreLimit:z.string().optional(),
    page:z.string().optional(),
    limit:z.string().optional(),
    searchQuery:z.string().optional()
})
export type searchQueryType=z.infer<typeof searchQuery>
export  type signUpBodyType=z.infer<typeof signupBodySchema>
export  type loginBodyType=z.infer<typeof loginBodySchema>