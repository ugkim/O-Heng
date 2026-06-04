-- Connect every map row with previous/next travel portals.
-- Travel order matches get_maps(), so characters can walk through the whole
-- database map catalog without relying on client-side fallback portals.

with ordered_maps as (
  select
    id,
    map_key,
    coalesce(map_id, map_key) as map_id,
    coalesce(map_name, name, map_key) as map_name,
    width,
    height,
    spawn_point,
    spawns,
    row_number() over (
      order by
        case map_key
          when 'first_field' then 1
          when 'forest_edge' then 2
          when 'forest01' then 3
          when 'forest02' then 4
          when 'crystal_cavern' then 5
          else 100
        end,
        map_key
    ) as travel_index
  from public.map
),
portal_edges as (
  select
    source.id as source_id,
    source.map_key as source_map_key,
    source.width as source_width,
    source.height as source_height,
    target.map_key as target_map_key,
    target.map_id as target_map_id,
    target.map_name as target_map_name,
    target.width as target_width,
    target.height as target_height,
    target.spawn_point as target_spawn_point,
    target.spawns as target_spawns,
    'prev'::text as direction,
    'spawn-right'::text as desired_spawn_id,
    1 as portal_order
  from ordered_maps source
  join ordered_maps target on target.travel_index = source.travel_index - 1

  union all

  select
    source.id as source_id,
    source.map_key as source_map_key,
    source.width as source_width,
    source.height as source_height,
    target.map_key as target_map_key,
    target.map_id as target_map_id,
    target.map_name as target_map_name,
    target.width as target_width,
    target.height as target_height,
    target.spawn_point as target_spawn_point,
    target.spawns as target_spawns,
    'next'::text as direction,
    'spawn-left'::text as desired_spawn_id,
    2 as portal_order
  from ordered_maps source
  join ordered_maps target on target.travel_index = source.travel_index + 1
),
portal_payloads as (
  select
    edge.source_id,
    edge.portal_order,
    jsonb_build_object(
      'id',
      edge.source_map_key || '-portal-' || edge.direction,
      'name',
      edge.target_map_name,
      'x',
      case
        when edge.direction = 'prev' then 64
        else greatest(64, coalesce(edge.source_width, 1600) - 64)
      end,
      'y',
      case
        when coalesce(edge.source_height, 540) >= 700 then 550
        else greatest(
          (case when coalesce(edge.source_height, 540) >= 700 then 96 else 88 end) / 2,
          coalesce(edge.source_height, 540) - 118
        )
      end,
      'width',
      44,
      'height',
      case when coalesce(edge.source_height, 540) >= 700 then 96 else 88 end,
      'targetMapKey',
      edge.target_map_key,
      'targetMapId',
      edge.target_map_id,
      'targetSpawnId',
      case when matched_spawn.spawn is null then null else edge.desired_spawn_id end,
      'targetSpawnPoint',
      jsonb_build_object(
        'x',
        coalesce((target_spawn.spawn->>'x')::int, case when edge.direction = 'prev' then greatest(140, coalesce(edge.target_width, 1600) - 140) else 140 end),
        'y',
        coalesce((target_spawn.spawn->>'y')::int, greatest(300, coalesce(edge.target_height, 540) - 130))
      )
    ) as portal
  from portal_edges edge
  left join lateral (
    select value as spawn
    from jsonb_array_elements(
      case when jsonb_typeof(edge.target_spawns) = 'array' then edge.target_spawns else '[]'::jsonb end
    ) as spawn(value)
    where value->>'id' = edge.desired_spawn_id
    limit 1
  ) matched_spawn on true
  cross join lateral (
    select coalesce(
      matched_spawn.spawn,
      case when jsonb_typeof(edge.target_spawn_point) = 'object' then edge.target_spawn_point end,
      jsonb_build_object(
        'x',
        case when edge.direction = 'prev' then greatest(140, coalesce(edge.target_width, 1600) - 140) else 140 end,
        'y',
        greatest(300, coalesce(edge.target_height, 540) - 130)
      )
    ) as spawn
  ) target_spawn
),
portal_groups as (
  select
    source_id,
    jsonb_agg(portal order by portal_order) as portals
  from portal_payloads
  group by source_id
)
update public.map map
set portals = coalesce(portal_groups.portals, '[]'::jsonb)
from ordered_maps
left join portal_groups on portal_groups.source_id = ordered_maps.id
where map.id = ordered_maps.id;
