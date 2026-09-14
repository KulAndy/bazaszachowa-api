import pino from "pino";

export const loggerConfig = {
  level: "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
    target: "pino-pretty",
  },
};
const logger = pino(loggerConfig);

export default logger;
