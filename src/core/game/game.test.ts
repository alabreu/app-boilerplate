import { describe, expect, it } from 'vitest'
import {
  ELEMENTS,
  HORDE_COUNTDOWN,
  HORDE_WARNING,
  MAP_SIZE,
  TURRET_LEVELS,
  WAVES,
} from './balance'
import { Game } from './game'
import {
  CORE_TILE,
  FISSURE_TILE,
  generateMap,
  regionIndex,
  regionOf,
} from './map'

function run(game: Game, seconds: number, dt = 0.05) {
  for (let t = 0; t < seconds; t += dt) game.tick(dt)
}

describe('mapa', () => {
  it('é determinístico pela seed e só a colônia nasce revelada', () => {
    const a = generateMap(7)
    const b = generateMap(7)
    expect(a.collectibles).toEqual(b.collectibles)
    expect(a.tiles.length).toBe(MAP_SIZE * MAP_SIZE)
    const revealed = a.regions.filter((r) => r.state === 'revealed')
    expect(revealed).toHaveLength(1)
    expect(revealed[0]).toMatchObject({ rx: 1, ry: 1 })
  })

  it('a área inicial tem os dois recursos sem precisar explorar', () => {
    const game = new Game(7)
    const inColony = game.state.collectibles.filter((c) =>
      game.isRevealed(c.x, c.y),
    )
    expect(inColony.some((c) => ELEMENTS[c.kind].resource === 'biomass')).toBe(
      true,
    )
    expect(inColony.some((c) => ELEMENTS[c.kind].resource === 'ore')).toBe(true)
  })

  it('nada nasce em cima do núcleo nem da fissura', () => {
    const { collectibles } = generateMap(7)
    for (const c of collectibles) {
      const onCore =
        c.x >= CORE_TILE.x &&
        c.x <= CORE_TILE.x + 1 &&
        c.y >= CORE_TILE.y &&
        c.y <= CORE_TILE.y + 1
      const onFissure =
        Math.abs(c.x - FISSURE_TILE.x) <= 1 &&
        Math.abs(c.y - FISSURE_TILE.y) <= 1
      expect(onCore || onFissure).toBe(false)
    }
  })
})

describe('coleta manual', () => {
  it('cada toque desgasta e o último entrega o recurso', () => {
    const game = new Game(7)
    const tree = game.state.collectibles.find(
      (c) => c.kind === 'tree' && game.isRevealed(c.x, c.y),
    )!
    const hp = tree.hp
    for (let i = 0; i < hp - 1; i++) game.tapAt(tree.x + 0.5, tree.y + 0.5)
    expect(tree.hp).toBe(1)
    expect(game.state.resources.biomass).toBe(0)
    game.tapAt(tree.x + 0.5, tree.y + 0.5)
    expect(game.state.resources.biomass).toBe(ELEMENTS.tree.yield)
    expect(
      game.state.collectibles.find((c) => c.id === tree.id),
    ).toBeUndefined()
    expect(game.state.stats.taps).toBe(hp)
  })

  it('toque na névoa de uma região vizinha explora (pagando biomassa)', () => {
    const game = new Game(7)
    game.state.resources.biomass = 10
    game.tapAt(20.5, 4.5) // região (2,0) — canto, não vizinha da colônia
    expect(game.state.scout).toBeNull()
    game.tapAt(12.5, 4.5) // região (1,0) — vizinha
    expect(game.state.scout).not.toBeNull()
    expect(game.state.resources.biomass).toBe(6)
    run(game, 8)
    expect(game.state.regions[regionIndex(1, 0)].state).toBe('revealed')
    expect(game.state.scout).toBeNull()
  })
})

describe('automação', () => {
  it('o coletor produz sozinho e liga a contagem da primeira horda', () => {
    const game = new Game(7)
    game.state.resources = { biomass: 20, ore: 20 }
    expect(game.buyCollector()).toBe(true)
    expect(game.state.horde.status).toBe('countdown')
    const before = game.state.resources.biomass + game.state.resources.ore
    run(game, 12)
    expect(
      game.state.resources.biomass + game.state.resources.ore,
    ).toBeGreaterThan(before)
  })

  it('melhoria de ferramentas aumenta a força do toque', () => {
    const game = new Game(7)
    game.state.resources = { biomass: 0, ore: 50 }
    expect(game.buyTools()).toBe(true)
    const rock = game.state.collectibles.find(
      (c) => c.kind === 'rock' && game.isRevealed(c.x, c.y),
    )!
    game.tapAt(rock.x + 0.5, rock.y + 0.5)
    expect(rock.hp).toBe(rock.maxHp - 2)
  })

  it('sem recursos a compra falha e avisa', () => {
    const game = new Game(7)
    expect(game.buyCollector()).toBe(false)
    game.tick(0.01)
    expect(game.state.hint).toBe('hint.noResources')
  })
})

