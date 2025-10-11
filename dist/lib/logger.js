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
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const level = () => {
    const env = process.env.NODE_ENV || "development";
    return env === "development" ? "debug" : "warn";
};
const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, meta = __rest(_a, ["timestamp", "level", "message"]);
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaString}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, meta = __rest(_a, ["timestamp", "level", "message"]);
    return JSON.stringify(Object.assign({ timestamp,
        level,
        message }, meta));
}));
const transports = [
    new winston_1.default.transports.Console(),
    new winston_daily_rotate_file_1.default({
        filename: "logs/error.log",
        level: "error",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "40m",
        maxFiles: "30d",
        format: fileFormat, // Ensuring JSON format for file logs
    }),
    new winston_daily_rotate_file_1.default({
        filename: "logs/all.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "40m",
        maxFiles: "30d",
        format: fileFormat, // Ensuring JSON format for file logs
    }),
];
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map