-- Phone account + 3 character slot schema for Supabase SQL Editor.
-- Password hashing and login checks are handled inside PostgreSQL with pgcrypto.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  password_hash text not null,
  failed_login_count int not null default 0,
  warning_count int not null default 0,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  slot_no int not null check (slot_no between 1 and 3),
  name text not null,
  job text,
  main_element text,
  sprite_key text,
  elements jsonb not null default '{}'::jsonb,
  element_points int not null default 0,
  level int not null default 1,
  exp int not null default 0,
  gold int not null default 0,
  hp int not null default 100,
  max_hp int not null default 100,
  mp int not null default 50,
  max_mp int not null default 50,
  attack int not null default 10,
  defense int not null default 5,
  dex int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, slot_no)
);

create index if not exists characters_account_id_idx on public.characters(account_id);

alter table public.characters
add column if not exists job text,
add column if not exists main_element text,
add column if not exists sprite_key text,
add column if not exists elements jsonb not null default '{}'::jsonb,
add column if not exists element_points int not null default 0,
add column if not exists mp int not null default 50,
add column if not exists max_mp int not null default 50,
add column if not exists attack int not null default 10,
add column if not exists defense int not null default 5,
add column if not exists dex int not null default 5;

create table if not exists public.monsters (
  id uuid primary key default gen_random_uuid(),
  monster_key text not null unique,
  name text not null,
  element text not null,
  sprite_key text not null,
  hp integer default 100,
  attack integer default 10,
  defense integer default 5,
  created_at timestamptz default now()
);

insert into public.monsters (
  monster_key,
  name,
  element,
  sprite_key,
  hp,
  attack,
  defense
)
values (
  'blue_dragon_wood',
  '청룡',
  'wood',
  'blue_dragon_wood',
  150,
  18,
  8
)
on conflict (monster_key) do nothing;

create table if not exists public.map (
  id uuid primary key default gen_random_uuid(),
  map_key text not null unique,
  name text not null,
  width integer not null default 1600 check (width > 0),
  height integer not null default 540 check (height > 0),
  spawn_point jsonb not null default '{"x":180,"y":410}'::jsonb check (jsonb_typeof(spawn_point) = 'object'),
  floor_data jsonb not null default '{"platforms":[]}'::jsonb check (jsonb_typeof(floor_data) = 'object'),
  monster_config jsonb not null default '{}'::jsonb check (jsonb_typeof(monster_config) = 'object'),
  portals jsonb not null default '[]'::jsonb check (jsonb_typeof(portals) = 'array'),
  background jsonb not null default '{}'::jsonb check (jsonb_typeof(background) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists map_map_key_idx on public.map(map_key);

alter table public.map
add column if not exists map_id text,
add column if not exists map_name text,
add column if not exists platforms jsonb not null default '[]'::jsonb check (jsonb_typeof(platforms) = 'array'),
add column if not exists ladders jsonb not null default '[]'::jsonb check (jsonb_typeof(ladders) = 'array'),
add column if not exists spawns jsonb not null default '[]'::jsonb check (jsonb_typeof(spawns) = 'array'),
add column if not exists monster_spawn_areas jsonb not null default '[]'::jsonb check (jsonb_typeof(monster_spawn_areas) = 'array');

create index if not exists map_map_id_idx on public.map(map_id);

insert into public.map (
  map_key,
  name,
  width,
  height,
  spawn_point,
  floor_data,
  monster_config,
  portals,
  background
)
values (
  'first_field',
  '첫 번째 수련장',
  1600,
  540,
  '{"x":180,"y":410}'::jsonb,
  '{
    "platforms": [
      {"id":"ground_left","x":250,"y":469,"width":520,"height":34},
      {"id":"ground_mid","x":850,"y":469,"width":430,"height":34},
      {"id":"ground_right","x":1330,"y":469,"width":420,"height":34},
      {"id":"upper_left","x":520,"y":368,"width":180,"height":24},
      {"id":"upper_right","x":1120,"y":330,"width":220,"height":24}
    ]
  }'::jsonb,
  '{
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
        {"x":650,"y":438},
        {"x":820,"y":438},
        {"x":1180,"y":294}
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
        {"x":1330,"y":438}
      ]
    }
  }'::jsonb,
  '[
    {"id":"to_town","name":"마을","x":64,"y":430,"width":44,"height":88,"targetMapKey":"town","targetSpawnPoint":{"x":180,"y":410}}
  ]'::jsonb,
  '{"skyColor":"#1f3447","groundColor":"#162330","platformColor":"#2b4c54","surfaceColor":"#79d7c9","borderColor":"#5fb3a1"}'::jsonb
)
on conflict (map_key) do update
set name = excluded.name,
    width = excluded.width,
    height = excluded.height,
    spawn_point = excluded.spawn_point,
    floor_data = excluded.floor_data,
    monster_config = excluded.monster_config,
    portals = excluded.portals,
    background = excluded.background;

