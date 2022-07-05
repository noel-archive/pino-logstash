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

import { getCallSites, JsonValue, JsonObject, levels } from './utils';
import { hasOwnProperty } from '@noelware/utils';
import { Writable } from 'stream';
import { URL } from 'url';
import https from 'https';
import http from 'http';

/** Represents the options to configure the HTTP transport. */
export interface LogstashHttpTransportOptions {
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

export function createHttpTransport(options: LogstashHttpTransportOptions) {
  return new LogstashHttpTransport(options);
}

export class LogstashHttpTransport extends Writable {
  #url: URL;

  constructor(private options: LogstashHttpTransportOptions) {
    super();

    this.#url = new URL(`http://${options.host}:${options.port}`);
  }

  #sendRequest(data: JsonObject) {
    const payload = JSON.stringify(data);
    const createRequest = this.#url.protocol === 'https:' ? https.request : http.request;
    const extraHeaders = {};

    if (hasOwnProperty(this.options, 'username') && hasOwnProperty(this.options, 'password')) {
      const username = this.options.username!;
      const password = this.options.password!;
      const basicB64 = Buffer.from(`${username}:${password}`).toString('base64');
      extraHeaders['Authorization'] = `Basic ${basicB64}`;
    }

    const req = createRequest(
      {
        protocol: 'http:',
        method: 'POST',
        path: '/',
        port: this.options.port,
        host: this.options.host,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': payload.length,
          ...extraHeaders
        }
      },
      () => {
        // do something
      }
    );

    req.on('error', (error) => {
      throw error;
    });

    req.write(payload);
    req.end();
  }

  override _write(chunk: any, encoding: string, callback: (error?: Error | undefined | null) => void) {
    let data: JsonObject;
    if (encoding === 'buffer') {
      data = JSON.parse((chunk as Buffer).toString('utf-8'));
    } else {
      data = JSON.parse(chunk.toString());
    }

    const timestampKey = this.options.timestampKey ?? '@timestamp';
    const attributes = hasOwnProperty(this.options, 'attributes') ? this.options.attributes! : {};
    const sites = getCallSites().filter((s) => s.isNative() || !s.getFileName()?.startsWith('node:'));
    try {
      this.#sendRequest({
        [timestampKey]: new Date(data.time as number).toISOString(),
        '@version': 1,
        level: levels.labels[data.level as number],
        message: data.msg,
        hostname: data.hostname,
        logger: data.name,
        process: data.pid,
        file: {
          path: sites[sites.length - 1].getFileName(),
          function: sites[sites.length - 1].getFunctionName(),
          method: sites[sites.length - 1].getMethodName(),
          line: sites[sites.length - 1].getLineNumber() ?? 0,
          column: sites[sites.length - 1].getColumnNumber() ?? 0
        },
        ...attributes
      });

      callback();
    } catch (e) {
      callback(e as any);
    }
  }
}
