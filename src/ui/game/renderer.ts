import { MAP_SIZE, REGION_SIZE, TURRET_LEVELS } from '@core/game/balance'
import type { Game } from '@core/game/game'
import { CORE_TILE, FISSURE_TILE } from '@core/game/map'
import { createRng } from '@core/game/rng'
import type { Collectible, Enemy, GroundKind, Unit } from '@core/game/types'
import { Camera, TILE } from './camera'
import { PAL, UI_COLORS } from './palette'
import {
  BRUTE,
  BUSH,
  COLLECTOR,
  CORE,
  DECOR,
  FISSURE,
  FUNGUS,
  HUMAN,
  LARVA,
  ROCK,
  SCOUT,
  SCRAP,
  TREE,
  TURRET,
  drawText,
  rasterize,
  type Spr,
} from './sprites'

const GROUND_COLORS: Record<
  GroundKind,
  { base: string; dots: string[]; lines?: string }
> = {
  dirt: { base: '#5a3f2b', dots: ['#6b4a33', '#4a3322', '#6b4a33'] },
  grass: { base: '#3f6b2a', dots: ['#6fc24a', '#2f5420', '#4f8a33'] },
  concrete: { base: '#55555f', dots: ['#45454d', '#64646e', '#45454d'] },
  plate: { base: '#4b5563', dots: ['#6b7280', '#3a414b'], lines: '#3a414b' },
  ash: { base: '#3b3340', dots: ['#4a4050', '#2e2834', '#5a4a5a'] },
}

const GROUND_FRONT: Record<GroundKind, string> = {
  dirt: '#3f2b1d',
  grass: '#2a4a1c',
  concrete: '#3d3d45',
  plate: '#343b45',
  ash: '#26212b',
}

