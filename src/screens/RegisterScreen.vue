<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { registerAccount } from '../services/authService'

const router = useRouter()
const phone = ref('')
const password = ref('')
const passwordConfirm = ref('')
const message = ref('')
const isLoading = ref(false)

async function submitRegister() {
  message.value = ''
  isLoading.value = true

  try {
    const result = await registerAccount({
      phone: phone.value,
      password: password.value,
      passwordConfirm: passwordConfirm.value,
    })

    if (!result.success) {
      message.value = result.message
      return
    }

    router.push('/characters')
  } catch (error) {
    message.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <p class="eyebrow">Account</p>
      <h1>계정 만들기</h1>

      <form class="auth-form" @submit.prevent="submitRegister">
        <label>
          전화번호
          <input v-model="phone" type="tel" inputmode="tel" autocomplete="tel" />
        </label>

        <label>
          비밀번호
          <input v-model="password" type="password" autocomplete="new-password" />
        </label>

        <label>
          비밀번호 확인
          <input v-model="passwordConfirm" type="password" autocomplete="new-password" />
        </label>

        <p v-if="message" class="form-message" role="alert">{{ message }}</p>

        <button class="primary-button" type="submit" :disabled="isLoading">
          {{ isLoading ? '생성 중' : '계정 생성' }}
        </button>
      </form>

      <RouterLink class="text-link" to="/">시작 화면</RouterLink>
    </section>
  </main>
</template>
