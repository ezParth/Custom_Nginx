import { z } from "zod"

export const workerMessageSchema = z.object({
    requestType: z.enum(['HTTP']),
    headers: z.any(),
    body: z.any(),
    url: z.string(),
})

export type workerMessageType = z.infer<typeof workerMessageSchema>