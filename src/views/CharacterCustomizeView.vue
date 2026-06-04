<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvatarRenderer from '../components/AvatarRenderer.vue'
import {
  AVATAR_ACTIONS,
  AVATAR_CATEGORIES,
  AVATAR_ITEMS,
  createDefaultAvatarAppearance,
  createDefaultEquippedAvatar,
  getAvatarItem,
} from '../data/avatarCatalog'
import { fetchCharacters, updateCharacterAvatar } from '../services/characterService'
import {
  getSelectedCharacter,
  getStoredAccount,
  storeSelectedCharacter,
} from '../services/sessionService'

const route = useRoute()
const router = useRouter()
const account = ref(getStoredAccount())
const character = ref(null)
const appearance = ref(createDefaultAvatarAppearance())
const equippedAvatar = ref(createDefaultEquippedAvatar())
const activeCategory = ref('hair')
const activeAction = ref('stand')
const message = ref('')
const isLoading = ref(false)
const isSaving = ref(false)

const actionEntries = computed(() => Object.entries(AVATAR_ACTIONS))
const activeItems = computed(() => AVATAR_ITEMS[activeCategory.value] || [])
const equippedSummary = computed(() =>
  AVATAR_CATEGORIES.map((category) => {
    const item = getAvatarItem(category.key, equippedAvatar.value[category.key])
    return {
      ...category,
      value: item?.name || '없음',
    }
  }),
)
const canSave = computed(() => Boolean(account.value?.id && character.value?.id && !isSaving.value))

onMounted(loadCharacter)

async function loadCharacter() {
  if (!account.value?.id) {
    router.replace('/login')
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    const characters = await fetchCharacters(account.value.id)
    const routeCharacterId = route.params.characterId
    const storedCharacter = getSelectedCharacter()
    const target =
      characters.find((entry) => entry.id === routeCharacterId) ||
      characters.find((entry) => entry.id === storedCharacter?.id) ||
      characters[0]

    if (!target) {
      router.replace('/character/create')
      return
    }

    character.value = target
    appearance.value = {
      ...createDefaultAvatarAppearance(),
      ...(target.appearance || {}),
    }
    equippedAvatar.value = {
      ...createDefaultEquippedAvatar(),
      ...(target.equipped_avatar || {}),
    }
    activeAction.value = appearance.value.action || 'stand'
  } catch (error) {
    message.value = error.message
  } finally {
    isLoading.value = false
  }
}

function selectItem(item) {
  equippedAvatar.value = {
    ...equippedAvatar.value,
    [activeCategory.value]: item.id,
  }
}

function selectAction(actionKey) {
  activeAction.value = actionKey
  appearance.value = {
    ...appearance.value,
    action: actionKey,
  }
}

function flipDirection() {
  appearance.value = {
    ...appearance.value,
    direction: appearance.value.direction === 'left' ? 'right' : 'left',
  }
}

async function saveAvatar() {
  if (!canSave.value) return

  isSaving.value = true
  message.value = ''

  try {
    const updatedCharacter = await updateCharacterAvatar({
      accountId: account.value.id,
      characterId: character.value.id,
      appearance: appearance.value,
      equippedAvatar: equippedAvatar.value,
    })

    character.value = updatedCharacter
    storeSelectedCharacter(updatedCharacter)
    window.dispatchEvent(
      new CustomEvent('character-updated', {
        detail: { character: updatedCharacter },
      }),
    )
    message.value = '외형을 저장했습니다.'
  } catch (error) {
    message.value = error.message
  } finally {
    isSaving.value = false
  }
}

function backToCharacters() {
  router.push('/characters')
}
</script>

