<template>
  <div class="col">
    <h1>Parent Content 1</h1>
    <p>Last dummy text: {{ lastDummy1 }}</p>
    <div class="button">
      <button :disabled="loadingRandom1" @click.prevent="random1">Trigger Random Tip</button>
    </div>
    <iframe src="http://localhost:8001#1" ref="iframe1" sandbox="allow-scripts allow-same-origin" />
    <p v-if="countdown1 > 0">Waiting to response... {{ countdown1 }}s</p>
  </div>
  <div class="col">
    <h1>Parent Content 2</h1>
    <p>Last dummy text: {{ lastDummy2 }}</p>
    <div class="button">
      <button :disabled="loadingRandom2" @click.prevent="random2">Trigger Random Tip 2</button>
    </div>
    <iframe src="http://localhost:8001#2" ref="iframe2" sandbox="allow-scripts allow-same-origin" />
    <p v-if="countdown2 > 0">Waiting to response... {{ countdown2 }}s</p>
  </div>
</template>

<script lang="ts" setup>
import { useEmbed } from '@devlsh/embed';
import { ref } from 'vue';

let interval1: number | undefined;
let interval2: number | undefined;

const iframe1 = ref<InstanceType<typeof HTMLIFrameElement>>();
const iframe2 = ref<InstanceType<typeof HTMLIFrameElement>>();
const loadingRandom1 = ref(false);
const loadingRandom2 = ref(false);
const countdown1 = ref(0);
const countdown2 = ref(0);
const lastDummy1 = ref('');
const lastDummy2 = ref('');

const {
  handle: handle1,
  events: events1,
  send: send1,
} = useEmbed<{
  dummy: (num: number) => void;
}>('host', {
  id: 'shared-id-1',
  iframe: iframe1,
  remote: 'http://localhost:8001',
  timeout: 15000,
  debug: true,
});

const {
  handle: handle2,
  events: events2,
  send: send2,
} = useEmbed<{
  dummy: (num: number) => void;
}>('host', {
  id: 'shared-id-2',
  iframe: iframe2,
  remote: 'http://localhost:8001',
  timeout: 15000,
  debug: true,
});

const random1 = async () => {
  loadingRandom1.value = true;

  await send1('random-tip', {
    tip: 'Penguins are cool 1',
  });

  loadingRandom1.value = false;
};
const random2 = async () => {
  loadingRandom2.value = true;

  await send2('random-tip', {
    tip: 'Penguins are cool 2',
  });

  loadingRandom2.value = false;
};

events1.on('dummy', num => {
  lastDummy1.value = `${num}`;
});

events2.on('dummy', num => {
  lastDummy2.value = `${num}`;
});

handle1('err', async () => {
  throw new Error('Some random error');
});

handle2('err', async () => {
  throw new Error('Some random error');
});

handle1<{ dummy: string }>('async', async payload => {
  lastDummy1.value = payload.dummy;
  countdown1.value = 5;

  return new Promise<string>((resolve, reject) => {
    interval1 = setInterval(() => {
      countdown1.value -= 1;

      if (countdown1.value === 0) {
        clearInterval(interval1);
        resolve('Hello world!');
      }
    }, 1000);
  });
});

handle2<{ dummy: string }>('async', async payload => {
  lastDummy2.value = payload.dummy;
  countdown2.value = 5;

  return new Promise<string>((resolve, reject) => {
    interval2 = setInterval(() => {
      countdown2.value -= 1;

      if (countdown2.value === 0) {
        clearInterval(interval2);
        resolve('Hello world!');
      }
    }, 1000);
  });
});
</script>

<style>
html,
body {
  height: 100%;
  padding: 0;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: row;
  height: calc(100% - 40px);
  padding: 20px;
}

.col {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  margin-left: 20px;
}

.col:first-child {
  margin-left: 0;
}

.button {
  margin-bottom: 20px;
}

iframe {
  flex-grow: 1;
  flex-shrink: 1;
}
</style>
