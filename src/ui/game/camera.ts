import { MAP_SIZE } from '@core/game/balance'

export const TILE = 16
/** Quantos tiles queremos ver na largura: a colônia (8) + um pouco de névoa
 *  de cada lado, para a exploração se anunciar sem precisar arrastar. No
 *  iPhone isso dá ~37px CSS por tile — um pouco abaixo dos 44pt, mas o alvo
 *  de toque é o tile inteiro e os elementos ocupam quase tudo dele. */
const TILES_ACROSS = 10
/** Margem visível além do mapa, em tiles (para a borda aparecer). */
const MARGIN_TILES = 1.5

/**
 * Câmera em pixels de MUNDO (1 unidade = 1 pixel de sprite). O canvas desenha
 * nessa resolução e é ampliado por um fator inteiro em pixels de DISPOSITIVO:
 * é o que mantém cada pixel da arte nítido e igual ao vizinho.
 */
export class Camera {
  x = 0
  y = 0
  /** Fator inteiro: pixels de dispositivo por pixel de mundo. */
  deviceScale = 3
  dpr = 1
  /** Tamanho da área visível em pixels de mundo. */
  viewW = 0
  viewH = 0

  resize(
    cssW: number,
    cssH: number,
    dpr: number,
  ): { backingW: number; backingH: number } {
    this.dpr = dpr
    this.deviceScale = Math.max(
      2,
      Math.round((cssW * dpr) / (TILES_ACROSS * TILE)),
    )
    this.viewW = Math.ceil((cssW * dpr) / this.deviceScale)
    this.viewH = Math.ceil((cssH * dpr) / this.deviceScale)
    this.clamp()
    return {
      backingW: this.viewW * this.deviceScale,
      backingH: this.viewH * this.deviceScale,
    }
  }

  /** Quantos px CSS tem um pixel de mundo. */
  get cssPerWorld(): number {
    return this.deviceScale / this.dpr
  }

  centerOnTile(tx: number, ty: number): void {
    this.x = tx * TILE - this.viewW / 2
    this.y = ty * TILE - this.viewH / 2
    this.clamp()
  }

  panByCss(dxCss: number, dyCss: number): void {
    this.x -= dxCss / this.cssPerWorld
    this.y -= dyCss / this.cssPerWorld
    this.clamp()
  }

  /** CSS px (relativo ao canvas) → coordenadas de tile (float). */
  cssToTile(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (this.x + sx / this.cssPerWorld) / TILE,
      y: (this.y + sy / this.cssPerWorld) / TILE,
    }
  }

  clamp(): void {
    const worldPx = MAP_SIZE * TILE
    const margin = MARGIN_TILES * TILE
    const minX = -margin
    const maxX = worldPx + margin - this.viewW
    const minY = -margin
    const maxY = worldPx + margin - this.viewH
    this.x =
      maxX < minX ? (minX + maxX) / 2 : Math.min(maxX, Math.max(minX, this.x))
    this.y =
      maxY < minY ? (minY + maxY) / 2 : Math.min(maxY, Math.max(minY, this.y))
  }
}
