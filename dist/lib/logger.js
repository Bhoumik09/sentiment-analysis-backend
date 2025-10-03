"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
// Define custom logging levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Set the logging level based on the environment
const level = () => {
    const env = process.env.NODE_ENV || "development";
    return env === "development" ? "debug" : "warn";
};
// Define colors for each logging level
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};
winston_1.default.addColors(colors);
// Define the format for console logs (human-readable)
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, meta = __rest(_a, ["timestamp", "level", "message"]);
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaString}`;
}));
// Define the format for file logs (structured JSON for machine readability)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
// Initialize transports array with a console logger, which is safe for all environments.
// We explicitly type the array to hold any valid Winston transport.
const transports = [
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
];
// If the environment is NOT production (e.g., 'development'), add the file transports.
if (process.env.NODE_ENV !== 'production') {
    const errorFileTransport = new winston_daily_rotate_file_1.default({
        filename: "logs/error.log",
        level: "error",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "40m",
        maxFiles: "30d",
        format: fileFormat,
    });
    const allFileTransport = new winston_daily_rotate_file_1.default({
        filename: "logs/all.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "40m",
        maxFiles: "30d",
        format: fileFormat,
    });
    transports.push(errorFileTransport, allFileTransport);
}
// Create the main logger instance with the configured levels and transports.
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map