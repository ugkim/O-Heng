import { requireSupabase } from '../lib/supabaseClient'
import { DEFAULT_MAP_KEY, getMapDefinition, normalizeMapRow } from '../game/data/maps'

let monsterCatalogPromise = null

export async function fetchMapByKey(mapKey = DEFAULT_MAP_KEY) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .rpc('get_map', {
      p_map_key: mapKey,
    })
    .single()

  if (error) throw error

  const mapData = data?.map_key || data?.map_id ? normalizeMapRow(data) : getMapDefinition(mapKey)
  const monsterCatalog = await fetchMonsterCatalog(supabase)

  return addDatabaseMonstersToMap(mapData, monsterCatalog)
}

async function fetchMonsterCatalog(supabase) {
  if (!monsterCatalogPromise) {
    monsterCatalogPromise = supabase
      .from('monsters')
      .select('monster_key,name,element,sprite_key,hp,attack,defense')
      .then(({ data, error }) => {
        if (error) {
          console.error('몬스터 데이터 로딩 실패:', error)
          return []
        }

        return Array.isArray(data) ? data : []
      })
  }

  return monsterCatalogPromise
}

function addDatabaseMonstersToMap(mapData, monsterCatalog) {
  if (!Array.isArray(monsterCatalog) || monsterCatalog.length === 0) return mapData

  const mapKey = mapData.mapKey || mapData.mapId || DEFAULT_MAP_KEY
  const monsterConfig = { ...(mapData.monsterConfig || {}) }
  const monsterSpawnAreas = [...(mapData.monsterSpawnAreas || [])]
  const platforms = mapData.platforms || mapData.floorData?.platforms || []
  const spawnPlatforms = getMonsterSpawnPlatforms(platforms)

  if (spawnPlatforms.length === 0) {
    return {
      ...mapData,
      monsterConfig,
      monsterSpawnAreas,
    }
  }

  monsterCatalog
    .filter((monster) => shouldPlaceMonsterOnMap(mapKey, monster))
    .forEach((monster, index) => {
      const monsterKey = monster.monster_key
      if (!monsterKey || monsterConfig[monsterKey]) return

      const platform = spawnPlatforms[index % spawnPlatforms.length]
      const radius = getMonsterRadius(monster)

      monsterConfig[monsterKey] = {
        name: monster.name,
        spriteKey: monster.sprite_key,
        hp: monster.hp ?? 30,
        attack: monster.attack ?? 5,
        defense: monster.defense ?? 1,
        exp: getMonsterExp(monster),
        element: monster.element || 'neutral',
        radius,
        dropItems: [
          {
            itemId: 'money',
            name: '돈',
            chance: 100,
            amountMin: Math.max(1, Math.floor(getMonsterPower(monster) / 18)),
            amountMax: Math.max(3, Math.floor(getMonsterPower(monster) / 10)),
          },
        ],
      }

      monsterSpawnAreas.push({
        id: `${mapKey}-${monsterKey}-auto-${index + 1}`,
        platformId: platform.id,
        monsterType: monsterKey,
        maxCount: getMonsterMaxCount(monster),
        spawnChance: getMonsterSpawnChance(monster),
        spawnRange: getPlatformSpawnRange(platform, radius),
      })
    })

  return {
    ...mapData,
    monsterConfig,
    monsterSpawnAreas,
  }
}

function getMonsterSpawnPlatforms(platforms) {
  return platforms.filter((platform) => {
    if (!platform.id || platform.width < 120) return false
    return platform.id.includes('ground') || platform.id.includes('platform') || platform.id.includes('branch')
  })
}

function shouldPlaceMonsterOnMap(mapKey, monster) {
  const power = getMonsterPower(monster)
  const element = monster.element || 'neutral'

  if (mapKey === 'forest01') return power <= 130
  if (mapKey === 'first_field') return power <= 120
  if (mapKey === 'forest_edge') return power <= 220 && ['neutral', 'wood', 'earth'].includes(element)
  if (mapKey === 'forest02') return power >= 90 || ['wood', 'earth', 'metal', 'neutral'].includes(element)
  if (mapKey === 'crystal_cavern') return power >= 130 || ['water', 'metal', 'earth'].includes(element)

  return true
}

function getMonsterPower(monster) {
  return (monster.hp ?? 30) + (monster.attack ?? 5) * 5 + (monster.defense ?? 1) * 4
}

function getMonsterExp(monster) {
  return Math.max(8, Math.round(getMonsterPower(monster) / 5))
}

function getMonsterRadius(monster) {
  return getMonsterPower(monster) >= 220 ? 28 : 24
}

function getMonsterMaxCount(monster) {
  return getMonsterPower(monster) >= 220 ? 1 : 2
}

function getMonsterSpawnChance(monster) {
  return getMonsterPower(monster) >= 220 ? 45 : 80
}

function getPlatformSpawnRange(platform, radius) {
  const padding = Math.max(28, radius + 10)

  return {
    x1: Math.round(platform.x - platform.width / 2 + padding),
    x2: Math.round(platform.x + platform.width / 2 - padding),
  }
}
