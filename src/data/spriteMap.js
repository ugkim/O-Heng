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

export const spriteMap = {
  characters: {
    novice: {
      ...mageFireSprite,
      job: 'novice',
      element: 'none',
    },
    mage_fire: {
      ...mageFireSprite,
      type: 'character',
      job: 'mage',
      element: 'fire',
    },
    knight_earth: {
      ...mageFireSprite,
      job: 'knight',
      element: 'earth',
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

  if (level <= 5 && spriteMap.characters.novice) return 'novice'

  const job = character?.job || 'mage'
  const element = character?.main_element || defaultElementByJob[job] || 'fire'
  const traitKey = `${job}_${element}`

  if (spriteMap.characters[traitKey]) return traitKey
  if (character?.sprite_key && spriteMap.characters[character.sprite_key]) return character.sprite_key
  if (spriteMap.characters[job]) return job

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
