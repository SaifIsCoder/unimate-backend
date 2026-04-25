const createLog =
  (level) =>
  (...args) =>
    console[level](`[${level.toUpperCase()}]`, ...args);

export const info = createLog("log");
export const warn = createLog("warn");
export const error = createLog("error");
