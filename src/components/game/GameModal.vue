<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})

defineEmits(['close'])
</script>

<template>
  <div class="game-modal-layer" role="presentation" @click.self="$emit('close')">
    <section class="game-modal" role="dialog" aria-modal="true" :aria-label="title">
      <header class="game-modal-header">
        <h2>{{ title }}</h2>
        <button class="game-modal-close" type="button" aria-label="닫기" @click="$emit('close')">
          ×
        </button>
      </header>
      <div class="game-modal-body">
        <slot />
      </div>
    </section>
  </div>
</template>
