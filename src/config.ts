import fs from "fs/promises";
import { parse } from "yaml";
import { rootConfigSchema } from "./config_schema";

const parseYAMLConfig = async (filepath: string) => {
    const data = await fs.readFile(filepath, "utf-8");
    const result = parse(data);
    console.log("result: ", result)
    return JSON.stringify(result);
};

const validateConfig = async (config: string) => {
    const validatiorConfig = await rootConfigSchema.parseAsync(JSON.parse(config));
    return validatiorConfig;
};

export { parseYAMLConfig, validateConfig };
