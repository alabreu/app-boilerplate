/**
 * Toque × arrasto sem conflito: um ponteiro que anda menos que DRAG_PX até
 * soltar é toque; passou disso, vira arrasto da câmera (e não dispara toque ao
 * soltar). Funciona igual para dedo e mouse (Pointer Events).
 */
const DRAG_PX = 8

export interface InputHandlers {
  onTap: (cssX: number, cssY: number) => void
  onPan: (dxCss: number, dyCss: number) => void
}

export function attachInput(
  el: HTMLElement,
  handlers: InputHandlers,
): () => void {
  let active: number | null = null
  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0
  let dragging = false

  function down(e: PointerEvent) {
    if (active !== null) return
    active = e.pointerId
    startX = lastX = e.clientX
    startY = lastY = e.clientY
    dragging = false
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // Eventos sintéticos (testes) não têm ponteiro ativo; o arrasto ainda funciona.
    }
  }

  function move(e: PointerEvent) {
    if (e.pointerId !== active) return
    if (
      !dragging &&
      Math.hypot(e.clientX - startX, e.clientY - startY) > DRAG_PX
    ) {
      dragging = true
    }
    if (dragging) {
      handlers.onPan(e.clientX - lastX, e.clientY - lastY)
    }
    lastX = e.clientX
    lastY = e.clientY
  }

  function up(e: PointerEvent) {
    if (e.pointerId !== active) return
    active = null
    if (!dragging) {
      const r = el.getBoundingClientRect()
      handlers.onTap(e.clientX - r.left, e.clientY - r.top)
    }
    dragging = false
  }

  function cancel(e: PointerEvent) {
    if (e.pointerId !== active) return
    active = null
    dragging = false
  }

  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', cancel)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', cancel)
  }
}
