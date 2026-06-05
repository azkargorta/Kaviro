const isProd = process.env.NODE_ENV === "production";

/** Logger central: en producción solo warn/error (evita ruido y fugas en logs). */
export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (!isProd) console.info(...args);
  },
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