<template>
  <main class="customize-page">
    <header class="customize-header">
      <div>
        <p class="eyebrow">Avatar Studio</p>
        <h1>캐릭터 꾸미기</h1>
      </div>
      <button class="secondary-button" type="button" @click="backToCharacters">목록</button>
    </header>

    <p v-if="message" class="form-message" role="alert">{{ message }}</p>
    <p v-if="isLoading" class="subtle-text">불러오는 중</p>

    <section v-if="character" class="customize-shell" aria-label="캐릭터 꾸미기">
      <section class="avatar-preview-panel" aria-label="아바타 미리보기">
        <div class="preview-stage">
          <AvatarRenderer
            :appearance="appearance"
            :equipped-avatar="equippedAvatar"
            :action="activeAction"
            size="large"
          />
        </div>

        <div class="preview-meta">
          <div>
            <span>캐릭터</span>
            <strong>{{ character.name }}</strong>
          </div>
          <div>
            <span>합성 구조</span>
            <strong>Core + Parts</strong>
          </div>
          <div>
            <span>액션</span>
            <strong>{{ AVATAR_ACTIONS[activeAction]?.coreActionName }}</strong>
          </div>
        </div>

        <div class="action-tabs" aria-label="아바타 액션">
          <button
            v-for="[actionKey, action] in actionEntries"
            :key="actionKey"
            type="button"
            :class="{ active: activeAction === actionKey }"
            @click="selectAction(actionKey)"
          >
            {{ action.label }}
          </button>
        </div>

        <div class="preview-actions">
          <button class="secondary-button" type="button" @click="flipDirection">좌우 반전</button>
          <button class="primary-button" type="button" :disabled="!canSave" @click="saveAvatar">
            {{ isSaving ? '저장 중' : '외형 저장' }}
          </button>
        </div>
      </section>

      <section class="parts-panel" aria-label="파츠 선택">
        <div class="category-tabs" aria-label="파츠 카테고리">
          <button
            v-for="category in AVATAR_CATEGORIES"
            :key="category.key"
            type="button"
            :class="{ active: activeCategory === category.key }"
            @click="activeCategory = category.key"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="item-grid">
          <button
            v-for="item in activeItems"
            :key="`${activeCategory}-${item.id ?? 'none'}`"
            class="avatar-item-card"
            type="button"
            :class="{ selected: equippedAvatar[activeCategory] === item.id }"
            @click="selectItem(item)"
          >
            <span class="item-swatch" :style="{ background: item.palette?.main || item.palette?.hair || item.palette?.skin || '#273449' }"></span>
            <strong>{{ item.name }}</strong>
          </button>
        </div>

        <dl class="equipped-list">
          <div v-for="entry in equippedSummary" :key="entry.key">
            <dt>{{ entry.label }}</dt>
            <dd>{{ entry.value }}</dd>
          </div>
        </dl>
      </section>
    </section>
  </main>
</template>

<style scoped>
.customize-page {
  min-height: 100svh;
  padding: 18px;
  background:
    radial-gradient(circle at 18% 12%, rgba(139, 228, 208, 0.14), transparent 25%),
    linear-gradient(180deg, #111922 0%, #0b121b 100%);
}

.customize-header {
  width: min(1120px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto 16px;
}

.customize-header h1 {
  font-size: 30px;
}

.customize-page > .form-message,
.customize-page > .subtle-text {
  width: min(1120px, 100%);
  margin: 0 auto 12px;
}

.customize-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 14px;
}

.avatar-preview-panel,
.parts-panel {
  border: 1px solid #2d4658;
  border-radius: 8px;
  background: #111c2a;
}

.avatar-preview-panel {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
}

.preview-stage {
  min-height: 360px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 210, 126, 0.28);
  border-radius: 8px;
  background:
    linear-gradient(to top, rgba(90, 60, 34, 0.9) 0 20%, transparent 20%),
    linear-gradient(180deg, #8ecae6 0%, #d8f3dc 72%, #77553a 72%);
  overflow: hidden;
}

.preview-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.preview-meta div,
.equipped-list div {
  min-width: 0;
  border: 1px solid rgba(139, 228, 208, 0.16);
  border-radius: 7px;
  padding: 9px 10px;
  background: rgba(5, 11, 18, 0.42);
}

.preview-meta span,
.equipped-list dt {
  display: block;
  color: #aab8c5;
  font-size: 12px;
  font-weight: 800;
}

.preview-meta strong,
.equipped-list dd {
  display: block;
  min-width: 0;
  margin: 4px 0 0;
  overflow: hidden;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-tabs,
.category-tabs {
  display: grid;
  gap: 6px;
}

.action-tabs {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.category-tabs {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.action-tabs button,
.category-tabs button,
.avatar-item-card {
  min-height: 40px;
  border: 1px solid #3c5368;
  border-radius: 6px;
  color: #edf4f7;
  background: #0b121d;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.action-tabs button.active,
.category-tabs button.active,
.avatar-item-card.selected {
  border-color: #8be4d0;
  background: #193233;
}

.preview-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.parts-panel {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.avatar-item-card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-height: 58px;
  padding: 8px;
  text-align: left;
}

.avatar-item-card strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-swatch {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
}

.equipped-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

@media (max-width: 860px) {
  .customize-shell {
    grid-template-columns: 1fr;
  }

  .preview-stage {
    min-height: 300px;
  }
}

@media (max-width: 560px) {
  .customize-page {
    padding: 12px;
  }

  .customize-header h1 {
    font-size: 24px;
  }

  .preview-meta,
  .item-grid,
  .equipped-list {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
