<div align="center">
  <a href="https://www.npmjs.com/package/@devlsh/embed" target="_blank">
    <img src="https://img.shields.io/npm/v/@devlsh/embed?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/1000565079789535324?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@devlsh/embed?style=flat-square" alt="GPL-3.0-only" />
  <h3>Embedded iFrame IPC for Vue 3</h3>
</div>

`@devlsh/embed` provides a single Vue 3 hook which can be used to communicate between an iFrame and its parent via `postMessage` IPC.

- `sync`/`async` messaging/responses
- Configurable timeouts
- Bi-directional communication
- Cross-origin support
- Same usage/API for both Host & Client
- Support for enforcing origins for increased security
- No limit to number of instances you can use/create at any given time
- TypeScript
- Tiny (1.73kb)

## Installation

Install Embed with a compatible Vue peer:

```bash
yarn add @devlsh/embed vue@^3.3.8

# or

npm install @devlsh/embed vue@^3.3.8
```

## Usage

For this example, we'll assume the `host` is a webpage (`example.com`) and the `client` is a webpage embedded in an iFrame
(`frame.example.com`). The only difference between a `host` and a `client` is that the `host` requires an iFrame `ref` for binding and
sending the messages.

```vue
/** * Host */
<template>
  <iframe src="https://frame.example.com" ref="iframe" sandbox="allow-scripts" />
</template>

<script lang="ts" setup>
import { useEmbed } from '@devlsh/embed';
import { onMounted, ref } from 'vue';

const iframe = ref<HTMLIFrameElement>();

const { send, events } = useEmbed('host', {
  id: 'shared-id',
  iframe,
  remote: 'https://frame.example.com',
});

// Listen for any synchronous events being emitted over IPC
events.on('yay', payload => {
  console.log(payload);
});

onMounted(async () => {
  // Send an event to the iFrame and wait for a response.
  const response = await send('hello-world', {
    hello: 'world',
  });
});
</script>

/** * Client */
<template>
  <button @click.prevent="submit">Click me!</button>
</template>

<script lang="ts" setup>
import { useEmbed } from '@devlsh/embed';

const { handle, post } = useEmbed('client', {
  id: 'shared-id',
  remote: 'https://example.com',
});

// Resolves incoming (a)synchronous operations.
handle('hello-world', async payload => {
  if (payload.hello === 'world') {
    return 'hey';
  }

  return 'go away';
});

const submit = () => {
  // Send a synchronous event to the host
  post('yay', { test: 123 });
};
</script>
```

This example shows:

- Initializing the Host and Client
- Sending and waiting for asynchronous events
- Sending and receiving synchronous events

Since communication is bi-directional, you can use **any of the methods on either Host or Client**. For example, asynchronous operations
aren't limited to Host -> Client, the Client can also call asynchronous operations and the Host can register handlers/resolvers.

| **Option** | **Default**             | **Type**                              | **Description**                                                                           |
| ---------- | ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`       | **[Required]**          | `string`                              | The Host and Client that you want to talk to each other should share the \_same\_ ID.     |
| `timeout`  | `15000`                 | `number`                              | Configures the global timeout for all asynchronous operations against this ID pair.       |
| `iframe`   | **[Required for Host]** | `Ref<HTMLIFrameElement \| undefined>` | A Vue 3 `ref` for a Template reference.                                                   |
| `remote`   | `*`                     | `string`                              | A remote URL to limit who can recieve/process Events over this Host/Client pair.          |
| `debug`    | `false`                 | `boolean`                             | Whether to print Debug messages to the console, providing an overview of the IPC process. |

### Security Note

By default, if you don't supply a `remote`, the library will process **all** incoming messages and send events that **any** party can
recieve. By setting this to a URL (See above example), you can limit this and hugely reduce the impact it has on security.

## Legacy logger compatibility

Embed 1.3.0 intentionally depends on `@devlsh/logger` `^1.1.0`, not Logger 3.x. This is a temporary compatibility choice that preserves the
public `Context.logger` API, including `useLogger()` and the legacy `group(message, context?, collapsed?, level?, prefix?)` argument order.
The compatible Logger 1.1.0 release repairs declaration imports without changing its runtime. Vue `^3.3.8` is a peer dependency;
`nanoevents` remains a runtime and declaration dependency.

Keep `@devlsh/logger` on the compatible 1.x API until a separate public API migration is approved. Do not substitute Logger 3.x:
`Context.logger` exposes the legacy logger, including `useLogger()` and `group(message, context?, collapsed?, level?, prefix?)`.

The `main` and `module` fields retain the existing CommonJS and ESM entrypoints. CommonJS loading of the legacy ESM logger is checked on
Node 24.20.0; older Node versions have not been checked.

Original Evil Kiwi authorship and the GPL-3.0-only license are preserved. The Discord link above remains the existing community link, not a
new devlsh community.
