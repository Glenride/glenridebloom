const format = (level: string, message: string): string =>
  `[${new Date().toISOString()}] ${level} ${message}`;

export const logger = {
  info: (message: string): void => {
    console.log(format("INFO", message));
  },
  warn: (message: string): void => {
    console.warn(format("WARN", message));
  },
  error: (message: string, error?: unknown): void => {
    if (error) {
      console.error(format("ERROR", `${message}: ${String(error)}`));
    } else {
      console.error(format("ERROR", message));
    }
  }
};
