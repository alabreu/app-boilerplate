import { useMemo } from 'react'
import type { Cost } from '@core/game/balance'
import type { Game } from '@core/game/game'
import { Button, Card } from '@ui/design'
import { useTranslation } from '@ui/hooks/useTranslation'
import { hudIcons } from './icons'
import type { HudSnapshot } from './snapshot'

interface GameHudProps {
  game: Game
  snap: HudSnapshot
  onRestart: () => void
}

/** Ícone de recurso em pixel art (8×8 ampliado 2×). */
function PixelIcon({
  src,
  className = '',
}: {
  src: string
  className?: string
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={16}
      height={16}
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

function CostLabel({
  cost,
  icons,
}: {
  cost: Cost
  icons: ReturnType<typeof hudIcons>
}) {
  return (
    <span className="inline-flex items-center gap-1 text-label font-semibold text-muted">
      {cost.biomass ? (
        <>
          <PixelIcon src={icons.biomass} />
          {cost.biomass}
        </>
      ) : null}
      {cost.ore ? (
        <>
          <PixelIcon src={icons.ore} />
          {cost.ore}
        </>
      ) : null}
    </span>
  )
}

/**
 * HUD do jogo: recursos + ameaça em cima, dica + ações embaixo, tudo sobre o
 * canvas. Poucos painéis de propósito: uma linha de dica por vez, três botões,
 * e um painel de unidade só quando algo está selecionado.
 */
export function GameHud({ game, snap, onRestart }: GameHudProps) {
  const { t } = useTranslation()
  const icons = useMemo(() => hudIcons(), [])
  const h = snap.horde

  const hordeText =
    h.status === 'dormant'
      ? t('game.hordeDormant', { n: h.wave, total: h.total })
      : h.status === 'countdown'
        ? t('game.hordeIn', { n: h.wave, total: h.total, s: h.seconds })
        : h.status === 'warning'
          ? t('game.hordeWarning', { n: h.wave, total: h.total, s: h.seconds })
          : t('game.hordeActive', { n: h.wave, total: h.total, left: h.left })
  const hordeTone =
    h.status === 'warning' || h.status === 'active'
      ? 'text-danger'
      : h.status === 'countdown'
        ? 'text-accent'
        : 'text-muted'

  const selected = snap.selected

  return (
    <>
      {/* Topo: recursos, núcleo e ameaça. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1 px-gutter pt-2">
        <div className="flex items-center gap-2">
          <Card
            padding="none"
            className="pointer-events-auto flex items-center gap-1 px-2 py-1"
          >
            <PixelIcon src={icons.biomass} />
            <span className="text-metric font-extrabold tabular-nums text-success">
              {snap.biomass}
            </span>
          </Card>
          <Card
            padding="none"
            className="pointer-events-auto flex items-center gap-1 px-2 py-1"
          >
            <PixelIcon src={icons.ore} />
            <span className="text-metric font-extrabold tabular-nums text-primary">
              {snap.ore}
            </span>
          </Card>
          <Card
            padding="none"
            className="pointer-events-auto flex items-center gap-1 px-2 py-1"
          >
            <PixelIcon src={icons.core} />
            <span className="text-body font-bold tabular-nums">
              {snap.coreHp}/{snap.coreMax}
            </span>
          </Card>
        </div>
        <div className={`text-label font-bold ${hordeTone}`} aria-live="polite">
          {hordeText}
        </div>
      </div>

      {/* Base: dica + ações. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 px-gutter pb-3">
        <Card
          padding="sm"
          className="pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <p className="text-body">{t(snap.hint, snap.hintParams)}</p>
        </Card>

        {selected ? (
          <Card
            padding="sm"
            className="pointer-events-auto flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-body font-bold">
                {selected.kind === 'turret'
                  ? t('game.unitTurret', { n: selected.level })
                  : t('game.unitCollector', { n: selected.level })}
              </p>
              <p className="text-label text-muted">
                {selected.kind === 'turret'
                  ? t('game.turretStats', {
                      damage: selected.damage ?? 0,
                      range: selected.range ?? 0,
                    })
                  : t('game.collectorStats', { power: selected.power ?? 0 })}
                {' · '}
                {selected.isMax
                  ? t('game.levelMax')
                  : selected.mergeAvailable
                    ? t('game.mergeTip')
                    : t('game.mergeNone')}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => game.cancelMode()}
            >
              {t('game.close')}
            </Button>
          </Card>
        ) : snap.mode === 'place' ? (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto"
              onClick={() => game.cancelMode()}
            >
              {t('game.cancel')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto flex-1 flex-col gap-0 px-2"
              disabled={!snap.afford.collector}
              onClick={() => game.buyCollector()}
            >
              {t('game.collector')}
              <CostLabel cost={snap.costs.collector} icons={icons} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto flex-1 flex-col gap-0 px-2"
              disabled={!snap.afford.turret}
              onClick={() => game.startPlacing('turret')}
            >
              {t('game.turret')}
              <CostLabel cost={snap.costs.turret} icons={icons} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto flex-1 flex-col gap-0 px-2"
              disabled={!snap.afford.tools}
              onClick={() => game.buyTools()}
            >
              {t('game.toolsLevel', { n: snap.toolLevel + 1 })}
              <CostLabel cost={snap.costs.tools} icons={icons} />
            </Button>
          </div>
        )}
      </div>

      {/* Fim de jogo. */}
      {snap.phase !== 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-scrim/70 px-gutter">
          <Card
            bordered
            padding="md"
            className="flex w-full max-w-xs flex-col gap-3 text-center"
            role="dialog"
            aria-modal
          >
            <PixelIcon
              src={snap.phase === 'won' ? icons.core : icons.skull}
              className="mx-auto h-8 w-8"
            />
            <h2 className="text-display font-extrabold">
              {snap.phase === 'won' ? t('game.wonTitle') : t('game.lostTitle')}
            </h2>
            <p className="text-body text-muted">
              {snap.phase === 'won'
                ? t('game.wonBody', { waves: h.total })
                : t('game.lostBody')}
            </p>
            <p className="text-label text-muted">
              {t('game.statsTaps', { n: snap.stats.taps })} ·{' '}
              {t('game.statsCollected', {
                bio: snap.stats.biomass,
                ore: snap.stats.ore,
              })}
              <br />
              {t('game.statsMerges', {
                n: snap.stats.merges,
                k: snap.stats.kills,
              })}
            </p>
            <Button fullWidth onClick={onRestart}>
              {t('game.restart')}
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}
