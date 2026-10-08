<script setup lang="ts">
  import Child from './child/Child.vue';
  import Parent from './parent/Parent.vue';

  const child = new URLSearchParams(location.search).get('child');
</script>

<template>
  <Child v-if="child" :id="child" />
  <Parent v-else />
</template>