/**
 * Desenha o estado do jogo no canvas, em pixels de mundo. Mantém só memória
 * visual (quando cada coisa foi atingida) — nada de regra de jogo aqui.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D
  private ground = new Map<GroundKind, Spr[]>()
  private fogPattern: Spr
  private stripePattern: Spr
  private hpMemo = new Map<number, number>()
  private hitAt = new Map<number, number>()
  private time = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    for (const kind of Object.keys(GROUND_COLORS) as GroundKind[]) {
      this.ground.set(
        kind,
        [0, 1, 2, 3].map((v) => makeGroundTile(kind, v)),
      )
    }
    this.fogPattern = makeFogPattern()
    this.stripePattern = makeStripePattern()
  }

  draw(game: Game, cam: Camera, dt: number): void {
    const s = game.state
    const ctx = this.ctx
    this.time += Math.max(0, dt)
    const t = this.time

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = PAL.v
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(cam.deviceScale, 0, 0, cam.deviceScale, 0, 0)

    let shakeX = 0
    let shakeY = 0
    if (s.shake > 0) {
      const k = Math.min(1, s.shake) * 3
      shakeX = Math.round(Math.sin(t * 90) * k)
      shakeY = Math.round(Math.cos(t * 70) * k)
    }
    const camX = Math.round(cam.x) + shakeX
    const camY = Math.round(cam.y) + shakeY
    ctx.translate(-camX, -camY)

    const x0 = Math.max(0, Math.floor(camX / TILE) - 1)
    const y0 = Math.max(0, Math.floor(camY / TILE) - 1)
    const x1 = Math.min(MAP_SIZE - 1, Math.ceil((camX + cam.viewW) / TILE) + 1)
    const y1 = Math.min(MAP_SIZE - 1, Math.ceil((camY + cam.viewH) / TILE) + 1)

    // Memória de "foi atingido agora" para o tremor dos elementos.
    for (const c of s.collectibles) this.noteHit(c.id, c.hp, t)
    for (const u of s.units) this.noteHit(u.id, u.hp, t)
    for (const e of s.enemies) this.noteHit(e.id, e.hp, t)

    this.drawGround(game, x0, y0, x1, y1)
    this.drawBorder()
    if (s.mode.kind === 'place') this.drawPlacement(game, x0, y0, x1, y1, t)
    this.drawFissure(game, t)
    this.drawEntities(game, cam, t)
    this.drawProjectiles(game)
    this.drawParticles(game)
    this.drawPopups(game)
    this.drawFog(game, t)
    this.drawExploreMarkers(game, t)
    this.drawScout(game, t)

    ctx.translate(camX, camY)
    this.drawThreatArrows(game, cam, t)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private noteHit(id: number, hp: number, t: number) {
    const prev = this.hpMemo.get(id)
    if (prev !== undefined && hp < prev) this.hitAt.set(id, t)
    this.hpMemo.set(id, hp)
  }

  private hitOffset(id: number, t: number): number {
    const at = this.hitAt.get(id)
    if (at === undefined) return 0
    const age = t - at
    if (age > 0.18) return 0
    return Math.round(Math.sin(age * 60) * 1.5)
  }

  // ----------------------------------------------------------- terreno

  private drawGround(
    game: Game,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    const ctx = this.ctx
    const s = game.state
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const region =
          s.regions[
            Math.floor(y / REGION_SIZE) * 3 + Math.floor(x / REGION_SIZE)
          ]
        if (region.state === 'hidden') continue
        const tile = s.tiles[y * MAP_SIZE + x]
        ctx.drawImage(
          this.ground.get(tile.ground)![tile.variant],
          x * TILE,
          y * TILE,
        )
      }
    }
    // Face frontal da borda sul do mapa: dá o "degrau" da vista 3/4.
    for (let x = x0; x <= x1; x++) {
      const region = s.regions[2 * 3 + Math.floor(x / REGION_SIZE)]
      if (region.state === 'hidden') continue
      const tile = s.tiles[(MAP_SIZE - 1) * MAP_SIZE + x]
      ctx.fillStyle = GROUND_FRONT[tile.ground]
      ctx.fillRect(x * TILE, MAP_SIZE * TILE, TILE, 4)
    }
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const tile = s.tiles[y * MAP_SIZE + x]
        if (!tile.decor) continue
        const region =
          s.regions[
            Math.floor(y / REGION_SIZE) * 3 + Math.floor(x / REGION_SIZE)
          ]
        if (region.state === 'hidden') continue
        ctx.drawImage(
          rasterize(DECOR[tile.decor - 1], `decor${tile.decor}`),
          x * TILE,
          y * TILE,
        )
      }
    }
  }

  /** Limite definitivo do mapa: faixa de advertência + penhasco para o vazio. */
  private drawBorder() {
    const ctx = this.ctx
    const w = MAP_SIZE * TILE
    const pat = ctx.createPattern(this.stripePattern, 'repeat')!
    ctx.fillStyle = pat
    ctx.fillRect(-4, -4, w + 8, 4) // norte
    ctx.fillRect(-4, w + 4, w + 8, 4) // sul (abaixo da face frontal)
    ctx.fillRect(-4, 0, 4, w + 4) // oeste
    ctx.fillRect(w, 0, 4, w + 4) // leste
    ctx.fillStyle = '#000000'
    ctx.globalAlpha = 0.35
    ctx.fillRect(-4, -4, w + 8, 1)
    ctx.fillRect(-4, w + 7, w + 8, 1)
    ctx.fillRect(-4, -4, 1, w + 12)
    ctx.fillRect(w + 3, -4, 1, w + 12)
    ctx.globalAlpha = 1
  }

  private drawPlacement(
    game: Game,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    t: number,
  ) {
    const ctx = this.ctx
    const blink = Math.floor(t * 4) % 2 === 0
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!game.isRevealed(x, y)) continue
        const ok = game.canPlaceAt(x, y)
        if (!ok) continue
        ctx.fillStyle = UI_COLORS.valid
        ctx.globalAlpha = blink ? 0.55 : 0.35
        const px = x * TILE
        const py = y * TILE
        // Cantos marcados: lê como "slot" sem tampar o chão.
        for (const [cx, cy] of [
          [px + 2, py + 2],
          [px + TILE - 4, py + 2],
          [px + 2, py + TILE - 4],
          [px + TILE - 4, py + TILE - 4],
        ]) {
          ctx.fillRect(cx, cy, 2, 2)
        }
        ctx.globalAlpha = 1
      }
    }
  }

  private drawFissure(game: Game, t: number) {
    const s = game.state
    const ctx = this.ctx
    if (!game.isRevealed(FISSURE_TILE.x, FISSURE_TILE.y)) return
    const px = FISSURE_TILE.x * TILE - 8
    const py = FISSURE_TILE.y * TILE - 8
    const hot = s.horde.status === 'warning' || s.horde.status === 'active'
    const frame = Math.floor(t * (hot ? 6 : 1.5)) % 2
    ctx.drawImage(rasterize(FISSURE[frame], `fissure${frame}`), px, py)
    if (hot) {
      const pulse = 0.25 + 0.25 * Math.sin(t * 8)
      ctx.fillStyle = UI_COLORS.alert
      ctx.globalAlpha = pulse
      ctx.fillRect(px + 8, py + 10, 16, 12)
      ctx.globalAlpha = 1
      drawText(
        ctx,
        '!',
        px + 16,
        py - 10 + Math.round(Math.sin(t * 6)),
        UI_COLORS.alert,
      )
    }
  }

  // ----------------------------------------------------------- entidades

  private drawEntities(game: Game, _cam: Camera, t: number) {
    const s = game.state
    const ctx = this.ctx
    type Item = { y: number; draw: () => void }
    const items: Item[] = []

    for (const c of s.collectibles) {
      if (!this.visibleTile(game, c.x, c.y)) continue
      items.push({
        y: c.y * TILE + TILE,
        draw: () => this.drawCollectible(c, t),
      })
    }
    for (const u of s.units) {
      if (!this.visibleTile(game, Math.floor(u.x), Math.floor(u.y))) continue
      const baseY = u.kind === 'turret' ? u.y * TILE + TILE : u.y * TILE + 4
      items.push({ y: baseY, draw: () => this.drawUnit(game, u, t) })
    }
    for (const e of s.enemies) {
      if (!this.visibleTile(game, Math.floor(e.x), Math.floor(e.y))) continue
      items.push({ y: e.y * TILE + 4, draw: () => this.drawEnemy(e, t) })
    }
    // Núcleo (2×2 tiles) + a humana que circula em volta.
    items.push({
      y: (CORE_TILE.y + 2) * TILE,
      draw: () => {
        ctx.drawImage(
          rasterize(CORE, 'core'),
          CORE_TILE.x * TILE,
          CORE_TILE.y * TILE,
        )
        // Luz de alerta do núcleo pisca quando a horda está ativa.
        if (s.horde.status !== 'dormant' && Math.floor(t * 3) % 2 === 0) {
          ctx.fillStyle =
            s.horde.status === 'countdown' ? UI_COLORS.ore : UI_COLORS.alert
          ctx.fillRect(CORE_TILE.x * TILE + 13, CORE_TILE.y * TILE + 2, 3, 2)
        }
        if (s.core.hp < s.core.maxHp) {
          this.drawBar(
            CORE_TILE.x * TILE + 4,
            CORE_TILE.y * TILE + 34,
            24,
            s.core.hp / s.core.maxHp,
            UI_COLORS.alert,
          )
        }
      },
    })
    const hx = (CORE_TILE.x + 1) * TILE + Math.sin(t * 0.6) * 22
    const hy = (CORE_TILE.y + 2) * TILE + 6 + Math.cos(t * 0.6) * 4
    items.push({
      y: hy + 12,
      draw: () => {
        const frame = Math.floor(t * 5) % 2
        const facing = Math.cos(t * 0.6) >= 0 ? 1 : -1
        this.drawFlipped(
          rasterize(HUMAN[frame], `human${frame}`),
          Math.round(hx) - 8,
          Math.round(hy) - 10,
          facing,
        )
      },
    })

    items.sort((a, b) => a.y - b.y)
    for (const it of items) it.draw()
  }

  private visibleTile(game: Game, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false
    const r =
      game.state.regions[
        Math.floor(y / REGION_SIZE) * 3 + Math.floor(x / REGION_SIZE)
      ]
    return r.state !== 'hidden'
  }

  private drawCollectible(c: Collectible, t: number) {
    const ctx = this.ctx
    const ratio = c.hp / c.maxHp
    let spr: Spr
    switch (c.kind) {
      case 'tree':
        spr = rasterize(
          TREE[ratio > 0.66 ? 0 : ratio > 0.3 ? 1 : 2],
          `tree${ratio > 0.66 ? 0 : ratio > 0.3 ? 1 : 2}`,
        )
        break
      case 'rock':
        spr = rasterize(
          ROCK[ratio > 0.66 ? 0 : ratio > 0.3 ? 1 : 2],
          `rock${ratio > 0.66 ? 0 : ratio > 0.3 ? 1 : 2}`,
        )
        break
      case 'bush':
        spr = rasterize(BUSH[ratio > 0.5 ? 0 : 1], `bush${ratio > 0.5 ? 0 : 1}`)
        break
      case 'fungus':
        spr = rasterize(
          FUNGUS[ratio > 0.5 ? 0 : 1],
          `fungus${ratio > 0.5 ? 0 : 1}`,
        )
        break
      case 'scrap':
        spr = rasterize(
          SCRAP[ratio > 0.5 ? 0 : 1],
          `scrap${ratio > 0.5 ? 0 : 1}`,
        )
        break
    }
    const ox = this.hitOffset(c.id, t)
    const px = c.x * TILE + ox
    const py = c.y * TILE
    ctx.drawImage(spr, px, py)
    if (c.hp < c.maxHp) {
      const color =
        c.kind === 'rock' || c.kind === 'scrap'
          ? UI_COLORS.ore
          : UI_COLORS.biomass
      this.drawBar(px + 3, py + TILE - 1, 10, ratio, color)
    }
  }

  private drawUnit(game: Game, u: Unit, t: number) {
    const ctx = this.ctx
    const s = game.state
    const selected = s.mode.kind === 'selected' && s.mode.unitId === u.id
    if (u.kind === 'turret') {
      const px = u.x * TILE
      const py = u.y * TILE
      if (selected) {
        const range = TURRET_LEVELS[u.level - 1].range * TILE
        ctx.strokeStyle = UI_COLORS.select
        ctx.globalAlpha = 0.5
        ctx.setLineDash([2, 2])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(px + 8, py + 8, range, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
        this.drawSelectRing(px, py, 16, t)
      } else if (s.mode.kind === 'selected') {
        // Candidata a merge: mesma classe e nível da selecionada.
        const sel = game.selectedUnit()
        if (
          sel &&
          sel.kind === u.kind &&
          sel.level === u.level &&
          Math.floor(t * 4) % 2 === 0
        ) {
          this.drawSelectRing(px, py, 16, t, UI_COLORS.hit)
        }
      }
      const ox = this.hitOffset(u.id, t)
      this.drawFlipped(
        rasterize(TURRET[u.level - 1], `turret${u.level}`),
        px + ox,
        py,
        u.facing,
      )
      if (u.cooldown > TURRET_LEVELS[u.level - 1].fireEvery - 0.08) {
        ctx.fillStyle = UI_COLORS.hit
        ctx.fillRect(
          px + (u.facing > 0 ? 14 : 0),
          py + [7, 5, 4][u.level - 1],
          2,
          2,
        )
      }
      if (u.hp < u.maxHp)
        this.drawBar(
          px + 3,
          py + TILE - 1,
          10,
          u.hp / u.maxHp,
          UI_COLORS.select,
        )
      return
    }
    // Coletor: sprite centrado no pé.
    const px = Math.round(u.x * TILE) - 8
    const py = Math.round(u.y * TILE) - 14
    const moving = u.targetId !== null
    const frame = moving ? Math.floor(t * 8) % 2 : 0
    if (selected) this.drawSelectRing(px, py, 16, t)
    // Nível do coletor: contorno extra de cor (merge visível).
    const ox = this.hitOffset(u.id, t)
    this.drawFlipped(
      rasterize(COLLECTOR[frame], `collector${frame}`),
      px + ox,
      py,
      u.facing,
    )
    if (u.level > 1) {
      ctx.fillStyle = u.level === 2 ? UI_COLORS.ore : UI_COLORS.alert
      ctx.fillRect(px + 5, py + 9, 2, 2)
      ctx.fillRect(px + 9, py + 9, 2, 2)
    }
    if (u.hp < u.maxHp)
      this.drawBar(px + 3, py + TILE, 10, u.hp / u.maxHp, UI_COLORS.select)
  }

  private drawEnemy(e: Enemy, t: number) {
    const ctx = this.ctx
    const ox = this.hitOffset(e.id, t)
    if (e.kind === 'brute') {
      const frame = Math.floor(t * 4) % 2
      const px = Math.round(e.x * TILE) - 12 + ox
      const py = Math.round(e.y * TILE) - 18
      ctx.drawImage(rasterize(BRUTE[frame], `brute${frame}`), px, py)
      if (e.hp < e.maxHp)
        this.drawBar(px + 6, py + 22, 12, e.hp / e.maxHp, UI_COLORS.alert)
      return
    }
    const frame = Math.floor(t * 6 + e.id) % 2
    const px = Math.round(e.x * TILE) - 8 + ox
    const py = Math.round(e.y * TILE) - 12
    ctx.drawImage(rasterize(LARVA[frame], `larva${frame}`), px, py)
    if (e.hp < e.maxHp)
      this.drawBar(px + 3, py + 14, 10, e.hp / e.maxHp, UI_COLORS.alert)
  }

  private drawFlipped(spr: Spr, x: number, y: number, facing: 1 | -1) {
    const ctx = this.ctx
    if (facing > 0) {
      ctx.drawImage(spr, x, y)
      return
    }
    ctx.save()
    ctx.translate(x + spr.width, y)
    ctx.scale(-1, 1)
    ctx.drawImage(spr, 0, 0)
    ctx.restore()
  }

  private drawSelectRing(
    x: number,
    y: number,
    size: number,
    t: number,
    color = UI_COLORS.select,
  ) {
    const ctx = this.ctx
    const k = Math.floor(t * 6) % 2
    ctx.fillStyle = color
    const s = size
    const corners: [number, number][] = [
      [x - 1 - k, y - 1 - k],
      [x + s - 2 + k, y - 1 - k],
      [x - 1 - k, y + s - 2 + k],
      [x + s - 2 + k, y + s - 2 + k],
    ]
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx, cy, 3, 1)
      ctx.fillRect(cx, cy, 1, 3)
    }
  }

  private drawBar(
    x: number,
    y: number,
    w: number,
    ratio: number,
    color: string,
  ) {
    const ctx = this.ctx
    ctx.fillStyle = PAL['0']
    ctx.fillRect(x - 1, y - 1, w + 2, 3)
    ctx.fillStyle = color
    ctx.fillRect(x, y, Math.max(1, Math.round(w * Math.max(0, ratio))), 1)
  }

  // ----------------------------------------------------------- efeitos

  private drawProjectiles(game: Game) {
    const ctx = this.ctx
    for (const p of game.state.projectiles) {
      ctx.strokeStyle =
        p.level >= 3
          ? UI_COLORS.hit
          : p.level === 2
            ? UI_COLORS.select
            : '#f4f4f0'
      ctx.lineWidth = p.level >= 2 ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.tx * TILE, p.ty * TILE - 4)
      ctx.stroke()
      ctx.fillStyle = UI_COLORS.hit
      ctx.fillRect(
        Math.round(p.tx * TILE) - 1,
        Math.round(p.ty * TILE) - 5,
        3,
        3,
      )
    }
  }

  private drawParticles(game: Game) {
    const ctx = this.ctx
    for (const p of game.state.particles) {
      ctx.fillStyle = p.color
      ctx.fillRect(
        Math.round(p.x * TILE),
        Math.round(p.y * TILE),
        p.t > 0.25 ? 2 : 1,
        p.t > 0.25 ? 2 : 1,
      )
    }
  }

  private drawPopups(game: Game) {
    const ctx = this.ctx
    for (const p of game.state.popups) {
      const k = 1 - p.t / 1.1
      const y = p.y * TILE - 6 - k * 12
      const color =
        p.color === 'biomass'
          ? UI_COLORS.biomass
          : p.color === 'ore'
            ? UI_COLORS.ore
            : p.color === 'alert'
              ? UI_COLORS.alert
              : UI_COLORS.hit
      drawText(ctx, p.text, p.x * TILE, y, color)
    }
  }

  // ----------------------------------------------------------- névoa

  private drawFog(game: Game, t: number) {
    const ctx = this.ctx
    const s = game.state
    const size = REGION_SIZE * TILE
    const drift = Math.floor(t * 3) % 32
    const pat = ctx.createPattern(this.fogPattern, 'repeat')!
    for (const r of s.regions) {
      if (r.state === 'revealed') continue
      const px = r.rx * size
      const py = r.ry * size
      ctx.save()
      ctx.beginPath()
      ctx.rect(px, py, size, size)
      ctx.clip()
      ctx.globalAlpha =
        r.state === 'revealing' ? Math.max(0, 1 - r.progress * r.progress) : 1
      ctx.translate(drift, Math.floor(drift / 2))
      ctx.fillStyle = pat
      ctx.fillRect(px - 32, py - 32, size + 64, size + 64)
      ctx.restore()
    }
    // Borda tramada (dither) onde a névoa encosta em área revelada — é a
    // assinatura visual que a separa de sombra ou de obstáculo.
    ctx.fillStyle = PAL.n
    for (const r of s.regions) {
      if (r.state !== 'hidden') continue
      const px = r.rx * size
      const py = r.ry * size
      const sides: [number, number, boolean][] = [
        [r.rx - 1, r.ry, true],
        [r.rx + 1, r.ry, true],
        [r.rx, r.ry - 1, false],
        [r.rx, r.ry + 1, false],
      ]
      for (const [nx, ny, vertical] of sides) {
        if (nx < 0 || ny < 0 || nx > 2 || ny > 2) continue
        if (s.regions[ny * 3 + nx].state !== 'revealed') continue
        for (let i = 0; i < size; i += 2) {
          for (let d = 0; d < 4; d++) {
            if (
              (i / 2 + d) % 2 === 0 &&
              d < 2 + ((i / 2 + Math.floor(t * 2)) % 2)
            ) {
              if (vertical) {
                const x = nx < r.rx ? px - 1 - d : px + size + d
                ctx.fillRect(x, py + i, 1, 1)
              } else {
                const y = ny < r.ry ? py - 1 - d : py + size + d
                ctx.fillRect(px + i, y, 1, 1)
              }
            }
          }
        }
      }
    }
  }

  private drawExploreMarkers(game: Game, t: number) {
    const ctx = this.ctx
    const size = REGION_SIZE * TILE
    const cost = game.exploreCost().biomass ?? 0
    for (const r of game.state.regions) {
      if (!game.isExplorable(r.rx, r.ry)) continue
      // A placa fica encostada na fronteira com a região revelada vizinha — é
      // onde o jogador consegue ver sem arrastar a câmera.
      const neighbor = [
        [r.rx - 1, r.ry],
        [r.rx + 1, r.ry],
        [r.rx, r.ry - 1],
        [r.rx, r.ry + 1],
      ].find(
        ([nx, ny]) =>
          nx >= 0 &&
          ny >= 0 &&
          nx < 3 &&
          ny < 3 &&
          game.state.regions[ny * 3 + nx].state === 'revealed',
      )
      if (!neighbor) continue
      const [nx, ny] = neighbor
      let cx = r.rx * size + size / 2
      let cy = r.ry * size + size / 2
      const inset = Math.round(TILE * 0.6)
      if (nx < r.rx) cx = r.rx * size + inset
      else if (nx > r.rx) cx = r.rx * size + size - inset
      else if (ny < r.ry) cy = r.ry * size + inset
      else cy = r.ry * size + size - inset
      cy += Math.round(Math.sin(t * 3) * 2)
      // Placa: quadrado escuro com "?" e o custo em biomassa.
      ctx.fillStyle = PAL['0']
      ctx.fillRect(cx - 9, cy - 9, 18, 18)
      ctx.fillStyle = PAL.K
      ctx.fillRect(cx - 8, cy - 8, 16, 16)
      drawText(ctx, '?', cx, cy - 6, UI_COLORS.hit)
      drawText(ctx, `${cost}`, cx - 2, cy + 2, UI_COLORS.biomass)
      ctx.fillStyle = UI_COLORS.biomass
      ctx.fillRect(cx + 2, cy + 3, 3, 3)
    }
  }

  private drawScout(game: Game, t: number) {
    const s = game.state
    if (!s.scout) return
    const ctx = this.ctx
    const px = Math.round(s.scout.x * TILE) - 8
    const py =
      Math.round(s.scout.y * TILE) - 20 + Math.round(Math.sin(t * 4) * 2)
    ctx.fillStyle = PAL['0']
    ctx.globalAlpha = 0.35
    ctx.fillRect(px + 5, py + 22, 6, 2)
    ctx.globalAlpha = 1
    ctx.drawImage(
      rasterize(
        SCOUT[Math.floor(t * 20) % 2],
        `scout${Math.floor(t * 20) % 2}`,
      ),
      px,
      py,
    )
  }

  /** Setas na borda da tela apontando para a ameaça fora do enquadramento. */
  private drawThreatArrows(game: Game, cam: Camera, t: number) {
    const s = game.state
    if (s.horde.status !== 'warning' && s.horde.status !== 'active') return
    const ctx = this.ctx
    const targets: { x: number; y: number }[] = [
      { x: s.fissure.x * TILE, y: s.fissure.y * TILE },
    ]
    if (s.enemies.length) {
      const e = s.enemies.reduce((a, b) =>
        Math.hypot(a.x - s.core.x, a.y - s.core.y) <
        Math.hypot(b.x - s.core.x, b.y - s.core.y)
          ? a
          : b,
      )
      targets.push({ x: e.x * TILE, y: e.y * TILE })
    }
    const camX = Math.round(cam.x)
    const camY = Math.round(cam.y)
    for (const tg of targets) {
      const sx = tg.x - camX
      const sy = tg.y - camY
      if (sx >= 0 && sy >= 0 && sx <= cam.viewW && sy <= cam.viewH) continue
      const cx = cam.viewW / 2
      const cy = cam.viewH / 2
      const dx = sx - cx
      const dy = sy - cy
      const k = Math.min(
        (cam.viewW / 2 - 10) / Math.abs(dx || 1),
        (cam.viewH / 2 - 10) / Math.abs(dy || 1),
      )
      const ax = Math.round(cx + dx * k)
      const ay = Math.round(cy + dy * k)
      const ang = Math.atan2(dy, dx)
      ctx.save()
      ctx.translate(ax, ay)
      ctx.rotate(ang)
      ctx.fillStyle = UI_COLORS.alert
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8)
      ctx.beginPath()
      ctx.moveTo(6, 0)
      ctx.lineTo(-4, -5)
      ctx.lineTo(-4, 5)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      ctx.globalAlpha = 1
    }
  }
}

