import {parseYAMLConfig, validateConfig} from "./config";
import { ConfigSchemaType } from "./config_schema"
import { program } from "commander";
import cluster from "node:cluster";
import os from "os"
import http from "http"

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
            console.log(`Woker node ${i+1} spinned up`)
        }

        const server = http.createServer(function (req, res) {

        })
    } else {
        console.log(`Worker node`, process.env.config)
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
