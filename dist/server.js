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
const config_1 = require("./config");
const config_schema_1 = require("./config_schema");
const commander_1 = require("commander");
const node_cluster_1 = __importDefault(require("node:cluster"));
const os_1 = __importDefault(require("os"));
const http_1 = __importDefault(require("http"));
const server_schema_1 = require("./server_schema");
const createServer = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const { workerCount } = config;
    const workers = new Array(workerCount);
    if (node_cluster_1.default.isPrimary) {
        // master process
        console.log("Master Process is up!");
        for (let i = 0; i < workerCount; i++) {
            node_cluster_1.default.fork({ config: JSON.stringify(config.config) });
            console.log(`Worker node ${i + 1} spinned up`);
        }
        const server = http_1.default.createServer((req, res) => {
            var _a;
            if (req.url == "/") {
                res.writeHead(302, { Location: 'https://google.com' });
                res.end();
                return;
            }
            const index = Math.floor(Math.random() * workerCount);
            const worker = Object.values((_a = node_cluster_1.default.workers) !== null && _a !== void 0 ? _a : [])[index];
            if (!worker) {
                console.log("Worker is undefined");
                res.writeHead(500);
                res.end("Internal Server Error: No available worker");
                return;
            }
            const payload = {
                requestType: "HTTP",
                headers: req.headers,
                body: null,
                url: `${req.url}`,
            };
            worker.send(JSON.stringify(payload));
            const onMessage = (workerReply) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const reply = yield server_schema_1.workerMessageReplySchema.parseAsync(JSON.parse(workerReply));
                    if (reply.errorCode) {
                        res.writeHead(parseInt(reply.errorCode));
                        res.end(reply.error);
                    }
                    else {
                        res.writeHead(200);
                        res.end(reply.data);
                    }
                }
                catch (error) {
                    console.error("Error parsing worker reply:", error);
                    res.writeHead(500);
                    res.end("Internal Server Error");
                }
                finally {
                    worker.off("message", onMessage);
                }
            });
            worker.on("message", onMessage);
        });
        server.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
    else {
        // worker process
        const config = yield config_schema_1.rootConfigSchema.parseAsync(JSON.parse(process.env.config));
        process.on("message", (msg) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validatedMessage = yield server_schema_1.workerMessageSchema.parseAsync(JSON.parse(msg));
                const requestUrl = validatedMessage.url;
                const rule = config.server.rules.find((e) => e.path === requestUrl);
                if (!rule) {
                    const reply = {
                        errorCode: "404",
                        error: "Rule not found!",
                    };
                    if (process.send)
                        process.send(JSON.stringify(reply));
                    return;
                }
                const upstreamID = rule.upstreams[0];
                const upstream = config.server.upstream.find((e) => e.id === upstreamID);
                if (!upstream) {
                    const reply = {
                        errorCode: "500",
                        error: "Upstream not found!",
                    };
                    if (process.send)
                        process.send(JSON.stringify(reply));
                    return;
                }
                console.log("host: ", upstream.url, " path: ", requestUrl);
                const proxyReq = http_1.default.request({ host: upstream.url, path: requestUrl }, (proxyRes) => {
                    let body = "";
                    proxyRes.on("data", (chunk) => {
                        body += chunk;
                    });
                    proxyRes.on("end", () => {
                        const reply = { data: body };
                        if (process.send)
                            process.send(JSON.stringify(reply));
                    });
                });
                console.log("porxyReq: ", proxyReq.host);
                proxyReq.on("error", (err) => {
                    console.error("Error in proxy request:", err);
                    const reply = {
                        errorCode: "500",
                        error: "Proxy request failed!",
                    };
                    if (process.send)
                        process.send(JSON.stringify(reply));
                });
                proxyReq.end();
            }
            catch (error) {
                console.error("Error in worker message handler:", error);
                const reply = {
                    errorCode: "500",
                    error: "Internal Server Error",
                };
                if (process.send)
                    process.send(JSON.stringify(reply));
            }
        }));
    }
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        commander_1.program.option("--config <path>");
        commander_1.program.parse();
        const options = commander_1.program.opts();
        if (options && "config" in options) {
            const validatedConfig = yield (0, config_1.validateConfig)(yield (0, config_1.parseYAMLConfig)(options.config));
            yield createServer({
                port: validatedConfig.server.listen,
                workerCount: (_a = validatedConfig.server.workers) !== null && _a !== void 0 ? _a : os_1.default.cpus().length,
                config: validatedConfig,
            });
        }
    }
    catch (error) {
        console.log("Error in server.ts file: ", error);
    }
});
main();
