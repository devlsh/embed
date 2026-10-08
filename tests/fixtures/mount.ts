import { createApp } from 'vue';
import Client from './Client.vue';

const params = new URL(location.href).searchParams;

const id = params.get('id');

const parent = params.get('parent');

if (!id || !parent) {
  throw new Error('Client requires an ID and Parent');
}

const app = createApp(Client, {
  id,
  parent,
});

app.mount('#app');

window.addEventListener(
  'pagehide',
  () => {
    app.unmount();
  },
  { once: true },
);