insert into public.map (
  map_key,
  map_id,
  name,
  map_name,
  width,
  height,
  spawn_point,
  floor_data,
  platforms,
  ladders,
  portals,
  spawns,
  monster_spawn_areas,
  monster_config,
  background
)
values (
  'forest01',
  'forest01',
  '바람숲 입구',
  '바람숲 입구',
  1800,
  720,
  '{"id":"spawn-left","x":120,"y":560}'::jsonb,
  '{
    "platforms": [
      {"id":"forest01-BL-ground-01","x":220,"y":610,"width":440,"height":36},
      {"id":"forest01-BC-ground-01","x":710,"y":610,"width":420,"height":36},
      {"id":"forest01-BR-ground-01","x":1260,"y":610,"width":500,"height":36},
      {"id":"forest01-ML-platform-01","x":360,"y":485,"width":260,"height":24},
      {"id":"forest01-MC-platform-01","x":760,"y":455,"width":280,"height":24},
      {"id":"forest01-MR-platform-01","x":1210,"y":500,"width":320,"height":24},
      {"id":"forest01-TL-platform-01","x":250,"y":335,"width":220,"height":22},
      {"id":"forest01-TC-platform-01","x":850,"y":300,"width":260,"height":22},
      {"id":"forest01-TR-platform-01","x":1400,"y":345,"width":240,"height":22},
      {"id":"forest01-MC-bridge-01","x":1000,"y":405,"width":210,"height":18},
      {"id":"forest01-BR-small-01","x":1510,"y":560,"width":140,"height":20}
    ]
  }'::jsonb,
  '[
    {"id":"forest01-BL-ground-01","x":220,"y":610,"width":440,"height":36},
    {"id":"forest01-BC-ground-01","x":710,"y":610,"width":420,"height":36},
    {"id":"forest01-BR-ground-01","x":1260,"y":610,"width":500,"height":36},
    {"id":"forest01-ML-platform-01","x":360,"y":485,"width":260,"height":24},
    {"id":"forest01-MC-platform-01","x":760,"y":455,"width":280,"height":24},
    {"id":"forest01-MR-platform-01","x":1210,"y":500,"width":320,"height":24},
    {"id":"forest01-TL-platform-01","x":250,"y":335,"width":220,"height":22},
    {"id":"forest01-TC-platform-01","x":850,"y":300,"width":260,"height":22},
    {"id":"forest01-TR-platform-01","x":1400,"y":345,"width":240,"height":22},
    {"id":"forest01-MC-bridge-01","x":1000,"y":405,"width":210,"height":18},
    {"id":"forest01-BR-small-01","x":1510,"y":560,"width":140,"height":20}
  ]'::jsonb,
  '[
    {"id":"forest01-BL-ladder-01","x":470,"y":485,"width":32,"height":125,"from":"forest01-BL-ground-01","to":"forest01-ML-platform-01"},
    {"id":"forest01-MC-ladder-01","x":860,"y":300,"width":32,"height":155,"from":"forest01-MC-platform-01","to":"forest01-TC-platform-01"},
    {"id":"forest01-BR-ladder-01","x":1320,"y":500,"width":32,"height":110,"from":"forest01-BR-ground-01","to":"forest01-MR-platform-01"}
  ]'::jsonb,
  '[
    {"id":"forest01-BL-portal-prev","x":60,"y":550,"width":44,"height":96,"targetMapId":"town01","targetSpawnId":"spawn-right"},
    {"id":"forest01-BR-portal-next","x":1710,"y":550,"width":44,"height":96,"targetMapId":"forest02","targetSpawnId":"spawn-left"}
  ]'::jsonb,
  '[
    {"id":"spawn-left","x":120,"y":560},
    {"id":"spawn-center","x":820,"y":560},
    {"id":"spawn-right","x":1640,"y":560}
  ]'::jsonb,
  '[
    {"id":"forest01-BL-mob-01","platformId":"forest01-BL-ground-01","monsterType":"slime","maxCount":4,"spawnChance":100,"spawnRange":{"x1":80,"x2":420}},
    {"id":"forest01-MC-mob-01","platformId":"forest01-MC-platform-01","monsterType":"slime","maxCount":3,"spawnChance":100,"spawnRange":{"x1":640,"x2":880}},
    {"id":"forest01-BR-mob-01","platformId":"forest01-BR-ground-01","monsterType":"blue_dragon_wood","maxCount":1,"spawnChance":40,"spawnRange":{"x1":1080,"x2":1540}}
  ]'::jsonb,
  '{
    "slime": {
      "hp": 38,
      "attack": 6,
      "defense": 1,
      "exp": 12,
      "element": "neutral",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":2,"amountMax":5}
      ]
    },
    "blue_dragon_wood": {
      "hp": 170,
      "attack": 21,
      "defense": 9,
      "exp": 44,
      "element": "wood",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":10,"amountMax":18}
      ]
    }
  }'::jsonb,
  '{"skyColor":"#8ecae6","farTreeColor":"#2f6f58","treeColor":"#1f5a43","groundColor":"#5d3f25","platformColor":"#6b4a2e","surfaceColor":"#7ac943","borderColor":"#284a34"}'::jsonb
)
on conflict (map_key) do update
set map_id = excluded.map_id,
    map_name = excluded.map_name,
    name = excluded.name,
    width = excluded.width,
    height = excluded.height,
    spawn_point = excluded.spawn_point,
    floor_data = excluded.floor_data,
    platforms = excluded.platforms,
    ladders = excluded.ladders,
    portals = excluded.portals,
    spawns = excluded.spawns,
    monster_spawn_areas = excluded.monster_spawn_areas,
    monster_config = excluded.monster_config,
    background = excluded.background;

