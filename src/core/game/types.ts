/**
 * Tipos do jogo. Tudo aqui é dado puro (sem DOM): a "pele" em src/ui/game só
 * lê este estado e desenha.
 */
export type Resource = 'biomass' | 'ore'

export type ElementKind = 'tree' | 'bush' | 'rock' | 'scrap' | 'fungus'

export type GroundKind = 'dirt' | 'concrete' | 'plate' | 'grass' | 'ash'

export interface Tile {
  x: number
  y: number
  ground: GroundKind
  /** Variação visual (0..3), decidida no mapa para o desenho ser estável. */
  variant: number
  /** Decoração estática sem função (cano, entulho, mancha). */
  decor: number
}

export interface Collectible {
  id: number
  kind: ElementKind
  x: number
  y: number
  /** Toques restantes até destruir. */
  hp: number
  maxHp: number
}

export type UnitKind = 'collector' | 'turret'

export interface Unit {
  id: number
  kind: UnitKind
  level: number
  /** Posição em tiles (float para coletor que anda; inteiro para torreta). */
  x: number
  y: number
  hp: number
  maxHp: number
  /** Coletor: alvo atual e temporizador de golpe. Torreta: recarga. */
  targetId: number | null
  cooldown: number
  /** Coletor: carga a caminho do núcleo? (visual) */
  facing: 1 | -1
}

export type EnemyKind = 'larva' | 'brute'

export interface Enemy {
  id: number
  kind: EnemyKind
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  damage: number
  cooldown: number
  /** Deslocamento lateral para a horda não andar em fila única. */
  wobble: number
}

export type RegionState = 'hidden' | 'revealing' | 'revealed'

export interface Region {
  /** Índice na grade de regiões (rx, ry). */
  rx: number
  ry: number
  state: RegionState
  /** Progresso 0..1 da sonda a caminho (só em 'revealing'). */
  progress: number
  /** Nome da região para o HUD. */
  nameKey: RegionName
}

export type RegionName =
  | 'region.colony'
  | 'region.forest'
  | 'region.fissure'
  | 'region.fungus'
  | 'region.quarry'
  | 'region.ruins'
  | 'region.field'
  | 'region.scrapyard'
  | 'region.wastes'

export interface Projectile {
  x: number
  y: number
  tx: number
  ty: number
  t: number
  level: number
}

export interface Popup {
  x: number
  y: number
  text: string
  color: 'biomass' | 'ore' | 'hit' | 'alert'
  t: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  color: string
}

export type Phase = 'playing' | 'won' | 'lost'

export type Mode =
  | { kind: 'idle' }
  | { kind: 'place'; unit: 'turret' }
  | { kind: 'selected'; unitId: number }

export type Hint =
  | 'hint.tap'
  | 'hint.more'
  | 'hint.buyCollector'
  | 'hint.automation'
  | 'hint.explore'
  | 'hint.buildTurret'
  | 'hint.place'
  | 'hint.merge'
  | 'hint.mergeSelect'
  | 'hint.hordeIncoming'
  | 'hint.hordeNow'
  | 'hint.hordeCleared'
  | 'hint.placeInvalid'
  | 'hint.noResources'

export interface Horde {
  /** Próxima horda: 1..3. */
  wave: number
  /** Segundos até o próximo evento (aviso ou spawn). */
  timer: number
  status: 'dormant' | 'countdown' | 'warning' | 'active'
  spawned: number
  toSpawn: number
}

export interface GameState {
  seed: number
  time: number
  phase: Phase
  mode: Mode
  hint: Hint
  resources: Record<Resource, number>
  /** Nível das ferramentas: força do toque manual E dos coletores. */
  toolLevel: number
  core: { x: number; y: number; hp: number; maxHp: number }
  tiles: Tile[]
  collectibles: Collectible[]
  units: Unit[]
  enemies: Enemy[]
  regions: Region[]
  fissure: { x: number; y: number }
  horde: Horde
  projectiles: Projectile[]
  popups: Popup[]
  particles: Particle[]
  /** Posição da sonda exploradora (null quando parada). */
  scout: { x: number; y: number; targetRx: number; targetRy: number } | null
  /** Tremor de tela e flashes (visual). */
  shake: number
  /** Contadores para o teste da POC. */
  stats: {
    taps: number
    collected: Record<Resource, number>
    merges: number
    kills: number
  }
  nextId: number
}
