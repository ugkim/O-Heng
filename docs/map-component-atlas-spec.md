# Map Component Atlas Spec

This file defines the 1280x1280 PNG atlas policy for map collision visuals.

The existing background images should remain pure backgrounds. Walkable ground, floating platforms, ladders, and portal markers should be rendered from this atlas and placed according to each map's `platforms`, `ladders`, and `portals` data.

## Current Applied Atlas

- Runtime file: `public/assets/sprites/map/forest.png`
- Runtime mapping file: `src/game/data/mapComponentAtlas.js`
- Target atlas size: `1280x1280`
- Coordinate format: `x, y, width, height`
- Coordinate origin: top-left
- Collision boxes still come from map data. The atlas only controls visible sprites.

## 1280 Layout Policy

The atlas is split into two 640x640 theme blocks on the top row and one shared utility area on the bottom row.

| Block | Intended maps | Rect |
| --- | --- | ---: |
| `wind_forest` | `first_field`, `forest_edge`, `forest01` | `0,0,640,640` |
| `deep_forest` | `forest02`, `crystal_cavern` for now | `640,0,640,640` |
| `common` | portals, signs, debug/helper sprites | `0,640,1280,640` |

`training_field` currently reuses `wind_forest`. `crystal_cavern` currently reuses `deep_forest` until a cave-specific atlas is generated.

## Sprite Rules

- Transparent background.
- Platform middle sprites must repeat horizontally without visible seams.
- Ladder middle sprites must repeat vertically without visible seams.
- Keep each sprite inside its assigned rectangle.
- Avoid text labels inside the image.
- Keep collision-facing top edges visually readable, because physics still uses rectangular platform data.

## Local Theme Rects

These local coordinates are relative to the selected theme block.

For `wind_forest`, use the local coordinates as-is.

For `deep_forest`, add `640` to `x`.

| Key | Local rect | Purpose |
| --- | ---: | --- |
| `ground_left` | `24,30,84,100` | Main base ground left end |
| `ground_middle` | `136,30,89,100` | Main base ground repeating middle |
| `ground_right` | `533,30,78,100` | Main base ground right end |
| `platform_left` | `23,157,91,74` | Floating platform left end |
| `platform_middle` | `236,157,95,74` | Floating platform repeating middle |
| `platform_right` | `532,157,80,74` | Floating platform right end |
| `thin_left` | `22,273,93,43` | Thin bridge/branch left end |
| `thin_middle` | `238,273,89,43` | Thin bridge/branch repeating middle |
| `thin_right` | `531,273,81,43` | Thin bridge/branch right end |
| `ladder_top` | `27,338,78,40` | Ladder top cap |
| `ladder_middle` | `27,378,78,40` | Ladder vertical repeating middle |
| `ladder_bottom` | `27,418,78,44` | Ladder bottom cap |

## Absolute Coordinates

### wind_forest

| Key | Rect |
| --- | ---: |
| `wind_forest.ground_left` | `24,30,84,100` |
| `wind_forest.ground_middle` | `136,30,89,100` |
| `wind_forest.ground_right` | `533,30,78,100` |
| `wind_forest.platform_left` | `23,157,91,74` |
| `wind_forest.platform_middle` | `236,157,95,74` |
| `wind_forest.platform_right` | `532,157,80,74` |
| `wind_forest.thin_left` | `22,273,93,43` |
| `wind_forest.thin_middle` | `238,273,89,43` |
| `wind_forest.thin_right` | `531,273,81,43` |
| `wind_forest.ladder_top` | `27,338,78,40` |
| `wind_forest.ladder_middle` | `27,378,78,40` |
| `wind_forest.ladder_bottom` | `27,418,78,44` |

### deep_forest

| Key | Rect |
| --- | ---: |
| `deep_forest.ground_left` | `664,30,84,100` |
| `deep_forest.ground_middle` | `776,30,89,100` |
| `deep_forest.ground_right` | `1173,30,78,100` |
| `deep_forest.platform_left` | `663,157,91,74` |
| `deep_forest.platform_middle` | `876,157,95,74` |
| `deep_forest.platform_right` | `1172,157,80,74` |
| `deep_forest.thin_left` | `662,273,93,43` |
| `deep_forest.thin_middle` | `878,273,89,43` |
| `deep_forest.thin_right` | `1171,273,81,43` |
| `deep_forest.ladder_top` | `667,338,78,40` |
| `deep_forest.ladder_middle` | `667,378,78,40` |
| `deep_forest.ladder_bottom` | `667,418,78,44` |

## Common Coordinates

These coordinates are absolute atlas coordinates.

| Key | Rect | Purpose |
| --- | ---: | --- |
| `portal_forest_idle_01` | `62,920,72,92` | Forest portal animation frame 1 |
| `portal_forest_idle_02` | `214,920,72,92` | Forest portal animation frame 2 |
| `portal_forest_idle_03` | `365,920,72,92` | Forest portal animation frame 3 |
| `portal_forest_idle_04` | `517,920,72,92` | Forest portal animation frame 4 |
| `sign_left` | `365,1040,64,90` | Direction sign, left |
| `sign_right` | `503,1040,64,90` | Direction sign, right |
| `sign_up` | `386,1128,64,90` | Direction sign, up |
| `sign_down` | `512,1128,64,90` | Direction sign, down |

## Map To Theme Mapping

| Map key | Map name | Atlas theme |
| --- | --- | --- |
| `first_field` | 첫 번째 수련장 | `wind_forest` |
| `forest_edge` | 숲의 입구 | `wind_forest` |
| `forest01` | 바람숲 입구 | `wind_forest` |
| `forest02` | 바람숲 깊은 길 | `deep_forest` |
| `crystal_cavern` | 수정 동굴 | `deep_forest` |

## Platform Type Mapping

| Platform condition | Sprite strip |
| --- | --- |
| id contains `ground` or `floor`, or height >= 34 | `ground_left/middle/right` |
| id contains `bridge`, or height <= 20 | `thin_left/middle/right` |
| otherwise | `platform_left/middle/right` |

## Image Generation Request Template

Use this prompt when asking another image model to create or regenerate the atlas:

```text
Create one 1280x1280 transparent PNG sprite atlas for a 2D side-scrolling RPG map.
Use pixel-art friendly painted sprites with clean readable silhouettes and no text labels.
Follow the exact coordinate mapping table provided.
Keep every sprite inside its assigned rectangle.
The top-left 640x640 block is the bright wind forest theme.
The top-right 640x640 block is the darker deep forest theme.
The bottom 1280x640 area contains common portal and direction sign sprites.
Ground and platform middle sprites must tile seamlessly horizontally.
Ladder middle sprites must tile seamlessly vertically.
Do not draw full backgrounds. Only draw map collision components, portals, signs, and optional small decorations on transparent background.
```

