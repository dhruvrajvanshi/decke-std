
export type AnyFunction = (...args: never[]) => unknown;

/**
  * Throws an error with a stack trace starting from the provided function.
  * Helpful when you want to show the caller of a function at the beginning of the stack trace.
  */
function throwAt(error: Error, stackStartFn: AnyFunction): never {
  if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(error, stackStartFn);
  }
  throw error;
}

export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    message = message ? `Assertion failed: ${message}` : "Assertion failed";
    throwAt(new Error(message), assert);
  }
}

export function todo(template: TemplateStringsArray, ...args: unknown[]): never
export function todo(): never
export function todo(message: string): never
export function todo(message: unknown): never
export function todo(first?: unknown, ...args: unknown[]): never {
  let message: string
  if (first === undefined) {
    message = "TODO"
  } else if (typeof first === "string") {
    message = `TODO(${first})`
  } else if (Array.isArray(first) && "raw" in first) {
    message = "TODO: "

    for (let i = 0; i < first.length; i++) {
      message += first[i]
      const arg = args[i]
      if (arg !== undefined) {
        message += JSON.stringify(arg)
      }
    }
  } else {
    message = inspect(first)
  }
  throwAt(new Error(message), todo);
}

function inspect(value: unknown): string {
  return JSON.stringify(value, null, "  ")
}

export function assertUnreachable(value: never): never {
  throwAt(new Error(`Unreachable code reached with value: ${value}`), assertUnreachable);
}

interface RxObject {
  (...parts: (string | RegExp)[]): RegExp;
  named(name: string, regex: RegExp): RegExp;
  escape(str: string): string;
}
export const rx: RxObject = (...parts: (string | RegExp)[]): RegExp => {
  const pattern = parts
    .map((part) => (typeof part === "string" ? rx.escape(part) : part.source))
    .join("")

  try {
    return new RegExp(pattern)
  } catch (e) {
    const wrapped: Error & { cause?: unknown } = new Error(`Invalid regex: ${pattern}`)
    wrapped.cause = e
    throwAt(wrapped, rx)
  }
}

rx.named = function named(name: string, regex: RegExp): RegExp {
  if (regex.flags.includes("g")) {
    throwAt(new Error("Cannot name a global regex"), named)
  }
  return new RegExp(`(?<${name}>${regex.source})`, regex.flags)
}

rx.escape = function (str: string): string {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

