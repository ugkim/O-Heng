<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GameMenuBar from "../components/game/GameMenuBar.vue";
import GameModal from "../components/game/GameModal.vue";
import InventoryPanel from "../components/game/InventoryPanel.vue";
import QuestPanel from "../components/game/QuestPanel.vue";
import StatsPanel from "../components/game/StatsPanel.vue";
import SystemMenuPanel from "../components/game/SystemMenuPanel.vue";
import WorldMapPanel from "../components/game/WorldMapPanel.vue";
import {
  achievementEntries,
  activeQuests,
  bestiaryEntries,
  menuItems,
  menuMeta,
  shopItems,
  worldMapRegions,
} from "../data/mobileMenuData";
import {
  calculateCharacterStats,
  getPersistableCharacterStats,
} from "../game/data/characterStats";
import { DEFAULT_MAP_KEY, getMapDefinition } from "../game/data/maps";
import { createPhaserGame } from "../game/phaserGame";
import {
  updateCharacterState,
  useElementPoint,
} from "../services/characterService";
import {
  equipInventoryItem,
  fetchCharacterInventory,
  sellInventoryItem,
  unequipInventoryItem,
  useInventoryItem,
} from "../services/inventoryService";
import { fetchAvailableMaps, fetchMapByKey } from "../services/mapService";
import {
  getSelectedCharacter,
  getStoredAccount,
  storeSelectedCharacter,
} from "../services/sessionService";

const gameContainer = ref(null);
const selectedCharacter = ref(getSelectedCharacter());
const account = ref(getStoredAccount());
const activeMenuKey = ref("");
const currentMapKey = ref(DEFAULT_MAP_KEY);
const availableWorldMapRegions = ref(worldMapRegions);
const travelConfirmRegion = ref(null);
const spendingElementKey = ref("");
const elementSpendMessage = ref("");
const dragPadKnobStyle = ref({});
const inventoryItems = ref([]);
const inventoryLoading = ref(false);
const inventoryError = ref("");
const inventoryActionKey = ref("");
const isDeathModalOpen = ref(false);
const availableElementPoints = computed(
  () => selectedCharacter.value?.element_points ?? 0,
);
const characterStats = computed(() => {
  if (!selectedCharacter.value) return null;

  const stats = calculateCharacterStats(selectedCharacter.value);
  inventoryItems.value
    .filter((entry) => entry.is_equipped)
    .forEach((entry) => {
      const itemStats = entry.item?.stats || {};

      stats.maxHp += Number(itemStats.max_hp || itemStats.maxHp || 0);
      stats.maxMp += Number(itemStats.max_mp || itemStats.maxMp || 0);
      stats.attack += Number(itemStats.attack || 0);
      stats.defense += Number(itemStats.defense || 0);
      stats.dex += Number(itemStats.dex || 0);
    });

  return stats;
});
let phaserGame = null;
let handleCharacterUpdated = null;
let handleMapChanged = null;
let handlePlayerDead = null;
let handlePlayerRevived = null;
let dragPointerId = null;
let dragOrigin = { x: 0, y: 0 };
let dragControls = new Set();

const DRAG_DEAD_ZONE = 18;
const DRAG_KNOB_LIMIT = 34;

function sendGameControl(type, control) {
  // 모바일 터치 UI는 Vue 영역에 두고, Phaser에는 커스텀 이벤트만 전달한다.
  // 이렇게 분리하면 나중에 게임패드, 스킬 버튼, 퀵슬롯도 Vue UI로 확장하기 쉽다.
  window.dispatchEvent(
    new CustomEvent("rpg-control", {
      detail: { type, control },
    }),
  );
}

function startControl(control) {
  sendGameControl("start", control);
}

function endControl(control) {
  sendGameControl("end", control);
}

function attack() {
  sendGameControl("attack", "attack");
}

function skill() {
  sendGameControl("skill", "skill");
}

function returnToTown() {
  window.dispatchEvent(new CustomEvent("rpg-return-town"));
}

function openMenu(menuKey) {
  activeMenuKey.value = activeMenuKey.value === menuKey ? "" : menuKey;
  travelConfirmRegion.value = null;

  if (activeMenuKey.value === "inventory") {
    loadInventory();
  }
}

function closeMenu() {
  activeMenuKey.value = "";
  travelConfirmRegion.value = null;
}

function requestTravel(region) {
  if (!region?.unlocked) return;
  travelConfirmRegion.value = region;
}

