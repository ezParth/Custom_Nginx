import {parseYAMLConfig} from "./config";
import path from "path"

console.log("dirname: ", __dirname)

const mainPath = path.join(__dirname, '../config.yml')

console.log("main path: ", mainPath)

parseYAMLConfig(mainPath)
