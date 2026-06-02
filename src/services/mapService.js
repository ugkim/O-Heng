import { requireSupabase } from '../lib/supabaseClient'
import { DEFAULT_MAP_KEY, normalizeMapRow } from '../game/data/maps'

export async function fetchMapByKey(mapKey = DEFAULT_MAP_KEY) {
  const { data, error } = await requireSupabase()
    .rpc('get_map', {
      p_map_key: mapKey,
    })
    .single()

  if (error) throw error
  return normalizeMapRow(data)
}
