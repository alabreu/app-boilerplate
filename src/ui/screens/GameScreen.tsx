import { useCallback, useState } from 'react'
import { User } from '@phosphor-icons/react'
import { getUnreadCount } from '@core/changelog'
import { Game } from '@core/game/game'
import { IconButton } from '@ui/design'
import { MenuSheet } from '@ui/components/MenuSheet'
import { GameCanvas } from '@ui/game/GameCanvas'
import { GameHud } from '@ui/game/GameHud'
import { snapshot, type HudSnapshot } from '@ui/game/snapshot'
import { useAuth } from '@ui/hooks/useAuth'
import { useTranslation } from '@ui/hooks/useTranslation'

/**
 * A tela do jogo: canvas ocupando tudo, HUD por cima e o botão de menu do
 * template no canto superior direito (feedback, idioma, novidades, login).
 */
export function GameScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread] = useState(() => getUnreadCount())
  const [game, setGame] = useState(() => new Game(7))
  const [snap, setSnap] = useState<HudSnapshot>(() => snapshot(game))

  const restart = useCallback(() => {
    const next = game.restart()
    setGame(next)
    setSnap(snapshot(next))
  }, [game])

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <GameCanvas
        game={game}
        onSnapshot={setSnap}
        label={t('game.canvasLabel')}
      />
      <GameHud game={game} snap={snap} onRestart={restart} />
      <div className="absolute right-0 top-0 pr-gutter pt-2">
        <IconButton
          aria-label={
            unread > 0 ? t('home.menuButtonUnread') : t('home.menuButton')
          }
          onClick={() => setMenuOpen(true)}
          className="relative"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full rounded-control object-cover"
            />
          ) : (
            <User size={20} weight="bold" />
          )}
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-control bg-accent ring-2 ring-bg"
            />
          )}
        </IconButton>
      </div>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
