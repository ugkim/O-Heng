const CHARACTER_STORAGE_KEY = 'rpg_character'

export function getCharacter() {
  try {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    localStorage.removeItem(CHARACTER_STORAGE_KEY)
    return null
  }
}

export function saveCharacter(character) {
  localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
}

export function clearCharacter() {
  localStorage.removeItem(CHARACTER_STORAGE_KEY)
}

export function hasCharacter() {
  return Boolean(getCharacter())
}
