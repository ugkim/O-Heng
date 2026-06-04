import { getExpToNextLevel } from '../systems/levelSystem'
import { calculateCharacterStats } from './characterStats'

export function createInitialPlayerState(character = null) {
  const level = character?.level || 1
  const stats = calculateCharacterStats(character || { level })

  return {
    id: character?.id || null,
    level,
    exp: character?.exp || 0,
    expToNextLevel: getExpToNextLevel(level),
    gold: character?.gold || 0,
    elementPoints: character?.element_points || 0,
    elements: character?.elements || {},
    attack: stats.attack,
    defense: stats.defense,
    dex: stats.dex,
    maxHp: stats.maxHp,
    currentHp: Math.min(character?.hp ?? stats.maxHp, stats.maxHp),
    maxMp: stats.maxMp,
    currentMp: Math.min(character?.mp ?? stats.maxMp, stats.maxMp),
  }
}
