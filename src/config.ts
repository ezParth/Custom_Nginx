import fs from "fs"
import { parse } from "yaml"

const parseYAMLConfig = async (filepath: string) => {
    fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
            console.log("Error in reading the yml file: ", err)
        } else {
            console.log(data)
            const result = parse(data)
            const final_result = JSON.stringify(result)
            console.log(final_result)
            return final_result
        }
    })
}

const validateConfig = async (config: string) => {
    
}

export { parseYAMLConfig }