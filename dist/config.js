"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.parseYAMLConfig = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const yaml_1 = require("yaml");
const config_schema_1 = require("./config_schema");
const parseYAMLConfig = (filepath) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield promises_1.default.readFile(filepath, "utf-8");
    const result = (0, yaml_1.parse)(data);
    // console.log("result: ", result)
    return JSON.stringify(result);
});
exports.parseYAMLConfig = parseYAMLConfig;
const validateConfig = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const validatiorConfig = yield config_schema_1.rootConfigSchema.parseAsync(JSON.parse(config));
    return validatiorConfig;
});
exports.validateConfig = validateConfig;
