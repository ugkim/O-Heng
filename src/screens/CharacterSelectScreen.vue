<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logoutAccount } from '../services/authService'
import {
  createCharacter,
  deleteCharacter,
  fetchCharacters,
} from '../services/characterService'
import {
  clearSelectedCharacter,
  getStoredAccount,
  storeSelectedCharacter,
} from '../services/sessionService'

const router = useRouter()
const account = ref(getStoredAccount())
const characters = ref([])
const message = ref('')
const isLoading = ref(false)
const creatingSlot = ref(null)
const newName = ref('')

const slots = computed(() =>
  [1, 2, 3].map((slotNo) => ({
    slotNo,
    character: characters.value.find((character) => character.slot_no === slotNo) || null,
  })),
)

onMounted(async () => {
  if (!account.value) {
    router.replace('/login')
    return
  }

  await loadCharacters()
})

async function loadCharacters() {
  message.value = ''
  isLoading.value = true

  try {
    characters.value = await fetchCharacters(account.value.id)
  } catch (error) {
    message.value = error.message
  } finally {
    isLoading.value = false
  }
}

function startCreate(slotNo) {
  creatingSlot.value = slotNo
  newName.value = ''
}

async function submitCreate(slotNo) {
  const name = newName.value.trim()

  if (!name) {
    message.value = '캐릭터 이름을 입력하세요.'
    return
  }

  try {
    await createCharacter({
      accountId: account.value.id,
      slotNo,
      name,
      job: 'mage',
      mainElement: 'fire',
      spriteKey: 'novice',
      elements: {
        wood: 0,
        fire: 10,
        earth: 0,
        metal: 0,
        water: 0,
      },
    })
    creatingSlot.value = null
    newName.value = ''
    await loadCharacters()
  } catch (error) {
    message.value = error.message
  }
}

async function removeCharacter(character) {
  if (!confirm(`${character.name} 캐릭터를 삭제할까요?`)) return

  try {
    await deleteCharacter({
      accountId: account.value.id,
      characterId: character.id,
    })
    clearSelectedCharacter()
    await loadCharacters()
  } catch (error) {
    message.value = error.message
  }
}

function enterGame(character) {
  storeSelectedCharacter(character)
  router.push('/game')
}

function logout() {
  logoutAccount()
  router.replace('/')
}
</script>

<template>
  <main class="character-page">
    <header class="character-header">
      <div>
        <p class="eyebrow">Character</p>
        <h1>캐릭터 선택</h1>
      </div>
      <button class="secondary-button" type="button" @click="logout">로그아웃</button>
    </header>

    <p v-if="message" class="form-message" role="alert">{{ message }}</p>
    <p v-if="isLoading" class="subtle-text">불러오는 중</p>

    <section class="slot-grid" aria-label="캐릭터 슬롯">
      <article v-for="slot in slots" :key="slot.slotNo" class="slot-card">
        <p class="slot-number">Slot {{ slot.slotNo }}</p>

        <template v-if="slot.character">
          <h2>{{ slot.character.name }}</h2>
          <dl class="character-stats">
            <div>
              <dt>Lv</dt>
              <dd>{{ slot.character.level }}</dd>
            </div>
            <div>
              <dt>Gold</dt>
              <dd>{{ slot.character.gold }}</dd>
            </div>
            <div>
              <dt>오행 포인트</dt>
              <dd>{{ slot.character.element_points ?? 0 }}</dd>
            </div>
          </dl>

          <div class="button-row">
            <button class="primary-button" type="button" @click="enterGame(slot.character)">
              입장
            </button>
            <button class="danger-button" type="button" @click="removeCharacter(slot.character)">
              삭제
            </button>
          </div>
        </template>

        <template v-else-if="creatingSlot === slot.slotNo">
          <form class="slot-create-form" @submit.prevent="submitCreate(slot.slotNo)">
            <input v-model="newName" type="text" maxlength="16" placeholder="캐릭터 이름" />
            <div class="button-row">
              <button class="primary-button" type="submit">생성</button>
              <button class="secondary-button" type="button" @click="creatingSlot = null">
                취소
              </button>
            </div>
          </form>
        </template>

        <template v-else>
          <button class="primary-button" type="button" @click="startCreate(slot.slotNo)">
            캐릭터 생성
          </button>
        </template>
      </article>
    </section>
  </main>
</template>
