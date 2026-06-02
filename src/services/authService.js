import { requireSupabase } from '../lib/supabaseClient'
import { clearAccount, storeAccount } from './sessionService'

export async function registerAccount({ phone, password, passwordConfirm }) {
  const normalizedPhone = normalizePhone(phone)

  if (!normalizedPhone) {
    return { success: false, message: '전화번호를 입력하세요.' }
  }

  if ((password || '').length < 4) {
    return { success: false, message: '비밀번호는 4자리 이상이어야 합니다.' }
  }

  if (password !== passwordConfirm) {
    return { success: false, message: '비밀번호 확인이 일치하지 않습니다.' }
  }

  const isAvailable = await checkPhoneAvailable(normalizedPhone)

  if (!isAvailable) {
    return { success: false, message: '이미 가입된 전화번호입니다.' }
  }

  const { data, error } = await requireSupabase()
    .rpc('register_account', {
      p_phone: normalizedPhone,
      p_password: password,
    })
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  if (data.success && data.account) {
    storeAccount(data.account)
  }

  return data
}

export async function loginAccount({ phone, password }) {
  const normalizedPhone = normalizePhone(phone)

  if (!normalizedPhone || !password) {
    return { success: false, message: '전화번호와 비밀번호를 입력하세요.' }
  }

  const { data, error } = await requireSupabase()
    .rpc('login_account', {
      p_phone: normalizedPhone,
      p_password: password,
    })
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  if (data.success && data.account) {
    storeAccount(data.account)
  }

  return data
}

export function logoutAccount() {
  clearAccount()
}

async function checkPhoneAvailable(phone) {
  const { data, error } = await requireSupabase()
    .rpc('is_phone_available', {
      p_phone: phone,
    })

  if (error) throw error
  return data === true
}

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').trim()
}
