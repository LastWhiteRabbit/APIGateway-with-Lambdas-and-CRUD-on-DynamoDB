interface Logger {
  debug(message: string, ...params: any[]): void;
  info(message: string, ...params: any[]): void;
  warn(message: string, ...params: any[]): void;
  error(message: string, ...params: any[]): void;
  error(e: Error, message: string, properties?: Record<string, any>): void;
}

export const logger: Logger = {
  debug: (message?: any, ...params: any[]): void => {
    if (process.env.LOG_LEVEL === 'debug') {
      params.length > 0
        ? console.debug(message, params)
        : console.debug(message);
    }
  },
  info: (message?: any, ...params: any[]): void => {
    params.length > 0 ? console.info(message, params) : console.info(message);
  },
  warn: (message?: any, ...params: any[]): void => {
    params.length > 0 ? console.warn(message, params) : console.warn(message);
  },
  error: (message?: any, ...params: any[]): void => {
    params.length > 0 ? console.error(message, params) : console.error(message);
  },
};

export default logger;
