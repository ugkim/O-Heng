export const MAP_COMPONENT_ATLAS = {
  imageUrl: '/assets/sprites/map/forest.png',
  textureKey: 'map-components:forest',
  width: 1280,
  height: 1280,
  tileSize: 64,
  coordinateMode: 'x-y-width-height',
}

export const MAP_THEME_BY_KEY = {
  first_field: 'wind_forest',
  forest_edge: 'wind_forest',
  forest01: 'wind_forest',
  forest02: 'deep_forest',
  crystal_cavern: 'deep_forest',
}

export const MAP_THEME_BLOCKS = {
  training_field: { x: 0, y: 0, width: 640, height: 640 },
  wind_forest: { x: 0, y: 0, width: 640, height: 640 },
  deep_forest: { x: 640, y: 0, width: 640, height: 640 },
  crystal_cavern: { x: 640, y: 0, width: 640, height: 640 },
  common: { x: 0, y: 640, width: 1280, height: 640 },
}

export const MAP_COMPONENT_LOCAL_RECTS = {
  ground_left: { x: 24, y: 30, width: 84, height: 100 },
  ground_middle: { x: 136, y: 30, width: 89, height: 100 },
  ground_right: { x: 533, y: 30, width: 78, height: 100 },
  ground_fill: { x: 192, y: 0, width: 64, height: 64 },
  ground_top_overlay: { x: 256, y: 0, width: 64, height: 64 },
  ground_crack_variant: { x: 320, y: 0, width: 64, height: 64 },
  ground_shadow: { x: 384, y: 0, width: 64, height: 64 },
  ground_corner_detail: { x: 448, y: 0, width: 64, height: 64 },

  platform_left: { x: 23, y: 157, width: 91, height: 74 },
  platform_middle: { x: 236, y: 157, width: 95, height: 74 },
  platform_right: { x: 532, y: 157, width: 80, height: 74 },
  platform_fill: { x: 192, y: 64, width: 64, height: 64 },
  platform_top_overlay: { x: 256, y: 64, width: 64, height: 64 },
  platform_crack_variant: { x: 320, y: 64, width: 64, height: 64 },
  platform_shadow: { x: 384, y: 64, width: 64, height: 64 },
  platform_corner_detail: { x: 448, y: 64, width: 64, height: 64 },

  thin_left: { x: 22, y: 273, width: 93, height: 43 },
  thin_middle: { x: 238, y: 273, width: 89, height: 43 },
  thin_right: { x: 531, y: 273, width: 81, height: 43 },
  thin_fill: { x: 192, y: 128, width: 64, height: 64 },
  thin_top_overlay: { x: 256, y: 128, width: 64, height: 64 },
  thin_variant: { x: 320, y: 128, width: 64, height: 64 },
  thin_shadow: { x: 384, y: 128, width: 64, height: 64 },
  thin_corner_detail: { x: 448, y: 128, width: 64, height: 64 },

  ladder_top: { x: 27, y: 338, width: 78, height: 40 },
  ladder_middle: { x: 27, y: 378, width: 78, height: 40 },
  ladder_bottom: { x: 27, y: 418, width: 78, height: 44 },
  ladder_broken_top: { x: 192, y: 192, width: 64, height: 64 },
  ladder_broken_middle: { x: 256, y: 192, width: 64, height: 64 },
  ladder_broken_bottom: { x: 320, y: 192, width: 64, height: 64 },
  ladder_shadow: { x: 384, y: 192, width: 64, height: 64 },
  ladder_rope_detail: { x: 448, y: 192, width: 64, height: 64 },

  slope_up_left: { x: 0, y: 256, width: 64, height: 64 },
  slope_up_right: { x: 64, y: 256, width: 64, height: 64 },
  slope_down_left: { x: 128, y: 256, width: 64, height: 64 },
  slope_down_right: { x: 192, y: 256, width: 64, height: 64 },
  step_small: { x: 256, y: 256, width: 64, height: 64 },
  step_tall: { x: 320, y: 256, width: 64, height: 64 },
  edge_vine_or_chain: { x: 384, y: 256, width: 64, height: 64 },
  edge_detail_alt: { x: 448, y: 256, width: 64, height: 64 },

  deco_01: { x: 0, y: 320, width: 64, height: 64 },
  deco_02: { x: 64, y: 320, width: 64, height: 64 },
  deco_03: { x: 128, y: 320, width: 64, height: 64 },
  deco_04: { x: 192, y: 320, width: 64, height: 64 },
  deco_05: { x: 256, y: 320, width: 64, height: 64 },
  deco_06: { x: 320, y: 320, width: 64, height: 64 },
  deco_07: { x: 384, y: 320, width: 64, height: 64 },
  deco_08: { x: 448, y: 320, width: 64, height: 64 },

  deco_large_01: { x: 0, y: 384, width: 128, height: 128 },
  deco_large_02: { x: 128, y: 384, width: 128, height: 128 },
  deco_large_03: { x: 256, y: 384, width: 128, height: 128 },
  deco_large_04: { x: 384, y: 384, width: 128, height: 128 },
}

export const COMMON_COMPONENT_RECTS = {
  portal_forest_idle_01: { x: 62, y: 920, width: 72, height: 92 },
  portal_forest_idle_02: { x: 214, y: 920, width: 72, height: 92 },
  portal_forest_idle_03: { x: 365, y: 920, width: 72, height: 92 },
  portal_forest_idle_04: { x: 517, y: 920, width: 72, height: 92 },
  portal_cavern_idle_01: { x: 256, y: 512, width: 64, height: 64 },
  portal_cavern_idle_02: { x: 320, y: 512, width: 64, height: 64 },
  portal_cavern_idle_03: { x: 384, y: 512, width: 64, height: 64 },
  portal_cavern_idle_04: { x: 448, y: 512, width: 64, height: 64 },
  portal_large_forest: { x: 0, y: 576, width: 128, height: 128 },
  portal_large_cavern: { x: 128, y: 576, width: 128, height: 128 },
  sign_left: { x: 256, y: 576, width: 64, height: 64 },
  sign_right: { x: 320, y: 576, width: 64, height: 64 },
  sign_up: { x: 384, y: 576, width: 64, height: 64 },
  sign_down: { x: 448, y: 576, width: 64, height: 64 },
  collision_debug_ground: { x: 0, y: 704, width: 64, height: 64 },
  collision_debug_platform: { x: 64, y: 704, width: 64, height: 64 },
  collision_debug_ladder: { x: 128, y: 704, width: 64, height: 64 },
}

export function getAtlasRect(themeKey, componentKey) {
  if (themeKey === 'common') return COMMON_COMPONENT_RECTS[componentKey] || null

  const block = MAP_THEME_BLOCKS[themeKey]
  const localRect = MAP_COMPONENT_LOCAL_RECTS[componentKey]
  if (!block || !localRect) return null

  return {
    x: block.x + localRect.x,
    y: block.y + localRect.y,
    width: localRect.width,
    height: localRect.height,
  }
}

export function getMapThemeKey(mapKey) {
  return MAP_THEME_BY_KEY[mapKey] || 'wind_forest'
}

export function getPlatformComponentSet(platform = {}) {
  const id = platform.id || ''

  if (id.includes('bridge') || platform.height <= 20) {
    return ['thin_left', 'thin_middle', 'thin_right']
  }

  if (id.includes('ground') || id.includes('floor') || platform.height >= 34) {
    return ['ground_left', 'ground_middle', 'ground_right']
  }

  return ['platform_left', 'platform_middle', 'platform_right']
}