insert into public.map (
  map_key,
  name,
  width,
  height,
  spawn_point,
  floor_data,
  monster_config,
  portals,
  background
)
values (
  'forest_edge',
  '숲의 입구',
  1800,
  540,
  '{"x":140,"y":400}'::jsonb,
  '{
    "platforms": [
      {"id":"forest_ground_1","x":240,"y":468,"width":480,"height":36},
      {"id":"forest_ground_2","x":760,"y":468,"width":360,"height":36},
      {"id":"forest_ground_3","x":1240,"y":468,"width":520,"height":36},
      {"id":"forest_ground_4","x":1660,"y":468,"width":260,"height":36},
      {"id":"low_branch","x":470,"y":380,"width":210,"height":24},
      {"id":"mid_branch","x":920,"y":338,"width":240,"height":24},
      {"id":"high_branch","x":1350,"y":292,"width":220,"height":24}
    ]
  }'::jsonb,
  '{
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
        {"x":520,"y":432},
        {"x":780,"y":432},
        {"x":1120,"y":432},
        {"x":1470,"y":432}
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
        {"x":1360,"y":256}
      ]
    }
  }'::jsonb,
  '[
    {"id":"to_first_field","name":"수련장","x":1740,"y":424,"width":44,"height":96,"targetMapKey":"first_field","targetSpawnPoint":{"x":120,"y":410}}
  ]'::jsonb,
  '{"skyColor":"#183044","groundColor":"#172417","platformColor":"#31513b","surfaceColor":"#9ee08f","borderColor":"#7cc6a6"}'::jsonb
)
on conflict (map_key) do update
set name = excluded.name,
    width = excluded.width,
    height = excluded.height,
    spawn_point = excluded.spawn_point,
    floor_data = excluded.floor_data,
    monster_config = excluded.monster_config,
    portals = excluded.portals,
    background = excluded.background;

