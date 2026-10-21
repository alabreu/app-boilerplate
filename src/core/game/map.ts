import { MAP_SIZE, REGION_SIZE, REGIONS_PER_SIDE } from './balance'
import { createRng } from './rng'
import type {
  Collectible,
  ElementKind,
  GroundKind,
  Region,
  RegionName,
  Tile,
} from './types'

interface RegionRecipe {
  nameKey: RegionName
  ground: GroundKind[]
  elements: Partial<Record<ElementKind, number>>
}

/**
 * Receita de cada região (rx, ry). O centro é a colônia; o leste guarda a
 * fissura. Os cantos existem para a exploração ter o que descobrir, mas o
 * ciclo da POC fecha só com o centro + uma vizinha.
 */
const RECIPES: Record<string, RegionRecipe> = {
  '1,1': {
    nameKey: 'region.colony',
    ground: ['dirt', 'dirt', 'concrete', 'plate', 'grass'],
    elements: { tree: 6, bush: 5, rock: 4 },
  },
  '2,1': {
    nameKey: 'region.fissure',
    ground: ['ash', 'ash', 'dirt', 'concrete'],
    elements: { rock: 6, scrap: 2, bush: 2 },
  },
  '0,1': {
    nameKey: 'region.quarry',
    ground: ['dirt', 'ash', 'concrete'],
    elements: { rock: 8, scrap: 1, bush: 1 },
  },
  '1,0': {
    nameKey: 'region.forest',
    ground: ['grass', 'grass', 'dirt'],
    elements: { tree: 10, bush: 6, rock: 1 },
  },
  '1,2': {
    nameKey: 'region.fungus',
    ground: ['dirt', 'grass', 'ash'],
    elements: { fungus: 10, bush: 3, rock: 1 },
  },
  '0,0': {
    nameKey: 'region.ruins',
    ground: ['concrete', 'concrete', 'plate', 'dirt'],
    elements: { scrap: 4, rock: 3, tree: 2 },
  },
  '2,0': {
    nameKey: 'region.scrapyard',
    ground: ['plate', 'concrete', 'ash'],
    elements: { scrap: 5, rock: 2, bush: 2 },
  },
  '0,2': {
    nameKey: 'region.field',
    ground: ['grass', 'grass', 'dirt'],
    elements: { tree: 4, bush: 6, fungus: 2 },
  },
  '2,2': {
    nameKey: 'region.wastes',
    ground: ['ash', 'ash', 'concrete'],
    elements: { rock: 4, fungus: 3, scrap: 1 },
  },
}

export const CORE_TILE = { x: MAP_SIZE / 2 - 1, y: MAP_SIZE / 2 - 1 } // 2×2 a partir daqui
export const FISSURE_TILE = { x: MAP_SIZE - 4, y: MAP_SIZE / 2 }

export function regionOf(x: number, y: number): { rx: number; ry: number } {
  return { rx: Math.floor(x / REGION_SIZE), ry: Math.floor(y / REGION_SIZE) }
}

export function regionIndex(rx: number, ry: number): number {
  return ry * REGIONS_PER_SIDE + rx
}

export function inMap(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE
}

/** Tiles reservados (núcleo + margem, fissura + margem) não recebem elementos. */
function reserved(x: number, y: number): boolean {
  const nearCore =
    x >= CORE_TILE.x - 1 &&
    x <= CORE_TILE.x + 2 &&
    y >= CORE_TILE.y - 1 &&
    y <= CORE_TILE.y + 2
  const nearFissure =
    Math.abs(x - FISSURE_TILE.x) <= 1 && Math.abs(y - FISSURE_TILE.y) <= 1
  return nearCore || nearFissure
}

export interface GeneratedMap {
  tiles: Tile[]
  collectibles: Collectible[]
  regions: Region[]
}

export function generateMap(seed: number, firstId = 1): GeneratedMap {
  const rng = createRng(seed)
  const tiles: Tile[] = []
  const regions: Region[] = []
  const collectibles: Collectible[] = []
  let nextId = firstId

  for (let ry = 0; ry < REGIONS_PER_SIDE; ry++) {
    for (let rx = 0; rx < REGIONS_PER_SIDE; rx++) {
      const recipe = RECIPES[`${rx},${ry}`]
      const isColony = rx === 1 && ry === 1
      regions.push({
        rx,
        ry,
        state: isColony ? 'revealed' : 'hidden',
        progress: 0,
        nameKey: recipe.nameKey,
      })
    }
  }

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const { rx, ry } = regionOf(x, y)
      const recipe = RECIPES[`${rx},${ry}`]
      const ground = recipe.ground[Math.floor(rng() * recipe.ground.length)]
      const decor = rng() < 0.12 ? 1 + Math.floor(rng() * 4) : 0
      tiles.push({ x, y, ground, variant: Math.floor(rng() * 4), decor })
    }
  }

  // Pátio de concreto ao redor do núcleo: lê como "instalação", não como mato.
  for (let y = CORE_TILE.y - 1; y <= CORE_TILE.y + 2; y++) {
    for (let x = CORE_TILE.x - 1; x <= CORE_TILE.x + 2; x++) {
      const t = tiles[y * MAP_SIZE + x]
      t.ground = 'plate'
      t.decor = 0
    }
  }
  // Chão rachado em volta da fissura.
  for (let y = FISSURE_TILE.y - 1; y <= FISSURE_TILE.y + 1; y++) {
    for (let x = FISSURE_TILE.x - 1; x <= FISSURE_TILE.x + 1; x++) {
      const t = tiles[y * MAP_SIZE + x]
      t.ground = 'ash'
      t.decor = 0
    }
  }

  const occupied = new Set<string>()
  for (let ry = 0; ry < REGIONS_PER_SIDE; ry++) {
    for (let rx = 0; rx < REGIONS_PER_SIDE; rx++) {
      const recipe = RECIPES[`${rx},${ry}`]
      for (const [kindKey, count] of Object.entries(recipe.elements)) {
        const kind = kindKey as ElementKind
        let placed = 0
        let tries = 0
        while (placed < count && tries < 200) {
          tries++
          const x = rx * REGION_SIZE + Math.floor(rng() * REGION_SIZE)
          const y = ry * REGION_SIZE + Math.floor(rng() * REGION_SIZE)
          const key = `${x},${y}`
          if (occupied.has(key) || reserved(x, y)) continue
          occupied.add(key)
          collectibles.push(makeCollectible(nextId++, kind, x, y))
          placed++
        }
      }
    }
  }

  return { tiles, collectibles, regions }
}

import { ELEMENTS } from './balance'

export function makeCollectible(
  id: number,
  kind: ElementKind,
  x: number,
  y: number,
): Collectible {
  const hp = ELEMENTS[kind].hp
  return { id, kind, x, y, hp, maxHp: hp }
}
