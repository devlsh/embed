<script setup lang="ts">
  import { useEmbed } from '../../../src/index';
  import { onUnmounted, ref } from 'vue';
  import { type DemoEvents } from '../types';

  interface RandomTip {
    tip: string;
  }

  const props = defineProps<{ id: string }>();

  const client = useEmbed<DemoEvents>('client', {
    id: props.id,
    remote: location.origin,
    debug: true,
  });

  const randomTip = ref('');

  const result = ref('');

  const err = ref('');

  client.handle<RandomTip>('random-tip', async (payload) => {
    randomTip.value = payload.tip;
  });

  async function requestAsync() {
    try {
      result.value = await client.send('async', { dummy: 'lol 123' });
    } catch (error) {
      err.value = String(error);
    }
  }

  function postSync() {
    client.post('dummy', Math.floor(Math.random() * 100000) + 1);
  }

  async function requestError() {
    try {
      await client.send('err');
    } catch (error) {
      err.value = String(error);
    }
  }

  onUnmounted(() => {
    client.destroy();
  });
</script>

<template>
  <h1>Child Content</h1>
  <p>Async result: {{ result }}</p>
  <p>Error result: {{ err }}</p>
  <button type="button" @click="requestAsync">Click for Async</button>
  <button type="button" @click="postSync">Click for Sync</button>
  <button type="button" @click="requestError">Click for Error</button>
  <p v-if="randomTip.length > 0">{{ randomTip }}</p>
</template>
