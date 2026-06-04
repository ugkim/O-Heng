const mageFireSprite = {
  type: 'character',
  job: 'mage',
  element: 'fire',
  src: '/assets/sprites/characters/mage-fire.png',
  columns: 4,
  rows: 4,
  frameCount: 16,
  sourceWidth: 1280,
  sourceHeight: 1280,
  frameWidth: 320,
  frameHeight: 320,
  renderWidth: 64,
  renderHeight: 64,
  animations: {
    idle: [0],
    walk: [0, 1, 2, 3],
    jump: [4],
    attack: [8, 9, 10, 11],
  },
}

const defaultNoviceSprite = {
  type: 'character',
  job: 'novice',
  element: 'none',
  src: '/assets/sprites/characters/default-novice.jpg',
  columns: 8,
  rows: 8,
  frameCount: 56,
  sourceWidth: 1280,
  sourceHeight: 1280,
  frameWidth: 160,
  frameHeight: 160,
  renderWidth: 64,
  renderHeight: 64,
  animations: {
    idle: [0, 1, 2],
    walk: [3, 4, 5],
    jump: [6],
    attack: [16, 17, 18],
  },
}

const soilKnightSprite = {
  type: 'character',
  job: 'knight',
  element: 'earth',
  src: '/assets/sprites/characters/soil-knight.png',
  columns: 8,
  rows: 8,
  frameCount: 64,
  sourceWidth: 512,
  sourceHeight: 512,
  frameWidth: 64,
  frameHeight: 64,
  renderWidth: 64,
  renderHeight: 64,
  animations: {
    idle: [0, 1, 2],
    walkRight: [3, 4, 5],
    walk: [3, 4, 5],
    jump: [6],
    land: [7],
    walkLeft: [8, 9, 10],
    climb: [11, 12, 13],
    attack: [14, 15, 16, 17, 18],
    dead: [19, 20, 21, 22],
    skill1: [24, 25],
    skill2: [26, 27],
    skill3: [28, 29],
    skill4: [30, 31],
    skill5: [32, 33],
    skill6: [34, 35],
    skill7: [36, 37],
    skill8: [38, 39],
    skill9: [40, 41],
    skill10: [42, 43],
    skill11: [44, 45],
    skill12: [46, 47],
    skill13: [48, 49],
    skill14: [50, 51],
    skill15: [52, 53],
    skill16: [54, 55],
  },
}

export const spriteMap = {
  characters: {
    novice: defaultNoviceSprite,
    mage_fire: {
      ...mageFireSprite,
      type: 'character',
      job: 'mage',
      element: 'fire',
    },
    knight_earth: {
      ...soilKnightSprite,
    },
    archer_metal: {
      ...mageFireSprite,
      job: 'archer',
      element: 'metal',
    },
    cleric_water: {
      ...mageFireSprite,
      job: 'cleric',
      element: 'water',
    },
    spirit_wood: {
      ...mageFireSprite,
      job: 'spirit',
      element: 'wood',
    },
  },

  monsters: {
    blue_dragon_wood: {
      type: 'monster',
      name: '청룡',
      element: 'wood',
      src: '/assets/sprites/monsters/blue-dragon-wood.png',
      columns: 10,
      rows: 5,
      frameCount: 50,
      sourceWidth: 1280,
      sourceHeight: 853,
      autoDetectSize: true,
      renderWidth: 96,
      renderHeight: 64,
    },
  },
}

export function findSprite(spriteKey) {
  return spriteMap.characters[spriteKey] || spriteMap.monsters[spriteKey] || null
}

export function getCharacterSpriteKey(character) {
  const level = Number(character?.level) || 1
  const job = character?.job || 'mage'
  const element = character?.main_element || defaultElementByJob[job] || 'fire'
  const traitKey = `${job}_${element}`
  const explicitSpriteKey = character?.sprite_key || character?.spriteKey

  if (explicitSpriteKey && explicitSpriteKey !== 'novice' && spriteMap.characters[explicitSpriteKey]) {
    return explicitSpriteKey
  }

  if (spriteMap.characters[traitKey]) return traitKey
  if (explicitSpriteKey && spriteMap.characters[explicitSpriteKey]) return explicitSpriteKey
  if (spriteMap.characters[job]) return job
  if (level <= 5 && spriteMap.characters.novice) return 'novice'

  return 'mage_fire'
}

export function resolveCharacterSprite(character) {
  const key = getCharacterSpriteKey(character)

  return {
    key,
    ...findSprite(key),
  }
}

const defaultElementByJob = {
  knight: 'earth',
  mage: 'fire',
  archer: 'metal',
  cleric: 'water',
  spirit: 'wood',
}