insert into public.map (
  map_key,
  name,
  width,
  height,
  spawn_point,
  floor_data,
  monster_config,
  portals,
  background
)
values (
  'crystal_cavern',
  '수정 동굴',
  2200,
  540,
  '{"x":130,"y":398}'::jsonb,
  '{
    "platforms": [
      {"id":"cavern_floor_1","x":260,"y":466,"width":520,"height":38},
      {"id":"cavern_floor_2","x":860,"y":466,"width":440,"height":38},
      {"id":"cavern_floor_3","x":1450,"y":466,"width":620,"height":38},
      {"id":"cavern_floor_4","x":2050,"y":466,"width":280,"height":38},
      {"id":"left_crystal_step","x":470,"y":382,"width":190,"height":24},
      {"id":"center_crystal_step","x":980,"y":336,"width":250,"height":24},
      {"id":"right_crystal_step","x":1530,"y":318,"width":230,"height":24},
      {"id":"high_crystal_step","x":1810,"y":258,"width":180,"height":22}
    ]
  }'::jsonb,
  '{
    "slime": {
      "spawnChance": 100,
      "maxSpawn": 5,
      "hp": 42,
      "attack": 7,
      "defense": 2,
      "exp": 14,
      "element": "water",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":3,"amountMax":7},
        {"itemId":"crystal_dust","name":"수정 가루","chance":35,"amountMin":1,"amountMax":1}
      ],
      "spawnPoints": [
        {"x":520,"y":430},
        {"x":820,"y":430},
        {"x":1210,"y":430},
        {"x":1570,"y":430},
        {"x":1880,"y":222}
      ]
    },
    "blue_dragon_wood": {
      "spawnChance": 35,
      "maxSpawn": 1,
      "hp": 210,
      "attack": 26,
      "defense": 12,
      "exp": 58,
      "element": "wood",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":18,"amountMax":30},
        {"itemId":"blue_scale","name":"푸른 비늘","chance":25,"amountMin":1,"amountMax":1}
      ],
      "spawnPoints": [
        {"x":1530,"y":282}
      ]
    }
  }'::jsonb,
  '[
    {"id":"to_forest_edge","name":"숲","x":70,"y":420,"width":44,"height":96,"targetMapKey":"forest_edge","targetSpawnPoint":{"x":1660,"y":400}},
    {"id":"to_first_field","name":"수련장","x":2140,"y":420,"width":44,"height":96,"targetMapKey":"first_field","targetSpawnPoint":{"x":120,"y":410}}
  ]'::jsonb,
  '{"skyColor":"#142233","groundColor":"#151c2a","platformColor":"#34435b","surfaceColor":"#93e7ff","borderColor":"#6bbbd6"}'::jsonb
)
on conflict (map_key) do update
set name = excluded.name,
    width = excluded.width,
    height = excluded.height,
    spawn_point = excluded.spawn_point,
    floor_data = excluded.floor_data,
    monster_config = excluded.monster_config,
    portals = excluded.portals,
    background = excluded.background;

