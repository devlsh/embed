<p align="center">
  <h1 align="center">@devlsh/embed</h1>
  <p align="center">Simple iFrame messaging for Vue.</p>
</p>

<br />

<p align="center">
  <a href="https://www.npmjs.com/package/@devlsh/embed" rel="nofollow">
    <img src="https://img.shields.io/npm/dm/%40devlsh%2Fembed?style=flat-square" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/devlsh/embed/stargazers" rel="nofollow">
    <img src="https://img.shields.io/github/stars/devlsh/embed?style=flat-square" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/devlsh/embed/actions/workflows/validate.yml" rel="nofollow">
    <img src="https://img.shields.io/github/actions/workflow/status/devlsh/embed/validate.yml?style=flat-square" alt="Build Status" />
  </a>
  <a href="https://github.com/devlsh/embed/blob/main/LICENSE" rel="nofollow">
    <img src="https://img.shields.io/github/license/devlsh/embed?style=flat-square" alt="Software License" />
  </a>
</p>

<br />

- Cross-origin iFrame IPC.
- Two-way messaging and async responses.
- The same API for parent and embedded pages.
- Multiple iframe connections on the same page.
- Vue 3 and TypeScript support.

<br />

## Installation

```bash
$ npm install @devlsh/embed
```

## Usage

Set up a host page at `https://example.com` and a client page at `https://frame.example.com`.

Use the same `id` in both components, otherwise they'll ignore eachothers messages.

### Shared

```typescript
import { type DefaultEventsMap } from '@devlsh/embed';

interface Yay {
  test: number;
}

export interface CustomEvents extends DefaultEventsMap {
  yay: (payload: Yay) => void;
}
```

### Host

```vue
<template>
  <iframe ref="iframe" src="https://frame.example.com" title="Client page" sandbox="allow-scripts allow-same-origin" />
</template>

<script setup lang="ts">
  import { useEmbed, type DefaultEventsMap } from '@devlsh/embed';
  import { shallowRef } from 'vue';

  const iframe = shallowRef<HTMLIFrameElement>();

  const host = useEmbed<CustomEvents>('host', {
    id: 'shared-id',
    iframe,
    remote: 'https://frame.example.com',
  });

  host.events.on('yay', (payload) => {
    console.log(payload);
  });

  onMounted(() => {
    void host.send<string>('hello-world', { hello: 'world' });
  });
</script>
```

### Client

```vue
<template>
  <button type="button" @click="submit">Send event</button>
</template>

<script setup lang="ts">
  import { useEmbed } from '@devlsh/embed';

  interface HelloWorld {
    hello: string;
  }

  const client = useEmbed<CustomEvents>('client', {
    id: 'shared-id',
    remote: 'https://example.com',
  });

  client.handle<HelloWorld>('hello-world', async ({ hello }) => {
    return hello === 'world' ? 'hey' : 'go away';
  });

  function submit() {
    client.post('yay', { test: 123 });
  }
</script>
```

### Options

| Option    | Type                                      | Default or required   | Description                                                                                                               |
| --------- | ----------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`      | `string`                                  | Required              | Shared connection ID for the host and client. Use a different ID for each iframe connection.                              |
| `timeout` | `number`                                  | `15000`               | Request timeout in milliseconds.                                                                                          |
| `iframe`  | Vue `Ref<HTMLIFrameElement \| undefined>` | Required in host mode | Reference to the host's iframe element.                                                                                   |
| `remote`  | `string`                                  | `'*'`                 | Remote origin for message checks and, when the target origin is readable, outgoing messages. See the security note below. |
| `debug`   | `boolean`                                 | `false`               | Enable debug logs for the connection.                                                                                     |

### Security Note

By default, if you don't supply a `remote`, the library will process all incoming messages and send events that any party can recieve. By setting this to a URL (See above example), you can limit this and hugely reduce the impact it has on security.

## Contributing

Report bugs through [issues](https://github.com/devlsh/embed/issues) or ask questions in [Discussions](https://github.com/devlsh/embed/discussions). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

For local development, pull requests, and other contributions, see the [Contributing Guidelines](CONTRIBUTING.md).

## License

`@devlsh/embed` is free and open-source software licensed under the [MIT License](LICENSE).

---

> [devlsh.com](https://devlsh.com) &nbsp;&middot;&nbsp;
> GitHub: [@devlsh](https://github.com/devlsh) &nbsp;&middot;&nbsp;
> X: [@itsdevlsh](https://x.com/itsdevlsh)
