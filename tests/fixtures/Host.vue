<script setup lang="ts">
  import { onUnmounted, ref, shallowRef, type ComponentPublicInstance } from 'vue';
  import { useEmbed } from '../../src/index';
  import { type Events, type History, type Request } from '../helpers/contracts';
  import { work } from '../helpers/work';

  const props = defineProps<{ id: string; crossOrigin?: boolean; rejectionProbe?: 'origin' | 'source' }>();

  const emit = defineEmits<{
    'host-result': [value: unknown];
    'child-result': [value: unknown];
    notice: [value: unknown];
    'child-notice': [value: unknown];
    history: [value: History];
    packet: [value: { payload: string; origin: string; expectedSource: boolean; trusted: boolean }];
  }>();

  const iframe = shallowRef<HTMLIFrameElement>();

  const origin = ref('');

  const loaded = ref(false);

  const payload = ref('host notice');

  const notices: unknown[] = [];

  let reads = 0;

  const tasks = work();

  const url = new URL('/tests/fixtures/client.html', location.origin);

  if (props.crossOrigin) {
    url.hostname = 'localhost';
  }

  url.searchParams.set('id', props.id);

  url.searchParams.set('parent', location.origin);

  const frameURL = ref(url.href);

  const host = useEmbed<Events>('host', {
    id: props.id,
    iframe,
    remote: url.origin,
    timeout: 200,
  });

  function observePacket(event: MessageEvent<unknown>) {
    const packet = event.data;

    if (
      // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Native message boundary validates the complete probe packet before use.
      typeof packet !== 'object' ||
      packet === null ||
      !('id' in packet) ||
      packet.id !== props.id ||
      !('type' in packet) ||
      packet.type !== 'notice' ||
      !('payload' in packet) ||
      (packet.payload !== 'rejected notice' && packet.payload !== 'rejection barrier')
    ) {
      return;
    }

    emit('packet', {
      payload: packet.payload,
      origin: event.origin,
      expectedSource: event.source === iframe.value?.contentWindow,
      trusted: event.isTrusted,
    });
  }

  window.addEventListener('message', observePacket);

  function navigateClient(rejected: boolean) {
    const destination = new URL(url);
    destination.hostname = rejected ? 'localhost' : location.hostname;
    origin.value = '';
    loaded.value = false;
    frameURL.value = destination.href;
  }

  host.events.on('ready', (value) => {
    origin.value = value;
  });

  host.events.on('_loaded', () => {
    loaded.value = true;
  });

  host.events.on('result', (value) => {
    emit('child-result', value);
  });

  host.events.on('failure', (error) => {
    emit('child-result', error);
  });

  host.events.on('received', (value) => {
    emit('child-notice', value);
  });

  host.handle<Request>('calculate', async ({ value }) => `host:${value * 3}`);

  const unsubscribe = host.events.on('notice', (value) => {
    notices.push(value);
    emit('notice', value);
  });

  host.handle('history', async () => {
    reads += 1;

    return {
      notices,
      reads,
    };
  });

  const removeHandler = host.handle('removable', async () => 'host removable');

  host.handle('failure', async () => {
    throw new Error('Host refused request');
  });

  host.handle<Request>('concurrent', async ({ value }) => {
    await tasks.wait(value === 2 ? 40 : 0);

    return `host:${value * 3}`;
  });

  host.handle('stall', async () => tasks.wait());

  host.handle('recover', async () => {
    tasks.dispose();

    return 'host recovered';
  });

  async function request() {
    emit('host-result', await host.send<string>('calculate', { value: 7 }));
  }

  async function concurrent() {
    const completion: string[] = [];

    const values = await Promise.all(
      [2, 9].map(async (value) => {
        const result = await host.send<string>('concurrent', { value });
        completion.push(result);

        return result;
      }),
    );

    emit('host-result', {
      values,
      completion,
    });
  }

  async function requestError(type: string) {
    try {
      emit('host-result', await host.send<unknown>(type));
    } catch (error) {
      emit('host-result', error);
    }
  }

  async function timeout() {
    await requestError('stall');
    emit('host-result', await host.send<unknown>('recover'));
  }

  async function post() {
    host.post('notice', payload.value);
    emit('history', await host.send<History>('history'));
  }

  async function postFalsy() {
    for (const value of [0, false, '']) {
      host.post('notice', value);
    }

    emit('history', await host.send<History>('history'));
  }

  async function postObject() {
    host.post('notice', { nested: ['value', 4] });
    emit('history', await host.send<History>('history'));
  }

  function postError() {
    host.post('notice', new Error('Host event error'));
  }

  function unserializable() {
    try {
      host.post('notice', 1n);
    } catch (error) {
      emit('host-result', error);
    }
  }

  function setFrame(element: Element | ComponentPublicInstance | null) {
    iframe.value = element instanceof HTMLIFrameElement ? element : undefined;
  }

  onUnmounted(() => {
    window.removeEventListener('message', observePacket);
    tasks.dispose();
    host.destroy();
  });
</script>

<template>
  <section :aria-label="`Host ${props.id}`">
    <output role="status" aria-label="Ready origin">{{ loaded ? origin : '' }}</output>
    <label>Host payload<input v-model="payload" /></label>
    <button type="button" @click="request">Host request</button>
    <button type="button" @click="concurrent">Host concurrent</button>
    <button type="button" @click="requestError('failure')">Host error</button>
    <button type="button" @click="timeout">Host timeout</button>
    <button type="button" @click="post">Host post</button>
    <button type="button" @click="postFalsy">Host falsy values</button>
    <button type="button" @click="postObject">Host object</button>
    <button type="button" @click="postError">Host event error</button>
    <button type="button" @click="unserializable">Host unserializable</button>
    <button type="button" @click="removeHandler">Remove host handler</button>
    <button type="button" @click="requestError('removable')">Request child handler</button>
    <button type="button" @click="unsubscribe">Unsubscribe host</button>
    <button v-if="props.rejectionProbe === 'origin'" type="button" @click="navigateClient(true)">
      Navigate to rejected origin
    </button>
    <button v-if="props.rejectionProbe === 'origin'" type="button" @click="navigateClient(false)">
      Restore allowed origin
    </button>
    <iframe :ref="setFrame" :src="frameURL" :title="`Client ${props.id}`" />
    <iframe v-if="props.rejectionProbe === 'source'" :src="url.href" :title="`Other client ${props.id}`" />
  </section>
</template>
