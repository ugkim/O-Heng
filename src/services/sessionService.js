const ACCOUNT_KEY = 'rpg.account'
const CHARACTER_KEY = 'rpg.character'

export function getStoredAccount() {
  return readJson(ACCOUNT_KEY)
}

export function storeAccount(account) {
  writeJson(ACCOUNT_KEY, account)
}

export function clearAccount() {
  localStorage.removeItem(ACCOUNT_KEY)
  clearSelectedCharacter()
}

export function getSelectedCharacter() {
  return readJson(CHARACTER_KEY)
}

export function storeSelectedCharacter(character) {
  writeJson(CHARACTER_KEY, character)
}

export function clearSelectedCharacter() {
  localStorage.removeItem(CHARACTER_KEY)
}

function readJson(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
