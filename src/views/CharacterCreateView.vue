<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import SpriteRenderer from '../components/SpriteRenderer.vue'
import {
  createDefaultAvatarAppearance,
  createDefaultEquippedAvatar,
} from '../data/avatarCatalog'
import { elementKeys, elements } from '../data/elements'
import { jobKeys, jobs } from '../data/jobs'
import { getCharacterSpriteKey } from '../data/spriteMap'
import { createCharacter, fetchCharacters } from '../services/characterService'
import { getStoredAccount, storeSelectedCharacter } from '../services/sessionService'

const TOTAL_POINTS = 10

const router = useRouter()
const account = ref(getStoredAccount())
const name = ref('')
const selectedJob = ref('')
const message = ref('')
const isSubmitting = ref(false)
const allocatedElements = reactive(
  elementKeys.reduce((stats, key) => {
    stats[key] = 0
    return stats
  }, {}),
)

const selectedJobInfo = computed(() => (selectedJob.value ? jobs[selectedJob.value] : null))
const usedPoints = computed(() => elementKeys.reduce((total, key) => total + allocatedElements[key], 0))
const remainingPoints = computed(() => TOTAL_POINTS - usedPoints.value)
const selectedSpriteKey = computed(() =>
  selectedJob.value
    ? getCharacterSpriteKey({
        level: 1,
        job: selectedJob.value,
        main_element: getMainElement(),
      })
    : '',
)
const canCreate = computed(
  () =>
    Boolean(account.value) &&
    Boolean(name.value.trim()) &&
    Boolean(selectedJob.value) &&
    remainingPoints.value === 0 &&
    !isSubmitting.value,
)

const disabledReason = computed(() => {
  if (!name.value.trim()) return '캐릭터 이름을 입력하세요.'
  if (!selectedJob.value) return '직업을 선택하세요.'
  if (remainingPoints.value > 0) return `남은 포인트 ${remainingPoints.value}점을 모두 분배하세요.`
  return ''
})

function isRecommendedElement(elementKey) {
  return selectedJobInfo.value?.recommendedElements.includes(elementKey)
}

function increaseElement(elementKey) {
  if (remainingPoints.value <= 0) return
  allocatedElements[elementKey] += 1
}

function decreaseElement(elementKey) {
  if (allocatedElements[elementKey] <= 0) return
  allocatedElements[elementKey] -= 1
}

function getMainElement() {
  if (selectedJob.value === 'mage') return 'fire'

  return elementKeys.reduce((bestKey, key) => {
    return allocatedElements[key] > allocatedElements[bestKey] ? key : bestKey
  }, elementKeys[0])
}

