const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log('[LOG]', ...args); },
  info: (...args: unknown[]) => { if (isDev) console.info('[INFO]', ...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn('[WARN]', ...args); },
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};
