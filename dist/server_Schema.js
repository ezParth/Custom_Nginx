"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMessageSchema = void 0;
const zod_1 = require("zod");
exports.workerMessageSchema = zod_1.z.object({
    requestType: zod_1.z.enum(['HTTP']),
    headers: zod_1.z.any(),
    body: zod_1.z.any(),
    url: zod_1.z.string(),
});
