import Phaser from 'phaser'

export default class TownScene extends Phaser.Scene {
  constructor() {
    super('TownScene')
  }

  create() {
    // 이후 마을 NPC, 상점, 창고, 퀘스트 UI를 붙일 수 있도록 비워 둔 Scene이다.
    this.add
      .text(32, 32, 'Town Scene', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
  }
}
