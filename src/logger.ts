if (process.env.LOG_LEVEL === undefined) {
  process.env.LOG_LEVEL = "info";
}

type LoggerArgs = Parameters<typeof console.log>;

const logLevel = ["error", "warn", "info", "debug"] as const;
const logLevelIndex = logLevel.indexOf(
  process.env.LOG_LEVEL as (typeof logLevel)[number]
);

const logger = {
  debug: (...args: LoggerArgs) => {
    if (logLevelIndex >= 3) {
      console.debug(...args);
    }
  },

  info: (...args: LoggerArgs) => {
    if (logLevelIndex >= 2) {
      console.info(...args);
    }
  },

  warn: (...args: LoggerArgs) => {
    if (logLevelIndex >= 1) {
      console.warn(...args);
    }
  },

  error: (...args: LoggerArgs) => {
    if (logLevelIndex >= 0) {
      console.error(...args);
    }
  },
};

export default logger;
