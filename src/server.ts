import {parseYAMLConfig, validateConfig} from "./config";
import { program } from "commander";
import path from "path"
// const mainPath = path.join(__dirname, '../config.yml')
// console.log(mainPath)

const main = async () => {
    try {
        program.option('--config <path>')
        program.parse();
        const options = program.opts()
        if(options && 'config' in options) {
            const validatedConfig = await validateConfig(await parseYAMLConfig(options.config))
            console.log("-------->\n",validatedConfig)
        }
    } catch (error) {
        console.log("Error in server.ts file: ", error)        
    }
}

main()
