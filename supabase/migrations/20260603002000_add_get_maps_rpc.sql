create or replace function public.get_maps()
returns setof public.map
language sql
security definer
set search_path = public, extensions
as $$
  select *
  from map
  order by
    case map_key
      when 'first_field' then 1
      when 'forest_edge' then 2
      when 'forest01' then 3
      when 'forest02' then 4
      when 'crystal_cavern' then 5
      else 100
    end,
    map_key;
$$;

grant execute on function public.get_maps() to anon, authenticated;
