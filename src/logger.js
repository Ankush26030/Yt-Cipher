/**
 * Lightweight structured logger with colored output.
 */

const COLORS = {
  DEBUG: "\x1b[90m",
  INFO: "\x1b[36m",
  WARN: "\x1b[33m",
  ERROR: "\x1b[31m",
};
const RESET = "\x1b[0m";

function format(level, message, context) {
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `${color}[${ts}] [${level}]${RESET} ${message}${ctx}`;
}

export const log = {
  debug(message, context) {
    console.debug(format("DEBUG", message, context));
  },
  info(message, context) {
    console.log(format("INFO", message, context));
  },
  warn(message, context) {
    console.warn(format("WARN", message, context));
  },
  error(message, context) {
    console.error(format("ERROR", message, context));
  },
};
