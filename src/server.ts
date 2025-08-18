import {parseYAMLConfig, validateConfig} from "./config";
import { program } from "commander";
import cluster from "node:cluster";
import os from "os"

interface createServerConfig {
    port: number
    workerCount: number
}

const createServer = async (config: createServerConfig) => {
    const { workerCount } = config
    const workers = new Array(workerCount)

    if(cluster.isPrimary) {
        console.log("Master Process in up!")

        for(var i = 0; i<workerCount; i++) {
            cluster.fork()
            console.log(`Woker node ${i+1} spinned up`)
        }
    } else {
        console.log(`Worker node`)
    }
}

const main = async () => {
    try {
        program.option('--config <path>')
        program.parse();
        const options = program.opts()
        if(options && 'config' in options) {
            const validatedConfig = await validateConfig(await parseYAMLConfig(options.config))

            await createServer({ port: validatedConfig.server.listen, workerCount: validatedConfig.server.workers ?? os.cpus().length})
        }
    } catch (error) {
        console.log("Error in server.ts file: ", error)        
    }
}

main()