function confirmTravel() {
  if (!travelConfirmRegion.value) return;

  window.dispatchEvent(
    new CustomEvent("rpg-map-travel", {
      detail: {
        mapKey: travelConfirmRegion.value.mapKey,
        mapName: travelConfirmRegion.value.name,
      },
    }),
  );
  currentMapKey.value = travelConfirmRegion.value.mapKey;
  closeMenu();
}

async function loadWorldMapRegions() {
  try {
    const maps = await fetchAvailableMaps();

    if (!Array.isArray(maps) || maps.length === 0) return;

    availableWorldMapRegions.value = maps.map((map) => ({
      id: map.mapKey,
      mapKey: map.mapKey,
      name: map.mapName || map.name || map.mapKey,
      visited: true,
      unlocked: true,
    }));
  } catch (error) {
    console.error("월드맵 데이터 로딩 실패:", error);
  }
}

function syncDragControls(nextControls) {
  const directionalControls = ["left", "right", "up", "down"];

  directionalControls.forEach((control) => {
    const isActive = dragControls.has(control);
    const shouldBeActive = nextControls.has(control);

    if (isActive !== shouldBeActive) {
      sendGameControl(shouldBeActive ? "start" : "end", control);
    }
  });

  dragControls = nextControls;
}

function updateDragPad(clientX, clientY) {
  const dx = clientX - dragOrigin.x;
  const dy = clientY - dragOrigin.y;
  const nextControls = new Set();

  if (Math.abs(dx) > DRAG_DEAD_ZONE) {
    nextControls.add(dx < 0 ? "left" : "right");
  }

  if (Math.abs(dy) > DRAG_DEAD_ZONE) {
    nextControls.add(dy < 0 ? "up" : "down");
  }

  const knobX = Math.max(-DRAG_KNOB_LIMIT, Math.min(DRAG_KNOB_LIMIT, dx));
  const knobY = Math.max(-DRAG_KNOB_LIMIT, Math.min(DRAG_KNOB_LIMIT, dy));
  dragPadKnobStyle.value = {
    transform: `translate(${knobX}px, ${knobY}px)`,
  };

  syncDragControls(nextControls);
}

function startDragPad(event) {
  dragPointerId = event.pointerId;
  dragOrigin = { x: event.clientX, y: event.clientY };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  updateDragPad(event.clientX, event.clientY);
}

function moveDragPad(event) {
  if (dragPointerId !== event.pointerId) return;
  updateDragPad(event.clientX, event.clientY);
}

function endDragPad(event) {
  if (dragPointerId !== event.pointerId) return;

  event.currentTarget.releasePointerCapture?.(event.pointerId);
  dragPointerId = null;
  dragPadKnobStyle.value = {};
  syncDragControls(new Set());
}

async function spendElementPoint(elementKey) {
  if (
    !account.value?.id ||
    !selectedCharacter.value?.id ||
    availableElementPoints.value <= 0
  )
    return;

  spendingElementKey.value = elementKey;
  elementSpendMessage.value = "";

  try {
    const pointUpdatedCharacter = await useElementPoint({
      accountId: account.value.id,
      characterId: selectedCharacter.value.id,
      elementKey,
    });
    const nextStats = getPersistableCharacterStats(pointUpdatedCharacter);
    const updatedCharacter = await updateCharacterState({
      accountId: account.value.id,
      character: {
        ...pointUpdatedCharacter,
        hp: Math.min(
          pointUpdatedCharacter.hp ?? nextStats.max_hp,
          nextStats.max_hp,
        ),
        max_hp: nextStats.max_hp,
        mp: Math.min(
          pointUpdatedCharacter.mp ?? nextStats.max_mp,
          nextStats.max_mp,
        ),
        max_mp: nextStats.max_mp,
        attack: nextStats.attack,
        defense: nextStats.defense,
        dex: nextStats.dex,
      },
    });

    selectedCharacter.value = {
      ...selectedCharacter.value,
      ...updatedCharacter,
    };
    storeSelectedCharacter(selectedCharacter.value);
    window.dispatchEvent(
      new CustomEvent("character-updated", {
        detail: { character: selectedCharacter.value },
      }),
    );
    elementSpendMessage.value = "오행 포인트를 사용했습니다.";
  } catch (error) {
    console.error("오행 포인트 사용 실패:", error);
    elementSpendMessage.value = "오행 포인트 사용에 실패했습니다.";
  } finally {
    spendingElementKey.value = "";
  }
}

