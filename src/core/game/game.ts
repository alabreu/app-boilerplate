import {
  COLLECTOR,
  COLLECTOR_BASE_COST,
  COLLECTOR_COST_GROWTH,
  CORE_HP,
  ELEMENTS,
  ENEMIES,
  EXPLORE_COST,
  EXPLORE_SECONDS,
  HORDE_BETWEEN_WAVES,
  HORDE_COUNTDOWN,
  HORDE_SPAWN_GAP,
  HORDE_WARNING,
  MAP_SIZE,
  MAX_LEVEL,
  REGION_SIZE,
  REGIONS_PER_SIDE,
  REGROW_CAP,
  REGROW_EVERY,
  TOOLS_BASE_COST,
  TOOLS_COST_GROWTH,
  TURRET_BASE_COST,
  TURRET_COST_STEP,
  TURRET_LEVELS,
  WAVES,
  WAVES_TO_WIN,
  type Cost,
} from './balance'
import {
  CORE_TILE,
  FISSURE_TILE,
  generateMap,
  inMap,
  makeCollectible,
  regionIndex,
  regionOf,
} from './map'
import { createRng } from './rng'
import type {
  Collectible,
  Enemy,
  EnemyKind,
  GameState,
  Hint,
  Popup,
  Resource,
  Unit,
  UnitKind,
} from './types'

const POPUP_SECONDS = 1.1
const PARTICLE_SECONDS = 0.5
const HINT_FLASH_SECONDS = 2.2

/**
 * O "cérebro" do jogo: estado + ações + simulação por tick. Nada de DOM aqui —
 * a UI chama `tapAt`/`buy*`/`explore` e desenha `state` a cada frame.
 */
export class Game {
  state: GameState
  private rng: () => number
  private regrowTimer = 0
  private hintOverride: { hint: Hint; t: number } | null = null

  constructor(seed = 7) {
    this.rng = createRng(seed * 1013)
    const map = generateMap(seed)
    const nextId = map.collectibles.reduce((m, c) => Math.max(m, c.id), 0) + 1
    this.state = {
      seed,
      time: 0,
      phase: 'playing',
      mode: { kind: 'idle' },
      hint: 'hint.tap',
      resources: { biomass: 0, ore: 0 },
      toolLevel: 1,
      core: {
        x: CORE_TILE.x + 1,
        y: CORE_TILE.y + 1,
        hp: CORE_HP,
        maxHp: CORE_HP,
      },
      tiles: map.tiles,
      collectibles: map.collectibles,
      units: [],
      enemies: [],
      regions: map.regions,
      fissure: { x: FISSURE_TILE.x + 0.5, y: FISSURE_TILE.y + 0.5 },
      horde: { wave: 1, timer: 0, status: 'dormant', spawned: 0, toSpawn: 0 },
      projectiles: [],
      popups: [],
      particles: [],
      scout: null,
      shake: 0,
      stats: {
        taps: 0,
        collected: { biomass: 0, ore: 0 },
        merges: 0,
        kills: 0,
      },
      nextId,
    }
  }

  // ---------------------------------------------------------------- queries

  collectorCost(): Cost {
    const n = this.state.units.filter((u) => u.kind === 'collector').length
    const f = Math.pow(COLLECTOR_COST_GROWTH, n)
    return {
      biomass: Math.round((COLLECTOR_BASE_COST.biomass ?? 0) * f),
      ore: Math.round((COLLECTOR_BASE_COST.ore ?? 0) * f),
    }
  }

  turretCost(): Cost {
    const n = this.state.units.filter((u) => u.kind === 'turret').length
    return {
      ore: (TURRET_BASE_COST.ore ?? 0) + n * (TURRET_COST_STEP.ore ?? 0),
      biomass:
        (TURRET_BASE_COST.biomass ?? 0) + n * (TURRET_COST_STEP.biomass ?? 0),
    }
  }

