import { storageKey } from '@core/config'
import type { Locale } from '@core/i18n'

/**
 * Changelog do produto, exibido na tela "Novidades". Dados portáveis (sem UI),
 * com texto por idioma. MAIS NOVO PRIMEIRO. Só entra aqui o que é relevante
 * para o usuário — não cada bug fix. Adicione a entrada nova no TOPO ao lançar
 * algo que vale anunciar.
 */
export interface ChangelogEntry {
  /** Id estável (slug com data ISO funciona bem). */
  id: string
  /** Data de exibição (ISO); a formatação é trabalho da UI. */
  date: string
  emoji: string
  title: Record<Locale, string>
  items: Record<Locale, string[]>
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-10-21-poc',
    date: '2026-10-21',
    emoji: '🕳️',
    title: {
      pt: 'POC jogável',
      en: 'Playable POC',
    },
    items: {
      pt: [
        'Toque em árvores e pedras para coletar biomassa e minério.',
        'Coletor automático, melhoria de ferramentas e torretas que combinam.',
        'Névoa de guerra com sonda exploradora e uma fissura que cospe hordas.',
      ],
      en: [
        'Tap trees and rocks to collect biomass and ore.',
        'Automatic collector, tool upgrades and turrets that merge.',
        'Fog of war with a scout probe and a fissure that spits hordes.',
      ],
    },
  },
]

// Rastreio de "não lido": guarda o id da entrada mais nova vista. Quem nunca
// abriu tem tudo como não lido — assim a própria feature se anuncia.
// (Acesso a localStorage com guarda; no RN, trocar por AsyncStorage.)
const LAST_SEEN_KEY = storageKey('changelog-last-seen')

/** Quantas entradas do topo o usuário ainda não viu. */
export function getUnreadCount(): number {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
    if (!lastSeen) return CHANGELOG.length
    const index = CHANGELOG.findIndex((entry) => entry.id === lastSeen)
    return index === -1 ? CHANGELOG.length : index
  } catch {
    return 0
  }
}

/** Marca tudo como visto (chamar ao abrir a tela de novidades). */
export function markChangelogSeen(): void {
  try {
    if (CHANGELOG[0]) localStorage.setItem(LAST_SEEN_KEY, CHANGELOG[0].id)
  } catch {
    // Ignora falhas de storage (modo privado, etc.).
  }
}
