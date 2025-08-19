"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const server = http_1.default.createServer((req, res) => {
    const parsedUrl = req.url;
    if (parsedUrl == "/") {
        res.writeHead(200, { 'Content-type': 'text/plain' });
        res.write('Hello, I am a webserver !');
        res.end();
    }
    else {
        res.writeHead(404, { 'Content-type': 'text/plain' });
        res.end();
    }
});
server.listen(8001, () => {
    console.log("Server started on port 8001");
});
