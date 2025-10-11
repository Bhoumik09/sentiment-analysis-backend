"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQuery = exports.signupBodySchema = exports.loginBodySchema = void 0;
const zod_1 = require("zod");
exports.loginBodySchema = zod_1.z.object({
    email: zod_1.z.email({ error: "Enter a valid email Id" }),
    password: zod_1.z.string().min(8, { error: 'Password should be a min length of 8' })
});
exports.signupBodySchema = zod_1.z.object({
    email: zod_1.z.email({ error: "Enter a valid email Id" }),
    password: zod_1.z.string().min(8, { error: 'Password should be a min length of 8' }),
    name: zod_1.z.string()
});
exports.searchQuery = zod_1.z.object({
    sentiment: zod_1.z.string().optional(),
    time: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
    sentimentScoreLimit: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    searchQuery: zod_1.z.string().optional()
});
//# sourceMappingURL=types.js.map