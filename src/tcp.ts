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

/* eslint-disable quote-props */

import { getCallSites, JsonObject, JsonValue, levels } from './utils';
import { hasOwnProperty } from '@noelware/utils';
import { Writable } from 'stream';
import { connect } from 'net';

/** Represents the options to configure the TCP transport. */
export interface LogstashTcpTransportOptions {
  /**
   * Represents the timestamp key to use to identify the timestamp.
   * @default '@timestamp'
   */
  timestampKey?: string;

  /**
   * Extra attributes to append to the JSON payload.
   * @default '{}'
   */
  attributes?: Record<string, JsonValue>;

  /** The username to authenticate with, if the input plugin is configured for basic auth. */
  username?: string;

  /** The password to authenticate with, if the input plugin is configured for basic auth. */
  password?: string;

  /** The host to send the request to. */
  host: string;

  /** The port to send the request to. */
  port: number;
}

export function createTcpTransport(options: LogstashTcpTransportOptions) {
  const socket = connect({ port: options.port, host: options.host });
  return new Writable({
    write(chunk, encoding: string, callback) {
      let data: JsonObject;
      if (encoding === 'buffer') {
        data = JSON.parse((chunk as Buffer).toString('utf-8'));
      } else {
        data = JSON.parse(chunk.toString());
      }

      const timestampKey = options.timestampKey ?? '@timestamp';
      const attributes = hasOwnProperty(options, 'attributes') ? options.attributes! : {};
      const sites = getCallSites().filter((s) => s.isNative() || !s.getFileName()?.startsWith('node:'));
      const origin = sites.length === 0 ? null : sites[sites.length - 1];
      const toSend = JSON.stringify({
        [timestampKey]: new Date(data.time as number).toISOString(),
        '@version': 1,
        level: levels.labels[data.level as number],
        message: data.msg,
        hostname: data.hostname,
        logger: data.name,
        process: data.pid,
        file:
          origin !== null
            ? {
                path: origin.getFileName(),
                function: origin.getFunctionName(),
                method: origin.getMethodName(),
                line: origin.getLineNumber() ?? 0,
                column: origin.getColumnNumber() ?? 0
              }
            : {},
        ...attributes
      });

      socket.write(toSend, (error) => {
        callback(error);
      });
    }
  });
}
