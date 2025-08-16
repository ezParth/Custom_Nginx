"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const path_1 = __importDefault(require("path"));
console.log("dirname: ", __dirname);
const mainPath = path_1.default.join(__dirname, '../config.yml');
console.log("main path: ", mainPath);
(0, config_1.parseYAMLConfig)(mainPath);
