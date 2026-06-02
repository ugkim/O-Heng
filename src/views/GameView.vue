<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import SpriteRenderer from '../components/SpriteRenderer.vue'
import { elements } from '../data/elements'
import { jobs } from '../data/jobs'
import { getCharacterSpriteKey } from '../data/spriteMap'
import { calculateCharacterStats, getPersistableCharacterStats } from '../game/data/characterStats'
import { DEFAULT_MAP_KEY, getMapDefinition } from '../game/data/maps'
import { createPhaserGame } from '../game/phaserGame'
import { updateCharacterState, useElementPoint } from '../services/characterService'
import { fetchMapByKey } from '../services/mapService'
import {
  getSelectedCharacter,
  getStoredAccount,
  storeSelectedCharacter,
} from '../services/sessionService'

const gameContainer = ref(null)
const selectedCharacter = ref(getSelectedCharacter())
const account = ref(getStoredAccount())
const isCharacterHudOpen = ref(true)
const spendingElementKey = ref('')
const elementSpendMessage = ref('')
const selectedSpriteKey = computed(() =>
  selectedCharacter.value ? getCharacterSpriteKey(selectedCharacter.value) : '',
)
const availableElementPoints = computed(() => selectedCharacter.value?.element_points ?? 0)
const characterStats = computed(() =>
  selectedCharacter.value ? calculateCharacterStats(selectedCharacter.value) : null,
)
let phaserGame = null
let handleCharacterUpdated = null

function sendGameControl(type, control) {
  // 모바일 터치 UI는 Vue 영역에 두고, Phaser에는 커스텀 이벤트만 전달한다.
  // 이렇게 분리하면 나중에 게임패드, 스킬 버튼, 퀵슬롯도 Vue UI로 확장하기 쉽다.
  window.dispatchEvent(
    new CustomEvent('rpg-control', {
      detail: { type, control },
    }),
  )
}

function startControl(control) {
  sendGameControl('start', control)
}

function endControl(control) {
  sendGameControl('end', control)
}

function attack() {
  sendGameControl('attack', 'attack')
}

async function spendElementPoint(elementKey) {
  if (!account.value?.id || !selectedCharacter.value?.id || availableElementPoints.value <= 0) return

  spendingElementKey.value = elementKey
  elementSpendMessage.value = ''

  try {
    const pointUpdatedCharacter = await useElementPoint({
      accountId: account.value.id,
      characterId: selectedCharacter.value.id,
      elementKey,
    })
    const nextStats = getPersistableCharacterStats(pointUpdatedCharacter)
    const updatedCharacter = await updateCharacterState({
      accountId: account.value.id,
      character: {
        ...pointUpdatedCharacter,
        hp: Math.min(pointUpdatedCharacter.hp ?? nextStats.max_hp, nextStats.max_hp),
        max_hp: nextStats.max_hp,
        mp: Math.min(pointUpdatedCharacter.mp ?? nextStats.max_mp, nextStats.max_mp),
        max_mp: nextStats.max_mp,
        attack: nextStats.attack,
        defense: nextStats.defense,
        dex: nextStats.dex,
      },
    })

    selectedCharacter.value = {
      ...selectedCharacter.value,
      ...updatedCharacter,
    }
    storeSelectedCharacter(selectedCharacter.value)
    window.dispatchEvent(
      new CustomEvent('character-updated', {
        detail: { character: selectedCharacter.value },
      }),
    )
    elementSpendMessage.value = '오행 포인트를 사용했습니다.'
  } catch (error) {
    console.error('오행 포인트 사용 실패:', error)
    elementSpendMessage.value = '오행 포인트 사용에 실패했습니다.'
  } finally {
    spendingElementKey.value = ''
  }
}

onMounted(async () => {
  // Vue 컴포넌트가 실제 DOM에 마운트된 뒤 Phaser 캔버스를 붙인다.
  // parent에는 HTMLElement를 직접 넘겨 Vue 라우터 화면 안에 캔버스가 생성되도록 한다.
  let initialMapData = getMapDefinition(DEFAULT_MAP_KEY)

  try {
    initialMapData = await fetchMapByKey(DEFAULT_MAP_KEY)
  } catch (error) {
    console.error('맵 데이터 로딩 실패:', error)
  }

  phaserGame = createPhaserGame(gameContainer.value, initialMapData)

  handleCharacterUpdated = (event) => {
    if (!event.detail?.character) return
    selectedCharacter.value = event.detail.character
  }
  window.addEventListener('character-updated', handleCharacterUpdated)
})