insert into public.map (
  map_key,
  map_id,
  name,
  map_name,
  width,
  height,
  spawn_point,
  floor_data,
  platforms,
  ladders,
  portals,
  spawns,
  monster_spawn_areas,
  monster_config,
  background
)
values (
  'forest02',
  'forest02',
  '바람숲 깊은 길',
  '바람숲 깊은 길',
  2000,
  720,
  '{"id":"spawn-left","x":130,"y":560}'::jsonb,
  '{
    "platforms": [
      {"id":"forest02-BL-ground-01","x":250,"y":610,"width":500,"height":36},
      {"id":"forest02-BC-ground-01","x":810,"y":610,"width":420,"height":36},
      {"id":"forest02-BR-ground-01","x":1430,"y":610,"width":560,"height":36},
      {"id":"forest02-FR-ground-01","x":1870,"y":610,"width":220,"height":36},
      {"id":"forest02-ML-platform-01","x":430,"y":500,"width":260,"height":24},
      {"id":"forest02-MC-platform-01","x":910,"y":450,"width":300,"height":24},
      {"id":"forest02-MR-platform-01","x":1390,"y":495,"width":300,"height":24},
      {"id":"forest02-TL-platform-01","x":300,"y":350,"width":220,"height":22},
      {"id":"forest02-TC-platform-01","x":980,"y":310,"width":260,"height":22},
      {"id":"forest02-TR-platform-01","x":1570,"y":340,"width":260,"height":22},
      {"id":"forest02-MC-bridge-01","x":1170,"y":405,"width":220,"height":18}
    ]
  }'::jsonb,
  '[
    {"id":"forest02-BL-ground-01","x":250,"y":610,"width":500,"height":36},
    {"id":"forest02-BC-ground-01","x":810,"y":610,"width":420,"height":36},
    {"id":"forest02-BR-ground-01","x":1430,"y":610,"width":560,"height":36},
    {"id":"forest02-FR-ground-01","x":1870,"y":610,"width":220,"height":36},
    {"id":"forest02-ML-platform-01","x":430,"y":500,"width":260,"height":24},
    {"id":"forest02-MC-platform-01","x":910,"y":450,"width":300,"height":24},
    {"id":"forest02-MR-platform-01","x":1390,"y":495,"width":300,"height":24},
    {"id":"forest02-TL-platform-01","x":300,"y":350,"width":220,"height":22},
    {"id":"forest02-TC-platform-01","x":980,"y":310,"width":260,"height":22},
    {"id":"forest02-TR-platform-01","x":1570,"y":340,"width":260,"height":22},
    {"id":"forest02-MC-bridge-01","x":1170,"y":405,"width":220,"height":18}
  ]'::jsonb,
  '[
    {"id":"forest02-BL-ladder-01","x":520,"y":500,"width":32,"height":110,"from":"forest02-BL-ground-01","to":"forest02-ML-platform-01"},
    {"id":"forest02-MC-ladder-01","x":1010,"y":310,"width":32,"height":140,"from":"forest02-MC-platform-01","to":"forest02-TC-platform-01"},
    {"id":"forest02-BR-ladder-01","x":1480,"y":495,"width":32,"height":115,"from":"forest02-BR-ground-01","to":"forest02-MR-platform-01"}
  ]'::jsonb,
  '[
    {"id":"forest02-BL-portal-prev","name":"바람숲 입구","x":70,"y":550,"width":44,"height":96,"targetMapId":"forest01","targetSpawnId":"spawn-right"}
  ]'::jsonb,
  '[
    {"id":"spawn-left","x":130,"y":560},
    {"id":"spawn-center","x":960,"y":560},
    {"id":"spawn-right","x":1840,"y":560}
  ]'::jsonb,
  '[
    {"id":"forest02-BL-mob-01","platformId":"forest02-BL-ground-01","monsterType":"slime","maxCount":4,"spawnChance":100,"spawnRange":{"x1":120,"x2":470}},
    {"id":"forest02-MC-mob-01","platformId":"forest02-MC-platform-01","monsterType":"slime","maxCount":3,"spawnChance":100,"spawnRange":{"x1":780,"x2":1040}},
    {"id":"forest02-BR-mob-01","platformId":"forest02-BR-ground-01","monsterType":"blue_dragon_wood","maxCount":2,"spawnChance":55,"spawnRange":{"x1":1210,"x2":1700}}
  ]'::jsonb,
  '{
    "slime": {
      "hp": 48,
      "attack": 8,
      "defense": 2,
      "exp": 16,
      "element": "neutral",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":3,"amountMax":7}
      ]
    },
    "blue_dragon_wood": {
      "hp": 220,
      "attack": 28,
      "defense": 13,
      "exp": 64,
      "element": "wood",
      "dropItems": [
        {"itemId":"money","name":"돈","chance":100,"amountMin":18,"amountMax":32},
        {"itemId":"blue_scale","name":"푸른 비늘","chance":25,"amountMin":1,"amountMax":1}
      ]
    }
  }'::jsonb,
  '{"skyColor":"#5f93b8","farTreeColor":"#24546a","treeColor":"#174736","groundColor":"#493620","platformColor":"#5d422d","surfaceColor":"#63b85e","borderColor":"#243f32"}'::jsonb
)
on conflict (map_key) do update
set map_id = excluded.map_id,
    map_name = excluded.map_name,
    name = excluded.name,
    width = excluded.width,
    height = excluded.height,
    spawn_point = excluded.spawn_point,
    floor_data = excluded.floor_data,
    platforms = excluded.platforms,
    ladders = excluded.ladders,
    portals = excluded.portals,
    spawns = excluded.spawns,
    monster_spawn_areas = excluded.monster_spawn_areas,
    monster_config = excluded.monster_config,
    background = excluded.background;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists map_set_updated_at on public.map;
create trigger map_set_updated_at
before update on public.map
for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;
alter table public.characters enable row level security;
alter table public.map enable row level security;

revoke all on public.accounts from anon, authenticated;
revoke all on public.characters from anon, authenticated;
revoke all on public.map from anon, authenticated;

