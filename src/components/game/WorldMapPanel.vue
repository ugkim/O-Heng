<script setup>
defineProps({
  regions: {
    type: Array,
    required: true,
  },
  currentMapKey: {
    type: String,
    default: '',
  },
})

defineEmits(['travel'])
</script>

<template>
  <div class="world-map-panel">
    <button
      v-for="region in regions"
      :key="region.id"
      class="region-button"
      :class="{ locked: !region.unlocked, current: currentMapKey === region.mapKey }"
      type="button"
      :disabled="!region.unlocked"
      @click="$emit('travel', region)"
    >
      <span>{{ region.name }}</span>
      <small>{{ region.unlocked ? (region.visited ? '방문함' : '미방문') : '잠김' }}</small>
    </button>
  </div>
</template>
