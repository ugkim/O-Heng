export const menuItems = [
  'settings',
  'worldMap',
  'quest',
  'inventory',
  'stats',
]

export const menuMeta = {
  settings: { label: '메뉴', icon: '⚙️' },
  worldMap: { label: '월드맵', icon: '🗺️' },
  quest: { label: '퀘스트', icon: '📜' },
  inventory: { label: '인벤토리', icon: '🎒' },
  stats: { label: '스탯', icon: '📈' },
}

export const inventoryTabs = [
  {
    key: 'equipment',
    label: '장비',
    items: [
      { id: 'wood_staff', name: '수련 지팡이', icon: '🪄', quantity: 1, equipable: true },
      { id: 'cloth_hat', name: '천 모자', icon: '🎩', quantity: 1, equipable: true },
      { id: 'leaf_ring', name: '잎새 반지', icon: '💍', quantity: 1, equipable: true },
    ],
  },
  {
    key: 'consumable',
    label: '소비',
    items: [
      { id: 'hp_potion', name: 'HP 포션', icon: '🧪', quantity: 8 },
      { id: 'mp_potion', name: 'MP 포션', icon: '💧', quantity: 5 },
      { id: 'return_scroll', name: '귀환서', icon: '📜', quantity: 2 },
    ],
  },
  {
    key: 'etc',
    label: '기타',
    items: [
      { id: 'blue_scale', name: '푸른 비늘', icon: '🔷', quantity: 4 },
      { id: 'slime_jelly', name: '슬라임 젤리', icon: '🟢', quantity: 12 },
    ],
  },
]

export const activeQuests = [
  {
    id: 'hunt_slime_10',
    title: '슬라임 10마리 처치',
    current: 3,
    required: 10,
    rewards: { exp: 100, gold: 50 },
  },
]

export const worldMapRegions = [
  { id: 'forest01', mapKey: 'forest01', name: '바람숲', visited: true, unlocked: true },
  { id: 'forest02', mapKey: 'forest02', name: '청룡계곡', visited: true, unlocked: true },
  { id: 'elder_hill', mapKey: 'elder_hill', name: '고목언덕', visited: false, unlocked: false },
  { id: 'black_cave', mapKey: 'black_cave', name: '현무동굴', visited: false, unlocked: false },
]

export const shopItems = [
  { id: 'hp_potion', name: 'HP 포션', icon: '🧪', price: 30, sellPrice: 10 },
  { id: 'mp_potion', name: 'MP 포션', icon: '💧', price: 35, sellPrice: 12 },
  { id: 'return_scroll', name: '귀환서', icon: '📜', price: 120, sellPrice: 40 },
]

export const bestiaryEntries = [
  { id: 'slime', name: '슬라임', icon: '🟢', current: 12, required: 100, discovered: true },
  { id: 'blue_dragon_wood', name: '청룡 새끼', icon: '🐉', current: 4, required: 50, discovered: true },
  { id: 'tree_spirit', name: '나무정령', icon: '🌳', current: 0, required: 30, discovered: false },
]

export const achievementEntries = [
  { id: 'slime_100', title: '슬라임 100마리 처치', reward: '골드 300', completed: false },
  { id: 'level_10', title: 'Lv10 달성', reward: '오행 포인트 1', completed: false },
  { id: 'first_boss', title: '첫 보스 처치', reward: '골드 500', completed: false },
]
