<script setup>
import { computed } from 'vue'
import {
  AVATAR_ACTIONS,
  DEFAULT_AVATAR_APPEARANCE,
  resolveAvatarParts,
} from '../data/avatarCatalog'

const props = defineProps({
  appearance: {
    type: Object,
    default: null,
  },
  equippedAvatar: {
    type: Object,
    default: null,
  },
  action: {
    type: String,
    default: '',
  },
  direction: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'large',
  },
})

const resolvedAppearance = computed(() => ({
  ...DEFAULT_AVATAR_APPEARANCE,
  ...(props.appearance || {}),
}))

const resolvedAction = computed(() => props.action || resolvedAppearance.value.action || 'stand')
const actionMeta = computed(() => AVATAR_ACTIONS[resolvedAction.value] || AVATAR_ACTIONS.stand)
const resolvedDirection = computed(() => props.direction || resolvedAppearance.value.direction || 'right')
const parts = computed(() => resolveAvatarParts(props.equippedAvatar))

function partStyle(part) {
  const palette = part.item?.palette || {}

  return {
    '--skin': palette.skin,
    '--skin-shade': palette.shade,
    '--hair': palette.hair,
    '--hair-shine': palette.shine,
    '--item-main': palette.main,
    '--item-trim': palette.trim,
    '--item-sole': palette.sole,
    '--item-blade': palette.blade,
  }
}
</script>

<template>
  <div
    class="avatar-renderer"
    :class="[
      `size-${size}`,
      `pose-${actionMeta.pose}`,
      `direction-${resolvedDirection}`,
    ]"
    :aria-label="`아바타 ${actionMeta.label}`"
    role="img"
  >
    <div class="avatar-stage">
      <template v-for="part in parts" :key="part.slot">
        <span
          v-if="part.item"
          class="avatar-part"
          :class="[
            `part-${part.slot}`,
            part.item.shape ? `shape-${part.item.shape}` : '',
            part.item.expression ? `expression-${part.item.expression}` : '',
          ]"
          :style="partStyle(part)"
          aria-hidden="true"
        >
          <span v-if="part.slot === 'body'" class="body-head"></span>
          <span v-if="part.slot === 'body'" class="body-neck"></span>
          <span v-if="part.slot === 'body'" class="body-arm arm-left"></span>
          <span v-if="part.slot === 'body'" class="body-arm arm-right"></span>
          <span v-if="part.slot === 'body'" class="body-leg leg-left"></span>
          <span v-if="part.slot === 'body'" class="body-leg leg-right"></span>

          <span v-if="part.slot === 'face'" class="eye eye-left"></span>
          <span v-if="part.slot === 'face'" class="eye eye-right"></span>
          <span v-if="part.slot === 'face'" class="mouth"></span>

          <span v-if="part.slot === 'hair'" class="hair-back"></span>
          <span v-if="part.slot === 'hair'" class="hair-front"></span>
          <span v-if="part.slot === 'hair'" class="hair-bang bang-a"></span>
          <span v-if="part.slot === 'hair'" class="hair-bang bang-b"></span>

          <span v-if="part.slot === 'top'" class="top-body"></span>
          <span v-if="part.slot === 'top'" class="top-sleeve sleeve-left"></span>
          <span v-if="part.slot === 'top'" class="top-sleeve sleeve-right"></span>

          <span v-if="part.slot === 'bottom'" class="pants-waist"></span>
          <span v-if="part.slot === 'bottom'" class="pants-leg pants-left"></span>
          <span v-if="part.slot === 'bottom'" class="pants-leg pants-right"></span>

          <span v-if="part.slot === 'shoes'" class="shoe shoe-left"></span>
          <span v-if="part.slot === 'shoes'" class="shoe shoe-right"></span>

          <span v-if="part.slot === 'hat'" class="hat-crown"></span>
          <span v-if="part.slot === 'hat'" class="hat-brim"></span>

          <span v-if="part.slot === 'cape'" class="cape-cloth"></span>

          <span v-if="part.slot === 'weapon'" class="weapon-grip"></span>
          <span v-if="part.slot === 'weapon'" class="weapon-head"></span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.avatar-renderer {
  --pixel: 3px;
  --skin: #f2c0a2;
  --skin-shade: #d89375;
  --hair: #2a2224;
  --hair-shine: #55474a;
  --item-main: #2f9e68;
  --item-trim: #c6f6d5;
  --item-sole: #806044;
  --item-blade: #e7d4a8;
  display: grid;
  place-items: center;
  width: calc(var(--pixel) * 48);
  height: calc(var(--pixel) * 58);
  image-rendering: pixelated;
}