create or replace function public.register_account(p_phone text, p_password text)
returns table (
  success boolean,
  message text,
  account jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account accounts%rowtype;
  v_phone text := trim(coalesce(p_phone, ''));
begin
  if length(v_phone) = 0 then
    return query select false, '전화번호를 입력하세요.', null::jsonb;
    return;
  end if;

  if length(coalesce(p_password, '')) < 4 then
    return query select false, '비밀번호는 4자리 이상이어야 합니다.', null::jsonb;
    return;
  end if;

  insert into accounts (phone, password_hash)
  values (v_phone, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning * into v_account;

  return query select
    true,
    '계정이 생성되었습니다.',
    jsonb_build_object(
      'id', v_account.id,
      'phone', v_account.phone,
      'failed_login_count', v_account.failed_login_count,
      'warning_count', v_account.warning_count,
      'is_locked', v_account.is_locked,
      'created_at', v_account.created_at,
      'updated_at', v_account.updated_at
    );
exception
  when unique_violation then
    return query select false, '이미 가입된 전화번호입니다.', null::jsonb;
end;
$$;

create or replace function public.is_phone_available(p_phone text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select not exists (
    select 1
    from accounts
    where phone = trim(coalesce(p_phone, ''))
  );
$$;

create or replace function public.login_account(p_phone text, p_password text)
returns table (
  success boolean,
  message text,
  account jsonb,
  warning_count int,
  is_locked boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account accounts%rowtype;
  v_failed int;
  v_warning int;
  v_locked boolean;
begin
  select * into v_account
  from accounts
  where phone = trim(coalesce(p_phone, ''));

  if not found then
    return query select false, '전화번호 또는 비밀번호가 올바르지 않습니다.', null::jsonb, 0, false;
    return;
  end if;

  if v_account.is_locked then
    return query select
      false,
      '잠긴 계정입니다. 개발자에게 전화해서 해제 가능합니다.',
      null::jsonb,
      v_account.warning_count,
      true;
    return;
  end if;

  if v_account.password_hash = extensions.crypt(coalesce(p_password, ''), v_account.password_hash) then
    update accounts
    set failed_login_count = 0
    where id = v_account.id
    returning * into v_account;

    return query select
      true,
      '로그인되었습니다.',
      jsonb_build_object(
        'id', v_account.id,
        'phone', v_account.phone,
        'failed_login_count', v_account.failed_login_count,
        'warning_count', v_account.warning_count,
        'is_locked', v_account.is_locked,
        'created_at', v_account.created_at,
        'updated_at', v_account.updated_at
      ),
      v_account.warning_count,
      v_account.is_locked;
    return;
  end if;

  v_failed := v_account.failed_login_count + 1;
  v_warning := v_account.warning_count;
  v_locked := false;

  if v_failed >= 5 then
    v_failed := 0;
    v_warning := v_warning + 1;
  end if;

  if v_warning >= 3 then
    v_locked := true;
  end if;

  update accounts
  set failed_login_count = v_failed,
      warning_count = v_warning,
      is_locked = v_locked
  where id = v_account.id;

  if v_locked then
    return query select
      false,
      '경고 3회 누적으로 계정이 잠겼습니다. 개발자에게 전화해서 해제 가능합니다.',
      null::jsonb,
      v_warning,
      true;
  elsif v_failed = 0 then
    return query select
      false,
      '비밀번호 5회 실패로 경고가 1회 추가되었습니다.',
      null::jsonb,
      v_warning,
      false;
  else
    return query select
      false,
      format('전화번호 또는 비밀번호가 올바르지 않습니다. 연속 실패 %s/5회', v_failed),
      null::jsonb,
      v_warning,
      false;
  end if;
end;
$$;

create or replace function public.get_characters(p_account_id uuid)
returns setof public.characters
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from characters
  where account_id = p_account_id
  order by slot_no;
$$;

create or replace function public.get_map(p_map_key text default 'forest01')
returns public.map
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from map
  where map_key = coalesce(nullif(trim(p_map_key), ''), 'forest01')
     or map_id = coalesce(nullif(trim(p_map_key), ''), 'forest01')
  limit 1;
$$;

drop function if exists public.create_character(uuid, int, text);
drop function if exists public.create_character(uuid, int, text, text, text, text);
drop function if exists public.create_character(uuid, int, text, text, text, text, jsonb);

create or replace function public.create_character(
  p_account_id uuid,
  p_slot_no int,
  p_name text,
  p_job text default 'mage',
  p_main_element text default 'fire',
  p_sprite_key text default 'mage_fire',
  p_elements jsonb default '{}'::jsonb
)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count int;
  v_character characters%rowtype;
begin
  if p_slot_no not between 1 and 3 then
    raise exception 'slot_no must be between 1 and 3';
  end if;

  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'character name is required';
  end if;

  select count(*) into v_count
  from characters
  where account_id = p_account_id;

  if v_count >= 3 then
    raise exception 'maximum 3 characters per account';
  end if;

  insert into characters (account_id, slot_no, name, job, main_element, sprite_key, elements)
  values (p_account_id, p_slot_no, trim(p_name), p_job, p_main_element, p_sprite_key, coalesce(p_elements, '{}'::jsonb))
  returning * into v_character;

  return v_character;
end;
$$;

create or replace function public.delete_character(
  p_account_id uuid,
  p_character_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from characters
  where id = p_character_id
    and account_id = p_account_id;

  return found;
end;
$$;

drop function if exists public.update_character_state(uuid, uuid, int, int, int, int, int);
drop function if exists public.update_character_state(uuid, uuid, int, int, int, int, int, int);
drop function if exists public.update_character_state(uuid, uuid, int, int, int, int, int, int, int, int, int, int, int);

create or replace function public.update_character_state(
  p_account_id uuid,
  p_character_id uuid,
  p_level int,
  p_exp int,
  p_gold int,
  p_hp int,
  p_max_hp int,
  p_element_points int default 0,
  p_mp int default null,
  p_max_mp int default null,
  p_attack int default null,
  p_defense int default null,
  p_dex int default null
)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_character characters%rowtype;
begin
  update characters
  set level = greatest(1, p_level),
      exp = greatest(0, p_exp),
      gold = greatest(0, p_gold),
      hp = greatest(0, p_hp),
      max_hp = greatest(1, p_max_hp),
      element_points = greatest(0, coalesce(p_element_points, 0)),
      mp = greatest(0, coalesce(p_mp, mp)),
      max_mp = greatest(1, coalesce(p_max_mp, max_mp)),
      attack = greatest(0, coalesce(p_attack, attack)),
      defense = greatest(0, coalesce(p_defense, defense)),
      dex = greatest(0, coalesce(p_dex, dex))
  where id = p_character_id
    and account_id = p_account_id
  returning * into v_character;

  if not found then
    raise exception 'character not found';
  end if;

  return v_character;
end;
$$;

create or replace function public.use_element_point(
  p_account_id uuid,
  p_character_id uuid,
  p_element_key text
)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_character characters%rowtype;
  v_element_key text := lower(trim(coalesce(p_element_key, '')));
  v_current_value int;
begin
  if v_element_key not in ('wood', 'fire', 'earth', 'metal', 'water') then
    raise exception 'invalid element key';
  end if;

  select coalesce((elements ->> v_element_key)::int, 0) into v_current_value
  from characters
  where id = p_character_id
    and account_id = p_account_id;

  if not found then
    raise exception 'character not found';
  end if;

  update characters
  set element_points = element_points - 1,
      elements = jsonb_set(
        coalesce(elements, '{}'::jsonb),
        array[v_element_key],
        to_jsonb(v_current_value + 1),
        true
      )
  where id = p_character_id
    and account_id = p_account_id
    and element_points > 0
  returning * into v_character;

  if not found then
    raise exception 'not enough element points';
  end if;

  return v_character;
end;
$$;

grant execute on function public.register_account(text, text) to anon, authenticated;
grant execute on function public.is_phone_available(text) to anon, authenticated;
grant execute on function public.login_account(text, text) to anon, authenticated;
grant execute on function public.get_characters(uuid) to anon, authenticated;
grant execute on function public.get_map(text) to anon, authenticated;
grant execute on function public.create_character(uuid, int, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.delete_character(uuid, uuid) to anon, authenticated;
grant execute on function public.update_character_state(uuid, uuid, int, int, int, int, int, int, int, int, int, int, int) to anon, authenticated;
grant execute on function public.use_element_point(uuid, uuid, text) to anon, authenticated;
