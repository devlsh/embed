<script setup lang="ts">
  import { useEmbed } from '../../../src/index';
  import { onUnmounted, reactive, shallowRef, type ComponentPublicInstance } from 'vue';
  import { type DemoEvents } from '../types';

  interface AsyncRequest {
    dummy: string;
  }

  const props = defineProps<{ number: 1 | 2 }>();

  const iframe = shallowRef<HTMLIFrameElement>();

  const state = reactive({
    loading: false,
    tipError: '',
    lastDummy: '',
    countdown: 0,
  });

  const id = `shared-id-${props.number}`;

  const url = new URL(location.pathname, location.origin);

  url.searchParams.set('child', id);

  const host = useEmbed<DemoEvents>('host', {
    id,
    iframe,
    remote: location.origin,
    timeout: 15000,
    debug: true,
  });

  const pending = new Set<() => void>();

  host.events.on('dummy', (payload) => {
    state.lastDummy = String(payload);
  });

  host.handle('err', async () => {
    throw new Error('Some random error');
  });

  host.handle<AsyncRequest>('async', async (payload) => {
    state.lastDummy = payload.dummy;
    state.countdown = 5;

    return new Promise<string>((resolve, reject) => {
      let remaining = 5;

      const interval = window.setInterval(() => {
        remaining -= 1;
        state.countdown = remaining;

        if (remaining === 0) {
          window.clearInterval(interval);
          pending.delete(cancel);
          resolve('Hello world!');
        }
      }, 1000);

      function cancel() {
        window.clearInterval(interval);
        pending.delete(cancel);
        reject(new Error('Parent Content was unmounted.'));
      }

      pending.add(cancel);
    });
  });

  async function sendTip() {
    state.loading = true;
    state.tipError = '';

    try {
      await host.send('random-tip', { tip: `Penguins are cool ${props.number}` });
    } catch (error) {
      state.tipError = String(error);
    } finally {
      state.loading = false;
    }
  }

  onUnmounted(() => {
    for (const cancel of pending) {
      cancel();
    }

    host.destroy();
  });

  function setFrame(element: Element | ComponentPublicInstance | null) {
    iframe.value = element instanceof HTMLIFrameElement ? element : undefined;
  }
</script>

<template>
  <div class="col">
    <h1>Parent Content {{ props.number }}</h1>
    <p>Last dummy text: {{ state.lastDummy }}</p>
    <div class="button">
      <button type="button" :disabled="state.loading" @click="sendTip">
        {{ props.number === 1 ? 'Trigger Random Tip' : 'Trigger Random Tip 2' }}
      </button>
    </div>
    <p v-if="state.tipError">Tip request failed: {{ state.tipError }} Try again.</p>
    <iframe
      :ref="setFrame"
      :src="url.href"
      :title="`Child Content ${props.number}`"
      sandbox="allow-scripts allow-same-origin"
    />
    <p v-if="state.countdown > 0">Waiting to response... {{ state.countdown }}s</p>
  </div>
</template>
