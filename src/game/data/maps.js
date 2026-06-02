export const DEFAULT_MAP_KEY = 'forest01'

export const MAP_DEFINITIONS = {
  forest01: {
    mapId: 'forest01',
    mapName: '바람숲 입구',
    width: 1800,
    height: 720,
    platforms: [
      { id: 'forest01-BL-ground-01', x: 220, y: 610, width: 440, height: 36 },
      { id: 'forest01-BC-ground-01', x: 710, y: 610, width: 420, height: 36 },
      { id: 'forest01-BR-ground-01', x: 1260, y: 610, width: 500, height: 36 },
      { id: 'forest01-ML-platform-01', x: 360, y: 485, width: 260, height: 24 },
      { id: 'forest01-MC-platform-01', x: 760, y: 455, width: 280, height: 24 },
      { id: 'forest01-MR-platform-01', x: 1210, y: 500, width: 320, height: 24 },
      { id: 'forest01-TL-platform-01', x: 250, y: 335, width: 220, height: 22 },
      { id: 'forest01-TC-platform-01', x: 850, y: 300, width: 260, height: 22 },
      { id: 'forest01-TR-platform-01', x: 1400, y: 345, width: 240, height: 22 },
      { id: 'forest01-MC-bridge-01', x: 1000, y: 405, width: 210, height: 18 },
      { id: 'forest01-BR-small-01', x: 1510, y: 560, width: 140, height: 20 },
    ],
    ladders: [
      {
        id: 'forest01-BL-ladder-01',
        x: 470,
        y: 485,
        width: 32,
        height: 125,
        from: 'forest01-BL-ground-01',
        to: 'forest01-ML-platform-01',
      },
      {
        id: 'forest01-MC-ladder-01',
        x: 860,
        y: 300,
        width: 32,
        height: 155,
        from: 'forest01-MC-platform-01',
        to: 'forest01-TC-platform-01',
      },
      {
        id: 'forest01-BR-ladder-01',
        x: 1320,
        y: 500,
        width: 32,
        height: 110,
        from: 'forest01-BR-ground-01',
        to: 'forest01-MR-platform-01',
      },
    ],
    portals: [
      {
        id: 'forest01-BL-portal-prev',
        x: 60,
        y: 550,
        width: 44,
        height: 96,
        targetMapId: 'town01',
        targetSpawnId: 'spawn-right',
      },
      {
        id: 'forest01-BR-portal-next',
        x: 1710,
        y: 550,
        width: 44,
        height: 96,
        targetMapId: 'forest02',
        targetSpawnId: 'spawn-left',
      },
    ],
    spawns: [
      { id: 'spawn-left', x: 120, y: 560 },
      { id: 'spawn-center', x: 820, y: 560 },
      { id: 'spawn-right', x: 1640, y: 560 },
    ],
    monsterSpawnAreas: [
      {
        id: 'forest01-BL-mob-01',
        platformId: 'forest01-BL-ground-01',
        monsterType: 'slime',
        maxCount: 4,
        spawnChance: 100,
        spawnRange: { x1: 80, x2: 420 },
      },
      {
        id: 'forest01-MC-mob-01',
        platformId: 'forest01-MC-platform-01',
        monsterType: 'slime',
        maxCount: 3,
        spawnChance: 100,
        spawnRange: { x1: 640, x2: 880 },
      },
      {
        id: 'forest01-BR-mob-01',
        platformId: 'forest01-BR-ground-01',
        monsterType: 'blue_dragon_wood',
        maxCount: 1,
        spawnChance: 40,
        spawnRange: { x1: 1080, x2: 1540 },
      },
    ],
    monsterConfig: {
      slime: {
        hp: 38,
        attack: 6,
        defense: 1,
        exp: 12,
        element: 'neutral',
        dropItems: [
          { itemId: 'money', name: '돈', chance: 100, amountMin: 2, amountMax: 5 },
        ],
      },
      blue_dragon_wood: {
        hp: 170,
        attack: 21,
        defense: 9,
        exp: 44,
        element: 'wood',
        dropItems: [
          { itemId: 'money', name: '돈', chance: 100, amountMin: 10, amountMax: 18 },
        ],
      },
    },
    background: {
      skyColor: '#8ecae6',
      farTreeColor: '#2f6f58',
      treeColor: '#1f5a43',
      groundColor: '#5d3f25',
      platformColor: '#6b4a2e',
      surfaceColor: '#7ac943',
      borderColor: '#284a34',
    },
  },
  forest02: {
    mapId: 'forest02',
    mapName: '바람숲 깊은 길',
    width: 2000,
    height: 720,
    platforms: [
      { id: 'forest02-BL-ground-01', x: 250, y: 610, width: 500, height: 36 },
      { id: 'forest02-BC-ground-01', x: 810, y: 610, width: 420, height: 36 },
      { id: 'forest02-BR-ground-01', x: 1430, y: 610, width: 560, height: 36 },
      { id: 'forest02-FR-ground-01', x: 1870, y: 610, width: 220, height: 36 },
      { id: 'forest02-ML-platform-01', x: 430, y: 500, width: 260, height: 24 },
      { id: 'forest02-MC-platform-01', x: 910, y: 450, width: 300, height: 24 },
      { id: 'forest02-MR-platform-01', x: 1390, y: 495, width: 300, height: 24 },
      { id: 'forest02-TL-platform-01', x: 300, y: 350, width: 220, height: 22 },
      { id: 'forest02-TC-platform-01', x: 980, y: 310, width: 260, height: 22 },
      { id: 'forest02-TR-platform-01', x: 1570, y: 340, width: 260, height: 22 },
      { id: 'forest02-MC-bridge-01', x: 1170, y: 405, width: 220, height: 18 },
    ],
    ladders: [
      {
        id: 'forest02-BL-ladder-01',
        x: 520,
        y: 500,
        width: 32,
        height: 110,
        from: 'forest02-BL-ground-01',
        to: 'forest02-ML-platform-01',
      },
      {
        id: 'forest02-MC-ladder-01',
        x: 1010,
        y: 310,
        width: 32,
        height: 140,
        from: 'forest02-MC-platform-01',
        to: 'forest02-TC-platform-01',
      },
      {
        id: 'forest02-BR-ladder-01',
        x: 1480,
        y: 495,
        width: 32,
        height: 115,
        from: 'forest02-BR-ground-01',
        to: 'forest02-MR-platform-01',
      },
    ],
    portals: [
      {
        id: 'forest02-BL-portal-prev',
        name: '바람숲 입구',
        x: 70,
        y: 550,
        width: 44,
        height: 96,
        targetMapId: 'forest01',
        targetSpawnId: 'spawn-right',
      },
    ],
    spawns: [
      { id: 'spawn-left', x: 130, y: 560 },
      { id: 'spawn-center', x: 960, y: 560 },
      { id: 'spawn-right', x: 1840, y: 560 },
    ],
    monsterSpawnAreas: [
      {
        id: 'forest02-BL-mob-01',
        platformId: 'forest02-BL-ground-01',
        monsterType: 'slime',
        maxCount: 4,
        spawnChance: 100,
        spawnRange: { x1: 120, x2: 470 },
      },
      {
        id: 'forest02-MC-mob-01',
        platformId: 'forest02-MC-platform-01',
        monsterType: 'slime',
        maxCount: 3,
        spawnChance: 100,
        spawnRange: { x1: 780, x2: 1040 },
      },
      {
        id: 'forest02-BR-mob-01',
        platformId: 'forest02-BR-ground-01',
        monsterType: 'blue_dragon_wood',
        maxCount: 2,
        spawnChance: 55,
        spawnRange: { x1: 1210, x2: 1700 },
      },
    ],
    monsterConfig: {
      slime: {
        hp: 48,
        attack: 8,
        defense: 2,
        exp: 16,
        element: 'neutral',
        dropItems: [
          { itemId: 'money', name: '돈', chance: 100, amountMin: 3, amountMax: 7 },
        ],
      },
      blue_dragon_wood: {
        hp: 220,
        attack: 28,
        defense: 13,
        exp: 64,
        element: 'wood',
        dropItems: [
          { itemId: 'money', name: '돈', chance: 100, amountMin: 18, amountMax: 32 },
          { itemId: 'blue_scale', name: '푸른 비늘', chance: 25, amountMin: 1, amountMax: 1 },
        ],
      },
    },
    background: {
      skyColor: '#5f93b8',
      farTreeColor: '#24546a',
      treeColor: '#174736',
      groundColor: '#493620',
      platformColor: '#5d422d',
      surfaceColor: '#63b85e',
      borderColor: '#243f32',
    },
  },
}

