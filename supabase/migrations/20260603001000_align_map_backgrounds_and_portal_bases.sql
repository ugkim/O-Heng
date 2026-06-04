-- Align map collision data with the real background image coordinate space.
-- Legacy rows kept platforms only in floor_data.platforms, while the app now
-- also reads the top-level platforms column.

update public.map
set
  width = 1800,
  height = 720,
  spawn_point = '{"x":180,"y":560}'::jsonb,
  floor_data = '{
    "platforms": [
      {"id":"ground_left","x":260,"y":610,"width":520,"height":36},
      {"id":"ground_mid","x":860,"y":610,"width":430,"height":36},
      {"id":"ground_right","x":1390,"y":610,"width":420,"height":36},
      {"id":"upper_left","x":520,"y":500,"width":180,"height":24},
      {"id":"upper_right","x":1120,"y":455,"width":220,"height":24},
      {"id":"portal_base_left","x":70,"y":610,"width":140,"height":36}
    ]
  }'::jsonb,
  platforms = '[
    {"id":"ground_left","x":260,"y":610,"width":520,"height":36},
    {"id":"ground_mid","x":860,"y":610,"width":430,"height":36},
    {"id":"ground_right","x":1390,"y":610,"width":420,"height":36},
    {"id":"upper_left","x":520,"y":500,"width":180,"height":24},
    {"id":"upper_right","x":1120,"y":455,"width":220,"height":24},
    {"id":"portal_base_left","x":70,"y":610,"width":140,"height":36}
  ]'::jsonb,
  spawns = '[
    {"id":"spawn-left","x":180,"y":560},
    {"id":"spawn-center","x":860,"y":560},
    {"id":"spawn-right","x":1650,"y":560}
  ]'::jsonb,
  portals = '[
    {"id":"first_field-portal-next","name":"숲의 입구","x":1736,"y":550,"width":44,"height":96,"targetMapKey":"forest_edge","targetSpawnPoint":{"x":140,"y":560}}
  ]'::jsonb,
  monster_config = '{
    "slime": {
      "spawnChance": 100,
      "maxSpawn": 3,
      "hp": 30,
      "attack": 5,
      "defense": 1,
      "exp": 10,
      "element": "neutral",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":1,"amountMax":3}
      ],
      "spawnPoints": [
        {"x":650,"y":574},
        {"x":820,"y":574},
        {"x":1180,"y":419}
      ]
    },
    "blue_dragon_wood": {
      "spawnChance": 30,
      "maxSpawn": 1,
      "hp": 180,
      "attack": 22,
      "defense": 10,
      "exp": 45,
      "element": "wood",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":8,"amountMax":15}
      ],
      "spawnPoints": [
        {"x":1330,"y":574}
      ]
    }
  }'::jsonb,
  background = background || '{"image_url":"/assets/backgrounds/village-west01.webp"}'::jsonb
where map_key = 'first_field';

update public.map
set
  width = 1800,
  height = 720,
  spawn_point = '{"x":140,"y":560}'::jsonb,
  floor_data = '{
    "platforms": [
      {"id":"forest_ground_1","x":240,"y":610,"width":480,"height":36},
      {"id":"forest_ground_2","x":760,"y":610,"width":360,"height":36},
      {"id":"forest_ground_3","x":1240,"y":610,"width":520,"height":36},
      {"id":"forest_ground_4","x":1660,"y":610,"width":300,"height":36},
      {"id":"portal_base_right","x":1740,"y":610,"width":160,"height":36},
      {"id":"low_branch","x":470,"y":500,"width":210,"height":24},
      {"id":"mid_branch","x":920,"y":455,"width":240,"height":24},
      {"id":"high_branch","x":1350,"y":345,"width":220,"height":24}
    ]
  }'::jsonb,
  platforms = '[
    {"id":"forest_ground_1","x":240,"y":610,"width":480,"height":36},
    {"id":"forest_ground_2","x":760,"y":610,"width":360,"height":36},
    {"id":"forest_ground_3","x":1240,"y":610,"width":520,"height":36},
    {"id":"forest_ground_4","x":1660,"y":610,"width":300,"height":36},
    {"id":"portal_base_right","x":1740,"y":610,"width":160,"height":36},
    {"id":"low_branch","x":470,"y":500,"width":210,"height":24},
    {"id":"mid_branch","x":920,"y":455,"width":240,"height":24},
    {"id":"high_branch","x":1350,"y":345,"width":220,"height":24}
  ]'::jsonb,
  spawns = '[
    {"id":"spawn-left","x":140,"y":560},
    {"id":"spawn-right","x":1660,"y":560}
  ]'::jsonb,
  portals = '[
    {"id":"to_first_field","name":"수련장","x":1740,"y":550,"width":44,"height":96,"targetMapKey":"first_field","targetSpawnPoint":{"x":120,"y":560}}
  ]'::jsonb,
  monster_config = '{
    "slime": {
      "spawnChance": 100,
      "maxSpawn": 4,
      "hp": 35,
      "attack": 6,
      "defense": 1,
      "exp": 12,
      "element": "neutral",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":2,"amountMax":5}
      ],
      "spawnPoints": [
        {"x":520,"y":574},
        {"x":780,"y":574},
        {"x":1120,"y":574},
        {"x":1470,"y":574}
      ]
    },
    "blue_dragon_wood": {
      "spawnChance": 20,
      "maxSpawn": 1,
      "hp": 160,
      "attack": 20,
      "defense": 9,
      "exp": 40,
      "element": "wood",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":10,"amountMax":18}
      ],
      "spawnPoints": [
        {"x":1360,"y":309}
      ]
    }
  }'::jsonb,
  background = background || '{"image_url":"/assets/backgrounds/wind-forest.webp"}'::jsonb
where map_key = 'forest_edge';

update public.map
set
  platforms = coalesce(nullif(platforms, '[]'::jsonb), floor_data->'platforms'),
  spawns = coalesce(nullif(spawns, '[]'::jsonb), '[
    {"id":"spawn-left","x":130,"y":398},
    {"id":"spawn-right","x":2140,"y":398}
  ]'::jsonb),
  background = background || '{"image_url":"/assets/backgrounds/cristal-cave01.webp"}'::jsonb
where map_key = 'crystal_cavern';
