const BASE_EXP_TO_NEXT_LEVEL = 100
const BASE_ELEMENT_POINTS_PER_LEVEL = 10
const ELEMENT_POINT_TIER_SIZE = 5
const ELEMENT_POINT_TIER_BONUS = 5

export function getExpToNextLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1)
  return Math.floor(BASE_EXP_TO_NEXT_LEVEL * safeLevel ** 1.45 + (safeLevel - 1) * 25)
}

export function getElementPointRewardForLevel(level) {
  const safeLevel = Math.max(2, Number(level) || 2)
  return (
    BASE_ELEMENT_POINTS_PER_LEVEL +
    Math.floor(safeLevel / ELEMENT_POINT_TIER_SIZE) * ELEMENT_POINT_TIER_BONUS
  )
}

export function addExperience(playerState, amount) {
  playerState.exp += amount

  const levelUps = []
  let gainedElementPoints = 0

  // 한 번에 큰 경험치를 얻는 경우를 대비해 while로 처리한다.
  while (playerState.exp >= getExpToNextLevel(playerState.level)) {
    playerState.exp -= getExpToNextLevel(playerState.level)
    playerState.level += 1

    const elementPointReward = getElementPointRewardForLevel(playerState.level)
    playerState.elementPoints += elementPointReward
    gainedElementPoints += elementPointReward
    levelUps.push({
      level: playerState.level,
      elementPointReward,
    })
  }

  playerState.expToNextLevel = getExpToNextLevel(playerState.level)

  return {
    leveledUp: levelUps.length > 0,
    levelUps,
    gainedElementPoints,
  }
}
