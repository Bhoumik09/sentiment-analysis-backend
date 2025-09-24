import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
//this is used to give logs what we give in our code

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

const transports = [
  new winston.transports.Console(),
  new DailyRotateFile({
    filename: "logs/error.log",
    level: "error",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "40m",
    maxFiles: "30d",
    format: fileFormat, // Ensuring JSON format for file logs
  }),
  new DailyRotateFile({
    filename: "logs/all.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "40m",
    maxFiles: "30d",
    format: fileFormat, // Ensuring JSON format for file logs
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
