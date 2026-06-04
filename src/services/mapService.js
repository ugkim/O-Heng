import { requireSupabase } from '../lib/supabaseClient'
import { DEFAULT_MAP_KEY, getMapDefinition, normalizeMapRow } from '../game/data/maps'

let monsterCatalogPromise = null
let mapCatalogPromise = null

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
  const mapCatalog = await fetchMapCatalog(supabase)

  return addDatabaseMonstersToMap(addConnectedPortalsToMap(mapData, mapCatalog), monsterCatalog)
}

export async function fetchAvailableMaps() {
  const supabase = requireSupabase()
  return fetchMapCatalog(supabase)
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

async function fetchMapCatalog(supabase) {
  if (!mapCatalogPromise) {
    mapCatalogPromise = fetchMapRows(supabase).then((rows) => {
      const normalizedRows = rows
        .map((row) => normalizeMapRow(row))
        .filter((map) => map.mapKey)

      if (normalizedRows.length === 0) {
        return Object.keys(getLocalMapCatalog()).map((mapKey) => getMapDefinition(mapKey))
      }

      const mapsByKey = new Map()
      normalizedRows.forEach((map) => mapsByKey.set(map.mapKey, map))

      Object.values(getLocalMapCatalog()).forEach((map) => {
        if (!mapsByKey.has(map.mapKey)) {
          mapsByKey.set(map.mapKey, map)
        }
      })

      return sortMapsForTravel([...mapsByKey.values()])
    })
  }

  return mapCatalogPromise
}

async function fetchMapRows(supabase) {
  const rpcResult = await supabase.rpc('get_maps')
  if (!rpcResult.error && Array.isArray(rpcResult.data)) {
    return rpcResult.data
  }

  const tableResult = await supabase
    .from('map')
    .select(
      'id,map_key,map_id,name,map_name,width,height,spawn_point,floor_data,platforms,ladders,portals,spawns,monster_spawn_areas,monster_config,background,background_url',
    )
    .order('map_key')

  if (tableResult.error) {
    console.error('맵 목록 로딩 실패:', rpcResult.error || tableResult.error)
    return []
  }

  return Array.isArray(tableResult.data) ? tableResult.data : []
}

function getLocalMapCatalog() {
  return {
    forest_edge: getMapDefinition('forest_edge'),
    [DEFAULT_MAP_KEY]: getMapDefinition(DEFAULT_MAP_KEY),
    forest02: getMapDefinition('forest02'),
  }
}

function sortMapsForTravel(maps) {
  const preferredOrder = ['first_field', 'forest_edge', 'forest01', 'forest02', 'crystal_cavern']
  const orderIndex = new Map(preferredOrder.map((mapKey, index) => [mapKey, index]))

  return maps.sort((a, b) => {
    const aOrder = orderIndex.has(a.mapKey) ? orderIndex.get(a.mapKey) : Number.MAX_SAFE_INTEGER
    const bOrder = orderIndex.has(b.mapKey) ? orderIndex.get(b.mapKey) : Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) return aOrder - bOrder
    return String(a.mapKey).localeCompare(String(b.mapKey))
  })
}

function addConnectedPortalsToMap(mapData, mapCatalog) {
  if (!mapData?.mapKey || !Array.isArray(mapCatalog) || mapCatalog.length <= 1) return mapData

  const knownMapKeys = new Set(mapCatalog.map((map) => map.mapKey))
  const mapIndex = mapCatalog.findIndex((map) => map.mapKey === mapData.mapKey)
  if (mapIndex < 0) return mapData

  const portals = (mapData.portals || []).filter((portal) =>
    knownMapKeys.has(portal.targetMapKey || portal.targetMapId),
  )
  const existingTargets = new Set(portals.map((portal) => portal.targetMapKey || portal.targetMapId))
  const previousMap = mapCatalog[mapIndex - 1]
  const nextMap = mapCatalog[mapIndex + 1]

  if (previousMap && !existingTargets.has(previousMap.mapKey)) {
    portals.unshift(createTravelPortal(mapData, previousMap, 'prev'))
  }

  if (nextMap && !existingTargets.has(nextMap.mapKey)) {
    portals.push(createTravelPortal(mapData, nextMap, 'next'))
  }

  return {
    ...mapData,
    portals,
  }
}

function createTravelPortal(sourceMap, targetMap, direction) {
  const isPrevious = direction === 'prev'
  const spawn = getDirectionalSpawn(targetMap, isPrevious ? 'right' : 'left')
  const portalHeight = sourceMap.height >= 700 ? 96 : 88
  const portalWidth = 44
  const x = isPrevious ? 64 : Math.max(64, (sourceMap.width || 1600) - 64)
  const y = sourceMap.height >= 700 ? 550 : Math.max(portalHeight / 2, (sourceMap.height || 540) - 118)

  return {
    id: `${sourceMap.mapKey}-auto-portal-${direction}`,
    name: targetMap.mapName || targetMap.name || targetMap.mapKey,
    x,
    y,
    width: portalWidth,
    height: portalHeight,
    targetMapKey: targetMap.mapKey,
    targetMapId: targetMap.mapKey,
    targetSpawnId: spawn.id,
    targetSpawnPoint: { x: spawn.x, y: spawn.y },
  }
}

function getDirectionalSpawn(mapData, direction) {
  const namedSpawn = mapData.spawns?.find((spawn) => spawn.id === `spawn-${direction}`)
  if (namedSpawn) return namedSpawn

  if (mapData.spawnPoint?.x != null && mapData.spawnPoint?.y != null) {
    return mapData.spawnPoint
  }

  return {
    x: direction === 'right' ? Math.max(140, (mapData.width || 1600) - 140) : 140,
    y: Math.max(300, (mapData.height || 540) - 130),
  }
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
