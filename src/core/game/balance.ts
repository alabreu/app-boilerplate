import type { ElementKind, EnemyKind, Resource } from './types'

/** Tamanho do mapa: 3×3 regiões de 8×8 tiles. */
export const REGION_SIZE = 8
export const REGIONS_PER_SIDE = 3
export const MAP_SIZE = REGION_SIZE * REGIONS_PER_SIDE

export interface ElementSpec {
  hp: number
  resource: Resource
  yield: number
}

/** Quantos toques cada elemento aguenta e o que entrega ao cair. */
export const ELEMENTS: Record<ElementKind, ElementSpec> = {
  tree: { hp: 8, resource: 'biomass', yield: 4 },
  bush: { hp: 3, resource: 'biomass', yield: 1 },
  fungus: { hp: 5, resource: 'biomass', yield: 3 },
  rock: { hp: 10, resource: 'ore', yield: 4 },
  scrap: { hp: 12, resource: 'ore', yield: 6 },
}

export type Cost = Partial<Record<Resource, number>>

export const COLLECTOR_BASE_COST: Cost = { biomass: 6, ore: 4 }
export const COLLECTOR_COST_GROWTH = 1.5
export const TURRET_BASE_COST: Cost = { ore: 5, biomass: 3 }
export const TURRET_COST_STEP: Cost = { ore: 2, biomass: 1 }
export const TOOLS_BASE_COST = 8
export const TOOLS_COST_GROWTH = 1.8
export const EXPLORE_COST: Cost = { biomass: 4 }
export const EXPLORE_SECONDS = 7

export const COLLECTOR = {
  speed: 2.2, // tiles/s
  hitEvery: 0.7, // s
  hp: 6,
  reach: 0.9,
}

export interface TurretSpec {
  damage: number
  range: number
  fireEvery: number
  hp: number
}

/** Nível 1 → 3. Combinar dois iguais sobe um nível (mais que o dobro). */
export const TURRET_LEVELS: TurretSpec[] = [
  { damage: 1, range: 2.6, fireEvery: 0.8, hp: 10 },
  { damage: 3, range: 3.3, fireEvery: 0.65, hp: 24 },
  { damage: 8, range: 4.0, fireEvery: 0.5, hp: 50 },
]
export const MAX_LEVEL = TURRET_LEVELS.length

export const CORE_HP = 30

export const ENEMIES: Record<
  EnemyKind,
  { hp: number; speed: number; damage: number; attackEvery: number }
> = {
  larva: { hp: 4, speed: 1.3, damage: 1, attackEvery: 1.0 },
  brute: { hp: 30, speed: 0.6, damage: 4, attackEvery: 1.4 },
}

/** Hordas: a primeira só conta depois da primeira automação. */
export const HORDE_COUNTDOWN = 45 // s entre automação e aviso
export const HORDE_WARNING = 15 // s de aviso (tremor) antes do spawn
export const HORDE_BETWEEN_WAVES = 45 // s de respiro entre hordas
export const HORDE_SPAWN_GAP = 0.4 // s entre inimigos da mesma horda (em bloco, não em fila)
export const WAVES: { larva: number; brute: number }[] = [
  { larva: 6, brute: 0 },
  { larva: 10, brute: 1 },
  { larva: 14, brute: 3 },
]
export const WAVES_TO_WIN = WAVES.length

/** Rebrota: um broto novo em tile livre revelado a cada N segundos. */
export const REGROW_EVERY = 8
export const REGROW_CAP = 10