.size-small {
  --pixel: 1.5px;
}

.size-large {
  --pixel: 4px;
}

.avatar-stage {
  position: relative;
  width: calc(var(--pixel) * 48);
  height: calc(var(--pixel) * 58);
  transform-origin: 50% 100%;
}

.direction-left .avatar-stage {
  transform: scaleX(-1);
}

.avatar-part,
.avatar-part span {
  position: absolute;
  display: block;
}

.body-head {
  left: calc(var(--pixel) * 15);
  top: calc(var(--pixel) * 4);
  width: calc(var(--pixel) * 18);
  height: calc(var(--pixel) * 18);
  border: var(--pixel) solid var(--skin-shade);
  border-radius: calc(var(--pixel) * 7);
  background: var(--skin);
}

.body-neck {
  left: calc(var(--pixel) * 21);
  top: calc(var(--pixel) * 20);
  width: calc(var(--pixel) * 6);
  height: calc(var(--pixel) * 7);
  background: var(--skin-shade);
}

.body-arm {
  top: calc(var(--pixel) * 28);
  width: calc(var(--pixel) * 6);
  height: calc(var(--pixel) * 17);
  border-radius: calc(var(--pixel) * 4);
  background: var(--skin);
}

.arm-left {
  left: calc(var(--pixel) * 11);
  transform: rotate(8deg);
}

.arm-right {
  left: calc(var(--pixel) * 31);
  transform: rotate(-8deg);
}

.body-leg {
  top: calc(var(--pixel) * 41);
  width: calc(var(--pixel) * 7);
  height: calc(var(--pixel) * 13);
  border-radius: calc(var(--pixel) * 3);
  background: var(--skin-shade);
}

.leg-left {
  left: calc(var(--pixel) * 18);
}

.leg-right {
  left: calc(var(--pixel) * 25);
}

.hair-back {
  left: calc(var(--pixel) * 13);
  top: calc(var(--pixel) * 2);
  width: calc(var(--pixel) * 22);
  height: calc(var(--pixel) * 22);
  border-radius: calc(var(--pixel) * 9) calc(var(--pixel) * 9) calc(var(--pixel) * 5) calc(var(--pixel) * 5);
  background: var(--hair);
}

.hair-front {
  left: calc(var(--pixel) * 15);
  top: calc(var(--pixel) * 3);
  width: calc(var(--pixel) * 18);
  height: calc(var(--pixel) * 8);
  border-radius: calc(var(--pixel) * 7) calc(var(--pixel) * 7) calc(var(--pixel) * 2) calc(var(--pixel) * 2);
  background: var(--hair-shine);
}

.hair-bang {
  top: calc(var(--pixel) * 9);
  width: calc(var(--pixel) * 7);
  height: calc(var(--pixel) * 8);
  border-radius: 0 0 calc(var(--pixel) * 5) calc(var(--pixel) * 5);
  background: var(--hair);
}

.bang-a {
  left: calc(var(--pixel) * 16);
}

.bang-b {
  left: calc(var(--pixel) * 25);
}

.shape-bob .hair-back {
  height: calc(var(--pixel) * 26);
}

.shape-spike .hair-front {
  top: calc(var(--pixel) * 1);
  height: calc(var(--pixel) * 11);
  clip-path: polygon(0 100%, 10% 20%, 28% 78%, 45% 0, 62% 78%, 84% 18%, 100% 100%);
}

.eye {
  top: calc(var(--pixel) * 13);
  width: calc(var(--pixel) * 3);
  height: calc(var(--pixel) * 4);
  border-radius: 50%;
  background: #17191d;
}

.eye-left {
  left: calc(var(--pixel) * 19);
}

.eye-right {
  left: calc(var(--pixel) * 27);
}

.mouth {
  left: calc(var(--pixel) * 22);
  top: calc(var(--pixel) * 18);
  width: calc(var(--pixel) * 5);
  height: calc(var(--pixel) * 2);
  border-radius: 999px;
  background: #9d4b4f;
}

.expression-focus .eye {
  height: calc(var(--pixel) * 2);
}

.expression-smile .eye {
  height: calc(var(--pixel) * 2);
  border-radius: 0;
}

.expression-smile .mouth {
  height: calc(var(--pixel) * 3);
  border-radius: 0 0 calc(var(--pixel) * 5) calc(var(--pixel) * 5);
}

