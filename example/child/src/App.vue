<template>
  <h1>Child Content</h1>
  <p>Async result: {{ result }}</p>
  <p>Error result: {{ err }}</p>
  <button @click.prevent="async">Click for Async</button>
  <button @click.prevent="sync">Click for Sync</button>
  <button @click.prevent="error">Click for Error</button>
  <p v-if="randomTip.length > 0">{{ randomTip }}</p>
</template>

<script lang="ts" setup>
import { useEmbed } from '@devlsh/embed';
import { ref } from 'vue';

import { rand } from './helpers';

const id = window.location.hash.substr(1);

const { send, post, handle } = useEmbed('client', {
  id: `shared-id-${id}`,
  remote: 'http://localhost:8000',
  debug: true,
});

const randomTip = ref('');
const result = ref('');
const err = ref('');

handle<{ tip: string }>('random-tip', async ({ tip }) => {
  randomTip.value = tip;
});

const async = async () => {
  try {
    const fetch = await send<string>('async', {
      dummy: 'lol 123',
    });

    result.value = fetch;
  } catch (e) {
    throw new Error(`Async fetch failed! ${e}`);
  }
};

const error = async () => {
  try {
    await send('err');
  } catch (e) {
    err.value = `${e}`;
  }
};

const sync = () => {
  post('dummy', rand(1, 100000));
};
</script>
