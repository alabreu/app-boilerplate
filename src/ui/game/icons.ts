import {
  ICON_BIOMASS,
  ICON_CORE,
  ICON_ORE,
  ICON_SKULL,
  rasterize,
} from './sprites'

/** Ícones da pixel art como data URL, para o HUD (DOM) falar a mesma língua do canvas. */
let cached: Record<'biomass' | 'ore' | 'core' | 'skull', string> | null = null

export function hudIcons() {
  if (cached) return cached
  cached = {
    biomass: rasterize(ICON_BIOMASS, 'icon-biomass').toDataURL(),
    ore: rasterize(ICON_ORE, 'icon-ore').toDataURL(),
    core: rasterize(ICON_CORE, 'icon-core').toDataURL(),
    skull: rasterize(ICON_SKULL, 'icon-skull').toDataURL(),
  }
  return cached
}
