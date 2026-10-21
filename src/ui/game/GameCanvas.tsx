import { useEffect, useRef } from 'react'
import type { Game } from '@core/game/game'
import { CORE_TILE } from '@core/game/map'
import { Camera } from './camera'
import { attachInput } from './input'
import { Renderer } from './renderer'
import { snapshot, type HudSnapshot } from './snapshot'

const HUD_SYNC_MS = 100

interface GameCanvasProps {
  game: Game
  onSnapshot: (snap: HudSnapshot) => void
  label: string
}

/**
 * O canvas do mundo: loop de simulação + desenho, redimensionamento por
 * ResizeObserver e entrada (toque/arrasto/mouse). Recebe o `Game` pronto e
 * só avisa o HUD, por `onSnapshot`, quando algo relevante muda.
 */
export function GameCanvas({ game, onSnapshot, label }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onSnapshotRef = useRef(onSnapshot)
  useEffect(() => {
    onSnapshotRef.current = onSnapshot
  }, [onSnapshot])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const el = canvas
    const cam = new Camera()
    const renderer = new Renderer(canvas)
    const parent = canvas.parentElement!

    function resize() {
      const rect = parent.getBoundingClientRect()
      const { backingW, backingH } = cam.resize(
        rect.width,
        rect.height,
        window.devicePixelRatio || 1,
      )
      el.width = backingW
      el.height = backingH
      el.style.width = `${backingW / cam.dpr}px`
      el.style.height = `${backingH / cam.dpr}px`
    }
    resize()
    cam.centerOnTile(CORE_TILE.x + 1, CORE_TILE.y + 1.5)
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    // `?debug` expõe jogo e câmera para scripts de teste (capturas, Playwright).
    if (window.location.search.includes('debug')) {
      ;(window as unknown as { __fissura: unknown }).__fissura = { game, cam }
    }

    const detach = attachInput(canvas, {
      onTap: (sx, sy) => {
        const { x, y } = cam.cssToTile(sx, sy)
        game.tapAt(x, y)
      },
      onPan: (dx, dy) => cam.panByCss(dx, dy),
    })

    let raf = 0
    let last = performance.now()
    let lastSync = 0
    let lastKey = ''
    function frame(now: number) {
      // O timestamp do rAF pode vir antes do performance.now() da montagem: nunca negativo.
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000))
      last = now
      game.tick(dt)
      renderer.draw(game, cam, dt)
      if (now - lastSync > HUD_SYNC_MS) {
        lastSync = now
        const snap = snapshot(game)
        const key = JSON.stringify(snap)
        if (key !== lastKey) {
          lastKey = key
          onSnapshotRef.current(snap)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      detach()
    }
  }, [game])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="block touch-none select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