async function createNewCharacter() {
  if (!canCreate.value) return

  message.value = ''
  isSubmitting.value = true

  try {
    const characters = await fetchCharacters(account.value.id)
    const usedSlots = new Set(characters.map((character) => character.slot_no))
    const slotNo = [1, 2, 3].find((slot) => !usedSlots.has(slot))

    if (!slotNo) {
      message.value = '사용 가능한 캐릭터 슬롯이 없습니다.'
      return
    }

    const character = await createCharacter({
      accountId: account.value.id,
      slotNo,
      name: name.value.trim(),
      job: selectedJob.value,
      mainElement: getMainElement(),
      spriteKey: selectedSpriteKey.value || null,
      elements: { ...allocatedElements },
      appearance: createDefaultAvatarAppearance(),
      equippedAvatar: createDefaultEquippedAvatar(),
    })

    storeSelectedCharacter(character)
    router.push('/game')
  } catch (error) {
    message.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="character-create-page">
    <section class="create-shell" aria-label="캐릭터 생성">
      <section class="preview-panel" aria-label="캐릭터 미리보기">
        <div class="avatar-frame">
          <SpriteRenderer v-if="selectedSpriteKey" :sprite-key="selectedSpriteKey" :frame-index="0" />
          <div v-else class="avatar-silhouette">
            <span>{{ selectedJobInfo?.label?.slice(0, 1) || '?' }}</span>
          </div>
        </div>
        <div class="preview-copy">
          <p class="eyebrow">Character Create</p>
          <h1>{{ selectedJobInfo?.label || '직업 선택' }}</h1>
          <p>{{ selectedJobInfo?.description || '이름과 직업을 정하고 오행을 분배하세요.' }}</p>
        </div>
      </section>

      <form class="create-form" @submit.prevent="createNewCharacter">
        <p v-if="message" class="form-message" role="alert">{{ message }}</p>

        <label class="name-field">
          <span>캐릭터 이름</span>
          <input v-model="name" type="text" maxlength="16" placeholder="테스트캐릭터" />
        </label>

        <section class="form-section" aria-label="직업 선택">
          <div class="section-title">
            <h2>직업 선택</h2>
          </div>
          <div class="job-grid">
            <button
              v-for="jobKey in jobKeys"
              :key="jobKey"
              class="job-card"
              :class="{ selected: selectedJob === jobKey }"
              type="button"
              @click="selectedJob = jobKey"
            >
              <strong>{{ jobs[jobKey].label }}</strong>
              <span>{{ jobs[jobKey].core }}</span>
            </button>
          </div>
        </section>

        <section class="form-section" aria-label="오행 스탯 분배">
          <div class="section-title">
            <h2>오행 스탯</h2>
            <strong>남은 {{ remainingPoints }}</strong>
          </div>

          <div class="element-list">
            <article
              v-for="elementKey in elementKeys"
              :key="elementKey"
              class="element-card"
              :class="{ recommended: isRecommendedElement(elementKey) }"
            >
              <div
                class="element-dot"
                :style="{ backgroundColor: elements[elementKey].color }"
                aria-hidden="true"
              />
              <div class="element-meta">
                <strong>{{ elements[elementKey].label }}</strong>
                <span>{{ elements[elementKey].meaning }}</span>
              </div>
              <div class="stat-controls">
                <button
                  type="button"
                  :disabled="allocatedElements[elementKey] <= 0"
                  aria-label="포인트 회수"
                  @click="decreaseElement(elementKey)"
                >
                  -
                </button>
                <output>{{ allocatedElements[elementKey] }}</output>
                <button
                  type="button"
                  :disabled="remainingPoints <= 0"
                  aria-label="포인트 추가"
                  @click="increaseElement(elementKey)"
                >
                  +
                </button>
              </div>
            </article>
          </div>
        </section>

        <button class="create-button" type="submit" :disabled="!canCreate">
          {{ isSubmitting ? '생성 중' : '생성 완료' }}
        </button>
        <p v-if="!canCreate" class="disabled-reason">{{ disabledReason }}</p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.character-create-page {
  min-height: 100svh;
  display: grid;
  justify-items: center;
  padding: 12px;
  background:
    radial-gradient(circle at 50% 8%, rgba(118, 215, 198, 0.2), transparent 28%),
    linear-gradient(180deg, #151017 0%, #101722 48%, #090d13 100%);
}

.create-shell {
  width: min(480px, 100%);
  min-height: calc(100svh - 24px);
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
}

.preview-panel,
.create-form {
  border: 1px solid rgba(139, 228, 208, 0.18);
  border-radius: 8px;
  background: rgba(9, 15, 23, 0.86);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
}

.preview-panel {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  min-height: 176px;
  padding: 18px;
}

.avatar-frame {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(242, 201, 76, 0.22), rgba(47, 158, 68, 0.12));
  border: 1px solid rgba(248, 249, 250, 0.18);
}

.avatar-silhouette {
  width: 78%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(180deg, #263449, #111820);
  box-shadow: inset 0 -14px 24px rgba(0, 0, 0, 0.32);
}

.avatar-silhouette span {
  font-size: 36px;
  font-weight: 900;
}

.preview-copy {
  min-width: 0;
}

.preview-copy h1 {
  font-size: 28px;
}

.preview-copy p:last-child {
  margin: 8px 0 0;
  color: #b9c6d2;
  line-height: 1.45;
}

.create-form {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 16px;
}

.name-field {
  display: grid;
  gap: 8px;
  color: #dce8ef;
  font-weight: 800;
}

.form-section {
  display: grid;
  gap: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title h2 {
  margin: 0;
  font-size: 16px;
}

.section-title strong {
  color: #8be4d0;
}

.job-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.job-card {
  min-height: 76px;
  display: grid;
  align-content: center;
  gap: 6px;
  border: 1px solid #30465a;
  border-radius: 8px;
  padding: 10px;
  color: #ffffff;
  background: #121f2d;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.job-card strong {
  font-size: 16px;
}

.job-card span {
  color: #aab8c5;
  font-size: 12px;
  line-height: 1.35;
}

.job-card.selected {
  border-color: #8be4d0;
  background: #193233;
}

.element-list {
  display: grid;
  gap: 8px;
}

.element-card {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  border: 1px solid #30465a;
  border-radius: 8px;
  padding: 10px;
  background: rgba(18, 31, 45, 0.94);
}

.element-card.recommended {
  border-color: rgba(242, 201, 76, 0.74);
  background: rgba(52, 47, 27, 0.72);
}

.element-dot {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
}

.element-meta {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.element-meta strong {
  font-size: 15px;
}

.element-meta span {
  color: #aab8c5;
  font-size: 12px;
}

.stat-controls {
  display: grid;
  grid-template-columns: 32px 26px 32px;
  align-items: center;
  gap: 4px;
}

.stat-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #526f86;
  border-radius: 6px;
  color: #ffffff;
  background: #1a2a3a;
  font: inherit;
  font-weight: 900;
}

.stat-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.stat-controls output {
  color: #ffffff;
  font-weight: 900;
  text-align: center;
}

.create-button {
  min-height: 48px;
  border: 1px solid #8be4d0;
  border-radius: 8px;
  color: #ffffff;
  background: #1e7b70;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.create-button:disabled {
  border-color: #40576c;
  background: #263443;
  cursor: not-allowed;
  opacity: 0.66;
}

.disabled-reason {
  margin: -8px 0 0;
  color: #ffcc8a;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 380px) {
  .preview-panel {
    grid-template-columns: 96px minmax(0, 1fr);
    padding: 14px;
  }

  .preview-copy h1 {
    font-size: 24px;
  }

  .job-grid {
    grid-template-columns: 1fr;
  }
}
</style>
