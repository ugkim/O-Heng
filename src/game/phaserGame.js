import Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import TownScene from './scenes/TownScene'
import FieldScene from './scenes/FieldScene'

// Phaser 인스턴스 생성만 담당하는 팩토리 함수다.
// Vue 컴포넌트는 이 함수를 호출하고, unmount 시 반환된 game.destroy()만 수행하면 된다.
export function createPhaserGame(parent, initialMapData = null) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#192231',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 980 },
        debug: false,
      },
    },
    scene: [new BootScene(initialMapData), TownScene, FieldScene],
  })
}
