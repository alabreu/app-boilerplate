import {
  HORDE_WARNING,
  MAX_LEVEL,
  TURRET_LEVELS,
  WAVES_TO_WIN,
  type Cost,
} from '@core/game/balance'
import type { Game } from '@core/game/game'
import type { Hint, Horde, Mode, Phase } from '@core/game/types'

/**
 * Recorte do estado que o HUD (React) precisa. O canvas lê o estado inteiro a
 * cada frame; o HUD só re-renderiza quando ESTE recorte muda (comparado por
 * JSON a ~10 Hz), para o React não competir com o loop do jogo.
 */
export interface SelectedInfo {
  kind: 'turret' | 'collector'
  level: number
  isMax: boolean
  mergeAvailable: boolean
  damage?: number
  range?: number
  power?: number
}

export interface HudSnapshot {
  biomass: number
  ore: number
  coreHp: number
  coreMax: number
  phase: Phase
  hint: Hint
  hintParams: Record<string, string | number>
  mode: Mode['kind']
  horde: Pick<Horde, 'status' | 'wave'> & {
    seconds: number
    left: number
    total: number
  }
  costs: { collector: Cost; turret: Cost; tools: Cost }
  afford: { collector: boolean; turret: boolean; tools: boolean }
  toolLevel: number
  selected: SelectedInfo | null
  stats: {
    taps: number
    biomass: number
    ore: number
    merges: number
    kills: number
  }
}

export function snapshot(game: Game): HudSnapshot {
  const s = game.state
  const collectorCost = game.collectorCost()
  const turretCost = game.turretCost()
  const toolsCost = game.toolsCost()
  const sel = game.selectedUnit()
  let selected: SelectedInfo | null = null
  if (sel) {
    selected = {
      kind: sel.kind,
      level: sel.level,
      isMax: sel.level >= MAX_LEVEL,
      mergeAvailable: sel.level < MAX_LEVEL && game.mergePartnerExists(sel),
    }
    if (sel.kind === 'turret') {
      const spec = TURRET_LEVELS[sel.level - 1]
      selected.damage = spec.damage
      selected.range = Math.round(spec.range * 10) / 10
    } else {
      selected.power = s.toolLevel * sel.level
    }
  }
  const h = s.horde
  return {
    biomass: s.resources.biomass,
    ore: s.resources.ore,
    coreHp: s.core.hp,
    coreMax: s.core.maxHp,
    phase: s.phase,
    hint: s.hint,
    hintParams: {
      biomass: collectorCost.biomass ?? 0,
      ore: collectorCost.ore ?? 0,
    },
    mode: s.mode.kind,
    horde: {
      status: h.status,
      wave: Math.min(h.wave, WAVES_TO_WIN),
      seconds: Math.max(
        0,
        Math.ceil(h.status === 'countdown' ? h.timer + HORDE_WARNING : h.timer),
      ),
      left: h.toSpawn - h.spawned + s.enemies.length,
      total: WAVES_TO_WIN,
    },
    costs: { collector: collectorCost, turret: turretCost, tools: toolsCost },
    afford: {
      collector: game.canAfford(collectorCost),
      turret: game.canAfford(turretCost),
      tools: game.canAfford(toolsCost),
    },
    toolLevel: s.toolLevel,
    selected,
    stats: {
      taps: s.stats.taps,
      biomass: s.stats.collected.biomass,
      ore: s.stats.collected.ore,
      merges: s.stats.merges,
      kills: s.stats.kills,
    },
  }
}
