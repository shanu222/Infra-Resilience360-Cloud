const truthyEnv = (value, fallback = 'true') =>
  ['1', 'true', 'yes', 'on'].includes(String(value ?? fallback).trim().toLowerCase())

const splitCsv = (value) =>
  String(value ?? '')
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const unique = (items) => items.filter((item, index, all) => all.indexOf(item) === index)

export const AI_UNAVAILABLE_MESSAGE =
  'AI service is temporarily unavailable. Please try again later.'

export const AI_PROVIDER_ORDER = splitCsv(process.env.AI_PROVIDER_ORDER || 'openai,gemini,openrouter').map((item) =>
  item.toLowerCase(),
)
export const AI_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.AI_TIMEOUT_MS ?? process.env.AI_CHAT_TIMEOUT_MS ?? 45_000) || 45_000,
)
export const AI_MAX_RETRIES = Math.max(1, Number(process.env.AI_MAX_RETRIES ?? 3) || 3)
export const AI_FALLBACK_ENABLED = truthyEnv(process.env.AI_FALLBACK_ENABLED, 'true')
export const AI_PARALLEL_FALLBACK = truthyEnv(process.env.AI_PARALLEL_FALLBACK, 'false')
export const AI_PARALLEL_STAGGER_MS = Math.max(0, Number(process.env.AI_PARALLEL_STAGGER_MS ?? 8_000) || 8_000)
export const AI_CACHE_ENABLED = truthyEnv(process.env.AI_CACHE_ENABLED, 'true')
export const AI_CACHE_TTL = Math.max(10, Number(process.env.AI_CACHE_TTL ?? 3_600) || 3_600)
export const AI_LOG_LEVEL = String(process.env.AI_LOG_LEVEL ?? 'info').trim().toLowerCase()
export const AI_CIRCUIT_BREAKER_THRESHOLD = Math.max(
  1,
  Number(process.env.AI_CIRCUIT_BREAKER_THRESHOLD ?? 3) || 3,
)
export const AI_CIRCUIT_BREAKER_COOLDOWN_MS = Math.max(
  30_000,
  Number(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS ?? 10 * 60 * 1000) || 10 * 60 * 1000,
)

export const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY ?? '').trim()
export const OPENAI_MODEL = String(process.env.OPENAI_MODEL ?? 'gpt-4.1').trim()
export const OPENAI_FALLBACK_MODEL = String(process.env.OPENAI_FALLBACK_MODEL ?? 'gpt-4.1-mini').trim()
export const OPENAI_SECONDARY_MODEL = String(process.env.OPENAI_SECONDARY_MODEL ?? 'gpt-4o-mini').trim()
export const OPENAI_TEXT_MODELS = unique(
  splitCsv(process.env.OPENAI_TEXT_MODELS || `${OPENAI_MODEL},${OPENAI_FALLBACK_MODEL},${OPENAI_SECONDARY_MODEL}`),
)
export const OPENAI_VISION_MODEL = String(process.env.OPENAI_VISION_MODEL ?? OPENAI_MODEL).trim()
export const OPENAI_VISION_FALLBACK_MODELS = unique(
  splitCsv(
    process.env.OPENAI_VISION_FALLBACK_MODELS ||
      `${OPENAI_VISION_MODEL},${OPENAI_FALLBACK_MODEL},${OPENAI_SECONDARY_MODEL}`,
  ).filter((value) => value !== OPENAI_VISION_MODEL),
)
export const OPENAI_CODING_MODELS = unique(
  splitCsv(process.env.OPENAI_CODING_MODELS || `${OPENAI_MODEL},${OPENAI_FALLBACK_MODEL},${OPENAI_SECONDARY_MODEL}`),
)

export const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY ?? '').trim()
export const GEMINI_MODEL = String(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim()
export const GEMINI_FALLBACK_MODEL = String(process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-2.5-flash-lite').trim()
export const GEMINI_SECONDARY_MODEL = String(process.env.GEMINI_SECONDARY_MODEL ?? 'gemini-2.0-flash').trim()
export const GEMINI_TEXT_MODELS = unique(
  splitCsv(process.env.GEMINI_TEXT_MODELS || `${GEMINI_MODEL},${GEMINI_FALLBACK_MODEL},${GEMINI_SECONDARY_MODEL}`),
)
export const GEMINI_VISION_MODELS = unique(
  splitCsv(process.env.GEMINI_VISION_MODELS || `${GEMINI_MODEL},${GEMINI_FALLBACK_MODEL},${GEMINI_SECONDARY_MODEL}`),
)
export const GEMINI_CODING_MODELS = unique(
  splitCsv(process.env.GEMINI_CODING_MODELS || `${GEMINI_MODEL},${GEMINI_FALLBACK_MODEL},${GEMINI_SECONDARY_MODEL}`),
)

export const OPENROUTER_API_KEY = String(process.env.OPENROUTER_API_KEY ?? '').trim()
export const OPENROUTER_BASE_URL = String(process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1')
  .trim()
  .replace(/\/+$/, '')
export const OPENROUTER_SITE_URL = String(process.env.OPENROUTER_SITE_URL ?? '').trim()
export const OPENROUTER_SITE_NAME = String(process.env.OPENROUTER_SITE_NAME ?? 'Resilience360').trim()
export const OPENROUTER_MODELS = unique(
  splitCsv(
    process.env.OPENROUTER_MODELS ||
      'google/gemma-4-31b-it,meta-llama/llama-3.3-70b-instruct,google/gemma-4-26b-a4b-it,nousresearch/hermes-3-405b,qwen/qwen3-coder-480b-a35b',
  ),
)
export const OPENROUTER_VISION_MODELS = unique(
  splitCsv(process.env.OPENROUTER_VISION_MODELS || 'google/gemma-4-31b-it,google/gemma-4-26b-a4b-it'),
)
export const OPENROUTER_CODING_MODELS = unique(
  splitCsv(process.env.OPENROUTER_CODING_MODELS || 'qwen/qwen3-coder-480b-a35b,nousresearch/hermes-3-405b'),
)

export const TASK_TYPE = {
  CHAT: 'chat',
  CODING: 'coding',
  VISION: 'vision',
}

export function isAnyAiProviderConfigured() {
  return Boolean(OPENAI_API_KEY || GEMINI_API_KEY || OPENROUTER_API_KEY)
}

export function isOpenAiConfigured() {
  const key = OPENAI_API_KEY.replace(/^['"]|['"]$/g, '')
  return Boolean(key && !/^sk-your|your-api-key|replace-with/i.test(key))
}