export function getMapDefinition(mapKey = DEFAULT_MAP_KEY) {
  return normalizeMapData(MAP_DEFINITIONS[mapKey] || MAP_DEFINITIONS[DEFAULT_MAP_KEY])
}

export function normalizeMapRow(row) {
  if (!row) return getMapDefinition()

  return normalizeMapData({
    id: row.id,
    mapId: row.map_id || row.map_key,
    mapName: row.map_name || row.name,
    width: row.width,
    height: row.height,
    platforms: row.platforms || row.floor_data?.platforms,
    ladders: row.ladders,
    portals: row.portals,
    spawns: row.spawns,
    monsterSpawnAreas: row.monster_spawn_areas,
    monsterConfig: row.monster_config,
    spawnPoint: row.spawn_point,
    background: row.background,
  })
}

export function normalizeMapData(mapData) {
  const platforms = mapData.platforms || mapData.floorData?.platforms || []
  const spawns = mapData.spawns || []
  const spawnPoint = mapData.spawnPoint || spawns[0] || { x: 180, y: 410 }

  return {
    ...mapData,
    mapKey: mapData.mapId || mapData.mapKey,
    mapId: mapData.mapId || mapData.mapKey,
    name: mapData.mapName || mapData.name,
    mapName: mapData.mapName || mapData.name,
    width: mapData.width || 1600,
    height: mapData.height || 540,
    spawnPoint,
    platforms,
    floorData: { platforms },
    ladders: mapData.ladders || [],
    portals: normalizePortals(mapData.portals || []),
    spawns,
    monsterSpawnAreas: mapData.monsterSpawnAreas || [],
    monsterConfig: mapData.monsterConfig || {},
    background: mapData.background || {},
  }
}

function normalizePortals(portals) {
  return portals.map((portal) => ({
    ...portal,
    targetMapKey: portal.targetMapKey || portal.targetMapId,
    targetMapId: portal.targetMapId || portal.targetMapKey,
  }))
}