  toolsCost(): Cost {
    return {
      ore: Math.round(
        TOOLS_BASE_COST * Math.pow(TOOLS_COST_GROWTH, this.state.toolLevel - 1),
      ),
    }
  }

  exploreCost(): Cost {
    return EXPLORE_COST
  }

  canAfford(cost: Cost): boolean {
    return (Object.entries(cost) as [Resource, number][]).every(
      ([r, n]) => this.state.resources[r] >= n,
    )
  }

  isRevealed(x: number, y: number): boolean {
    if (!inMap(x, y)) return false
    const { rx, ry } = regionOf(x, y)
    return this.state.regions[regionIndex(rx, ry)].state === 'revealed'
  }

  /** Região escondida e vizinha (4-conexa) de uma revelada: dá para explorar. */
  isExplorable(rx: number, ry: number): boolean {
    if (rx < 0 || ry < 0 || rx >= REGIONS_PER_SIDE || ry >= REGIONS_PER_SIDE)
      return false
    const r = this.state.regions[regionIndex(rx, ry)]
    if (r.state !== 'hidden') return false
    const near = [
      [rx - 1, ry],
      [rx + 1, ry],
      [rx, ry - 1],
      [rx, ry + 1],
    ]
    return near.some(
      ([ax, ay]) =>
        ax >= 0 &&
        ay >= 0 &&
        ax < REGIONS_PER_SIDE &&
        ay < REGIONS_PER_SIDE &&
        this.state.regions[regionIndex(ax, ay)].state === 'revealed',
    )
  }

  hasExplorableRegion(): boolean {
    return this.state.regions.some((r) => this.isExplorable(r.rx, r.ry))
  }

  unitAt(x: number, y: number): Unit | undefined {
    let best: Unit | undefined
    let bestD = 0.75
    for (const u of this.state.units) {
      const cx = u.kind === 'turret' ? u.x + 0.5 : u.x
      const cy = u.kind === 'turret' ? u.y + 0.5 : u.y
      const d = Math.hypot(cx - x, cy - y)
      if (d < bestD) {
        bestD = d
        best = u
      }
    }
    return best
  }

  collectibleAt(tx: number, ty: number): Collectible | undefined {
    return this.state.collectibles.find((c) => c.x === tx && c.y === ty)
  }

  /** Pode construir aqui? Revelado, livre, fora do núcleo e da fissura. */
  canPlaceAt(tx: number, ty: number): boolean {
    if (!this.isRevealed(tx, ty)) return false
    if (
      tx >= CORE_TILE.x &&
      tx <= CORE_TILE.x + 1 &&
      ty >= CORE_TILE.y &&
      ty <= CORE_TILE.y + 1
    )
      return false
    if (
      Math.abs(tx - FISSURE_TILE.x) <= 1 &&
      Math.abs(ty - FISSURE_TILE.y) <= 1
    )
      return false
    if (this.collectibleAt(tx, ty)) return false
    if (
      this.state.units.some(
        (u) => u.kind === 'turret' && u.x === tx && u.y === ty,
      )
    )
      return false
    return true
  }

  selectedUnit(): Unit | undefined {
    const m = this.state.mode
    if (m.kind !== 'selected') return undefined
    return this.state.units.find((u) => u.id === m.unitId)
  }

  /** Outra unidade igual (tipo e nível) existe? Então o merge está disponível. */
  mergePartnerExists(unit: Unit): boolean {
    return this.state.units.some(
      (u) => u.id !== unit.id && u.kind === unit.kind && u.level === unit.level,
    )
  }

  // ---------------------------------------------------------------- actions

