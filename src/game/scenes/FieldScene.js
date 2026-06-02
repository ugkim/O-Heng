import Phaser from 'phaser'
import { calculateCharacterStats } from '../data/characterStats'
import { createInitialPlayerState } from '../data/playerBase'
import { MONSTER_DEFINITIONS } from '../data/monsters'
import { DEFAULT_MAP_KEY, getMapDefinition } from '../data/maps'
import { attackMonster, findMonsterInRange } from '../systems/combatSystem'
import { addExperience } from '../systems/levelSystem'
import { updateCharacterState } from '../../services/characterService'
import { fetchMapByKey } from '../../services/mapService'
import { resolveCharacterSprite } from '../../data/spriteMap'
import {
  getSelectedCharacter,
  getStoredAccount,
  storeSelectedCharacter,
} from '../../services/sessionService'

const PLAYER_SPEED = 220
const PLAYER_JUMP_SPEED = 470
const PLAYER_CLIMB_SPEED = 160
const PLAYER_BODY_WIDTH = 34
const PLAYER_BODY_HEIGHT = 56
const ATTACK_RANGE = 70
const FALL_RESPAWN_OFFSET = 170
const MONSTER_RESPAWN_INTERVAL = 3000
const MONSTER_FULL_RESPAWN_INTERVAL = 30000
const MONSTER_COLORS = {
  neutral: 0x66d36e,
  wood: 0x4ed483,
  fire: 0xe05f3f,
  water: 0x5aa7ff,
  metal: 0xcfd7df,
  earth: 0xd3a35b,
}

export default class FieldScene extends Phaser.Scene {
  constructor() {
    super('FieldScene')
  }

  preload() {
    this.selectedCharacter = getSelectedCharacter()
    this.playerSpriteData = resolveCharacterSprite(this.selectedCharacter)
    this.playerTextureKey = `player:${this.playerSpriteData.key}`

    if (!this.textures.exists(this.playerTextureKey)) {
      this.load.spritesheet(this.playerTextureKey, this.playerSpriteData.src, {
        frameWidth: this.playerSpriteData.frameWidth,
        frameHeight: this.playerSpriteData.frameHeight,
        endFrame: this.playerSpriteData.frameCount - 1,
      })
    }
  }

  create(data = {}) {
    this.mapKey = data.mapKey || data.mapData?.mapKey || DEFAULT_MAP_KEY
    this.mapData = data.mapData || getMapDefinition(this.mapKey)
    this.respawnPoint = data.spawnPoint || this.mapData.spawnPoint || { x: 180, y: 410 }
    this.account = getStoredAccount()
    this.selectedCharacter = this.selectedCharacter || getSelectedCharacter()
    this.playerState = createInitialPlayerState(this.selectedCharacter)
    this.monsters = []
    this.monsterSpawnStates = []
    this.playerFacing = 'right'
    this.isPlayerAttacking = false
    this.isClimbing = false
    this.activeLadder = null
    this.jumpsRemaining = 2

    this.createWorld()
    this.createPlayer()
    this.createMonsters()
    this.createInput()
    this.createHud()
  }

  update() {
    const portalUpPressed = this.consumePortalUpPressed()
    this.updatePlayerMovement()
    this.updatePortalInteraction(portalUpPressed)
    this.updateHud()
  }

