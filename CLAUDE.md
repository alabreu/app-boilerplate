# app-boilerplate

Template de partida para apps novos (React + Vite + TS + Tailwind v4 +
Supabase + Vercel). Extraído dos padrões do Tutor Brew
(`alabreu/alabreu.github.io`, pasta `mtg-deck-builder/`) e do Komme
(`alabreu/mesa-app`). Detalhes de uso e setup: `README.md`.

## O que já vem pronto (não reimplementar)

- i18n pt/en tipado: `core/i18n` + `useTranslation()`. Toda string de UI entra
  em `core/i18n/pt.ts` (fonte da verdade) e `en.ts` (o tipo força paridade).
- Feedback: `core/feedback/submit.ts` → tabela `feedback` (insert-only RLS) ou
  fallback `mailto:` sem backend.
- Changelog: `core/changelog.ts` (entradas bilíngues, mais novo primeiro) com
  badge de não lido. Ao lançar feature relevante, adicionar entrada no TOPO.
- Auth guest-first: `core/auth/client.ts` (email+senha e Google via Supabase),
  UI só enxerga `AuthUser`. Sem env vars o app roda 100% local — preservar isso.
- Doações: `core/donate.ts` + `ui/screens/DonateScreen.tsx` — Stripe Payment
  Link via `VITE_STRIPE_DONATE_URL` (URL pública, sem secret). O item do menu
  só aparece configurado. Upgrade para Checkout dinâmico: ver README.
- Menu do topo direito: `ui/components/MenuSheet.tsx` — itens específicos do
  app entram no array `ITEMS`. Rodapé mostra versão + sha + hora do build
  (`VersionLabel`); 5 toques abrem o `/admin`.
- Painel de admin: `/admin` (lazy, sem link na UI), KPIs via RPCs
  `admin_metrics()`/`admin_feedback()` (security definer, allowlist
  `public.admins`). Eventos de uso: `core/analytics.ts` (`track()`,
  insert-only em `analytics_events`); o shell registra `session_start`.
- LLM via OpenRouter: `core/llm/client.ts` — `streamChat()` com dois modos
  atrás da mesma interface (proxy pela Edge Function `llm`, ou BYOK com a chave
  do próprio usuário), precedência resolvida em runtime. A chave do operador é
  secret do servidor; NUNCA criar `VITE_OPENROUTER_API_KEY`. Cota atômica com
  limite por usuário + global na migração `0003`. Sem UI de chat de propósito.
- Design system: tokens no `@theme` de `src/index.css` (cor, raio, espaçamento,
  tipografia — nomeados por papel) + primitivos em `src/ui/design/` (`Button`,
  `IconButton`, `Card`, `Chip`, `Field`/`Input`/`Textarea`, `SectionTitle`,
  `Screen`/`ScreenBody`, `Sheet`). Vitrine viva em `/design` (lazy, sem link).
- PWA + toast de atualização (`vite-plugin-pwa` modo prompt).

## Regras

- Acessibilidade: toda feature nova segue `ACCESSIBILITY.md` (contraste AA,
  teclado, leitor de tela, reduced motion — tem checklist no fim). Para painel
  modal, use o `Sheet` de `@ui/design` (Escape, trap e retorno de foco,
  `invisible` quando fechado) — não reimplemente. Nunca desabilitar zoom no
  viewport nem remover o `:focus-visible` global.

- Design system: UI nova COMPÕE os primitivos de `@ui/design`; tokens do
  `@theme` no lugar de valores crus (`text-body` e não `text-sm`,
  `rounded-card` e não `rounded-2xl`, `px-gutter` e não `px-4`). Classe crua do
  Tailwind só para layout local (flex, grid, gap) ou quando o caso realmente não
  existe — e aí a variante entra no primitivo, com comentário do porquê, em vez
  de ficar solta na tela. Ao criar um primitivo novo, exporte-o no
  `design/index.ts` e mostre-o em `/design`.
  Exceção única de i18n: `DesignScreen` é ferramenta de dev e mantém strings
  inline — traduzir rótulo de vitrine só poluiria a tabela de mensagens.

- Arquitetura "cérebro vs pele": nada em `src/core/` importa de `src/ui/` nem
  usa DOM. Aliases `@core/*`, `@ui/*`, `@app/*`.
- Todo acesso a backend passa por `core/backend/client.ts` (costura única —
  preparação para eventual migração AWS; ver README).
- Idioma da UI: português como default; toda string nova nasce nos dois idiomas.
- Sempre rodar `npm run lint`, `npm test` e `npm run build` antes de commitar.
- Segurança: seguir `SECURITY.md` (RLS na mesma migração, validação no banco,
  secrets nunca no código, host novo de API entra no `connect-src` da CSP do
  `vercel.json`). Lógica nova de `core/` ganha teste `*.test.ts` ao lado.
- Migrações em `supabase/migrations/`, numeradas, rodadas à mão no SQL Editor.
  Tabela nova = RLS habilitado + policies na mesma migração.
- NUNCA commitar service_role key ou qualquer secret (anon key pode).

## Ao criar um app novo a partir do template

Seguir o checklist de renomeação do README (config.ts, vite.config.ts,
index.html, package.json, paleta, ícones, changelog inicial).