  /** Toque no mundo, em coordenadas de tile (float). */
  tapAt(wx: number, wy: number): void {
    const s = this.state
    if (s.phase !== 'playing') return
    const tx = Math.floor(wx)
    const ty = Math.floor(wy)
    if (!inMap(tx, ty)) {
      this.setMode({ kind: 'idle' })
      return
    }

    const { rx, ry } = regionOf(tx, ty)
    const region = s.regions[regionIndex(rx, ry)]
    if (region.state !== 'revealed') {
      if (region.state === 'hidden') this.explore(rx, ry)
      return
    }

    if (s.mode.kind === 'place') {
      if (this.canPlaceAt(tx, ty)) {
        this.placeTurret(tx, ty)
      } else {
        this.flashHint('hint.placeInvalid')
      }
      return
    }

    // Inimigo: o toque manual também machuca (pouco).
    const enemy = s.enemies.find((e) => Math.hypot(e.x - wx, e.y - wy) < 0.6)
    if (enemy) {
      this.damageEnemy(enemy, s.toolLevel)
      s.stats.taps++
      this.spark(enemy.x, enemy.y, '#f3c2a0')
      return
    }

    const unit = this.unitAt(wx, wy)
    if (unit) {
      const sel = this.selectedUnit()
      if (
        sel &&
        sel.id !== unit.id &&
        sel.kind === unit.kind &&
        sel.level === unit.level
      ) {
        this.merge(sel, unit)
        return
      }
      this.setMode({ kind: 'selected', unitId: unit.id })
      return
    }

    const c = this.collectibleAt(tx, ty)
    if (c) {
      s.stats.taps++
      s.shake = Math.max(s.shake, 0.12)
      this.hitCollectible(c, s.toolLevel, true)
      return
    }

    this.setMode({ kind: 'idle' })
  }

  startPlacing(unit: 'turret'): void {
    if (this.state.phase !== 'playing') return
    if (!this.canAfford(this.turretCost())) {
      this.flashHint('hint.noResources')
      return
    }
    this.setMode({ kind: 'place', unit })
  }

  cancelMode(): void {
    this.setMode({ kind: 'idle' })
  }

  buyCollector(): boolean {
    const s = this.state
    if (s.phase !== 'playing') return false
    const cost = this.collectorCost()
    if (!this.pay(cost)) return false
    const u = this.makeUnit(
      'collector',
      s.core.x + (this.rng() - 0.5) * 2,
      s.core.y + 1.6,
    )
    s.units.push(u)
    this.spark(u.x, u.y, '#3dd6c4')
    if (s.horde.status === 'dormant') {
      s.horde.status = 'countdown'
      s.horde.timer = HORDE_COUNTDOWN
    }
    return true
  }

  buyTools(): boolean {
    const s = this.state
    if (s.phase !== 'playing') return false
    if (!this.pay(this.toolsCost())) return false
    s.toolLevel++
    this.popup(s.core.x, s.core.y - 1.2, `x${s.toolLevel}`, 'hit')
    return true
  }

  explore(rx: number, ry: number): boolean {
    const s = this.state
    if (s.phase !== 'playing') return false
    if (!this.isExplorable(rx, ry)) return false
    if (s.scout) return false
    if (!this.pay(this.exploreCost())) return false
    const r = s.regions[regionIndex(rx, ry)]
    r.state = 'revealing'
    r.progress = 0
    s.scout = { x: s.core.x, y: s.core.y, targetRx: rx, targetRy: ry }
    this.setMode({ kind: 'idle' })
    return true
  }

  restart(): Game {
    return new Game(this.state.seed + 1)
  }

  // ---------------------------------------------------------------- internals

  private setMode(mode: GameState['mode']): void {
    this.state.mode = mode
  }

  private flashHint(hint: Hint): void {
    this.hintOverride = { hint, t: HINT_FLASH_SECONDS }
  }

  private pay(cost: Cost): boolean {
    if (!this.canAfford(cost)) {
      this.flashHint('hint.noResources')
      return false
    }
    for (const [r, n] of Object.entries(cost) as [Resource, number][]) {
      this.state.resources[r] -= n
    }
    return true
  }

