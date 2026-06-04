-- MapleStory-style item catalog and character inventory system.
-- Apply this in the Supabase SQL editor after the base schema.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('equipment', 'consumable', 'material', 'quest', 'currency')),
  sub_type text check (
    sub_type is null
    or sub_type in ('weapon', 'armor', 'helmet', 'gloves', 'shoes', 'accessory', 'potion', 'etc')
  ),
  element text check (
    element is null
    or element in ('wood', 'fire', 'earth', 'metal', 'water', 'neutral')
  ),
  grade text not null default 'normal' check (grade in ('normal', 'rare', 'epic', 'unique', 'legendary')),
  required_level integer not null default 1 check (required_level >= 1),
  max_stack integer not null default 1 check (max_stack >= 1),
  price integer not null default 0 check (price >= 0),
  sell_price integer not null default 0 check (sell_price >= 0),
  icon_url text,
  description text,
  stats jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  effects jsonb not null default '{}'::jsonb check (jsonb_typeof(effects) = 'object'),
  tradable boolean not null default true,
  usable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity integer not null default 1 check (quantity >= 1),
  slot_index integer not null check (slot_index between 0 and 47),
  is_equipped boolean not null default false,
  durability integer,
  enhancement_level integer not null default 0 check (enhancement_level >= 0),
  custom_stats jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_stats) = 'object'),
  obtained_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, slot_index)
);

create index if not exists items_type_idx on public.items(type);
create index if not exists character_inventory_character_id_idx on public.character_inventory(character_id);
create index if not exists character_inventory_item_id_idx on public.character_inventory(item_id);

create or replace function public.validate_inventory_item()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item public.items%rowtype;
begin
  select * into v_item
  from public.items
  where id = new.item_id;

  if not found then
    raise exception 'item not found';
  end if;

  if new.quantity < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  if new.quantity > v_item.max_stack then
    raise exception 'quantity exceeds max_stack';
  end if;

  if new.is_equipped and v_item.type <> 'equipment' then
    raise exception 'only equipment can be equipped';
  end if;

  if v_item.type = 'equipment' and v_item.max_stack <> 1 then
    raise exception 'equipment max_stack must be 1';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists character_inventory_validate_item on public.character_inventory;
create trigger character_inventory_validate_item
before insert or update on public.character_inventory
for each row execute function public.validate_inventory_item();

insert into public.items (
  id, name, type, sub_type, element, grade, required_level, max_stack,
  price, sell_price, icon_url, description, stats, effects, tradable, usable
)
values
  ('10000000-0000-0000-0000-000000000001', '초보자의 목검', 'equipment', 'weapon', 'wood', 'normal', 1, 1, 120, 36, '🪵', '나무 기운이 희미하게 남아 있는 초심자용 검.', '{"attack":3}'::jsonb, '{}'::jsonb, true, false),
  ('10000000-0000-0000-0000-000000000002', '수련복', 'equipment', 'armor', 'neutral', 'normal', 1, 1, 100, 30, '🥋', '움직임이 편한 기본 수련복.', '{"defense":2,"dex":1}'::jsonb, '{}'::jsonb, true, false),
  ('10000000-0000-0000-0000-000000000003', '작은 체력 물약', 'consumable', 'potion', 'neutral', 'normal', 1, 50, 30, 10, '🧪', 'HP를 조금 회복한다.', '{}'::jsonb, '{"hp":50}'::jsonb, true, true),
  ('10000000-0000-0000-0000-000000000004', '작은 마력 물약', 'consumable', 'potion', 'neutral', 'normal', 1, 50, 35, 12, '💧', 'MP를 조금 회복한다.', '{}'::jsonb, '{"mp":30}'::jsonb, true, true),
  ('10000000-0000-0000-0000-000000000005', '나무 정수', 'material', 'etc', 'wood', 'normal', 1, 99, 0, 8, '🌿', '목 속성 제작에 쓰이는 작은 정수.', '{}'::jsonb, '{}'::jsonb, true, false),
  ('10000000-0000-0000-0000-000000000006', '불꽃 결정', 'material', 'etc', 'fire', 'normal', 1, 99, 0, 12, '🔥', '화 속성 제작에 쓰이는 뜨거운 결정.', '{}'::jsonb, '{}'::jsonb, true, false)
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    sub_type = excluded.sub_type,
    element = excluded.element,
    grade = excluded.grade,
    required_level = excluded.required_level,
    max_stack = excluded.max_stack,
    price = excluded.price,
    sell_price = excluded.sell_price,
    icon_url = excluded.icon_url,
    description = excluded.description,
    stats = excluded.stats,
    effects = excluded.effects,
    tradable = excluded.tradable,
    usable = excluded.usable;

