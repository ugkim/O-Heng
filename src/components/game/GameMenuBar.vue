<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
  meta: {
    type: Object,
    required: true,
  },
  activeKey: {
    type: String,
    default: '',
  },
})

defineEmits(['select'])
</script>

<template>
  <nav class="game-menu-bar" aria-label="게임 메뉴">
    <button
      v-for="item in items"
      :key="item"
      class="game-menu-button"
      :class="{ active: activeKey === item }"
      type="button"
      :aria-label="meta[item]?.label || item"
      @click="$emit('select', item)"
    >
      <span aria-hidden="true">{{ meta[item]?.icon || '•' }}</span>
    </button>
  </nav>
</template>