  private makeUnit(kind: UnitKind, x: number, y: number): Unit {
    const s = this.state
    const hp = kind === 'turret' ? TURRET_LEVELS[0].hp : COLLECTOR.hp
    return {
      id: s.nextId++,
      kind,
      level: 1,
      x,
      y,
      hp,
      maxHp: hp,
      targetId: null,
      cooldown: 0,
      facing: 1,
    }
  }

  private placeTurret(tx: number, ty: number): void {
    const s = this.state
    if (!this.pay(this.turretCost())) {
      this.setMode({ kind: 'idle' })
      return
    }
    const u = this.makeUnit('turret', tx, ty)
    s.units.push(u)
    this.spark(tx + 0.5, ty + 0.5, '#f2b134')
    this.setMode({ kind: 'idle' })
  }

  private merge(source: Unit, target: Unit): void {
    const s = this.state
    if (target.level >= MAX_LEVEL) {
      this.setMode({ kind: 'selected', unitId: target.id })
      return
    }
    s.units = s.units.filter((u) => u.id !== source.id)
    target.level++
    const hp =
      target.kind === 'turret'
        ? TURRET_LEVELS[target.level - 1].hp
        : COLLECTOR.hp * target.level
    target.hp = hp
    target.maxHp = hp
    s.stats.merges++
    const cx = target.kind === 'turret' ? target.x + 0.5 : target.x
    const cy = target.kind === 'turret' ? target.y + 0.5 : target.y
    this.popup(cx, cy - 0.8, `NV${target.level}`, 'hit')
    for (let i = 0; i < 10; i++) this.spark(cx, cy, '#fff2a8')
    s.shake = Math.max(s.shake, 0.2)
    this.setMode({ kind: 'idle' })
  }

  private hitCollectible(c: Collectible, power: number, manual: boolean): void {
    const s = this.state
    c.hp -= power
    this.spark(
      c.x + 0.5,
      c.y + 0.4,
      c.kind === 'rock' || c.kind === 'scrap' ? '#b9c1cc' : '#a7e35b',
    )
    if (c.hp > 0) return
    const spec = ELEMENTS[c.kind]
    s.collectibles = s.collectibles.filter((o) => o.id !== c.id)
    s.resources[spec.resource] += spec.yield
    s.stats.collected[spec.resource] += spec.yield
    this.popup(c.x + 0.5, c.y + 0.1, `+${spec.yield}`, spec.resource)
    for (let i = 0; i < 6; i++)
      this.spark(
        c.x + 0.5,
        c.y + 0.5,
        spec.resource === 'ore' ? '#f2b134' : '#8be04a',
      )
    if (manual) s.shake = Math.max(s.shake, 0.18)
  }

  private damageEnemy(e: Enemy, dmg: number): void {
    e.hp -= dmg
    if (e.hp <= 0) {
      const s = this.state
      s.enemies = s.enemies.filter((o) => o.id !== e.id)
      s.stats.kills++
      for (let i = 0; i < 6; i++) this.spark(e.x, e.y, '#d8365f')
    }
  }

  private popup(
    x: number,
    y: number,
    text: string,
    color: Popup['color'],
  ): void {
    this.state.popups.push({ x, y, text, color, t: POPUP_SECONDS })
  }

