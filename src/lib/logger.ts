import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import TransportStream from "winston-transport";

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
winston.addColors(colors);

// Define the format for console logs (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${level}: ${message} ${metaString}`;
  })
);

// Define the format for file logs (structured JSON for machine readability)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Initialize transports array with a console logger, which is safe for all environments.
// We explicitly type the array to hold any valid Winston transport.
const transports: TransportStream[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// If the environment is NOT production (e.g., 'development'), add the file transports.
if (process.env.NODE_ENV !== 'production') {
  const errorFileTransport = new DailyRotateFile({
    filename: "logs/error.log",
    level: "error",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "40m",
    maxFiles: "30d",
    format: fileFormat,
  });

  const allFileTransport = new DailyRotateFile({
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
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export default logger;