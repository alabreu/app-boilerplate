/**
 * Config do cliente de LLM. Os limites espelham os da Edge Function
 * (supabase/functions/llm/index.ts) para falhar rápido, sem gastar rede — a
 * validação que VALE é sempre a do servidor.
 */
export const LLM = {
  /**
   * Modelo usado no modo BYOK (chave do próprio usuário). No modo proxy quem
   * decide é o servidor — o `model` mandado pelo cliente é ignorado lá.
   */
  byokModel: 'anthropic/claude-opus-5',
  maxTokens: 1024,
  maxMessages: 30,
  maxCharsPerMessage: 8000,
  maxCharsTotal: 24000,
} as const

/** Caminho da Edge Function do proxy, relativo à URL do Supabase. */
export const LLM_PROXY_PATH = '/functions/v1/llm'

/** Endpoint do OpenRouter usado APENAS no modo BYOK (chave do usuário). */
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
