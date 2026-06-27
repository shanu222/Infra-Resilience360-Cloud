const truthyEnv = (value, fallback = 'true') =>
  ['1', 'true', 'yes'].includes(String(value ?? fallback).trim().toLowerCase())

export const AI_UNAVAILABLE_MESSAGE =
  'AI service is temporarily unavailable. Please try again later.'

export const AI_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.AI_TIMEOUT_MS ?? process.env.AI_CHAT_TIMEOUT_MS ?? 45_000) || 45_000,
)

export const AI_MAX_RETRIES = Math.max(1, Number(process.env.AI_MAX_RETRIES ?? 3) || 3)

export const AI_FALLBACK_ENABLED = truthyEnv(process.env.AI_FALLBACK_ENABLED, 'true')

export const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY ?? '').trim()
export const OPENAI_MODEL = String(process.env.OPENAI_MODEL ?? process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1').trim()
export const OPENAI_VISION_MODEL = String(process.env.OPENAI_VISION_MODEL ?? OPENAI_MODEL ?? 'gpt-4o-mini').trim()
export const OPENAI_VISION_FALLBACK_MODELS = String(
  process.env.OPENAI_VISION_FALLBACK_MODELS ?? 'gpt-4o-mini,gpt-4.1-mini,gpt-4o',
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((value, index, all) => all.indexOf(value) === index && value !== OPENAI_VISION_MODEL)

export const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY ?? '').trim()
export const GEMINI_MODEL = String(process.env.GEMINI_MODEL ?? 'gemini-1.5-flash').trim()
export const GEMINI_VISION_MODEL = String(process.env.GEMINI_VISION_MODEL ?? GEMINI_MODEL).trim()

export const OPENROUTER_API_KEY = String(process.env.OPENROUTER_API_KEY ?? '').trim()
export const OPENROUTER_BASE_URL = String(process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1')
  .trim()
  .replace(/\/+$/, '')
export const OPENROUTER_SITE_URL = String(process.env.OPENROUTER_SITE_URL ?? '').trim()
export const OPENROUTER_SITE_NAME = String(process.env.OPENROUTER_SITE_NAME ?? 'Resilience360').trim()

export const DEFAULT_OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nousresearch/hermes-3-405b:free',
  'qwen/qwen3-coder-480b-a35b:free',
]

export const OPENROUTER_MODELS = String(process.env.OPENROUTER_MODELS ?? '')
  .split(/[,;\n]+/)
  .map((value) => value.trim())
  .filter(Boolean)

export const OPENROUTER_MODEL_CANDIDATES =
  OPENROUTER_MODELS.length > 0 ? OPENROUTER_MODELS : DEFAULT_OPENROUTER_MODELS

export const AI_PROVIDER_ORDER = String(process.env.AI_PROVIDER_ORDER ?? 'openai,gemini,openrouter')
  .split(/[,;\s]+/)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

export function isAnyAiProviderConfigured() {
  return Boolean(OPENAI_API_KEY || GEMINI_API_KEY || OPENROUTER_API_KEY)
}

export function isOpenAiConfigured() {
  const key = OPENAI_API_KEY.replace(/^['"]|['"]$/g, '')
  return Boolean(key && !/^sk-your|your-api-key|replace-with/i.test(key))
}