  private spark(x: number, y: number, color: string): void {
    const a = this.rng() * Math.PI * 2
    const v = 1.5 + this.rng() * 2.5
    this.state.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 1.5,
      t: PARTICLE_SECONDS,
      color,
    })
  }

  private spawnEnemy(kind: EnemyKind): void {
    const s = this.state
    const spec = ENEMIES[kind]
    s.enemies.push({
      id: s.nextId++,
      kind,
      x: s.fissure.x + (this.rng() - 0.5) * 0.8,
      y: s.fissure.y + (this.rng() - 0.5) * 0.8,
      hp: spec.hp,
      maxHp: spec.hp,
      speed: spec.speed,
      damage: spec.damage,
      cooldown: 0.5,
      wobble: (this.rng() - 0.5) * 2.5,
    })
    this.spark(s.fissure.x, s.fissure.y, '#8c1e3c')
  }

  // ---------------------------------------------------------------- tick

  tick(dt: number): void {
    const s = this.state
    if (s.phase !== 'playing') return
    dt = Math.max(0, Math.min(dt, 0.1))
    s.time += dt
    s.shake = Math.max(0, s.shake - dt)

    this.tickEffects(dt)
    this.tickRegrow(dt)
    this.tickScout(dt)
    this.tickCollectors(dt)
    this.tickTurrets(dt)
    this.tickEnemies(dt)
    this.tickHorde(dt)
    this.tickHint(dt)

    if (s.core.hp <= 0) {
      s.core.hp = 0
      s.phase = 'lost'
    }
  }

  private tickEffects(dt: number): void {
    const s = this.state
    for (const p of s.popups) p.t -= dt
    s.popups = s.popups.filter((p) => p.t > 0)
    for (const p of s.particles) {
      p.t -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 6 * dt
    }
    s.particles = s.particles.filter((p) => p.t > 0)
    for (const p of s.projectiles) p.t -= dt
    s.projectiles = s.projectiles.filter((p) => p.t > 0)
  }

  private tickRegrow(dt: number): void {
    const s = this.state
    this.regrowTimer += dt
    if (this.regrowTimer < REGROW_EVERY) return
    this.regrowTimer = 0
    const bushes = s.collectibles.filter((c) => c.kind === 'bush').length
    if (bushes >= REGROW_CAP) return
    for (let tries = 0; tries < 30; tries++) {
      const x = Math.floor(this.rng() * MAP_SIZE)
      const y = Math.floor(this.rng() * MAP_SIZE)
      if (!this.canPlaceAt(x, y)) continue
      if (s.tiles[y * MAP_SIZE + x].ground === 'plate') continue
      s.collectibles.push(makeCollectible(s.nextId++, 'bush', x, y))
      return
    }
  }

  private tickScout(dt: number): void {
    const s = this.state
    if (!s.scout) return
    const r = s.regions[regionIndex(s.scout.targetRx, s.scout.targetRy)]
    r.progress = Math.min(1, r.progress + dt / EXPLORE_SECONDS)
    const tx = s.scout.targetRx * REGION_SIZE + REGION_SIZE / 2
    const ty = s.scout.targetRy * REGION_SIZE + REGION_SIZE / 2
    // A sonda voa até o centro da região na primeira metade e sobrevoa depois.
    const k = Math.min(1, r.progress * 2)
    s.scout.x = s.core.x + (tx - s.core.x) * k
    s.scout.y = s.core.y + (ty - s.core.y) * k
    if (r.progress >= 1) {
      r.state = 'revealed'
      s.scout = null
      this.popup(tx, ty, '!', 'alert')
    }
  }

  private tickCollectors(dt: number): void {
    const s = this.state
    for (const u of s.units) {
      if (u.kind !== 'collector') continue
      let target =
        u.targetId === null
          ? undefined
          : s.collectibles.find((c) => c.id === u.targetId)
      if (!target) {
        target = this.nearestCollectible(u.x, u.y)
        u.targetId = target ? target.id : null
        if (!target) continue
      }
      const cx = target.x + 0.5
      const cy = target.y + 0.7
      const dx = cx - u.x
      const dy = cy - u.y
      const d = Math.hypot(dx, dy)
      if (d > COLLECTOR.reach) {
        const step = Math.min(d, COLLECTOR.speed * dt)
        u.x += (dx / d) * step
        u.y += (dy / d) * step
        if (Math.abs(dx) > 0.05) u.facing = dx > 0 ? 1 : -1
        u.cooldown = COLLECTOR.hitEvery * 0.5
        continue
      }
      u.cooldown -= dt
      if (u.cooldown <= 0) {
        u.cooldown = COLLECTOR.hitEvery
        this.hitCollectible(target, s.toolLevel * u.level, false)
      }
    }
  }

  private nearestCollectible(x: number, y: number): Collectible | undefined {
    let best: Collectible | undefined
    let bestD = Infinity
    const taken = new Set(
      this.state.units
        .filter((u) => u.kind === 'collector' && u.targetId !== null)
        .map((u) => u.targetId),
    )
    for (const c of this.state.collectibles) {
      if (!this.isRevealed(c.x, c.y)) continue
      // Preferir alvos livres: dois coletores no mesmo arbusto é desperdício.
      const d =
        Math.hypot(c.x + 0.5 - x, c.y + 0.5 - y) + (taken.has(c.id) ? 3 : 0)
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
    return best
  }

  private tickTurrets(dt: number): void {
    const s = this.state
    for (const u of s.units) {
      if (u.kind !== 'turret') continue
      u.cooldown -= dt
      if (u.cooldown > 0) continue
      const spec = TURRET_LEVELS[u.level - 1]
      const cx = u.x + 0.5
      const cy = u.y + 0.5
      let best: Enemy | undefined
      let bestD = spec.range
      for (const e of s.enemies) {
        const d = Math.hypot(e.x - cx, e.y - cy)
        if (d < bestD) {
          bestD = d
          best = e
        }
      }
      if (!best) continue
      u.cooldown = spec.fireEvery
      u.facing = best.x >= cx ? 1 : -1
      s.projectiles.push({
        x: cx,
        y: cy - 0.3,
        tx: best.x,
        ty: best.y,
        t: 0.12,
        level: u.level,
      })
      this.damageEnemy(best, spec.damage)
    }
  }

  private tickEnemies(dt: number): void {
    const s = this.state
    for (const e of s.enemies) {
      e.cooldown -= dt
      // Alvo de oportunidade: unidade ao alcance de mordida.
      let victim: Unit | undefined
      let vd = 0.8
      for (const u of s.units) {
        const ux = u.kind === 'turret' ? u.x + 0.5 : u.x
        const uy = u.kind === 'turret' ? u.y + 0.5 : u.y
        const d = Math.hypot(ux - e.x, uy - e.y)
        if (d < vd) {
          vd = d
          victim = u
        }
      }
      const dCore = Math.hypot(s.core.x - e.x, s.core.y - e.y)
      if (victim || dCore < 1.4) {
        if (e.cooldown <= 0) {
          e.cooldown = ENEMIES[e.kind].attackEvery
          if (victim) {
            victim.hp -= e.damage
            this.spark(victim.x, victim.y, '#f3c2a0')
          } else {
            s.core.hp -= e.damage
            s.shake = Math.max(s.shake, 0.25)
            this.popup(s.core.x, s.core.y - 1.4, `-${e.damage}`, 'alert')
          }
        }
        continue
      }
      // Anda em direção ao núcleo com um desvio lateral fixo (horda espalhada).
      const dx = s.core.x - e.x
      const dy = s.core.y - e.y
      const nx = dx / dCore
      const ny = dy / dCore
      const side = Math.max(0, Math.min(1, (dCore - 2) / 6)) * e.wobble
      e.x += (nx - ny * side * 0.3) * e.speed * dt
      e.y += (ny + nx * side * 0.3) * e.speed * dt
    }
    const dead = s.units.filter((u) => u.hp <= 0)
    if (dead.length) {
      for (const u of dead)
        for (let i = 0; i < 8; i++) this.spark(u.x, u.y, '#5b6270')
      s.units = s.units.filter((u) => u.hp > 0)
      const sel = s.mode.kind === 'selected' ? s.mode.unitId : null
      if (sel !== null && !s.units.some((u) => u.id === sel))
        this.setMode({ kind: 'idle' })
    }
  }

  private tickHorde(dt: number): void {
    const s = this.state
    const h = s.horde
    switch (h.status) {
      case 'dormant':
        return
      case 'countdown':
        h.timer -= dt
        if (h.timer <= 0) {
          h.status = 'warning'
          h.timer = HORDE_WARNING
          // O tremor rasga o chão: a região da fissura aparece mesmo sem sonda.
          const fr = regionOf(FISSURE_TILE.x, FISSURE_TILE.y)
          const region = s.regions[regionIndex(fr.rx, fr.ry)]
          if (region.state !== 'revealed') {
            region.state = 'revealed'
            if (
              s.scout &&
              s.scout.targetRx === fr.rx &&
              s.scout.targetRy === fr.ry
            )
              s.scout = null
          }
          s.shake = Math.max(s.shake, 0.6)
          for (let i = 0; i < 12; i++)
            this.spark(s.fissure.x, s.fissure.y, '#8c1e3c')
        }
        return
      case 'warning':
        h.timer -= dt
        if (s.time % 1 < dt) s.shake = Math.max(s.shake, 0.15)
        if (h.timer <= 0) {
          const w = WAVES[h.wave - 1]
          h.status = 'active'
          h.spawned = 0
          h.toSpawn = w.larva + w.brute
          h.timer = 0
        }
        return
      case 'active': {
        h.timer -= dt
        if (h.spawned < h.toSpawn && h.timer <= 0) {
          const w = WAVES[h.wave - 1]
          this.spawnEnemy(h.spawned < w.larva ? 'larva' : 'brute')
          h.spawned++
          h.timer = HORDE_SPAWN_GAP
        }
        if (h.spawned >= h.toSpawn && s.enemies.length === 0) {
          h.wave++
          if (h.wave > WAVES_TO_WIN) {
            s.phase = 'won'
            return
          }
          h.status = 'countdown'
          h.timer = HORDE_BETWEEN_WAVES - HORDE_WARNING
          this.flashHint('hint.hordeCleared')
          this.hintOverride!.t = 5
        }
        return
      }
    }
  }

  private tickHint(dt: number): void {
    const s = this.state
    if (this.hintOverride) {
      this.hintOverride.t -= dt
      if (this.hintOverride.t > 0) {
        s.hint = this.hintOverride.hint
        return
      }
      this.hintOverride = null
    }
    s.hint = this.computeHint()
  }

  private computeHint(): Hint {
    const s = this.state
    if (s.mode.kind === 'place') return 'hint.place'
    if (s.mode.kind === 'selected') {
      const u = this.selectedUnit()
      if (u && u.level < MAX_LEVEL && this.mergePartnerExists(u))
        return 'hint.mergeSelect'
    }
    if (s.horde.status === 'warning') return 'hint.hordeIncoming'
    if (s.horde.status === 'active') return 'hint.hordeNow'
    const collectors = s.units.filter((u) => u.kind === 'collector').length
    const turrets = s.units.filter((u) => u.kind === 'turret')
    if (s.stats.collected.biomass + s.stats.collected.ore === 0)
      return 'hint.tap'
    if (collectors === 0)
      return this.canAfford(this.collectorCost())
        ? 'hint.buyCollector'
        : 'hint.more'
    const canExplore =
      this.hasExplorableRegion() &&
      !s.scout &&
      this.canAfford(this.exploreCost())
    if (turrets.length === 0) {
      if (this.canAfford(this.turretCost())) return 'hint.buildTurret'
      return canExplore ? 'hint.explore' : 'hint.automation'
    }
    if (turrets.length === 1) return 'hint.buildTurret'
    if (turrets.some((t) => t.level < MAX_LEVEL && this.mergePartnerExists(t)))
      return 'hint.merge'
    if (this.hasExplorableRegion() && !s.scout) return 'hint.explore'
    return 'hint.automation'
  }
}
