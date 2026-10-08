<script setup lang="ts">
  import Channel from './Channel.vue';
</script>

<template>
  <div class="parent">
    <Channel :number="1" />
    <Channel :number="2" />
  </div>
</template>
