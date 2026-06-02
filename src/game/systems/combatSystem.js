import Phaser from 'phaser'

export function findMonsterInRange(player, monsters, range) {
  return monsters.find((monster) => {
    const distance = Phaser.Math.Distance.Between(player.x, player.y, monster.body.x, monster.body.y)
    return distance <= range
  })
}

export function attackMonster(monster, damage) {
  monster.currentHp -= damage

  return {
    damage,
    defeated: monster.currentHp <= 0,
  }
}
