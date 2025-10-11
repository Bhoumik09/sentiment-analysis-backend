import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from 'path';
import os from 'os'
import TransportStream from "winston-transport";
import dotenv from "dotenv";

dotenv.config();
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
winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaString}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  }),
);




// Start with the transport that works everywhere
const transports:TransportStream[] = [
  new winston.transports.Console(),
];

// --- THIS IS THE KEY CHANGE ---
// Only add file transports if NOT in production
if (process.env.NODE_ENV !== 'PRODUCTION') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(os.tmpdir(), 'logs', 'error-%DATE%.log'),
      level: "error",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "40m",
      maxFiles: "30d",
      format: fileFormat,
    }),
    new DailyRotateFile({
      // 👇 I also fixed a copy-paste error here, this should be 'all-%DATE%.log'
      filename: path.join(os.tmpdir(), 'logs', 'all-%DATE%.log'),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "40m",
      maxFiles: "30d",
      format: fileFormat,
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports, // Use the dynamically built array
});

export default logger;

