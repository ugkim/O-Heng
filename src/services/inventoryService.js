import { requireSupabase } from '../lib/supabaseClient'

export const INVENTORY_SLOT_COUNT = 48

export async function fetchItems(type = null) {
  const { data, error } = await requireSupabase().rpc('get_items', {
    p_type: type,
  })

  if (error) throw error
  return data || []
}

export async function fetchCharacterInventory({ accountId, characterId }) {
  const { data, error } = await requireSupabase().rpc('get_character_inventory', {
    p_account_id: accountId,
    p_character_id: characterId,
  })

  if (error) throw error
  return data || []
}

export async function addItemToInventory({ accountId, characterId, itemId, quantity = 1 }) {
  const { data, error } = await requireSupabase().rpc('add_item_to_inventory', {
    p_account_id: accountId,
    p_character_id: characterId,
    p_item_id: itemId,
    p_quantity: quantity,
  })

  if (error) throw error
  return data || []
}

export async function useInventoryItem({ accountId, inventoryId }) {
  const { data, error } = await requireSupabase()
    .rpc('use_inventory_item', {
      p_account_id: accountId,
      p_inventory_id: inventoryId,
    })
    .single()

  if (error) throw error
  return data
}

export async function equipInventoryItem({ accountId, inventoryId }) {
  const { data, error } = await requireSupabase().rpc('equip_inventory_item', {
    p_account_id: accountId,
    p_inventory_id: inventoryId,
  })

  if (error) throw error
  return data
}

export async function unequipInventoryItem({ accountId, inventoryId }) {
  const { data, error } = await requireSupabase().rpc('unequip_inventory_item', {
    p_account_id: accountId,
    p_inventory_id: inventoryId,
  })

  if (error) throw error
  return data
}

export async function sellInventoryItem({ accountId, inventoryId, quantity = 1 }) {
  const { data, error } = await requireSupabase()
    .rpc('sell_inventory_item', {
      p_account_id: accountId,
      p_inventory_id: inventoryId,
      p_quantity: quantity,
    })
    .single()

  if (error) throw error
  return data
}
