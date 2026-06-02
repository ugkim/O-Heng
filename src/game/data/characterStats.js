const BASE_STATS = {
  maxHp: 100,
  maxMp: 50,
  attack: 10,
  defense: 5,
  dex: 5,
}

function getElementValue(elements, key) {
  return Math.max(0, Number(elements?.[key]) || 0)
}

export function calculateCharacterStats(character = {}) {
  const level = Math.max(1, Number(character?.level) || 1)
  const elements = character?.elements || {}
  const wood = getElementValue(elements, 'wood')
  const fire = getElementValue(elements, 'fire')
  const earth = getElementValue(elements, 'earth')
  const metal = getElementValue(elements, 'metal')
  const water = getElementValue(elements, 'water')
  const levelBonus = level - 1

  return {
    maxHp: BASE_STATS.maxHp + levelBonus * 8 + earth * 14 + wood * 3,
    maxMp: BASE_STATS.maxMp + levelBonus * 4 + water * 10 + wood * 2,
    attack: BASE_STATS.attack + levelBonus + fire * 2 + Math.floor(wood / 2),
    defense: BASE_STATS.defense + Math.floor(levelBonus / 2) + earth + Math.floor(wood / 3),
    dex: BASE_STATS.dex + Math.floor(levelBonus / 2) + metal * 2 + Math.floor(wood / 2),
  }
}

export function getPersistableCharacterStats(character = {}) {
  const stats = calculateCharacterStats(character)

  return {
    max_hp: stats.maxHp,
    max_mp: stats.maxMp,
    attack: stats.attack,
    defense: stats.defense,
    dex: stats.dex,
  }
}
