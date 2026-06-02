import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor(initialMapData = null) {
    super('BootScene')
    this.initialMapData = initialMapData
  }

  create() {
    // 이미지/사운드 로딩이 생기면 preload()에서 처리하고 여기서 다음 Scene으로 넘기면 된다.
    // 지금은 기본 도형만 사용하므로 바로 필드로 이동한다.
    this.scene.start('FieldScene', {
      mapData: this.initialMapData,
    })
  }
}