  createWorld() {
    const worldWidth = this.mapData.width
    const worldHeight = this.mapData.height
    const background = this.mapData.background || {}
    const skyColor = Phaser.Display.Color.HexStringToColor(background.skyColor || '#1f3447').color
    const borderColor = Phaser.Display.Color.HexStringToColor(background.borderColor || '#5fb3a1').color

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 240)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)

    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, skyColor)
    this.createBackgroundDecor(worldWidth, worldHeight, background)
    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth - 60, worldHeight - 60).setStrokeStyle(2, borderColor)

    this.platforms = this.physics.add.staticGroup()
    ;(this.mapData.platforms || this.mapData.floorData?.platforms || []).forEach((platform) => {
      this.addPlatform(platform)
    })

    this.createLadders()
    this.createPortals()

    this.mapNameText = this.add
      .text(480, 16, this.mapData.mapName || this.mapData.name, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(120)
  }

  createBackgroundDecor(worldWidth, worldHeight, background) {
    const farTreeColor = Phaser.Display.Color.HexStringToColor(background.farTreeColor || '#25465a').color
    const treeColor = Phaser.Display.Color.HexStringToColor(background.treeColor || '#1b3f35').color
    const groundColor = Phaser.Display.Color.HexStringToColor(background.groundColor || '#162330').color

    for (let x = 80; x < worldWidth; x += 180) {
      const height = 110 + ((x / 60) % 4) * 18
      this.add.rectangle(x, worldHeight - 80 - height / 2, 34, height, farTreeColor, 0.45)
      this.add.circle(x, worldHeight - 98 - height, 58, farTreeColor, 0.45)
    }

    for (let x = 40; x < worldWidth; x += 260) {
      const height = 130 + ((x / 80) % 3) * 22
      this.add.rectangle(x, worldHeight - 74 - height / 2, 40, height, treeColor, 0.58)
      this.add.circle(x - 22, worldHeight - 108 - height, 52, treeColor, 0.58)
      this.add.circle(x + 24, worldHeight - 116 - height, 62, treeColor, 0.58)
    }

    this.add.rectangle(worldWidth / 2, worldHeight - 38, worldWidth, 76, groundColor)
  }

  addPlatform(platformData) {
    const { x, y, width, height, id = '' } = platformData
    const background = this.mapData.background || {}
    const platformColor = Phaser.Display.Color.HexStringToColor(background.platformColor || '#2b4c54').color
    const surfaceColor = Phaser.Display.Color.HexStringToColor(background.surfaceColor || '#79d7c9').color
    const shadowColor = Phaser.Display.Color.HexStringToColor(background.groundColor || '#162330').color
    const platform = this.add.rectangle(x, y + height / 2, width, height, platformColor)
    this.physics.add.existing(platform, true)
    platform.platformId = id
    this.platforms.add(platform)

    const isGround = id.includes('-ground-')
    this.add.rectangle(x, y, width, isGround ? 8 : 5, surfaceColor)
    this.add.rectangle(x, y + height - 2, width, 4, shadowColor, 0.26)

    if (isGround) {
      for (let offset = -width / 2 + 28; offset < width / 2; offset += 56) {
        this.add.rectangle(x + offset, y + height / 2 + 4, 14, height - 12, shadowColor, 0.18)
      }
    }

    return platform
  }

  createLadders() {
    this.ladders = []

    ;(this.mapData.ladders || []).forEach((ladder) => {
      const railColor = 0x8b5f35
      const rungColor = 0xd0a46f
      const topY = ladder.y
      const bottomY = ladder.y + ladder.height
      const leftX = ladder.x - ladder.width / 2 + 7
      const rightX = ladder.x + ladder.width / 2 - 7

      this.add.rectangle(leftX, topY + ladder.height / 2, 5, ladder.height, railColor)
      this.add.rectangle(rightX, topY + ladder.height / 2, 5, ladder.height, railColor)

      for (let y = topY + 12; y < bottomY; y += 18) {
        this.add.rectangle(ladder.x, y, ladder.width, 4, rungColor)
      }

      this.ladders.push({
        ...ladder,
        left: ladder.x - ladder.width / 2,
        right: ladder.x + ladder.width / 2,
        top: ladder.y,
        bottom: ladder.y + ladder.height,
      })
    })
  }

  createPortals() {
    this.portals = this.physics.add.staticGroup()

    ;(this.mapData.portals || []).forEach((portalData) => {
      const portal = this.add.rectangle(
        portalData.x,
        portalData.y,
        portalData.width,
        portalData.height,
        0x8be4d0,
        0.24,
      )
      portal.mapPortal = portalData
      this.physics.add.existing(portal, true)
      this.portals.add(portal)

      this.add
        .text(portalData.x, portalData.y - portalData.height / 2 - 18, portalData.name || 'Portal', {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#d8fff7',
        })
        .setOrigin(0.5)
    })
  }

  createPlayer() {
    this.createPlayerAnimations()

    this.player = this.physics.add.sprite(
      this.respawnPoint.x,
      this.respawnPoint.y,
      this.playerTextureKey,
      this.getAnimationFrames('idle')[0] || 0,
    )
    this.player.setOrigin(0.5, 1)
    this.player.setDisplaySize(this.playerSpriteData.renderWidth, this.playerSpriteData.renderHeight)
    this.player.play(this.getAnimationKey('idle'))

    this.player.body.setCollideWorldBounds(false)
    this.configurePlayerBody()
    this.player.body.setMaxVelocity(PLAYER_SPEED, 820)
    this.player.body.setDragX(1400)

    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
  }

  configurePlayerBody() {
    const scaleX = this.playerSpriteData.renderWidth / this.playerSpriteData.frameWidth
    const scaleY = this.playerSpriteData.renderHeight / this.playerSpriteData.frameHeight
    const bodyWidth = PLAYER_BODY_WIDTH / scaleX
    const bodyHeight = PLAYER_BODY_HEIGHT / scaleY
    const offsetX = (this.playerSpriteData.frameWidth - bodyWidth) / 2
    const offsetY = this.playerSpriteData.frameHeight - bodyHeight

    this.player.body.setSize(bodyWidth, bodyHeight, false)
    this.player.body.setOffset(offsetX, offsetY)
  }

  createPlayerAnimations() {
    this.createAnimation('idle', 2, -1)
    this.createAnimation('walk', 8, -1)
    this.createAnimation('jump', 1, -1)
    this.createAnimation('attack', 12, 0)
  }

  createAnimation(name, frameRate, repeat) {
    const key = this.getAnimationKey(name)

    if (this.anims.exists(key)) return

    this.anims.create({
      key,
      frames: this.getAnimationFrames(name).map((frame) => ({
        key: this.playerTextureKey,
        frame,
      })),
      frameRate,
      repeat,
    })
  }

  getAnimationKey(name) {
    return `${this.playerTextureKey}:${name}`
  }

  getAnimationFrames(name) {
    const frames = this.playerSpriteData.animations?.[name] || this.playerSpriteData.animations?.idle || [0]
    const maxFrame = this.playerSpriteData.frameCount - 1

    return frames.filter((frame) => frame >= 0 && frame <= maxFrame)
  }

  createMonsters() {
    this.monsterSpawnStates = []

    if ((this.mapData.monsterSpawnAreas || []).length > 0) {
      this.createMonstersFromSpawnAreas()
      this.startMonsterRespawnTimers()
      return
    }

    Object.entries(this.mapData.monsterConfig || {}).forEach(([monsterId, mapMonsterConfig]) => {
      const spawnPoints = mapMonsterConfig.spawnPoints || []
      const maxSpawn = Math.min(mapMonsterConfig.maxSpawn ?? spawnPoints.length, spawnPoints.length)

      this.monsterSpawnStates.push({
        id: `legacy-${monsterId}`,
        monsterType: monsterId,
        monsterConfig: mapMonsterConfig,
        maxSpawn,
        spawnPoints: spawnPoints.slice(0, maxSpawn),
      })

      for (let index = 0; index < maxSpawn; index += 1) {
        this.spawnMonsterFromState(this.monsterSpawnStates[this.monsterSpawnStates.length - 1], {
          fixedIndex: index,
          respectChance: true,
        })
      }
    })

    this.startMonsterRespawnTimers()
  }

  createMonstersFromSpawnAreas() {
    ;(this.mapData.monsterSpawnAreas || []).forEach((area) => {
      const platform = (this.mapData.platforms || []).find((item) => item.id === area.platformId)
      const monsterConfig = this.mapData.monsterConfig?.[area.monsterType] || {}
      const maxSpawn = Math.max(0, area.maxSpawn ?? area.maxCount ?? monsterConfig.maxSpawn ?? 0)

      if (!platform || maxSpawn <= 0) return

      const range = area.spawnRange || {
        x1: platform.x - platform.width / 2 + 24,
        x2: platform.x + platform.width / 2 - 24,
      }

      const state = {
        id: area.id,
        area,
        platform,
        range,
        monsterType: area.monsterType,
        monsterConfig,
        maxSpawn,
      }
      this.monsterSpawnStates.push(state)

      for (let index = 0; index < maxSpawn; index += 1) {
        this.spawnMonsterFromState(state, { fixedIndex: index, respectChance: true })
      }
    })
  }

  startMonsterRespawnTimers() {
    if (this.monsterRespawnTimer || this.monsterFullRespawnTimer || this.monsterSpawnStates.length === 0) {
      return
    }

    this.monsterRespawnTimer = this.time.addEvent({
      delay: MONSTER_RESPAWN_INTERVAL,
      loop: true,
      callback: () => this.respawnOneMissingMonster(),
    })

    this.monsterFullRespawnTimer = this.time.addEvent({
      delay: MONSTER_FULL_RESPAWN_INTERVAL,
      loop: true,
      callback: () => this.fillMonsterSpawnsToMax(),
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.monsterRespawnTimer?.remove(false)
      this.monsterFullRespawnTimer?.remove(false)
      this.monsterRespawnTimer = null
      this.monsterFullRespawnTimer = null
    })
  }

  respawnOneMissingMonster() {
    const targetState = this.monsterSpawnStates.find(
      (state) => this.countMonstersInSpawnState(state) < state.maxSpawn,
    )

    if (targetState) {
      this.spawnMonsterFromState(targetState)
    }
  }

  fillMonsterSpawnsToMax() {
    this.monsterSpawnStates.forEach((state) => {
      while (this.countMonstersInSpawnState(state) < state.maxSpawn) {
        if (!this.spawnMonsterFromState(state)) break
      }
    })
  }

  countMonstersInSpawnState(state) {
    return this.monsters.filter((monster) => monster.spawnStateId === state.id).length
  }

  spawnMonsterFromState(state, options = {}) {
    if (!state || this.countMonstersInSpawnState(state) >= state.maxSpawn) return false

    const spawnChance = Phaser.Math.Clamp(
      state.area?.spawnChance ?? state.monsterConfig.spawnChance ?? 100,
      0,
      100,
    )

    if (options.respectChance && Phaser.Math.Between(1, 100) > spawnChance) {
      return false
    }

    const spawnPoint = this.getSpawnPointForState(state, options.fixedIndex)
    if (!spawnPoint) return false

    const monster = this.createMonster(state.monsterType, state.monsterConfig, spawnPoint)
    if (!monster) return false

    monster.spawnStateId = state.id
    this.monsters.push(monster)
    return true
  }

  getSpawnPointForState(state, fixedIndex = null) {
    if (state.spawnPoints?.length) {
      return state.spawnPoints[fixedIndex ?? Phaser.Math.Between(0, state.spawnPoints.length - 1)]
    }

    if (!state.platform || !state.range) return null

    const x1 = Math.min(state.range.x1, state.range.x2)
    const x2 = Math.max(state.range.x1, state.range.x2)
    const radius = state.monsterConfig.radius || 24
    const x =
      fixedIndex !== null && state.maxSpawn > 1
        ? x1 + ((x2 - x1) / (state.maxSpawn - 1)) * fixedIndex
        : Phaser.Math.Between(Math.round(x1), Math.round(x2))

    return {
      x,
      y: state.platform.y - radius - 4,
    }
  }

  createMonster(monsterId, mapMonsterConfig, spawnPoint) {
    const baseMonsterData = MONSTER_DEFINITIONS[monsterId]
    if (!baseMonsterData && !mapMonsterConfig?.name) return null

    const maxHp = mapMonsterConfig.hp ?? mapMonsterConfig.maxHp ?? baseMonsterData?.maxHp ?? 30
    const element = mapMonsterConfig.element || baseMonsterData?.element || 'neutral'
    const monster = {
      ...(baseMonsterData || {}),
      id: monsterId,
      name: mapMonsterConfig.name || baseMonsterData?.name || monsterId,
      element,
      maxHp,
      attack: mapMonsterConfig.attack ?? baseMonsterData?.attack ?? 0,
      defense: mapMonsterConfig.defense ?? baseMonsterData?.defense ?? 0,
      exp: mapMonsterConfig.exp ?? baseMonsterData?.exp ?? 0,
      gold: mapMonsterConfig.gold ?? baseMonsterData?.gold ?? 0,
      dropItems: mapMonsterConfig.dropItems || [],
      currentHp: maxHp,
      body: this.add.circle(
        spawnPoint.x,
        spawnPoint.y,
        mapMonsterConfig.radius || 24,
        MONSTER_COLORS[element] || MONSTER_COLORS.neutral,
      ),
      nameText: null,
      hpText: null,
    }

    this.physics.add.existing(monster.body)
    monster.body.body.setImmovable(true)
    monster.body.body.setAllowGravity(false)

    monster.nameText = this.add
      .text(monster.body.x, monster.body.y - 46, monster.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    monster.hpText = this.add
      .text(monster.body.x, monster.body.y + 34, `HP ${monster.currentHp}/${monster.maxHp}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#f6ffb8',
      })
      .setOrigin(0.5)

    return monster
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    })

    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleAttack()
      }
    })

    // Vue 모바일 조작 버튼이 보내는 입력 상태다.
    // 키보드 입력과 동일한 updatePlayerMovement()에서 함께 읽는다.
    this.virtualInput = {
      up: false,
      upQueued: false,
      down: false,
      left: false,
      right: false,
      jumpQueued: false,
    }

    this.handleVirtualControl = (event) => {
      const { type, control } = event.detail || {}

      if (type === 'attack') {
        this.handleAttack()
        return
      }

      if (control === 'jump' && type === 'start') {
        this.virtualInput.jumpQueued = true
        return
      }

      if (!(control in this.virtualInput)) return

      if (control === 'up' && type === 'start') {
        this.virtualInput.upQueued = true
      }

      this.virtualInput[control] = type === 'start'
    }

    this.handleCharacterUpdated = (event) => {
      const character = event.detail?.character
      if (!character || character.id !== this.selectedCharacter?.id) return

      this.selectedCharacter = {
        ...this.selectedCharacter,
        ...character,
      }
      this.playerState.level = character.level ?? this.playerState.level
      this.playerState.exp = character.exp ?? this.playerState.exp
      this.playerState.gold = character.gold ?? this.playerState.gold
      this.playerState.currentHp = character.hp ?? this.playerState.currentHp
      this.playerState.currentMp = character.mp ?? this.playerState.currentMp
      this.playerState.elementPoints = character.element_points ?? this.playerState.elementPoints
      this.playerState.elements = character.elements || this.playerState.elements || {}
      this.refreshPlayerStats()
    }

    window.addEventListener('rpg-control', this.handleVirtualControl)
    window.addEventListener('character-updated', this.handleCharacterUpdated)

    // Scene이 종료될 때 Vue에서 온 전역 이벤트 리스너를 반드시 제거한다.
    // 이후 Scene 교체나 Phaser destroy 때 중복 입력이 남지 않게 하기 위함이다.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('rpg-control', this.handleVirtualControl)
      window.removeEventListener('character-updated', this.handleCharacterUpdated)
    })
  }

  createHud() {
    // 좌측 상단 고정 HUD다. 카메라 이동이 추가되어도 화면에 붙어 있도록 scrollFactor를 0으로 둔다.
    this.hudText = this.add
      .text(16, 16, '', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#00000099',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(100)

    this.updateHud()
  }

  updatePlayerMovement() {
    const body = this.player.body
    const up = this.cursors.up.isDown || this.keys.up.isDown || this.virtualInput.up
    const down = this.cursors.down.isDown || this.keys.down.isDown || this.virtualInput.down
    const left = this.cursors.left.isDown || this.keys.left.isDown || this.virtualInput.left
    const right = this.cursors.right.isDown || this.keys.right.isDown || this.virtualInput.right
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) || this.virtualInput.jumpQueued
    const onGround = body.blocked.down || body.touching.down

    this.virtualInput.jumpQueued = false

    const currentLadder = this.findCurrentLadder()
    if ((up || down) && currentLadder) {
      this.startClimbing(currentLadder)
    }

    if (this.isClimbing) {
      this.updateLadderMovement({ up, down, left, right, jumpPressed })
      return
    }

    if (onGround) {
      this.jumpsRemaining = 2
    }

    if (left && !right) {
      body.setVelocityX(-PLAYER_SPEED)
      this.playerFacing = 'left'
    } else if (right && !left) {
      body.setVelocityX(PLAYER_SPEED)
      this.playerFacing = 'right'
    } else {
      body.setVelocityX(0)
    }

    if (jumpPressed && this.jumpsRemaining > 0) {
      body.setVelocityY(-PLAYER_JUMP_SPEED)
      this.jumpsRemaining -= 1
    }

    this.player.setFlipX(this.playerFacing === 'left')
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.mapData.width - 20)

    if (this.player.y > this.mapData.height + FALL_RESPAWN_OFFSET) {
      this.respawnPlayer()
      return
    }

    this.updatePlayerAnimation(onGround)
  }

  findCurrentLadder() {
    const body = this.player.body
    const footY = body.y + body.height
    const centerX = body.x + body.width / 2

    return (this.ladders || []).find((ladder) => {
      const horizontalPadding = 18
      const verticalPadding = 10

      return (
        centerX >= ladder.left - horizontalPadding &&
        centerX <= ladder.right + horizontalPadding &&
        footY >= ladder.top - verticalPadding &&
        body.y <= ladder.bottom + verticalPadding
      )
    })
  }

  startClimbing(ladder) {
    this.isClimbing = true
    this.activeLadder = ladder
    this.jumpsRemaining = 2
    this.player.x = ladder.x
    this.playerPlatformCollider.active = false
    this.player.body.setAllowGravity(false)
    this.player.body.setVelocity(0, 0)
  }

  stopClimbing() {
    this.isClimbing = false
    this.activeLadder = null
    this.playerPlatformCollider.active = true
    this.player.body.setAllowGravity(true)
  }

  updateLadderMovement({ up, down, left, right, jumpPressed }) {
    const ladder = this.activeLadder
    if (!ladder) {
      this.stopClimbing()
      return
    }

    if (jumpPressed) {
      this.stopClimbing()
      this.player.body.setVelocityY(-PLAYER_JUMP_SPEED)
      this.jumpsRemaining = 1
      return
    }

    const climbDirection = (down ? 1 : 0) - (up ? 1 : 0)
    const horizontalDirection = (right ? 1 : 0) - (left ? 1 : 0)

    if (left && !right) {
      this.playerFacing = 'left'
    } else if (right && !left) {
      this.playerFacing = 'right'
    }

    this.player.body.setVelocityX(horizontalDirection * (PLAYER_SPEED * 0.45))
    this.player.body.setVelocityY(climbDirection * PLAYER_CLIMB_SPEED)

    if (!left && !right) {
      this.player.x = Phaser.Math.Linear(this.player.x, ladder.x, 0.22)
    }

    if (this.player.body.y < ladder.top - 18) {
      this.player.y = ladder.top
      this.player.body.setVelocity(0, 0)
      this.stopClimbing()
      return
    }

    if (this.player.body.y + this.player.body.height > ladder.bottom + 18) {
      this.player.y = ladder.bottom
      this.player.body.setVelocity(0, 0)
      this.stopClimbing()
      return
    }

    if (!this.findCurrentLadder()) {
      this.stopClimbing()
      return
    }

    this.player.setFlipX(this.playerFacing === 'left')
    this.player.play(this.getAnimationKey('idle'), true)
  }

  consumePortalUpPressed() {
    if (!this.cursors || !this.keys || !this.virtualInput) return false

    const upPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      this.virtualInput.upQueued

    this.virtualInput.upQueued = false
    return upPressed
  }

  updatePortalInteraction(upPressed) {
    const portalData = this.findCurrentPortal()

    if (!portalData) {
      this.activePortalId = null
      return
    }

    if (this.activePortalId !== portalData.id) {
      this.activePortalId = portalData.id
      this.showFloatingText(this.player.x, this.player.y - 86, '위 키로 이동', '#d8fff7')
    }

    if (upPressed) {
      this.enterPortal(portalData)
    }
  }

  findCurrentPortal() {
    const body = this.player?.body
    if (!body) return null

    const centerX = body.x + body.width / 2
    const centerY = body.y + body.height / 2

    return (this.mapData.portals || []).find((portal) => {
      const left = portal.x - portal.width / 2
      const right = portal.x + portal.width / 2
      const top = portal.y - portal.height / 2
      const bottom = portal.y + portal.height / 2

      return centerX >= left && centerX <= right && centerY >= top && centerY <= bottom
    })
  }

  updatePlayerAnimation(onGround) {
    if (this.isPlayerAttacking) return

    if (!onGround) {
      this.player.play(this.getAnimationKey('jump'), true)
      return
    }

    if (Math.abs(this.player.body.velocity.x) > 5) {
      this.player.play(this.getAnimationKey('walk'), true)
      return
    }

    this.player.play(this.getAnimationKey('idle'), true)
  }

  respawnPlayer() {
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y)
    this.player.body.setVelocity(0, 0)
    this.jumpsRemaining = 2
    this.showFloatingText(this.player.x, this.player.y - 72, 'RESPAWN', '#8fd3ff')
  }

  async enterPortal(portalData) {
    if (!portalData || this.isEnteringPortal) return

    this.isEnteringPortal = true
    const targetMapKey = portalData.targetMapKey || portalData.targetMapId

    try {
      const targetMap = await fetchMapByKey(targetMapKey)
      const targetSpawn =
        targetMap.spawns?.find((spawn) => spawn.id === portalData.targetSpawnId) ||
        portalData.targetSpawnPoint ||
        targetMap.spawnPoint

      this.scene.restart({
        mapKey: targetMap.mapKey || targetMapKey,
        mapData: targetMap,
        spawnPoint: targetSpawn,
      })
      return
    } catch (error) {
      console.error('맵 이동 실패:', error)
    }

    if (getMapDefinition(targetMapKey)?.mapKey === targetMapKey) {
      const targetMap = getMapDefinition(targetMapKey)
      const targetSpawn =
        targetMap.spawns?.find((spawn) => spawn.id === portalData.targetSpawnId) ||
        portalData.targetSpawnPoint ||
        targetMap.spawnPoint

      this.scene.restart({
        mapKey: targetMapKey,
        mapData: targetMap,
        spawnPoint: targetSpawn,
      })
      return
    }

    this.showFloatingText(this.player.x, this.player.y - 72, `${portalData.name || '포탈'} 준비 중`, '#8fd3ff')
    this.time.delayedCall(900, () => {
      this.isEnteringPortal = false
    })
  }

  handleAttack() {
    this.playAttackAnimation()

    const target = findMonsterInRange(this.player, this.monsters, ATTACK_RANGE)

    if (!target) {
      this.showFloatingText(this.player.x, this.player.y - 36, 'MISS', '#c8d3df')
      return
    }

    const result = attackMonster(target, this.playerState.attack)

    this.showFloatingText(target.body.x, target.body.y - 52, `-${result.damage}`, '#ffdf7e')
    target.hpText.setText(`HP ${Math.max(target.currentHp, 0)}/${target.maxHp}`)

    if (result.defeated) {
      this.defeatMonster(target)
    }
  }

  playAttackAnimation() {
    this.isPlayerAttacking = true
    this.player.play(this.getAnimationKey('attack'), true)
    this.time.delayedCall(280, () => {
      this.isPlayerAttacking = false
    })
  }

  defeatMonster(monster) {
    this.monsters = this.monsters.filter((item) => item !== monster)

    monster.body.destroy()
    monster.nameText.destroy()
    monster.hpText.destroy()

    const levelResult = addExperience(this.playerState, monster.exp)
    const droppedGold = this.rollDroppedGold(monster)
    this.playerState.gold += droppedGold
    this.showFloatingText(this.player.x, this.player.y - 52, `EXP +${monster.exp}`, '#8cffb2')

    if (droppedGold > 0) {
      this.showFloatingText(this.player.x, this.player.y - 30, `돈 +${droppedGold}`, '#ffd36e')
    }

    if (levelResult.leveledUp) {
      this.refreshPlayerStats({ restoreVitals: true })
      this.showFloatingText(this.player.x, this.player.y - 78, 'LEVEL UP!', '#8fd3ff')
      this.showFloatingText(
        this.player.x,
        this.player.y - 104,
        `오행 +${levelResult.gainedElementPoints}`,
        '#ffd36e',
      )
    }

    this.saveCharacterState()
  }

  rollDroppedGold(monster) {
    const baseGold = monster.gold || 0
    const itemGold = (monster.dropItems || []).reduce((total, item) => {
      if (item.itemId !== 'money') return total
      if (Phaser.Math.Between(1, 100) > (item.chance ?? 100)) return total

      const min = item.amountMin ?? item.amount ?? 0
      const max = item.amountMax ?? item.amount ?? min
      return total + Phaser.Math.Between(min, max)
    }, 0)

    return baseGold + itemGold
  }

  async saveCharacterState() {
    if (!this.account?.id || !this.selectedCharacter?.id) return

    this.refreshPlayerStats()

    try {
      const updatedCharacter = await updateCharacterState({
        accountId: this.account.id,
        character: {
          id: this.selectedCharacter.id,
          level: this.playerState.level,
          exp: this.playerState.exp,
          gold: this.playerState.gold,
          hp: this.playerState.currentHp,
          max_hp: this.playerState.maxHp,
          mp: this.playerState.currentMp,
          max_mp: this.playerState.maxMp,
          attack: this.playerState.attack,
          defense: this.playerState.defense,
          dex: this.playerState.dex,
          element_points: this.playerState.elementPoints,
        },
      })

      this.selectedCharacter = {
        ...this.selectedCharacter,
        ...updatedCharacter,
      }
      storeSelectedCharacter(this.selectedCharacter)
      window.dispatchEvent(
        new CustomEvent('character-updated', {
          detail: { character: this.selectedCharacter },
        }),
      )
    } catch (error) {
      console.error('캐릭터 저장 실패:', error)
    }
  }

  refreshPlayerStats({ restoreVitals = false } = {}) {
    const stats = calculateCharacterStats({
      ...this.selectedCharacter,
      level: this.playerState.level,
      elements: this.playerState.elements || this.selectedCharacter?.elements || {},
    })

    const previousMaxHp = this.playerState.maxHp || stats.maxHp
    const previousMaxMp = this.playerState.maxMp || stats.maxMp

    this.playerState.maxHp = stats.maxHp
    this.playerState.maxMp = stats.maxMp
    this.playerState.attack = stats.attack
    this.playerState.defense = stats.defense
    this.playerState.dex = stats.dex

    if (restoreVitals) {
      this.playerState.currentHp = stats.maxHp
      this.playerState.currentMp = stats.maxMp
      return
    }

    this.playerState.currentHp = Math.min(
      Math.max(0, this.playerState.currentHp || stats.maxHp),
      stats.maxHp,
    )
    this.playerState.currentMp = Math.min(
      Math.max(0, this.playerState.currentMp || stats.maxMp),
      stats.maxMp,
    )

    if (stats.maxHp > previousMaxHp && this.playerState.currentHp === previousMaxHp) {
      this.playerState.currentHp = stats.maxHp
    }

    if (stats.maxMp > previousMaxMp && this.playerState.currentMp === previousMaxMp) {
      this.playerState.currentMp = stats.maxMp
    }
  }

  showFloatingText(x, y, text, color) {
    // 전투 피드백용 임시 텍스트다. 이후 데미지 숫자 컴포넌트로 분리할 수 있다.
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color,
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 650,
      onComplete: () => label.destroy(),
    })
  }

  updateHud() {
    this.hudText.setText(
      `Lv ${this.playerState.level}  EXP ${this.playerState.exp}/${this.playerState.expToNextLevel}  HP ${this.playerState.currentHp}/${this.playerState.maxHp}  MP ${this.playerState.currentMp}/${this.playerState.maxMp}  ATK ${this.playerState.attack}  Gold ${this.playerState.gold}  오행 ${this.playerState.elementPoints}`,
    )
  }
}
