<script setup>
import { computed, ref, watch } from 'vue'
import { INVENTORY_SLOT_COUNT } from '../../services/inventoryService'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  actionKey: {
    type: String,
    default: '',
  },
  characterGold: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['refresh', 'use', 'equip', 'unequip', 'sell'])

const tabs = [
  { key: 'all', label: '전체' },
  { key: 'equipment', label: '장비' },
  { key: 'consumable', label: '소비' },
  { key: 'material', label: '재료' },
  { key: 'quest', label: '퀘스트' },
]

const gradeLabels = {
  normal: '일반',
  rare: '레어',
  epic: '에픽',
  unique: '유니크',
  legendary: '전설',
}

const typeLabels = {
  equipment: '장비',
  consumable: '소비',
  material: '재료',
  quest: '퀘스트',
  currency: '재화',
}

const subTypeLabels = {
  weapon: '무기',
  armor: '갑옷',
  helmet: '모자',
  gloves: '장갑',
  shoes: '신발',
  accessory: '장신구',
  potion: '물약',
  etc: '기타',
}

const statLabels = {
  hp: 'HP',
  mp: 'MP',
  max_hp: '최대 HP',
  max_mp: '최대 MP',
  attack: '공격력',
  defense: '방어력',
  dex: '민첩',
}

const activeTab = ref('all')
const selectedInventoryId = ref('')

const inventoryBySlot = computed(() => {
  const slots = Array.from({ length: INVENTORY_SLOT_COUNT }, () => null)

  props.items.forEach((entry) => {
    if (entry.slot_index < 0 || entry.slot_index >= INVENTORY_SLOT_COUNT) return
    if (activeTab.value !== 'all' && entry.item?.type !== activeTab.value) return
    slots[entry.slot_index] = entry
  })

  return slots
})

const selectedItem = computed(() =>
  props.items.find((entry) => entry.id === selectedInventoryId.value) || null,
)

const selectedMeta = computed(() => selectedItem.value?.item || null)
const selectedStats = computed(() => Object.entries(selectedMeta.value?.stats || {}))
const selectedEffects = computed(() => Object.entries(selectedMeta.value?.effects || {}))

watch(
  () => props.items,
  () => {
    if (!selectedInventoryId.value) return
    if (!props.items.some((entry) => entry.id === selectedInventoryId.value)) {
      selectedInventoryId.value = ''
    }
  },
)

watch(activeTab, () => {
  if (!selectedItem.value) return
  if (activeTab.value !== 'all' && selectedMeta.value?.type !== activeTab.value) {
    selectedInventoryId.value = ''
  }
})

function iconFor(item) {
  return item?.icon_url || '□'
}

function actionDisabled(action) {
  return props.loading || props.actionKey === action
}
</script>

<template>
  <div class="inventory-panel">
    <div class="inventory-summary">
      <strong>{{ characterGold.toLocaleString() }} G</strong>
      <button type="button" class="secondary-button compact" :disabled="loading" @click="emit('refresh')">
        새로고침
      </button>
    </div>

    <div class="rpg-tabs inventory-tabs" role="tablist" aria-label="인벤토리 분류">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <p v-if="error" class="inventory-message error">{{ error }}</p>
    <p v-else-if="loading" class="inventory-message">인벤토리를 불러오는 중입니다.</p>

    <div class="inventory-grid" aria-label="아이템 슬롯">
      <button
        v-for="(entry, index) in inventoryBySlot"
        :key="index"
        class="inventory-slot"
        type="button"
        :class="{
          empty: !entry,
          equipped: entry?.is_equipped,
          selected: selectedInventoryId === entry?.id,
        }"
        :disabled="!entry"
        @click="selectedInventoryId = entry.id"
      >
        <template v-if="entry">
          <span class="slot-icon">{{ iconFor(entry.item) }}</span>
          <span class="slot-name">{{ entry.item?.name }}</span>
          <span v-if="entry.quantity > 1" class="slot-quantity">{{ entry.quantity }}</span>
          <span v-if="entry.is_equipped" class="slot-badge">장착</span>
        </template>
      </button>
    </div>

    <section v-if="selectedItem && selectedMeta" class="inventory-detail" aria-label="아이템 상세">
      <div class="inventory-detail-head">
        <span class="detail-icon">{{ iconFor(selectedMeta) }}</span>
        <div>
          <strong :class="`grade-${selectedMeta.grade}`">{{ selectedMeta.name }}</strong>
          <span>
            {{ gradeLabels[selectedMeta.grade] || selectedMeta.grade }}
            · {{ typeLabels[selectedMeta.type] || selectedMeta.type }}
            <template v-if="selectedMeta.sub_type">
              · {{ subTypeLabels[selectedMeta.sub_type] || selectedMeta.sub_type }}
            </template>
          </span>
        </div>
      </div>

      <p class="item-description">{{ selectedMeta.description || '설명이 없습니다.' }}</p>

      <dl v-if="selectedStats.length" class="item-stat-grid">
        <div v-for="[key, value] in selectedStats" :key="key">
          <dt>{{ statLabels[key] || key }}</dt>
          <dd>+{{ value }}</dd>
        </div>
      </dl>

      <dl v-if="selectedEffects.length" class="item-stat-grid">
        <div v-for="[key, value] in selectedEffects" :key="key">
          <dt>{{ statLabels[key] || key }}</dt>
          <dd>+{{ value }}</dd>
        </div>
      </dl>

      <div class="inventory-actions">
        <button
          v-if="selectedMeta.type === 'consumable'"
          type="button"
          class="primary-button"
          :disabled="actionDisabled(`use:${selectedItem.id}`)"
          @click="emit('use', selectedItem)"
        >
          사용
        </button>
        <button
          v-if="selectedMeta.type === 'equipment' && !selectedItem.is_equipped"
          type="button"
          class="primary-button"
          :disabled="actionDisabled(`equip:${selectedItem.id}`)"
          @click="emit('equip', selectedItem)"
        >
          장착
        </button>
        <button
          v-if="selectedMeta.type === 'equipment' && selectedItem.is_equipped"
          type="button"
          class="secondary-button"
          :disabled="actionDisabled(`unequip:${selectedItem.id}`)"
          @click="emit('unequip', selectedItem)"
        >
          해제
        </button>
        <button
          type="button"
          class="secondary-button"
          :disabled="
            selectedMeta.type === 'quest' ||
            selectedItem.is_equipped ||
            selectedMeta.sell_price <= 0 ||
            actionDisabled(`sell:${selectedItem.id}`)
          "
          @click="emit('sell', selectedItem)"
        >
          판매 {{ selectedMeta.sell_price.toLocaleString() }}G
        </button>
      </div>
    </section>
  </div>
</template>
