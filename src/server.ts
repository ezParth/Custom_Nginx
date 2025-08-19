import {parseYAMLConfig, validateConfig} from "./config";
import { ConfigSchemaType, rootConfigSchema } from "./config_schema"
import { program } from "commander";
import cluster , { Worker } from "node:cluster";
import os from "os"
import http from "http"
import { workerMessageReplySchema, workerMessageReplyType, workerMessageSchema, workerMessageType } from "./server_schema";

interface createServerConfig {
    port: number
    workerCount: number
    config: ConfigSchemaType
}

const createServer = async (config: createServerConfig) => {
    const { workerCount } = config
    const workers = new Array(workerCount)

    if(cluster.isPrimary) {
        console.log("Master Process in up!")

        for(var i = 0; i<workerCount; i++) {
            cluster.fork({ config: JSON.stringify(config.config) })
            // console.log(`Woker node ${i+1} spinned up`)
        }



        const server = http.createServer(function (req, res) {
            const index = Math.floor(Math.random() * workerCount)
            const worker: Worker | undefined = Object.values(cluster.workers ?? [])[index]
            if(worker == undefined) {
                console.log('worker is undefined')
                return;
            }
            // console.log('worker: ', worker)
            var BODY : any = ""
            req.on('data', (data) => {
                console.log('data: ', data, " -> ", typeof data)
                BODY += data
            })
            JSON.stringify(BODY)

            const payload: workerMessageType = {
                requestType: 'HTTP',
                headers: req.headers,
                body: BODY || null,
                url: `${req.url}`
            }


            worker.send(JSON.stringify(payload)) 

            worker.on('message', async (workerReply: string) => {
                const reply = await workerMessageReplySchema.parseAsync(JSON.parse(workerReply))
                 if(reply.errorCode) {
                    res.writeHead(parseInt(reply.errorCode))
                    res.end(reply.error)
                    return
                 }else {
                    res.writeHead(200)
                    res.end(reply.data)
                    return
                 }
            })
        })

        server.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`)
        })
    } else {
        // console.log(`Worker node`, JSON.parse(process.env.config as string))

        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config as string))
        process.on('message', async (msg: string) => {
            // console.log("worker recieved a message: ", msg)
            const validatedMessage = await workerMessageSchema.parseAsync(JSON.parse(msg))
            console.log(validatedMessage)

            const requestUrl: string = validatedMessage.url
            const rule = config.server.rules.find(e => e.path == requestUrl)

            if(!rule) {
                const reply: workerMessageReplyType = {
                    errorCode: "404",
                    error: "Rule not found!"
                }
                const errorMessage = "Something is not good here, rule!"
                if(process.send) return process.send(JSON.stringify(reply))
                else return errorMessage
            }

            const upstreamID = rule.upstreams[0]
            const upstream = config.server.upstream.find(e => e.id === upstreamID)
            if(!upstreamID) {
                const reply: workerMessageReplyType = {
                    errorCode: "500",
                    error: "upstream not found!"
                }
                const errorMessage = "Something is not good here, upstram!"
                if(process.send) return process.send(JSON.stringify(reply))
                else return errorMessage
            }

            http.request({host: upstream?.url, path: requestUrl}, (proxyRes) => {
                let body = ''
                proxyRes.on('data', (a) => {
                    body += a
                })

                proxyRes.on('data', () => {
                    const reply: workerMessageReplyType = {
                        data: body
                    }

                    if(process.send) process.send(JSON.stringify(reply))
                })
            })
        })
    }
}

const main = async () => {
    try {
        program.option('--config <path>')
        program.parse();
        const options = program.opts()
        if(options && 'config' in options) {
            const validatedConfig = await validateConfig(await parseYAMLConfig(options.config))

            await createServer({ port: validatedConfig.server.listen, workerCount: validatedConfig.server.workers ?? os.cpus().length, config: validatedConfig})
        }
    } catch (error) {
        console.log("Error in server.ts file: ", error)        
    }
}

main()