// --------------------------------------------------------------- texturas

function makeGroundTile(kind: GroundKind, variant: number): Spr {
  const spec = GROUND_COLORS[kind]
  const rng = createRng(kind.length * 97 + variant * 13 + 1)
  const c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  const ctx = c.getContext('2d')!
  ctx.fillStyle = spec.base
  ctx.fillRect(0, 0, TILE, TILE)
  const dots = kind === 'grass' ? 14 : 8
  for (let i = 0; i < dots; i++) {
    ctx.fillStyle = spec.dots[Math.floor(rng() * spec.dots.length)]
    const x = Math.floor(rng() * TILE)
    const y = Math.floor(rng() * TILE)
    if (kind === 'grass' && rng() < 0.5) {
      ctx.fillRect(x, y, 1, 2)
    } else {
      ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1)
    }
  }
  if (kind === 'concrete' && rng() < 0.6) {
    ctx.fillStyle = spec.dots[0]
    let x = Math.floor(rng() * TILE)
    for (let y = 0; y < TILE; y++) {
      ctx.fillRect(x, y, 1, 1)
      if (rng() < 0.4) x += rng() < 0.5 ? 1 : -1
    }
  }
  if (spec.lines) {
    ctx.fillStyle = spec.lines
    ctx.fillRect(0, 0, TILE, 1)
    ctx.fillRect(0, 0, 1, TILE)
    ctx.fillStyle = spec.dots[0]
    ctx.fillRect(2, 2, 1, 1)
    ctx.fillRect(TILE - 3, 2, 1, 1)
    ctx.fillRect(2, TILE - 3, 1, 1)
    ctx.fillRect(TILE - 3, TILE - 3, 1, 1)
  }
  return c
}

function makeFogPattern(): Spr {
  const rng = createRng(4242)
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAL.n
  ctx.fillRect(0, 0, 32, 32)
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rng() < 0.5 ? PAL.N : PAL.M
    const x = Math.floor(rng() * 32)
    const y = Math.floor(rng() * 32)
    const w = 2 + Math.floor(rng() * 6)
    ctx.fillRect(x, y, w, 1)
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), 1)
  }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = '#1f2628'
    ctx.fillRect(
      Math.floor(rng() * 32),
      Math.floor(rng() * 32),
      1 + Math.floor(rng() * 3),
      1,
    )
  }
  return c
}

function makeStripePattern(): Spr {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 8
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2a2230'
  ctx.fillRect(0, 0, 8, 8)
  ctx.fillStyle = '#c9972b'
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 8 < 4) ctx.fillRect(x, y, 1, 1)
    }
  }
  return c
}
