"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = __importDefault(require("../lib/logger"));
const stream = {
    write: message => {
        console.log(message.trim()); // Print to console
        logger_1.default.http(message);
    },
};
// Skip all the Morgan http log if the
// application is not running in development mode.
// This method is not really needed here since
// we already told to the logger that it should print
// only warning and error messages in production.
exports.httpLogger = (0, morgan_1.default)("combined", { stream });
//# sourceMappingURL=httpLogger.js.map