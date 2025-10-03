"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
exports.prisma = new client_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_2.Prisma; } });
//# sourceMappingURL=prisma.js.map