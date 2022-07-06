/*
 * 🌲 @noelware/pino-logstash: Pino transport to log data into Logstash via HTTP, TCP, or UDP.
 * Copyright (c) 2021-2022 Noelware <team@noelware.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** Represents a value that can be transformed into valid JSON. */
export type JsonValue = JsonObject | JsonArray | string | number | boolean | null;

/** Represents a JSON object that can be transformed into valid JSON. */
export type JsonObject = { [k in string | symbol | number]: JsonValue };

/** Represents a JSON array that can be transformed into valid JSON. */
export type JsonArray = JsonValue[];

/**
 * Returns all the V8 callstack trace to retrieve where the file
 * is being executed in.
 */
export function getCallSites(): NodeJS.CallSite[] {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack as NodeJS.CallSite[] | undefined;
  Error.prepareStackTrace = _prepareStackTrace;

  return stack !== undefined ? stack : [];
}

let pino: any = null;
try {
  pino = require('pino');
} catch {
  // we hope pino is here
}

/**
 * Returns all the pino levels' object if Pino is available, otherwise, it'll
 * just return the defaults.
 */
export const levels = pino?.levels
  ? pino.levels
  : {
      labels: { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' },
      values: { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 }
    };
