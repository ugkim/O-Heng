<script setup>
import { computed } from 'vue'
import AvatarRenderer from '../AvatarRenderer.vue'
import SpriteRenderer from '../SpriteRenderer.vue'
import { elements } from '../../data/elements'
import { jobs } from '../../data/jobs'
import { getCharacterSpriteKey } from '../../data/spriteMap'
import { getExpToNextLevel } from '../../game/systems/levelSystem'

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
  availableElementPoints: {
    type: Number,
    default: 0,
  },
  spendingElementKey: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
})

defineEmits(['spend'])

const selectedSpriteKey = computed(() => getCharacterSpriteKey(props.character))
const expToNextLevel = computed(() => getExpToNextLevel(props.character.level || 1))
</script>

<template>
  <div class="stats-panel">
    <div class="stats-hero">
      <AvatarRenderer
        v-if="character.equipped_avatar"
        :appearance="character.appearance"
        :equipped-avatar="character.equipped_avatar"
        size="small"
      />
      <SpriteRenderer v-else-if="selectedSpriteKey" :sprite-key="selectedSpriteKey" :frame-index="0" />
      <div>
        <strong>{{ character.name }}</strong>
        <span>{{ jobs[character.job]?.label || character.job }}</span>
      </div>
    </div>

    <div class="rpg-stat-list">
      <div><span>레벨</span><strong>{{ character.level }}</strong></div>
      <div><span>경험치</span><strong>{{ character.exp }} / {{ expToNextLevel }}</strong></div>
      <div><span>골드</span><strong>{{ character.gold }} G</strong></div>
      <div><span>HP</span><strong>{{ character.hp ?? stats.maxHp }} / {{ stats.maxHp }}</strong></div>
      <div><span>MP</span><strong>{{ character.mp ?? stats.maxMp }} / {{ stats.maxMp }}</strong></div>
      <div><span>공격력</span><strong>{{ stats.attack }}</strong></div>
      <div><span>방어력</span><strong>{{ stats.defense }}</strong></div>
      <div><span>민첩</span><strong>{{ stats.dex }}</strong></div>
    </div>

    <div class="element-section">
      <div class="section-title">
        <span>오행 포인트</span>
        <strong>{{ availableElementPoints }}</strong>
      </div>
      <dl class="modal-elements">
        <div v-for="(element, key) in elements" :key="key">
          <dt>{{ element.label }}</dt>
          <dd>{{ character.elements?.[key] ?? 0 }}</dd>
          <button
            type="button"
            :disabled="availableElementPoints <= 0 || spendingElementKey === key"
            :aria-label="`${element.label} 오행 포인트 사용`"
            @click="$emit('spend', key)"
          >
            +
          </button>
        </div>
      </dl>
      <p v-if="message" class="element-message">{{ message }}</p>
    </div>
  </div>
</template>
