export const AVATAR_ACTIONS = {
  stand: {
    label: '서기',
    coreActionName: 'stand',
    partsActionName: 'stand',
    pose: 'stand',
  },
  walk: {
    label: '걷기',
    coreActionName: 'walk',
    partsActionName: 'walk',
    pose: 'walk',
  },
  jump: {
    label: '점프',
    coreActionName: 'jump',
    partsActionName: 'jump',
    pose: 'jump',
  },
  attack: {
    label: '공격',
    coreActionName: 'swingO1',
    partsActionName: 'swingO1',
    pose: 'attack',
  },
}

export const AVATAR_SLOT_ORDER = [
  'body',
  'face',
  'hair',
  'cape',
  'top',
  'bottom',
  'shoes',
  'hat',
  'weapon',
]

export const AVATAR_CATEGORIES = [
  { key: 'body', label: '바디' },
  { key: 'hair', label: '헤어' },
  { key: 'face', label: '얼굴' },
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'shoes', label: '신발' },
  { key: 'hat', label: '모자' },
  { key: 'cape', label: '망토' },
  { key: 'weapon', label: '무기' },
]

export const AVATAR_ITEMS = {
  body: [
    {
      id: 'body_light',
      slot: 'body',
      name: '라이트 스킨',
      palette: { skin: '#f2c0a2', shade: '#d89375' },
    },
    {
      id: 'body_warm',
      slot: 'body',
      name: '웜 스킨',
      palette: { skin: '#c9855b', shade: '#9f6344' },
    },
    {
      id: 'body_cool',
      slot: 'body',
      name: '쿨 스킨',
      palette: { skin: '#e2b7a9', shade: '#bc8175' },
    },
  ],
  hair: [
    {
      id: 'hair_black_mop',
      slot: 'hair',
      name: '검은 더벅머리',
      shape: 'mop',
      palette: { hair: '#2a2224', shine: '#55474a' },
    },
    {
      id: 'hair_brown_bob',
      slot: 'hair',
      name: '브라운 보브',
      shape: 'bob',
      palette: { hair: '#7b4b2c', shine: '#b17242' },
    },
    {
      id: 'hair_blue_spike',
      slot: 'hair',
      name: '블루 스파이크',
      shape: 'spike',
      palette: { hair: '#255f9c', shine: '#72b9ff' },
    },
  ],
  face: [
    {
      id: 'face_clear',
      slot: 'face',
      name: '초롱 눈',
      expression: 'clear',
    },
    {
      id: 'face_focus',
      slot: 'face',
      name: '집중 눈',
      expression: 'focus',
    },
    {
      id: 'face_smile',
      slot: 'face',
      name: '미소 눈',
      expression: 'smile',
    },
  ],
  top: [
    {
      id: 'top_green_hoodie',
      slot: 'top',
      name: '초록 후드',
      palette: { main: '#2f9e68', trim: '#c6f6d5' },
    },
    {
      id: 'top_red_jacket',
      slot: 'top',
      name: '붉은 재킷',
      palette: { main: '#b13b3f', trim: '#ffd166' },
    },
    {
      id: 'top_blue_tunic',
      slot: 'top',
      name: '푸른 튜닉',
      palette: { main: '#2e6bb8', trim: '#dbeafe' },
    },
  ],
  bottom: [
    {
      id: 'bottom_denim',
      slot: 'bottom',
      name: '데님 팬츠',
      palette: { main: '#314b7d', trim: '#83a0d8' },
    },
    {
      id: 'bottom_brown',
      slot: 'bottom',
      name: '브라운 팬츠',
      palette: { main: '#6b4f2a', trim: '#b59b68' },
    },
    {
      id: 'bottom_black',
      slot: 'bottom',
      name: '블랙 팬츠',
      palette: { main: '#252a32', trim: '#64748b' },
    },
  ],
  shoes: [
    {
      id: 'shoes_canvas',
      slot: 'shoes',
      name: '캔버스화',
      palette: { main: '#f7f0d6', sole: '#806044' },
    },
    {
      id: 'shoes_boots',
      slot: 'shoes',
      name: '가죽 부츠',
      palette: { main: '#4a2c1f', sole: '#1f1713' },
    },
    {
      id: 'shoes_silver',
      slot: 'shoes',
      name: '실버 슈즈',
      palette: { main: '#bcc8d4', sole: '#5a6675' },
    },
  ],
  hat: [
    {
      id: null,
      slot: 'hat',
      name: '없음',
    },
    {
      id: 'hat_leaf',
      slot: 'hat',
      name: '잎새 모자',
      shape: 'leaf',
      palette: { main: '#3ca66b', trim: '#a7f3d0' },
    },
    {
      id: 'hat_cap',
      slot: 'hat',
      name: '모험가 캡',
      shape: 'cap',
      palette: { main: '#334155', trim: '#facc15' },
    },
  ],
  cape: [
    {
      id: null,
      slot: 'cape',
      name: '없음',
    },
    {
      id: 'cape_amber',
      slot: 'cape',
      name: '호박빛 망토',
      palette: { main: '#c56b2d', trim: '#ffd166' },
    },
    {
      id: 'cape_mint',
      slot: 'cape',
      name: '민트 망토',
      palette: { main: '#318a83', trim: '#9ff5e8' },
    },
  ],
  weapon: [
    {
      id: null,
      slot: 'weapon',
      name: '없음',
    },
    {
      id: 'weapon_wood_sword',
      slot: 'weapon',
      name: '나무 검',
      shape: 'sword',
      palette: { main: '#9b6b38', blade: '#e7d4a8' },
    },
    {
      id: 'weapon_staff',
      slot: 'weapon',
      name: '초보 지팡이',
      shape: 'staff',
      palette: { main: '#6f4d2e', blade: '#7dd3fc' },
    },
  ],
}

export const DEFAULT_AVATAR_APPEARANCE = {
  version: 1,
  bodyScale: 1,
  direction: 'right',
  action: 'stand',
}

export const DEFAULT_EQUIPPED_AVATAR = {
  body: 'body_light',
  hair: 'hair_black_mop',
  face: 'face_clear',
  top: 'top_green_hoodie',
  bottom: 'bottom_denim',
  shoes: 'shoes_canvas',
  hat: null,
  cape: null,
  weapon: null,
}

export function createDefaultAvatarAppearance() {
  return { ...DEFAULT_AVATAR_APPEARANCE }
}

export function createDefaultEquippedAvatar() {
  return { ...DEFAULT_EQUIPPED_AVATAR }
}

export function getAvatarItem(slot, itemId) {
  return (AVATAR_ITEMS[slot] || []).find((item) => item.id === itemId) || null
}

export function resolveAvatarParts(equippedAvatar = {}) {
  const equipped = {
    ...DEFAULT_EQUIPPED_AVATAR,
    ...(equippedAvatar || {}),
  }

  return AVATAR_SLOT_ORDER.map((slot) => ({
    slot,
    item: getAvatarItem(slot, equipped[slot]),
  }))
}
