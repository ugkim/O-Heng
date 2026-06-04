import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import CharacterCreateView from '../views/CharacterCreateView.vue'
import CharacterCustomizeView from '../views/CharacterCustomizeView.vue'
import CharacterSelectScreen from '../screens/CharacterSelectScreen.vue'
import LoginScreen from '../screens/LoginScreen.vue'
import RegisterScreen from '../screens/RegisterScreen.vue'
import { getSelectedCharacter, getStoredAccount } from '../services/sessionService'

// Vue Router는 Phaser 바깥의 화면 전환을 담당한다.
// 실제 게임 루프와 입력 처리는 /game 화면 안의 Phaser 인스턴스가 맡는다.
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginScreen,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterScreen,
  },
  {
    path: '/characters',
    name: 'characters',
    component: CharacterSelectScreen,
    meta: { requiresAccount: true },
  },
  {
    path: '/character/create',
    name: 'character-create',
    component: CharacterCreateView,
    meta: { requiresAccount: true },
  },
  {
    path: '/character/:characterId/customize',
    name: 'character-customize',
    component: CharacterCustomizeView,
    meta: { requiresAccount: true },
  },
  {
    path: '/game',
    name: 'game',
    component: GameView,
    meta: { requiresCharacter: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAccount && !getStoredAccount()) {
    return '/login'
  }

  if (to.meta.requiresCharacter && !getSelectedCharacter()) {
    return '/character/create'
  }

  return true
})

export default router