async function loadInventory() {
  if (!account.value?.id || !selectedCharacter.value?.id) return;

  inventoryLoading.value = true;
  inventoryError.value = "";

  try {
    inventoryItems.value = await fetchCharacterInventory({
      accountId: account.value.id,
      characterId: selectedCharacter.value.id,
    });
  } catch (error) {
    console.error("인벤토리 로딩 실패:", error);
    inventoryError.value = "인벤토리를 불러오지 못했습니다.";
  } finally {
    inventoryLoading.value = false;
  }
}

function syncSelectedCharacter(character) {
  selectedCharacter.value = {
    ...selectedCharacter.value,
    ...character,
  };
  storeSelectedCharacter(selectedCharacter.value);
  window.dispatchEvent(
    new CustomEvent("character-updated", {
      detail: { character: selectedCharacter.value },
    }),
  );
}

async function runInventoryAction(actionKey, action) {
  if (!account.value?.id) return;

  inventoryActionKey.value = actionKey;
  inventoryError.value = "";

  try {
    const updatedCharacter = await action();
    if (updatedCharacter?.id) {
      syncSelectedCharacter(updatedCharacter);
    }
    await loadInventory();
  } catch (error) {
    console.error("인벤토리 액션 실패:", error);
    inventoryError.value = error?.message || "아이템 처리에 실패했습니다.";
  } finally {
    inventoryActionKey.value = "";
  }
}

function handleUseInventoryItem(entry) {
  runInventoryAction(`use:${entry.id}`, () =>
    useInventoryItem({
      accountId: account.value.id,
      inventoryId: entry.id,
    }),
  );
}

function handleEquipInventoryItem(entry) {
  runInventoryAction(`equip:${entry.id}`, async () => {
    await equipInventoryItem({
      accountId: account.value.id,
      inventoryId: entry.id,
    });
    return null;
  });
}

function handleUnequipInventoryItem(entry) {
  runInventoryAction(`unequip:${entry.id}`, async () => {
    await unequipInventoryItem({
      accountId: account.value.id,
      inventoryId: entry.id,
    });
    return null;
  });
}

function handleSellInventoryItem(entry) {
  runInventoryAction(`sell:${entry.id}`, () =>
    sellInventoryItem({
      accountId: account.value.id,
      inventoryId: entry.id,
      quantity: 1,
    }),
  );
}

onMounted(async () => {
  // Vue 컴포넌트가 실제 DOM에 마운트된 뒤 Phaser 캔버스를 붙인다.
  // parent에는 HTMLElement를 직접 넘겨 Vue 라우터 화면 안에 캔버스가 생성되도록 한다.
  let initialMapData = getMapDefinition(DEFAULT_MAP_KEY);

  try {
    initialMapData = await fetchMapByKey(DEFAULT_MAP_KEY);
  } catch (error) {
    console.error("맵 데이터 로딩 실패:", error);
  }

  await loadWorldMapRegions();

  phaserGame = createPhaserGame(gameContainer.value, initialMapData);

  handleCharacterUpdated = (event) => {
    if (!event.detail?.character) return;
    selectedCharacter.value = event.detail.character;
  };

  handleMapChanged = (event) => {
    if (!event.detail?.mapKey) return;
    currentMapKey.value = event.detail.mapKey;
  };

  handlePlayerDead = () => {
    isDeathModalOpen.value = true;
    activeMenuKey.value = "";
    travelConfirmRegion.value = null;
  };

  handlePlayerRevived = () => {
    isDeathModalOpen.value = false;
  };

  window.addEventListener("character-updated", handleCharacterUpdated);
  window.addEventListener("rpg-map-changed", handleMapChanged);
  window.addEventListener("rpg-player-dead", handlePlayerDead);
  window.addEventListener("rpg-player-revived", handlePlayerRevived);

  await loadInventory();
});

onBeforeUnmount(() => {
  // /game 화면을 떠날 때 Phaser의 렌더러, 입력 이벤트, Scene 리소스를 정리한다.
  // destroy(true)는 Phaser가 만든 canvas DOM까지 함께 제거한다.
  phaserGame?.destroy(true);
  phaserGame = null;
  syncDragControls(new Set());
  if (handleCharacterUpdated) {
    window.removeEventListener("character-updated", handleCharacterUpdated);
    handleCharacterUpdated = null;
  }
  if (handleMapChanged) {
    window.removeEventListener("rpg-map-changed", handleMapChanged);
    handleMapChanged = null;
  }
  if (handlePlayerDead) {
    window.removeEventListener("rpg-player-dead", handlePlayerDead);
    handlePlayerDead = null;
  }
  if (handlePlayerRevived) {
    window.removeEventListener("rpg-player-revived", handlePlayerRevived);
    handlePlayerRevived = null;
  }
});
</script>

