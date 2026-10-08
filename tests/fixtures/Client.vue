<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useEmbed } from '../../src/index';
  import { type Events, type History, type Reply, type Request } from '../helpers/contracts';
  import { work } from '../helpers/work';

  const props = defineProps<{ id: string; parent: string }>();

  const client = useEmbed<Events>('client', {
    id: props.id,
    remote: props.parent,
    timeout: 200,
  });

  const payload = ref('child notice');

  const notices: unknown[] = [];

  let reads = 0;

  const tasks = work();

  client.handle<Request>('calculate', async ({ value }) => `child:${value + 11}`);

  const unsubscribe = client.events.on('notice', (value) => {
    notices.push(value);

    // Record child Error decoding before the return transport can decode it again.
    const receipt: Parameters<Events['received']>[0] =
      value instanceof Error
        ? {
            isError: true,
            message: value.message,
          }
        : value;

    client.post('received', receipt);
  });

  client.handle('history', async () => {
    reads += 1;

    return {
      notices,
      reads,
    };
  });

  const removeHandler = client.handle('removable', async () => 'child removable');

  client.handle('failure', async () => {
    throw new Error('Child refused request');
  });

  client.handle<Request>('concurrent', async ({ value }) => {
    await tasks.wait(value === 2 ? 40 : 0);

    return `child:${value + 11}`;
  });

  client.handle('stall', async () => tasks.wait());

  client.handle('recover', async () => {
    tasks.dispose();

    return 'child recovered';
  });

  async function request() {
    const value = await client.send<string>('calculate', { value: 5 });
    client.post('result', value);
  }

  async function concurrent() {
    const completion: string[] = [];

    const values = await Promise.all(
      [2, 9].map(async (value) => {
        const result = await client.send<string>('concurrent', { value });
        completion.push(result);

        return result;
      }),
    );

    client.post('result', {
      values,
      completion,
    });
  }

  async function requestError(type: string) {
    try {
      const value = await client.send<Reply>(type);
      client.post('result', value);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      client.post('failure', error);
    }
  }

  async function timeout() {
    await requestError('stall');
    client.post('result', await client.send<string>('recover'));
  }

  async function post() {
    client.post('notice', payload.value);
    const value = await client.send<History>('history');
    client.post('result', value);
  }

  async function postFalsy() {
    for (const value of [0, false, '']) {
      client.post('notice', value);
    }

    client.post('result', await client.send<History>('history'));
  }

  async function postObject() {
    client.post('notice', { nested: ['value', 4] });
    client.post('result', await client.send<History>('history'));
  }

  function postError() {
    client.post('notice', new Error('Child event error'));
  }

  function unserializable() {
    try {
      client.post('notice', 1n);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      client.post('failure', error);
    }
  }

  function rejectedPackets() {
    // Native packets retain the browser's origin and source. The second packet
    // completes the same sender-to-parent queue before the test checks rejection.
    for (const value of ['rejected notice', 'rejection barrier']) {
      window.parent.postMessage(
        {
          id: props.id,
          type: 'notice',
          payload: value,
        },
        props.parent,
      );
    }
  }

  onMounted(() => {
    client.post('ready', location.origin);
  });

  onUnmounted(() => {
    tasks.dispose();
    client.destroy();
  });
</script>

<template>
  <label>Child payload<input v-model="payload" /></label>
  <button type="button" @click="request">Child request</button>
  <button type="button" @click="concurrent">Child concurrent</button>
  <button type="button" @click="requestError('failure')">Child error</button>
  <button type="button" @click="timeout">Child timeout</button>
  <button type="button" @click="post">Child post</button>
  <button type="button" @click="postFalsy">Child falsy values</button>
  <button type="button" @click="postObject">Child object</button>
  <button type="button" @click="postError">Child event error</button>
  <button type="button" @click="unserializable">Child unserializable</button>
  <button type="button" @click="rejectedPackets">Send rejected packets</button>
  <button type="button" @click="removeHandler">Remove child handler</button>
  <button type="button" @click="requestError('removable')">Request host handler</button>
  <button type="button" @click="unsubscribe">Unsubscribe child</button>
</template>
