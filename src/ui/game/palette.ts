/**
 * Paleta da pixel art. Uma letra por cor: os sprites em sprites.ts são
 * desenhados como texto, e cada letra vira um pixel desta cor. Mantém a
 * paleta curta de propósito — é o que faz terreno, recurso, aliado e inimigo
 * se separarem de longe num celular.
 */
export const PAL: Record<string, string> = {
  '0': '#121018', // contorno
  '1': '#241f2b', // sombra
  k: '#3b3340', // cinza-roxo escuro
  K: '#4d4458', // cinza-roxo
  g: '#235c2a', // verde escuro
  G: '#3f8f3a', // verde
  l: '#6fc24a', // verde claro
  L: '#a7e35b', // lima
  b: '#4a3322', // madeira escura
  B: '#8a6240', // madeira
  w: '#c9a070', // bege
  s: '#5b6270', // pedra escura
  S: '#8a93a3', // pedra
  W: '#b9c1cc', // pedra clara
  y: '#f2b134', // âmbar (minério)
  Y: '#fff2a8', // amarelo pálido
  o: '#ea7b2c', // laranja (macacão)
  r: '#b7472a', // ferrugem
  R: '#d8365f', // vermelho-magenta (criaturas)
  d: '#8c1e3c', // vermelho escuro
  p: '#f3c2a0', // carne pálida
  P: '#c94f8c', // rosa (fungo)
  m: '#7a4a8a', // roxo (fungo)
  c: '#3dd6c4', // ciano (robôs)
  C: '#1e9c8f', // teal
  t: '#4b5563', // aço
  T: '#6b7280', // aço claro
  h: '#e8b89d', // pele
  e: '#c6ff4a', // olho ácido
  f: '#f4f4f0', // branco
  n: '#2f3a3d', // névoa escura
  N: '#3d4a4e', // névoa
  M: '#4a5a5c', // névoa clara
  v: '#0f0d14', // vazio além do mapa
  a: '#6e4c8c', // violeta (ninho da fissura)
  i: '#8be04a', // ícone biomassa
}

export const UI_COLORS = {
  biomass: '#8be04a',
  ore: '#f2b134',
  hit: '#fff2a8',
  alert: '#ff5c7a',
  select: '#3dd6c4',
  valid: '#8be04a',
  invalid: '#ff5c7a',
  fogDither: '#2f3a3d',
}
