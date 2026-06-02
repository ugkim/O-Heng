<script setup>
import { computed, ref, watch } from 'vue'
import { findSprite } from '../data/spriteMap'

const props = defineProps({
  sprite: {
    type: Object,
    default: null,
  },
  spriteKey: {
    type: String,
    default: '',
  },
  frameIndex: {
    type: Number,
    default: 0,
  },
})

const naturalWidth = ref(0)
const naturalHeight = ref(0)

const spriteData = computed(() => props.sprite || findSprite(props.spriteKey))

const layout = computed(() => {
  const sprite = spriteData.value
  if (!sprite) return null

  const sourceWidth = sprite.sourceWidth || naturalWidth.value
  const sourceHeight = sprite.sourceHeight || naturalHeight.value
  const columns = sprite.columns || 1
  const rows = sprite.rows || 1
  const frameWidth = sprite.frameWidth || (sourceWidth ? sourceWidth / columns : 0)
  const frameHeight = sprite.frameHeight || (sourceHeight ? sourceHeight / rows : 0)

  if (!sourceWidth || !sourceHeight || !frameWidth || !frameHeight) return null

  return {
    sourceWidth,
    sourceHeight,
    columns,
    rows,
    frameCount: sprite.frameCount || columns * rows,
    frameWidth,
    frameHeight,
    renderWidth: sprite.renderWidth || frameWidth,
    renderHeight: sprite.renderHeight || frameHeight,
  }
})

const currentFrame = computed(() => {
  if (!layout.value) return 0
  return Math.max(0, props.frameIndex) % layout.value.frameCount
})

const rendererStyle = computed(() => {
  const sprite = spriteData.value
  const info = layout.value
  if (!sprite || !info) return {}

  const column = currentFrame.value % info.columns
  const row = Math.floor(currentFrame.value / info.columns)
  const scaleX = info.renderWidth / info.frameWidth
  const scaleY = info.renderHeight / info.frameHeight

  return {
    width: `${info.renderWidth}px`,
    height: `${info.renderHeight}px`,
    backgroundImage: `url("${sprite.src}")`,
    backgroundSize: `${info.sourceWidth * scaleX}px ${info.sourceHeight * scaleY}px`,
    backgroundPosition: `${-column * info.renderWidth}px ${-row * info.renderHeight}px`,
  }
})

function handleImageLoad(event) {
  const sprite = spriteData.value
  naturalWidth.value = event.target.naturalWidth
  naturalHeight.value = event.target.naturalHeight

  if (sprite?.autoDetectSize) {
    const columns = sprite.columns || 1
    const rows = sprite.rows || 1
    console.info('[SpriteRenderer]', props.spriteKey, {
      naturalWidth: naturalWidth.value,
      naturalHeight: naturalHeight.value,
      columns,
      rows,
      frameWidth: naturalWidth.value / columns,
      frameHeight: naturalHeight.value / rows,
    })
  }
}

watch(
  () => spriteData.value?.src,
  () => {
    naturalWidth.value = 0
    naturalHeight.value = 0
  },
)
</script>

<template>
  <span v-if="spriteData" class="sprite-renderer" :style="rendererStyle" aria-hidden="true">
    <img class="sprite-preload" :src="spriteData.src" alt="" @load="handleImageLoad" />
  </span>
</template>

<style scoped>
.sprite-renderer {
  display: inline-block;
  flex: none;
  overflow: hidden;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}

.sprite-preload {
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
}
</style>