<template>
  <main class="game-page">
    <section class="game-shell" aria-label="게임 화면">
      <div ref="gameContainer" class="game-canvas-wrap" />

      <GameMenuBar
        :items="menuItems"
        :meta="menuMeta"
        :active-key="activeMenuKey"
        @select="openMenu"
      />

      <GameModal
        v-if="activeMenuKey && selectedCharacter"
        :title="menuMeta[activeMenuKey]?.label || '메뉴'"
        @close="closeMenu"
      >
        <StatsPanel
          v-if="activeMenuKey === 'stats' && characterStats"
          :character="selectedCharacter"
          :stats="characterStats"
          :available-element-points="availableElementPoints"
          :spending-element-key="spendingElementKey"
          :message="elementSpendMessage"
          @spend="spendElementPoint"
        />
        <InventoryPanel
          v-else-if="activeMenuKey === 'inventory'"
          :items="inventoryItems"
          :loading="inventoryLoading"
          :error="inventoryError"
          :action-key="inventoryActionKey"
          :character-gold="selectedCharacter.gold"
          @refresh="loadInventory"
          @use="handleUseInventoryItem"
          @equip="handleEquipInventoryItem"
          @unequip="handleUnequipInventoryItem"
          @sell="handleSellInventoryItem"
        />
        <QuestPanel
          v-else-if="activeMenuKey === 'quest'"
          :quests="activeQuests"
        />
        <WorldMapPanel
          v-else-if="activeMenuKey === 'worldMap'"
          :regions="availableWorldMapRegions"
          :current-map-key="currentMapKey"
          @travel="requestTravel"
        />
        <SystemMenuPanel
          v-else-if="activeMenuKey === 'settings'"
          :character-gold="selectedCharacter.gold"
          :shop-items="shopItems"
          :bestiary="bestiaryEntries"
          :achievements="achievementEntries"
        />
      </GameModal>

      <div
        v-if="isDeathModalOpen"
        class="death-modal-layer"
        role="presentation"
      >
        <section class="death-modal" role="dialog" aria-modal="true" aria-label="사망">
          <h2>사망했습니다</h2>
          <p>마을로 귀환한 뒤 다시 전투를 준비하세요.</p>
          <button class="primary-button" type="button" @click="returnToTown">
            마을로 귀환
          </button>
        </section>
      </div>

      <div
        v-if="travelConfirmRegion"
        class="travel-confirm-layer"
        role="presentation"
        @click.self="travelConfirmRegion = null"
      >
        <section class="travel-confirm" role="dialog" aria-modal="true">
          <h3>{{ travelConfirmRegion.name }}</h3>
          <p>이 지역으로 이동하시겠습니까?</p>
          <div class="button-row">
            <button class="secondary-button" type="button" @click="travelConfirmRegion = null">
              취소
            </button>
            <button class="primary-button" type="button" @click="confirmTravel">
              확인
            </button>
          </div>
        </section>
      </div>

      <div class="mobile-controls" aria-label="모바일 조작">
        <div
          class="drag-pad"
          role="application"
          aria-label="드래그 이동"
          @pointerdown.prevent="startDragPad"
          @pointermove.prevent="moveDragPad"
          @pointerup.prevent="endDragPad"
          @pointercancel.prevent="endDragPad"
          @pointerleave.prevent="endDragPad"
        >
          <span class="drag-pad-axis horizontal" aria-hidden="true"></span>
          <span class="drag-pad-axis vertical" aria-hidden="true"></span>
          <span
            class="drag-pad-knob"
            :style="dragPadKnobStyle"
            aria-hidden="true"
          ></span>
        </div>

        <div class="action-buttons" aria-label="액션">
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
            class="attack-button"
            type="button"
            aria-label="공격"
            @pointerdown.prevent="attack"
          >
            ATK
          </button>
          <button
            class="skill-button"
            type="button"
            aria-label="스킬"
            @pointerdown.prevent="skill"
          >
            SKILL
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
