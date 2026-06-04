<script setup>
import { ref } from 'vue'

defineProps({
  characterGold: {
    type: Number,
    default: 0,
  },
  shopItems: {
    type: Array,
    required: true,
  },
  bestiary: {
    type: Array,
    required: true,
  },
  achievements: {
    type: Array,
    required: true,
  },
})

const activeSection = ref('shop')
const bgmVolume = ref(70)
const sfxVolume = ref(80)
const vibration = ref(true)
const effects = ref(true)
const fpsLimit = ref('60')

const sections = [
  { key: 'shop', label: '상점' },
  { key: 'bestiary', label: '도감' },
  { key: 'achievements', label: '업적' },
  { key: 'settings', label: '설정' },
]
</script>

<template>
  <div class="system-menu-panel">
    <div class="rpg-tabs four" role="tablist" aria-label="하위 메뉴">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        :class="{ active: activeSection === section.key }"
        @click="activeSection = section.key"
      >
        {{ section.label }}
      </button>
    </div>

    <section v-if="activeSection === 'shop'" class="shop-panel">
      <div class="gold-strip">보유 골드 <strong>{{ characterGold }} G</strong></div>
      <article v-for="item in shopItems" :key="item.id" class="shop-item">
        <span class="shop-icon">{{ item.icon }}</span>
        <div>
          <strong>{{ item.name }}</strong>
          <small>구매 {{ item.price }}G · 판매 {{ item.sellPrice }}G</small>
        </div>
        <div class="shop-actions">
          <button type="button">구매</button>
          <button type="button">판매</button>
        </div>
      </article>
    </section>

    <section v-else-if="activeSection === 'bestiary'" class="collection-list">
      <article v-for="entry in bestiary" :key="entry.id" :class="{ muted: !entry.discovered }">
        <span>{{ entry.icon }}</span>
        <div>
          <strong>{{ entry.name }}</strong>
          <small>{{ entry.current }} / {{ entry.required }}</small>
        </div>
      </article>
    </section>

    <section v-else-if="activeSection === 'achievements'" class="achievement-list">
      <article v-for="achievement in achievements" :key="achievement.id">
        <div>
          <strong>{{ achievement.title }}</strong>
          <small>보상 {{ achievement.reward }}</small>
        </div>
        <button type="button" :disabled="!achievement.completed">받기</button>
      </article>
    </section>

    <section v-else class="settings-panel">
      <label>
        <span>BGM 볼륨</span>
        <input v-model="bgmVolume" type="range" min="0" max="100" />
      </label>
      <label>
        <span>효과음 볼륨</span>
        <input v-model="sfxVolume" type="range" min="0" max="100" />
      </label>
      <label class="switch-row">
        <span>진동</span>
        <input v-model="vibration" type="checkbox" />
      </label>
      <label class="switch-row">
        <span>이펙트</span>
        <input v-model="effects" type="checkbox" />
      </label>
      <div class="fps-options" role="radiogroup" aria-label="FPS 제한">
        <button
          v-for="option in ['30', '60', 'unlimited']"
          :key="option"
          type="button"
          :class="{ active: fpsLimit === option }"
          @click="fpsLimit = option"
        >
          {{ option === 'unlimited' ? '무제한' : option }}
        </button>
      </div>
    </section>
  </div>
</template>