.cape-cloth {
  left: calc(var(--pixel) * 13);
  top: calc(var(--pixel) * 24);
  width: calc(var(--pixel) * 22);
  height: calc(var(--pixel) * 30);
  border-radius: calc(var(--pixel) * 5) calc(var(--pixel) * 5) calc(var(--pixel) * 10) calc(var(--pixel) * 10);
  background: linear-gradient(90deg, var(--item-trim), var(--item-main) 22% 78%, var(--item-trim));
}

.top-body {
  left: calc(var(--pixel) * 16);
  top: calc(var(--pixel) * 25);
  width: calc(var(--pixel) * 16);
  height: calc(var(--pixel) * 18);
  border-radius: calc(var(--pixel) * 4);
  background: linear-gradient(var(--item-trim) 0 calc(var(--pixel) * 3), var(--item-main) calc(var(--pixel) * 3));
}

.top-sleeve {
  top: calc(var(--pixel) * 27);
  width: calc(var(--pixel) * 8);
  height: calc(var(--pixel) * 12);
  border-radius: calc(var(--pixel) * 4);
  background: var(--item-main);
}

.sleeve-left {
  left: calc(var(--pixel) * 10);
  transform: rotate(10deg);
}

.sleeve-right {
  left: calc(var(--pixel) * 30);
  transform: rotate(-10deg);
}

.pants-waist {
  left: calc(var(--pixel) * 17);
  top: calc(var(--pixel) * 39);
  width: calc(var(--pixel) * 14);
  height: calc(var(--pixel) * 5);
  background: var(--item-trim);
}

.pants-leg {
  top: calc(var(--pixel) * 43);
  width: calc(var(--pixel) * 7);
  height: calc(var(--pixel) * 10);
  border-radius: calc(var(--pixel) * 2);
  background: var(--item-main);
}

.pants-left {
  left: calc(var(--pixel) * 17);
}

.pants-right {
  left: calc(var(--pixel) * 25);
}

.shoe {
  top: calc(var(--pixel) * 52);
  width: calc(var(--pixel) * 10);
  height: calc(var(--pixel) * 5);
  border-radius: calc(var(--pixel) * 3);
  background: linear-gradient(var(--item-main) 0 70%, var(--item-sole) 70%);
}

.shoe-left {
  left: calc(var(--pixel) * 14);
}

.shoe-right {
  left: calc(var(--pixel) * 25);
}

.hat-crown {
  left: calc(var(--pixel) * 14);
  top: 0;
  width: calc(var(--pixel) * 20);
  height: calc(var(--pixel) * 10);
  border-radius: calc(var(--pixel) * 8) calc(var(--pixel) * 8) calc(var(--pixel) * 3) calc(var(--pixel) * 3);
  background: var(--item-main);
}

.hat-brim {
  left: calc(var(--pixel) * 12);
  top: calc(var(--pixel) * 8);
  width: calc(var(--pixel) * 24);
  height: calc(var(--pixel) * 4);
  border-radius: 999px;
  background: var(--item-trim);
}

.shape-leaf .hat-crown {
  clip-path: polygon(50% 0, 100% 70%, 56% 100%, 0 72%);
}

.weapon-grip {
  left: calc(var(--pixel) * 35);
  top: calc(var(--pixel) * 25);
  width: calc(var(--pixel) * 4);
  height: calc(var(--pixel) * 25);
  border-radius: 999px;
  background: var(--item-main);
  transform: rotate(-24deg);
}

.weapon-head {
  left: calc(var(--pixel) * 36);
  top: calc(var(--pixel) * 17);
  width: calc(var(--pixel) * 5);
  height: calc(var(--pixel) * 16);
  border-radius: calc(var(--pixel) * 2);
  background: var(--item-blade);
  transform: rotate(-24deg);
}

.shape-staff .weapon-head {
  width: calc(var(--pixel) * 9);
  height: calc(var(--pixel) * 9);
  border-radius: 50%;
}

.pose-walk .avatar-stage {
  animation: avatar-walk 0.72s steps(2) infinite;
}

.pose-jump .avatar-stage {
  transform: translateY(calc(var(--pixel) * -5));
}

.direction-left.pose-jump .avatar-stage {
  transform: scaleX(-1) translateY(calc(var(--pixel) * -5));
}

.pose-attack .weapon-grip,
.pose-attack .weapon-head {
  transform: rotate(-58deg) translateY(calc(var(--pixel) * -4));
}

@keyframes avatar-walk {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 calc(var(--pixel) * -2);
  }
}
</style>
