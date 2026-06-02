<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { loginAccount } from '../services/authService'

const router = useRouter()
const phone = ref('')
const password = ref('')
const message = ref('')
const isLoading = ref(false)

async function submitLogin() {
  message.value = ''
  isLoading.value = true

  try {
    const result = await loginAccount({
      phone: phone.value,
      password: password.value,
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
      <p class="eyebrow">Login</p>
      <h1>로그인</h1>

      <form class="auth-form" @submit.prevent="submitLogin">
        <label>
          전화번호
          <input v-model="phone" type="tel" inputmode="tel" autocomplete="tel" />
        </label>

        <label>
          비밀번호
          <input v-model="password" type="password" autocomplete="current-password" />
        </label>

        <p v-if="message" class="form-message" role="alert">{{ message }}</p>

        <button class="primary-button" type="submit" :disabled="isLoading">
          {{ isLoading ? '확인 중' : '로그인' }}
        </button>
      </form>

      <RouterLink class="text-link" to="/">시작 화면</RouterLink>
    </section>
  </main>
</template>