onBeforeUnmount(() => {
  // /game 화면을 떠날 때 Phaser의 렌더러, 입력 이벤트, Scene 리소스를 정리한다.
  // destroy(true)는 Phaser가 만든 canvas DOM까지 함께 제거한다.
  phaserGame?.destroy(true)
  phaserGame = null
  if (handleCharacterUpdated) {
    window.removeEventListener('character-updated', handleCharacterUpdated)
    handleCharacterUpdated = null
  }
})
</script>

<template>
  <main class="game-page">
    <header class="game-header">
      <RouterLink class="back-link" to="/character/create">캐릭터</RouterLink>
      <div>
        <h1>{{ selectedCharacter?.name || 'Field' }}</h1>
        <p>← → / A D 이동, Space 점프, ↑ ↓ / W S 사다리, 좌클릭 공격</p>
      </div>
    </header>

    <section class="game-shell" aria-label="게임 화면">
      <div ref="gameContainer" class="game-canvas-wrap" />

      <aside
        v-if="selectedCharacter"
        class="character-overlay"
        :class="{ collapsed: !isCharacterHudOpen }"
        aria-label="내 캐릭터 상태"
      >
        <button
          class="hud-toggle"
          type="button"
          :aria-expanded="isCharacterHudOpen"
          aria-label="캐릭터 HUD 접기 펼치기"
          @click="isCharacterHudOpen = !isCharacterHudOpen"
        >
          {{ isCharacterHudOpen ? '접기' : '펼치기' }}
        </button>

        <div class="overlay-summary">
          <SpriteRenderer
            v-if="isCharacterHudOpen && selectedSpriteKey"
            :sprite-key="selectedSpriteKey"
            :frame-index="0"
          />
          <div class="overlay-head">
            <strong>{{ selectedCharacter.name }}</strong>
            <span>{{ jobs[selectedCharacter.job]?.label || selectedCharacter.job }}</span>
          </div>
        </div>

        <div v-if="isCharacterHudOpen" class="overlay-details">
          <div class="overlay-meta">
            <span>Lv {{ selectedCharacter.level }}</span>
            <span>{{ selectedCharacter.gold }} G</span>
          </div>
          <div class="overlay-meta">
            <span>오행 포인트</span>
            <span>{{ availableElementPoints }}</span>
          </div>
          <div v-if="characterStats" class="stat-grid">
            <span>HP {{ selectedCharacter.hp ?? characterStats.maxHp }} / {{ characterStats.maxHp }}</span>
            <span>MP {{ selectedCharacter.mp ?? characterStats.maxMp }} / {{ characterStats.maxMp }}</span>
            <span>ATK {{ characterStats.attack }}</span>
            <span>DEF {{ characterStats.defense }}</span>
            <span>DEX {{ characterStats.dex }}</span>
          </div>
          <dl class="overlay-elements">
            <div v-for="(element, key) in elements" :key="key">
              <dt>{{ element.label }}</dt>
              <dd>{{ selectedCharacter.elements?.[key] ?? 0 }}</dd>
              <button
                type="button"
                :disabled="availableElementPoints <= 0 || spendingElementKey === key"
                :aria-label="`${element.label} 오행 포인트 사용`"
                @click="spendElementPoint(key)"
              >
                +
              </button>
            </div>
          </dl>
          <p v-if="elementSpendMessage" class="element-message">{{ elementSpendMessage }}</p>
        </div>
      </aside>

      <div class="mobile-controls" aria-label="모바일 조작">
        <div class="d-pad" aria-label="이동">
          <button
            class="control-button jump"
            type="button"
            aria-label="점프"
            @pointerdown.prevent="startControl('jump')"
            @pointerup.prevent="endControl('jump')"
            @pointercancel.prevent="endControl('jump')"
            @pointerleave.prevent="endControl('jump')"
          >
            ↑
          </button>
          <button
            class="control-button left"
            type="button"
            aria-label="왼쪽 이동"
            @pointerdown.prevent="startControl('left')"
            @pointerup.prevent="endControl('left')"
            @pointercancel.prevent="endControl('left')"
            @pointerleave.prevent="endControl('left')"
          >
            ←
          </button>
          <button
            class="control-button right"
            type="button"
            aria-label="오른쪽 이동"
            @pointerdown.prevent="startControl('right')"
            @pointerup.prevent="endControl('right')"
            @pointercancel.prevent="endControl('right')"
            @pointerleave.prevent="endControl('right')"
          >
            →
          </button>
        </div>

        <button class="attack-button" type="button" aria-label="공격" @pointerdown.prevent="attack">
          공격
        </button>
      </div>
    </section>
  </main>
</template>
