import Phaser from 'phaser'
import { calculateCharacterStats } from '../data/characterStats'
import {
  MAP_COMPONENT_ATLAS,
  getAtlasRect,
  getMapThemeKey,
  getPlatformComponentSet,
} from '../data/mapComponentAtlas'
import { createInitialPlayerState } from '../data/playerBase'
import { MONSTER_DEFINITIONS } from '../data/monsters'
import { DEFAULT_MAP_KEY, MAP_BACKGROUND_IMAGES, getMapDefinition } from '../data/maps'
import { attackMonster, findMonsterInRange } from '../systems/combatSystem'
import { addExperience } from '../systems/levelSystem'
import { updateCharacterState } from '../../services/characterService'
import { fetchMapByKey } from '../../services/mapService'
import { findSprite, resolveCharacterSprite, spriteMap } from '../../data/spriteMap'
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
const SKILL_MANA_COST = 8
const FALL_RESPAWN_OFFSET = 170
const MONSTER_RESPAWN_INTERVAL = 3000
const MONSTER_FULL_RESPAWN_INTERVAL = 30000
const MONSTER_SPAWN_DURATION = 1000
const MONSTER_DEATH_DURATION = 1000
const MONSTER_PATROL_SPEED = 23
const MONSTER_ATTACK_RANGE = 58
const MONSTER_ATTACK_COOLDOWN = 1000
const PLAYER_INVINCIBLE_DURATION = 1000
const PLAYER_VITAL_BAR_WIDTH = 58
const PLAYER_VITAL_BAR_HEIGHT = 5
const PLAYER_VITAL_BAR_GAP = 3
const MAP_COMPONENT_VISUAL_SCALE = 1.5
const MAP_LADDER_VISUAL_SCALE = 1
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

  init(data = {}) {
    this.mapKey = data.mapKey || data.mapData?.mapKey || DEFAULT_MAP_KEY
    this.mapData = data.mapData || getMapDefinition(this.mapKey)
    this.respawnPoint = data.spawnPoint || this.mapData.spawnPoint || { x: 180, y: 410 }
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

    Object.entries(spriteMap.monsters || {}).forEach(([spriteKey, spriteData]) => {
      const textureKey = this.getMonsterTextureKey(spriteKey)
      if (this.textures.exists(textureKey)) return

      const frameWidth = spriteData.frameWidth || Math.floor(spriteData.sourceWidth / spriteData.columns)
      const frameHeight =
        spriteData.frameHeight ||
        Math.floor((spriteData.sourceHeight || spriteData.rows * frameWidth) / spriteData.rows)

      this.load.spritesheet(textureKey, spriteData.src, {
        frameWidth,
        frameHeight,
        endFrame: spriteData.frameCount - 1,
      })
    })

    Object.entries(MAP_BACKGROUND_IMAGES).forEach(([mapKey, imageUrl]) => {
      this.queueMapBackgroundImage(mapKey, imageUrl)
    })

    this.queueMapBackgroundImage(this.mapData?.mapId || this.mapKey, this.mapData?.background?.imageUrl)

    if (!this.textures.exists(MAP_COMPONENT_ATLAS.textureKey)) {
      this.load.image(MAP_COMPONENT_ATLAS.textureKey, MAP_COMPONENT_ATLAS.imageUrl)
    }
  }

  create(data = {}) {
    this.account = getStoredAccount()
    this.selectedCharacter = this.selectedCharacter || getSelectedCharacter()
    this.playerState = createInitialPlayerState(this.selectedCharacter)
    this.monsters = []
    this.monsterSpawnStates = []
    this.playerFacing = 'right'
    this.isPlayerAttacking = false
    this.isPlayerDead = false
    this.isClimbing = false
    this.activeLadder = null
    this.jumpsRemaining = 2
    this.isPlayerInvincible = false
    this.wasPlayerAirborne = false

    this.createWorld()
    this.createPlayer()
    this.createMonsters()
    this.createInput()
    this.createHud()
    this.configureViewport()

    if (this.playerState.currentHp <= 0) {
      this.startPlayerDeath()
    }
  }

  update() {
    const portalUpPressed = this.consumePortalUpPressed()
    this.updatePlayerMovement()
    this.updateMonsters()
    this.updateMonsterAttacks()
    this.updatePortalInteraction(portalUpPressed)
    this.updatePlayerVitalBars()
    this.updateHud()
  }

  createWorld() {
    const worldWidth = this.mapData.width
    const worldHeight = this.mapData.height
    const background = this.mapData.background || {}
    const skyColor = Phaser.Display.Color.HexStringToColor(background.skyColor || '#1f3447').color
    const borderColor = Phaser.Display.Color.HexStringToColor(background.borderColor || '#5fb3a1').color
    const hasImageBackground = this.hasMapBackgroundImage()

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 240)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setZoom(1)

    if (hasImageBackground) {
      this.addMapBackgroundImage(worldWidth, worldHeight)
    } else {
      this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, skyColor)
      this.createBackgroundDecor(worldWidth, worldHeight, background)
      this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth - 60, worldHeight - 60).setStrokeStyle(2, borderColor)
    }

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

    if (hasImageBackground) {
      this.mapNameText.setVisible(false)
    }
  }

  getMapBackgroundTextureKey(mapKey = this.mapData?.mapId || this.mapKey) {
    return `map-bg:${mapKey}`
  }

  queueMapBackgroundImage(mapKey, imageUrl) {
    if (!mapKey || !imageUrl) return

    const textureKey = this.getMapBackgroundTextureKey(mapKey)
    if (!this.textures.exists(textureKey)) {
      this.load.image(textureKey, imageUrl)
    }
  }

  hasMapBackgroundImage() {
    const mapKey = this.mapData?.mapId || this.mapKey
    return Boolean(this.mapData?.background?.imageUrl && this.textures.exists(this.getMapBackgroundTextureKey(mapKey)))
  }

  addMapBackgroundImage(worldWidth, worldHeight) {
    const mapKey = this.mapData?.mapId || this.mapKey
    const backgroundImage = this.add.image(worldWidth / 2, worldHeight / 2, this.getMapBackgroundTextureKey(mapKey))

    backgroundImage
      .setDisplaySize(worldWidth, worldHeight)
      .setDepth(-100)
      .setScrollFactor(1)
  }

  configureViewport() {
    this.updateViewportAnchors()
    this.scale.on('resize', this.updateViewportAnchors, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.updateViewportAnchors, this)
    })
  }

  updateViewportAnchors() {
    this.cameras.main.setZoom(1)
    this.mapNameText?.setX(this.scale.width / 2)
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

    if (this.addAtlasPlatformVisual(platformData)) {
      platform.setAlpha(0)
      return platform
    }

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

  addAtlasPlatformVisual(platformData) {
    if (!this.hasMapComponentAtlas()) return false

    const componentKeys = getPlatformComponentSet(platformData)
    const rects = componentKeys.map((componentKey) => this.getMapComponentRect(componentKey))
    if (rects.some((rect) => !rect)) return false

    const { x, y, width } = platformData
    const visualScale = this.getPlatformVisualScale(platformData)
    const visualHeight = Math.round(Math.max(...rects.map((rect) => rect.height)) * visualScale)
    const topY = y
    const leftWidth = Math.min(Math.round(rects[0].width * visualScale), Math.max(16, width / 3))
    const rightWidth = Math.min(Math.round(rects[2].width * visualScale), Math.max(16, width / 3))
    const middleWidth = Math.max(0, width - leftWidth - rightWidth)
    const leftX = x - width / 2

    this.addAtlasImage(rects[0], leftX, topY, leftWidth, visualHeight)

    if (middleWidth > 0) {
      const middleTileWidth = Math.round(rects[1].width * visualScale)
      let cursorX = leftX + leftWidth
      let remainingWidth = middleWidth

      while (remainingWidth > 0.5) {
        const tileWidth = Math.min(middleTileWidth, remainingWidth)
        this.addAtlasImage(rects[1], cursorX, topY, tileWidth, visualHeight)
        cursorX += tileWidth
        remainingWidth -= tileWidth
      }
    }

    this.addAtlasImage(rects[2], leftX + width - rightWidth, topY, rightWidth, visualHeight)

    return true
  }

  getPlatformVisualScale(platformData) {
    if ((platformData.id || '').includes('bridge') || platformData.height <= 20) return 1.08
    if (platformData.height < 34) return 1.12
    return MAP_COMPONENT_VISUAL_SCALE
  }

  addAtlasImage(rect, x, y, width, height) {
    const frameKey = this.getMapComponentFrameKey(rect)
    const texture = this.textures.get(MAP_COMPONENT_ATLAS.textureKey)

    if (!texture.has(frameKey)) {
      texture.add(frameKey, 0, rect.x, rect.y, rect.width, rect.height)
    }

    return this.add
      .image(x, y, MAP_COMPONENT_ATLAS.textureKey, frameKey)
      .setOrigin(0, 0)
      .setDisplaySize(width, height)
      .setDepth(-10)
  }

  getMapComponentFrameKey(rect) {
    return `rect:${rect.x}:${rect.y}:${rect.width}:${rect.height}`
  }

  hasMapComponentAtlas() {
    return this.textures.exists(MAP_COMPONENT_ATLAS.textureKey)
  }

  getMapComponentRect(componentKey) {
    const mapKey = this.mapData?.mapKey || this.mapData?.mapId || this.mapKey
    return getAtlasRect(getMapThemeKey(mapKey), componentKey)
  }

  createLadders() {
    this.ladders = []

    ;(this.mapData.ladders || []).forEach((ladder) => {
      if (this.addAtlasLadderVisual(ladder)) {
        this.ladders.push({
          ...ladder,
          left: ladder.x - ladder.width / 2,
          right: ladder.x + ladder.width / 2,
          top: ladder.y,
          bottom: ladder.y + ladder.height,
        })
        return
      }

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

  addAtlasLadderVisual(ladder) {
    if (!this.hasMapComponentAtlas()) return false

    const topRect = this.getMapComponentRect('ladder_top')
    const middleRect = this.getMapComponentRect('ladder_middle')
    const bottomRect = this.getMapComponentRect('ladder_bottom')
    if (!topRect || !middleRect || !bottomRect) return false

    const visualWidth = Math.max(64, Math.round(topRect.width * MAP_LADDER_VISUAL_SCALE))
    const leftX = ladder.x - visualWidth / 2
    const topY = ladder.y
    const bottomY = ladder.y + ladder.height
    const topHeight = Math.min(Math.round(topRect.height * MAP_LADDER_VISUAL_SCALE), ladder.height / 3)
    const bottomHeight = Math.min(Math.round(bottomRect.height * MAP_LADDER_VISUAL_SCALE), ladder.height / 3)

    this.addAtlasImage(topRect, leftX, topY, visualWidth, topHeight)

    let cursorY = topY + topHeight
    const middleBottom = bottomY - bottomHeight
    const middleTileHeight = Math.round(middleRect.height * MAP_LADDER_VISUAL_SCALE)

    while (cursorY < middleBottom - 0.5) {
      const tileHeight = Math.min(middleTileHeight, middleBottom - cursorY)
      this.addAtlasImage(middleRect, leftX, cursorY, visualWidth, tileHeight)
      cursorY += tileHeight
    }

    this.addAtlasImage(bottomRect, leftX, bottomY - bottomHeight, visualWidth, bottomHeight)

    return true
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
        0,
      )
      portal.mapPortal = portalData
      this.physics.add.existing(portal, true)
      this.portals.add(portal)

      if (this.addAtlasPortalVisual(portalData)) return

      this.add
        .text(portalData.x, portalData.y - portalData.height / 2 - 18, portalData.name || 'Portal', {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: '#d8fff7',
        })
        .setOrigin(0.5)
    })
  }

  addAtlasPortalVisual(portalData) {
    if (!this.hasMapComponentAtlas()) return false

    const rect = getAtlasRect('common', 'portal_forest_idle_01')
    if (!rect) return false

    this.addAtlasImage(
      rect,
      portalData.x - portalData.width,
      portalData.y - portalData.height / 2,
      portalData.width * 2,
      portalData.height,
    ).setDepth(-5)

    return true
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
    this.playPlayerAnimation('idle')

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
    this.createAnimation('walkRight', 8, -1)
    this.createAnimation('walkLeft', 8, -1)
    this.createAnimation('jump', 1, -1)
    this.createAnimation('land', 1, 0)
    this.createAnimation('climb', 6, -1)
    this.createAnimation('attack', 12, -1)
    this.createAnimation('skill1', 12, 0)
    this.createAnimation('dead', 6, -1)
  }

  createAnimation(name, frameRate, repeat) {
    const key = this.getAnimationKey(name)
    const frames = this.getAnimationFrames(name)

    if (this.anims.exists(key) || frames.length === 0) return

    this.anims.create({
      key,
      frames: frames.map((frame) => ({
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
    const frames = this.playerSpriteData.animations?.[name] || []
    const maxFrame = this.playerSpriteData.frameCount - 1

    return frames.filter((frame) => frame >= 0 && frame <= maxFrame)
  }

  getFallbackAnimationName(name) {
    const fallbackByName = {
      walkRight: 'walk',
      walkLeft: 'walk',
      land: 'jump',
      climb: 'idle',
      dead: 'idle',
    }
    const fallbackName = fallbackByName[name] || 'idle'

    if (this.anims.exists(this.getAnimationKey(name))) return name
    if (this.anims.exists(this.getAnimationKey(fallbackName))) return fallbackName
    return 'idle'
  }

  playPlayerAnimation(name, ignoreIfPlaying = true) {
    this.player.play(this.getAnimationKey(this.getFallbackAnimationName(name)), ignoreIfPlaying)
  }

  hasAnimation(name) {
    return this.anims.exists(this.getAnimationKey(name))
  }

  usesDirectionalWalkFrames() {
    return this.hasAnimation('walkLeft') || this.hasAnimation('walkRight')
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

    const monster = this.createMonster(state.monsterType, state.monsterConfig, spawnPoint, state)
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

  createMonster(monsterId, mapMonsterConfig, spawnPoint, spawnState = null) {
    const baseMonsterData = MONSTER_DEFINITIONS[monsterId]
    if (!baseMonsterData && !mapMonsterConfig?.name) return null

    const maxHp = mapMonsterConfig.hp ?? mapMonsterConfig.maxHp ?? baseMonsterData?.maxHp ?? 30
    const element = mapMonsterConfig.element || baseMonsterData?.element || 'neutral'
    const radius = mapMonsterConfig.radius || 24
    const spriteKey = mapMonsterConfig.spriteKey || baseMonsterData?.spriteKey
    const spriteData = spriteKey ? findSprite(spriteKey) : null
    const visual = this.createMonsterVisual(spawnPoint, {
      element,
      radius,
      spriteData,
      spriteKey,
    })
    const patrolRange = this.getMonsterPatrolRange(spawnState, spawnPoint, radius)
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
      body: visual,
      nameText: null,
      hpText: null,
      radius,
      spriteData,
      patrolRange,
      patrolDirection: Phaser.Math.Between(0, 1) === 0 ? -1 : 1,
      moveSpeed: mapMonsterConfig.moveSpeed ?? baseMonsterData?.moveSpeed ?? MONSTER_PATROL_SPEED,
      attackRange: mapMonsterConfig.attackRange ?? baseMonsterData?.attackRange ?? MONSTER_ATTACK_RANGE,
      attackCooldown: mapMonsterConfig.attackCooldown ?? baseMonsterData?.attackCooldown ?? MONSTER_ATTACK_COOLDOWN,
      nextAttackAt: 0,
      isSpawning: true,
      isDying: false,
      isDead: false,
    }

    this.physics.add.existing(monster.body)
    monster.body.body.setImmovable(true)
    monster.body.body.setAllowGravity(false)
    monster.body.setAlpha(0)

    monster.nameText = this.add
      .text(monster.body.x, monster.body.y - 46, monster.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    monster.hpText = this.add
      .text(monster.body.x, monster.body.y + 34, `HP ${monster.currentHp}/${monster.maxHp}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#f6ffb8',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: [monster.body, monster.nameText, monster.hpText],
      alpha: 1,
      duration: MONSTER_SPAWN_DURATION,
      onComplete: () => {
        monster.isSpawning = false
      },
    })

    return monster
  }

  getMonsterTextureKey(spriteKey) {
    return `monster:${spriteKey}`
  }

  createMonsterVisual(spawnPoint, { element, radius, spriteData, spriteKey }) {
    if (spriteData && this.textures.exists(this.getMonsterTextureKey(spriteKey))) {
      const monsterSprite = this.add.sprite(
        spawnPoint.x,
        spawnPoint.y + radius,
        this.getMonsterTextureKey(spriteKey),
        0,
      )
      monsterSprite.setOrigin(0.5, 1)
      monsterSprite.setDisplaySize(spriteData.renderWidth || radius * 2, spriteData.renderHeight || radius * 2)
      monsterSprite.setTint(MONSTER_COLORS[element] || MONSTER_COLORS.neutral)
      return monsterSprite
    }

    return this.add.circle(
      spawnPoint.x,
      spawnPoint.y,
      radius,
      MONSTER_COLORS[element] || MONSTER_COLORS.neutral,
    )
  }

  getMonsterPatrolRange(spawnState, spawnPoint, radius) {
    if (spawnState?.range) {
      return {
        left: Math.min(spawnState.range.x1, spawnState.range.x2),
        right: Math.max(spawnState.range.x1, spawnState.range.x2),
      }
    }

    if (spawnState?.platform) {
      return {
        left: spawnState.platform.x - spawnState.platform.width / 2 + radius,
        right: spawnState.platform.x + spawnState.platform.width / 2 - radius,
      }
    }

    return {
      left: Math.max(20, spawnPoint.x - 90),
      right: Math.min(this.mapData.width - 20, spawnPoint.x + 90),
    }
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      skill: Phaser.Input.Keyboard.KeyCodes.X,
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

      if (type === 'skill') {
        this.handleSkill()
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

    this.handleMapTravel = (event) => {
      const { mapKey, mapName } = event.detail || {}
      if (!mapKey || mapKey === this.mapKey) return
      if (this.isPlayerDead) return

      this.enterPortal({
        id: `world-map-${mapKey}`,
        name: mapName || '월드맵',
        targetMapKey: mapKey,
        targetMapId: mapKey,
      })
    }

    this.handleReturnToTown = () => {
      if (!this.isPlayerDead) return

      this.dismissDeathModal()
      this.isPlayerDead = false
      this.playerState.currentHp = this.playerState.maxHp
      this.playerState.currentMp = this.playerState.maxMp
      this.saveCharacterState()
      this.enterPortal({
        id: 'death-return-town',
        name: '마을',
        targetMapKey: 'village02',
        targetMapId: 'village02',
        targetSpawnId: 'spawn-center',
      })
    }

    window.addEventListener('rpg-control', this.handleVirtualControl)
    window.addEventListener('character-updated', this.handleCharacterUpdated)
    window.addEventListener('rpg-map-travel', this.handleMapTravel)
    window.addEventListener('rpg-return-town', this.handleReturnToTown)

    // Scene이 종료될 때 Vue에서 온 전역 이벤트 리스너를 반드시 제거한다.
    // 이후 Scene 교체나 Phaser destroy 때 중복 입력이 남지 않게 하기 위함이다.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('rpg-control', this.handleVirtualControl)
      window.removeEventListener('character-updated', this.handleCharacterUpdated)
      window.removeEventListener('rpg-map-travel', this.handleMapTravel)
      window.removeEventListener('rpg-return-town', this.handleReturnToTown)
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

    this.playerVitalBars = this.add.graphics().setDepth(95)
    this.updateHud()
  }

  updatePlayerMovement() {
    if (this.isPlayerDead) return

    const body = this.player.body
    const up = this.cursors.up.isDown || this.keys.up.isDown || this.virtualInput.up
    const down = this.cursors.down.isDown || this.keys.down.isDown || this.virtualInput.down
    const left = this.cursors.left.isDown || this.keys.left.isDown || this.virtualInput.left
    const right = this.cursors.right.isDown || this.keys.right.isDown || this.virtualInput.right
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) || this.virtualInput.jumpQueued
    const skillPressed = Phaser.Input.Keyboard.JustDown(this.keys.skill)
    const onGround = body.blocked.down || body.touching.down

    this.virtualInput.jumpQueued = false

    if (skillPressed) {
      this.handleSkill()
    }

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

    this.player.setFlipX(!this.usesDirectionalWalkFrames() && this.playerFacing === 'left')
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
    this.playPlayerAnimation('climb')
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

    this.player.setFlipX(!this.usesDirectionalWalkFrames() && this.playerFacing === 'left')
    this.playPlayerAnimation('climb')
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
    if (this.isPlayerDead) return

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

    if (this.wasPlayerAirborne && onGround && this.hasAnimation('land')) {
      this.playPlayerAnimation('land')
      this.wasPlayerAirborne = false
      return
    }

    if (!onGround) {
      this.wasPlayerAirborne = true
      this.playPlayerAnimation('jump')
      return
    }

    if (Math.abs(this.player.body.velocity.x) > 5) {
      this.playPlayerAnimation(this.playerFacing === 'left' ? 'walkLeft' : 'walkRight')
      return
    }

    this.playPlayerAnimation('idle')
  }

  updateMonsters() {
    const deltaSeconds = this.game.loop.delta / 1000

    this.monsters.forEach((monster) => {
      if (monster.isSpawning || monster.isDying || monster.isDead) return

      const range = monster.patrolRange
      if (!range || range.left >= range.right) return

      const nextX = monster.body.x + monster.patrolDirection * monster.moveSpeed * deltaSeconds
      const clampedX = Phaser.Math.Clamp(nextX, range.left, range.right)

      monster.body.x = clampedX
      if (monster.body.body) {
        monster.body.body.updateFromGameObject()
      }

      if (clampedX <= range.left || clampedX >= range.right) {
        monster.patrolDirection *= -1
      }

      if ('setFlipX' in monster.body) {
        monster.body.setFlipX(monster.patrolDirection < 0)
      }

      this.updateMonsterLabels(monster)
    })
  }

  updateMonsterLabels(monster) {
    monster.nameText?.setPosition(monster.body.x, monster.body.y - 46)
    monster.hpText?.setPosition(monster.body.x, monster.body.y + 34)
  }

  updateMonsterAttacks() {
    if (this.isPlayerDead || this.isPlayerInvincible || this.playerState.currentHp <= 0) return

    const now = this.time.now
    const attackers = this.monsters.filter((monster) => {
      if (monster.isSpawning || monster.isDying || monster.isDead || now < monster.nextAttackAt) {
        return false
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y - PLAYER_BODY_HEIGHT / 2,
        monster.body.x,
        monster.body.y,
      )

      return distance <= monster.attackRange
    })

    if (attackers.length === 0) return

    const strongestAttacker = attackers.reduce((strongest, monster) =>
      monster.attack > strongest.attack ? monster : strongest,
    )

    strongestAttacker.nextAttackAt = now + strongestAttacker.attackCooldown
    this.applyMonsterDamage(strongestAttacker)
  }

  applyMonsterDamage(monster) {
    const blockedDamage = Math.max(0, this.playerState.defense || 0) * Math.max(1, this.playerState.level || 1)
    const damage = Math.max(0, Math.ceil((monster.attack || 0) - blockedDamage))

    if (damage > 0) {
      this.playerState.currentHp = Math.max(0, this.playerState.currentHp - damage)
      this.showFloatingText(this.player.x, this.player.y - 64, `-${damage}`, '#ff6f6f')
      this.saveCharacterState()

      if (this.playerState.currentHp <= 0) {
        this.startPlayerDeath()
      }
    } else {
      this.showFloatingText(this.player.x, this.player.y - 64, 'BLOCK', '#b8e6ff')
    }

    this.startPlayerInvincibility()
  }

  startPlayerInvincibility() {
    this.isPlayerInvincible = true

    this.tweens.killTweensOf(this.player)
    this.tweens.add({
      targets: this.player,
      alpha: 0.28,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(PLAYER_INVINCIBLE_DURATION / 200) - 1,
      onComplete: () => {
        this.player.setAlpha(1)
        this.isPlayerInvincible = false
      },
    })
  }

  respawnPlayer() {
    this.isPlayerDead = false
    this.dismissDeathModal()
    this.playerState.currentHp = this.playerState.maxHp
    this.playerState.currentMp = this.playerState.maxMp
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y)
    this.player.body.setVelocity(0, 0)
    this.player.body.enable = true
    this.player.body.setAllowGravity(true)
    this.jumpsRemaining = 2
    this.wasPlayerAirborne = false
    this.playPlayerAnimation('idle')
    this.showFloatingText(this.player.x, this.player.y - 72, 'RESPAWN', '#8fd3ff')
    this.saveCharacterState()
  }

  startPlayerDeath() {
    if (this.isPlayerDead) return

    this.isPlayerDead = true
    this.isPlayerAttacking = false
    this.isClimbing = false
    this.activeLadder = null
    this.player.body.setVelocity(0, 0)
    this.player.body.setAllowGravity(false)
    this.playPlayerAnimation('dead')
    this.showDeathModal()
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
      window.dispatchEvent(
        new CustomEvent('rpg-map-changed', {
          detail: { mapKey: targetMap.mapKey || targetMapKey },
        }),
      )
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
      window.dispatchEvent(
        new CustomEvent('rpg-map-changed', {
          detail: { mapKey: targetMapKey },
        }),
      )
      return
    }

    this.showFloatingText(this.player.x, this.player.y - 72, `${portalData.name || '포탈'} 준비 중`, '#8fd3ff')
    this.time.delayedCall(900, () => {
      this.isEnteringPortal = false
    })
  }

  handleAttack() {
    if (this.isPlayerDead) return
    this.performPlayerAttack({ animationName: 'attack', damage: this.playerState.attack })
  }

  handleSkill() {
    if (this.isPlayerDead) return
    if (this.playerState.currentMp < SKILL_MANA_COST) {
      this.showFloatingText(this.player.x, this.player.y - 46, 'MP 부족', '#8fd3ff')
      return
    }

    this.playerState.currentMp = Math.max(0, this.playerState.currentMp - SKILL_MANA_COST)
    this.performPlayerAttack({
      animationName: this.hasAnimation('skill1') ? 'skill1' : 'attack',
      damage: Math.ceil(this.playerState.attack * 1.35),
    })
  }

  performPlayerAttack({ animationName, damage }) {
    this.playAttackAnimation(animationName)

    const target = findMonsterInRange(this.player, this.monsters, ATTACK_RANGE)

    if (!target) {
      this.showFloatingText(this.player.x, this.player.y - 36, 'MISS', '#c8d3df')
      this.saveCharacterState()
      return
    }

    const result = attackMonster(target, damage)

    this.showFloatingText(target.body.x, target.body.y - 52, `-${result.damage}`, '#ffdf7e')
    target.hpText.setText(`HP ${Math.max(target.currentHp, 0)}/${target.maxHp}`)

    if (result.defeated) {
      this.defeatMonster(target)
    } else {
      this.saveCharacterState()
    }
  }

  playAttackAnimation(animationName = 'attack') {
    this.isPlayerAttacking = true
    const resolvedAnimationName = this.hasAnimation(animationName) ? animationName : 'attack'
    this.playPlayerAnimation(resolvedAnimationName)
    const attackFrameCount = Math.max(1, this.getAnimationFrames(resolvedAnimationName).length)
    const attackDuration = Math.max(280, Math.ceil((attackFrameCount / 12) * 1000))

    this.time.delayedCall(attackDuration, () => {
      this.isPlayerAttacking = false
    })
  }

  defeatMonster(monster) {
    this.monsters = this.monsters.filter((item) => item !== monster)
    monster.isDying = true
    monster.isDead = true
    monster.body.body.enable = false

    if (monster.spriteData && 'setFrame' in monster.body) {
      monster.body.setFrame(Math.max(0, monster.spriteData.frameCount - 1))
    } else if ('setStrokeStyle' in monster.body) {
      monster.body.setStrokeStyle(3, 0xffffff, 0.6)
    }

    this.tweens.killTweensOf([monster.body, monster.nameText, monster.hpText])
    this.tweens.add({
      targets: [monster.body, monster.nameText, monster.hpText],
      alpha: 0,
      duration: MONSTER_DEATH_DURATION,
      onComplete: () => {
        monster.body.destroy()
        monster.nameText.destroy()
        monster.hpText.destroy()
      },
    })

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
      Math.max(0, this.playerState.currentHp ?? stats.maxHp),
      stats.maxHp,
    )
    this.playerState.currentMp = Math.min(
      Math.max(0, this.playerState.currentMp ?? stats.maxMp),
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

  updatePlayerVitalBars() {
    if (!this.playerVitalBars || !this.player) return

    const hpRatio = Phaser.Math.Clamp(this.playerState.currentHp / this.playerState.maxHp, 0, 1)
    const mpRatio = Phaser.Math.Clamp(this.playerState.currentMp / this.playerState.maxMp, 0, 1)
    const x = Math.round(this.player.x - PLAYER_VITAL_BAR_WIDTH / 2)
    const y = Math.round(this.player.y - this.playerSpriteData.renderHeight - 18)
    const mpY = y + PLAYER_VITAL_BAR_HEIGHT + PLAYER_VITAL_BAR_GAP

    this.playerVitalBars.clear()
    this.drawVitalBar(x, y, hpRatio, 0xe74c4c)
    this.drawVitalBar(x, mpY, mpRatio, 0x4aa8ff)
  }

  drawVitalBar(x, y, ratio, color) {
    this.playerVitalBars.fillStyle(0x07090d, 0.76)
    this.playerVitalBars.fillRoundedRect(x - 1, y - 1, PLAYER_VITAL_BAR_WIDTH + 2, PLAYER_VITAL_BAR_HEIGHT + 2, 2)
    this.playerVitalBars.fillStyle(0x263140, 0.92)
    this.playerVitalBars.fillRect(x, y, PLAYER_VITAL_BAR_WIDTH, PLAYER_VITAL_BAR_HEIGHT)
    this.playerVitalBars.fillStyle(color, 1)
    this.playerVitalBars.fillRect(x, y, Math.round(PLAYER_VITAL_BAR_WIDTH * ratio), PLAYER_VITAL_BAR_HEIGHT)
  }

  showDeathModal() {
    window.dispatchEvent(
      new CustomEvent('rpg-player-dead', {
        detail: {
          hp: this.playerState.currentHp,
          maxHp: this.playerState.maxHp,
          mp: this.playerState.currentMp,
          maxMp: this.playerState.maxMp,
        },
      }),
    )
  }

  dismissDeathModal() {
    window.dispatchEvent(new CustomEvent('rpg-player-revived'))
  }
}
