<script setup>
defineProps({
  quests: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="quest-panel">
    <article v-for="quest in quests" :key="quest.id" class="quest-card">
      <div>
        <h3>{{ quest.title }}</h3>
        <p>({{ quest.current }}/{{ quest.required }})</p>
      </div>
      <meter :value="quest.current" :max="quest.required" />
      <div class="reward-row">
        <span>EXP {{ quest.rewards.exp }}</span>
        <span>골드 {{ quest.rewards.gold }}</span>
      </div>
      <button class="primary-button" type="button" :disabled="quest.current < quest.required">
        수령
      </button>
    </article>
  </div>
</template>
