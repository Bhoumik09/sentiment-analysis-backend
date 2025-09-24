import morgan, { StreamOptions } from "morgan";
import logger from "../lib/logger";

const stream: StreamOptions = {
  write: message => {
    console.log(message.trim()); // Print to console
    logger.http(message);
  },
};

// Skip all the Morgan http log if the
// application is not running in development mode.
// This method is not really needed here since
// we already told to the logger that it should print
// only warning and error messages in production.

export const httpLogger = morgan("combined", { stream });