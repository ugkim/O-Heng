import { requireSupabase } from '../lib/supabaseClient'

export async function fetchCharacters(accountId) {
  const { data, error } = await requireSupabase().rpc('get_characters', {
    p_account_id: accountId,
  })

  if (error) throw error
  return data || []
}

export async function createCharacter({
  accountId,
  slotNo,
  name,
  job = 'mage',
  mainElement = 'fire',
  spriteKey = 'novice',
  elements = {},
  appearance = null,
  equippedAvatar = null,
}) {
  const { data, error } = await requireSupabase()
    .rpc('create_character', {
      p_account_id: accountId,
      p_slot_no: slotNo,
      p_name: name,
      p_job: job,
      p_main_element: mainElement,
      p_sprite_key: spriteKey,
      p_elements: elements,
      p_appearance: appearance,
      p_equipped_avatar: equippedAvatar,
    })
    .single()

  if (error) throw error
  return data
}

export async function updateCharacterAvatar({
  accountId,
  characterId,
  appearance = {},
  equippedAvatar = {},
}) {
  const { data, error } = await requireSupabase()
    .rpc('update_character_avatar', {
      p_account_id: accountId,
      p_character_id: characterId,
      p_appearance: appearance,
      p_equipped_avatar: equippedAvatar,
    })
    .single()

  if (error) throw error
  return data
}

export async function deleteCharacter({ accountId, characterId }) {
  const { data, error } = await requireSupabase()
    .rpc('delete_character', {
      p_account_id: accountId,
      p_character_id: characterId,
    })

  if (error) throw error
  return data
}

export async function updateCharacterState({ accountId, character }) {
  const { data, error } = await requireSupabase()
    .rpc('update_character_state', {
      p_account_id: accountId,
      p_character_id: character.id,
      p_level: character.level,
      p_exp: character.exp,
      p_gold: character.gold,
      p_hp: character.hp,
      p_max_hp: character.max_hp,
      p_element_points: character.element_points ?? 0,
      p_mp: character.mp,
      p_max_mp: character.max_mp,
      p_attack: character.attack,
      p_defense: character.defense,
      p_dex: character.dex,
    })
    .single()

  if (error) throw error
  return data
}

export async function useElementPoint({ accountId, characterId, elementKey }) {
  const { data, error } = await requireSupabase()
    .rpc('use_element_point', {
      p_account_id: accountId,
      p_character_id: characterId,
      p_element_key: elementKey,
    })
    .single()

  if (error) throw error
  return data
}
