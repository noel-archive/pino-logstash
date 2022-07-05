# 🌲 Pino Transport for Logstash

> _Pino transport to log data into Logstash via HTTP, TCP, or UDP._

**@noelware/pino-logstash** is a library to pipe [Pino](https://npm.im/pino) into a Logstash instance using the [HTTP input plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-http.html), [TCP input plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-tcp.html), or [UDP input plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-udp.html).

## Usage

```typescript
import { createTcpTransport, createUdpTransport, createHttpTransport } from '@noelware/pino-logstash';
import pino from 'pino';

const log = pino({ level: 'info' }, [
  {
    stream: createTcpTransport({
      host: 'localhost',
      port: 4040
    })
  },
  {
    stream: createUdpTransport({
      host: 'localhost',
      port: 6654
    })
  },
  {
    stream: createHttpTransport({
      host: 'localhost',
      port: 9210,
      sername: 'myuser',
      password: 'mypass'
    })
  }
]);
```

At the moment, using SSL with the HTTP input plugin via **@noelware/pino-transport** is not supported.

## License

**@noelware/pino-transport** is released under the **MIT License** by Noelware.