create or replace function public.assert_character_owner(p_account_id uuid, p_character_id uuid)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_character public.characters%rowtype;
begin
  select * into v_character
  from public.characters
  where id = p_character_id
    and account_id = p_account_id;

  if not found then
    raise exception 'character not found';
  end if;

  return v_character;
end;
$$;

create or replace function public.get_items(p_type text default null)
returns setof public.items
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from public.items
  where p_type is null or type = p_type
  order by type, grade, required_level, name
$$;

create or replace function public.get_character_inventory(
  p_account_id uuid,
  p_character_id uuid
)
returns table (
  id uuid,
  character_id uuid,
  item_id uuid,
  quantity integer,
  slot_index integer,
  is_equipped boolean,
  durability integer,
  enhancement_level integer,
  custom_stats jsonb,
  obtained_at timestamptz,
  updated_at timestamptz,
  item jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.assert_character_owner(p_account_id, p_character_id);

  return query
  select
    ci.id,
    ci.character_id,
    ci.item_id,
    ci.quantity,
    ci.slot_index,
    ci.is_equipped,
    ci.durability,
    ci.enhancement_level,
    ci.custom_stats,
    ci.obtained_at,
    ci.updated_at,
    to_jsonb(i.*) as item
  from public.character_inventory ci
  join public.items i on i.id = ci.item_id
  where ci.character_id = p_character_id
  order by ci.slot_index;
end;
$$;

create or replace function public.add_item_to_inventory(
  p_account_id uuid,
  p_character_id uuid,
  p_item_id uuid,
  p_quantity integer default 1
)
returns setof public.character_inventory
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item public.items%rowtype;
  v_remaining integer := greatest(0, coalesce(p_quantity, 0));
  v_stack public.character_inventory%rowtype;
  v_can_add integer;
  v_slot integer;
begin
  perform public.assert_character_owner(p_account_id, p_character_id);

  if v_remaining < 1 then
    raise exception 'quantity must be at least 1';
  end if;

  select * into v_item
  from public.items
  where id = p_item_id;

  if not found then
    raise exception 'item not found';
  end if;

  if v_item.max_stack > 1 then
    for v_stack in
      select *
      from public.character_inventory
      where character_id = p_character_id
        and item_id = p_item_id
        and quantity < v_item.max_stack
      order by slot_index
      for update
    loop
      v_can_add := least(v_remaining, v_item.max_stack - v_stack.quantity);

      update public.character_inventory
      set quantity = quantity + v_can_add
      where id = v_stack.id;

      v_remaining := v_remaining - v_can_add;
      exit when v_remaining <= 0;
    end loop;
  end if;

  while v_remaining > 0 loop
    select slot_no into v_slot
    from generate_series(0, 47) as slot_no
    where not exists (
      select 1
      from public.character_inventory ci
      where ci.character_id = p_character_id
        and ci.slot_index = slot_no
    )
    order by slot_no
    limit 1;

    if v_slot is null then
      raise exception 'inventory is full';
    end if;

    v_can_add := case
      when v_item.max_stack > 1 then least(v_remaining, v_item.max_stack)
      else 1
    end;

    insert into public.character_inventory (character_id, item_id, quantity, slot_index)
    values (p_character_id, p_item_id, v_can_add, v_slot);

    v_remaining := v_remaining - v_can_add;
  end loop;

  return query
  select *
  from public.character_inventory
  where character_id = p_character_id
  order by slot_index;
end;
$$;

create or replace function public.use_inventory_item(
  p_account_id uuid,
  p_inventory_id uuid
)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inventory public.character_inventory%rowtype;
  v_item public.items%rowtype;
  v_character public.characters%rowtype;
  v_hp_gain integer;
  v_mp_gain integer;
begin
  select ci.* into v_inventory
  from public.character_inventory ci
  join public.characters c on c.id = ci.character_id
  where ci.id = p_inventory_id
    and c.account_id = p_account_id
  for update;

  if not found then
    raise exception 'inventory item not found';
  end if;

  select * into v_item
  from public.items
  where id = v_inventory.item_id;

  if v_item.type <> 'consumable' or not v_item.usable then
    raise exception 'item is not usable';
  end if;

  v_hp_gain := coalesce((v_item.effects ->> 'hp')::integer, 0);
  v_mp_gain := coalesce((v_item.effects ->> 'mp')::integer, 0);

  update public.characters
  set hp = least(max_hp, hp + v_hp_gain),
      mp = least(max_mp, mp + v_mp_gain)
  where id = v_inventory.character_id
  returning * into v_character;

  if v_inventory.quantity <= 1 then
    delete from public.character_inventory
    where id = v_inventory.id;
  else
    update public.character_inventory
    set quantity = quantity - 1
    where id = v_inventory.id;
  end if;

  return v_character;
end;
$$;

create or replace function public.equip_inventory_item(
  p_account_id uuid,
  p_inventory_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inventory public.character_inventory%rowtype;
  v_item public.items%rowtype;
begin
  select ci.* into v_inventory
  from public.character_inventory ci
  join public.characters c on c.id = ci.character_id
  where ci.id = p_inventory_id
    and c.account_id = p_account_id
  for update;

  if not found then
    raise exception 'inventory item not found';
  end if;

  select * into v_item
  from public.items
  where id = v_inventory.item_id;

  if v_item.type <> 'equipment' then
    raise exception 'item is not equipment';
  end if;

  update public.character_inventory ci
  set is_equipped = false
  from public.items i
  where ci.item_id = i.id
    and ci.character_id = v_inventory.character_id
    and i.type = 'equipment'
    and i.sub_type = v_item.sub_type
    and ci.id <> v_inventory.id;

  update public.character_inventory
  set is_equipped = true
  where id = v_inventory.id;

  return true;
end;
$$;

create or replace function public.unequip_inventory_item(
  p_account_id uuid,
  p_inventory_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.character_inventory ci
  set is_equipped = false
  from public.characters c
  where ci.id = p_inventory_id
    and c.id = ci.character_id
    and c.account_id = p_account_id;

  if not found then
    raise exception 'inventory item not found';
  end if;

  return true;
end;
$$;

create or replace function public.sell_inventory_item(
  p_account_id uuid,
  p_inventory_id uuid,
  p_quantity integer default 1
)
returns public.characters
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inventory public.character_inventory%rowtype;
  v_item public.items%rowtype;
  v_character public.characters%rowtype;
  v_quantity integer := greatest(1, coalesce(p_quantity, 1));
begin
  select ci.* into v_inventory
  from public.character_inventory ci
  join public.characters c on c.id = ci.character_id
  where ci.id = p_inventory_id
    and c.account_id = p_account_id
  for update;

  if not found then
    raise exception 'inventory item not found';
  end if;

  select * into v_item
  from public.items
  where id = v_inventory.item_id;

  if v_item.type = 'quest' then
    raise exception 'quest items cannot be sold';
  end if;

  if v_inventory.is_equipped then
    raise exception 'equipped items cannot be sold';
  end if;

  if v_quantity > v_inventory.quantity then
    raise exception 'not enough quantity';
  end if;

  update public.characters
  set gold = gold + (v_item.sell_price * v_quantity)
  where id = v_inventory.character_id
  returning * into v_character;

  if v_inventory.quantity = v_quantity then
    delete from public.character_inventory
    where id = v_inventory.id;
  else
    update public.character_inventory
    set quantity = quantity - v_quantity
    where id = v_inventory.id;
  end if;

  return v_character;
end;
$$;

alter table public.items enable row level security;
alter table public.character_inventory enable row level security;

revoke all on public.items from anon, authenticated;
revoke all on public.character_inventory from anon, authenticated;

grant execute on function public.get_items(text) to anon, authenticated;
grant execute on function public.get_character_inventory(uuid, uuid) to anon, authenticated;
grant execute on function public.add_item_to_inventory(uuid, uuid, uuid, integer) to anon, authenticated;
grant execute on function public.use_inventory_item(uuid, uuid) to anon, authenticated;
grant execute on function public.equip_inventory_item(uuid, uuid) to anon, authenticated;
grant execute on function public.unequip_inventory_item(uuid, uuid) to anon, authenticated;
grant execute on function public.sell_inventory_item(uuid, uuid, integer) to anon, authenticated;
