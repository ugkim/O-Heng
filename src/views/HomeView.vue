<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home-page">
    <section class="home-panel">
      <p class="eyebrow">2D RPG</p>
      <h1>메이플 스토리</h1>
      <div class="home-actions">
        <RouterLink class="primary-link" to="/character/create">캐릭터 생성</RouterLink>
        <RouterLink class="secondary-link" to="/game">게임 입장</RouterLink>
      </div>
    </section>
  </main>
</template>