describe('defesa e merge', () => {
  function placeTurret(game: Game, x: number, y: number) {
    game.state.resources = { biomass: 99, ore: 99 }
    game.startPlacing('turret')
    game.tapAt(x + 0.5, y + 0.5)
    return game.state.units.find(
      (u) => u.kind === 'turret' && u.x === x && u.y === y,
    )
  }

  it('torreta só vai em tile revelado e livre', () => {
    const game = new Game(7)
    game.state.resources = { biomass: 99, ore: 99 }
    game.startPlacing('turret')
    game.tapAt(CORE_TILE.x + 0.5, CORE_TILE.y + 0.5) // em cima do núcleo
    expect(game.state.units).toHaveLength(0)
    expect(game.state.mode.kind).toBe('place')
    const free = freeTile(game)
    game.tapAt(free.x + 0.5, free.y + 0.5)
    expect(game.state.units).toHaveLength(1)
    expect(game.state.mode.kind).toBe('idle')
  })

  it('duas torretas iguais viram uma de nível maior, mais forte', () => {
    const game = new Game(7)
    const [a, b] = twoFreeTiles(game)
    const ta = placeTurret(game, a.x, a.y)!
    const tb = placeTurret(game, b.x, b.y)!
    game.tapAt(ta.x + 0.5, ta.y + 0.5)
    expect(game.state.mode).toEqual({ kind: 'selected', unitId: ta.id })
    game.tapAt(tb.x + 0.5, tb.y + 0.5)
    expect(game.state.units.filter((u) => u.kind === 'turret')).toHaveLength(1)
    expect(tb.level).toBe(2)
    expect(tb.maxHp).toBe(TURRET_LEVELS[1].hp)
    expect(TURRET_LEVELS[1].damage).toBeGreaterThan(TURRET_LEVELS[0].damage * 2)
    expect(game.state.stats.merges).toBe(1)
  })

  it('torreta de nível diferente não combina: só troca a seleção', () => {
    const game = new Game(7)
    const [a, b, c] = threeFreeTiles(game)
    const ta = placeTurret(game, a.x, a.y)!
    const tb = placeTurret(game, b.x, b.y)!
    game.tapAt(ta.x + 0.5, ta.y + 0.5)
    game.tapAt(tb.x + 0.5, tb.y + 0.5) // merge → tb nível 2
    const tc = placeTurret(game, c.x, c.y)!
    game.tapAt(tc.x + 0.5, tc.y + 0.5)
    game.tapAt(tb.x + 0.5, tb.y + 0.5)
    expect(game.state.units.filter((u) => u.kind === 'turret')).toHaveLength(2)
    expect(game.state.mode).toEqual({ kind: 'selected', unitId: tb.id })
  })
})

describe('horda', () => {
  it('aviso revela a fissura, a horda nasce e o núcleo cai sem defesa', () => {
    const game = new Game(7)
    game.state.resources = { biomass: 20, ore: 20 }
    game.buyCollector()
    run(game, HORDE_COUNTDOWN + 0.5)
    expect(game.state.horde.status).toBe('warning')
    const fr = regionOf(FISSURE_TILE.x, FISSURE_TILE.y)
    expect(game.state.regions[regionIndex(fr.rx, fr.ry)].state).toBe('revealed')
    run(game, HORDE_WARNING + 2)
    expect(game.state.horde.status).toBe('active')
    expect(game.state.enemies.length).toBeGreaterThan(0)
    run(game, 90)
    expect(game.state.phase).toBe('lost')
  })

  it('com torretas fortes a colônia vence após as hordas', () => {
    const game = new Game(7)
    game.state.resources = { biomass: 999, ore: 999 }
    game.buyCollector()
    // Anel de torretas nível 3 ao redor do núcleo.
    const tiles = freeTilesNearCore(game, 6)
    for (const t of tiles) {
      game.startPlacing('turret')
      game.tapAt(t.x + 0.5, t.y + 0.5)
    }
    for (const u of game.state.units) {
      if (u.kind !== 'turret') continue
      u.level = 3
      u.hp = u.maxHp = TURRET_LEVELS[2].hp
    }
    game.state.resources = { biomass: 999, ore: 999 }
    run(game, 400)
    expect(game.state.phase).toBe('won')
    expect(game.state.stats.kills).toBe(
      WAVES.reduce((n, w) => n + w.larva + w.brute, 0),
    )
  })
})

function freeTile(game: Game) {
  return freeTilesNearCore(game, 1)[0]
}
function twoFreeTiles(game: Game) {
  return freeTilesNearCore(game, 2)
}
function threeFreeTiles(game: Game) {
  return freeTilesNearCore(game, 3)
}
function freeTilesNearCore(game: Game, n: number) {
  const out: { x: number; y: number }[] = []
  for (let r = 2; r < 5 && out.length < n; r++) {
    for (
      let y = CORE_TILE.y - r;
      y <= CORE_TILE.y + 1 + r && out.length < n;
      y++
    ) {
      for (
        let x = CORE_TILE.x - r;
        x <= CORE_TILE.x + 1 + r && out.length < n;
        x++
      ) {
        if (game.canPlaceAt(x, y) && !out.some((o) => o.x === x && o.y === y))
          out.push({ x, y })
      }
    }
  }
  return out
}
