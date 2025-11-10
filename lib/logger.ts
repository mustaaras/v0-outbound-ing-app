// Lightweight logger helpers. Logs only in non-production to avoid leaking data in prod.
// Declare process for environments that don't have Node typings in the local editor/runtime.
declare const process: any
const isDev = typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : true

export function devLog(...args: unknown[]) {
  if (isDev) console.log(...args)
}

export function errorLog(...args: unknown[]) {
  // Always use console.error to ensure errors are visible in server logs
  console.error(...args)
}

export default { devLog, errorLog }
