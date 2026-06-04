alter table public.characters
add column if not exists appearance jsonb not null default '{"version":1,"bodyScale":1,"direction":"right","action":"stand"}'::jsonb,
add column if not exists equipped_avatar jsonb not null default '{"body":"body_light","hair":"hair_black_mop","face":"face_clear","top":"top_green_hoodie","bottom":"bottom_denim","shoes":"shoes_canvas","hat":null,"cape":null,"weapon":null}'::jsonb;

drop function if exists public.create_character(uuid, int, text);
drop function if exists public.create_character(uuid, int, text, text, text, text);
drop function if exists public.create_character(uuid, int, text, text, text, text, jsonb);
drop function if exists public.create_character(uuid, int, text, text, text, text, jsonb, jsonb, jsonb);

create or replace function public.create_character(
  p_account_id uuid,
  p_slot_no int,
  p_name text,
  p_job text default 'mage',
  p_main_element text default 'fire',
  p_sprite_key text default 'novice',
  p_elements jsonb default '{}'::jsonb,
  p_appearance jsonb default '{"version":1,"bodyScale":1,"direction":"right","action":"stand"}'::jsonb,
  p_equipped_avatar jsonb default '{"body":"body_light","hair":"hair_black_mop","face":"face_clear","top":"top_green_hoodie","bottom":"bottom_denim","shoes":"shoes_canvas","hat":null,"cape":null,"weapon":null}'::jsonb
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

  insert into characters (
    account_id,
    slot_no,
    name,
    job,
    main_element,
    sprite_key,
    elements,
    appearance,
    equipped_avatar
  )
  values (
    p_account_id,
    p_slot_no,
    trim(p_name),
    p_job,
    p_main_element,
    p_sprite_key,
    coalesce(p_elements, '{}'::jsonb),
    coalesce(p_appearance, '{"version":1,"bodyScale":1,"direction":"right","action":"stand"}'::jsonb),
    coalesce(p_equipped_avatar, '{"body":"body_light","hair":"hair_black_mop","face":"face_clear","top":"top_green_hoodie","bottom":"bottom_denim","shoes":"shoes_canvas","hat":null,"cape":null,"weapon":null}'::jsonb)
  )
  returning * into v_character;

  return v_character;
end;
$$;

create or replace function public.update_character_avatar(
  p_account_id uuid,
  p_character_id uuid,
  p_appearance jsonb default '{}'::jsonb,
  p_equipped_avatar jsonb default '{}'::jsonb
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
  set appearance = coalesce(p_appearance, '{}'::jsonb),
      equipped_avatar = coalesce(p_equipped_avatar, '{}'::jsonb)
  where id = p_character_id
    and account_id = p_account_id
  returning * into v_character;

  if not found then
    raise exception 'character not found';
  end if;

  return v_character;
end;
$$;

grant execute on function public.create_character(uuid, int, text, text, text, text, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.update_character_avatar(uuid, uuid, jsonb, jsonb) to anon, authenticated;
