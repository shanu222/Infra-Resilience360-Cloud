/**
 * Verify AI credentials from project `.env` (never prints secrets).
 * Usage: `node scripts/check-ai-key.mjs`
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(root, '.env'), quiet: true })
dotenv.config({ quiet: true })

const provider = String(process.env.AI_PROVIDER ?? 'openai').toLowerCase()
const openaiKey = String(process.env.OPENAI_API_KEY ?? '').trim()
const hfKey = String(process.env.HUGGINGFACE_API_KEY ?? '').trim()
const hfBase = String(process.env.HUGGINGFACE_BASE_URL ?? 'https://router.huggingface.co/v1').replace(/\/+$/, '')
const model = String(process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim() || 'gpt-4o-mini'

function summarizeOpenAiError(bodyText) {
  try {
    const j = JSON.parse(bodyText)
    const err = j?.error
    if (err && typeof err === 'object') {
      return {
        type: err.type ?? null,
        code: err.code ?? null,
        message: String(err.message ?? '').slice(0, 500),
      }
    }
  } catch {
    /* ignore */
  }
  return { rawPreview: bodyText.slice(0, 400) }
}

async function checkOpenAI() {
  if (!openaiKey) {
    console.log(JSON.stringify({ ok: false, reason: 'OPENAI_API_KEY not set or empty in environment / .env' }, null, 2))
    return
  }
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 4,
    }),
  })
  const text = await r.text()
  const out = {
    provider: 'openai',
    modelTried: model,
    httpStatus: r.status,
    keyPresent: true,
  }
  if (r.status === 200) {
    out.verdict = 'Key works; chat completion succeeded.'
    console.log(JSON.stringify(out, null, 2))
    return
  }
  if (r.status === 401) {
    out.verdict = 'Authentication failed — invalid or revoked key, or wrong org/project.'
    out.details = summarizeOpenAiError(text)
    console.log(JSON.stringify(out, null, 2))
    return
  }
  if (r.status === 429) {
    out.verdict = 'Rate limited (429) — slow down, or org/account quota.'
    out.details = summarizeOpenAiError(text)
    console.log(JSON.stringify(out, null, 2))
    return
  }
  if (r.status === 402 || /insufficient_quota|billing|credit/i.test(text)) {
    out.verdict = 'Billing / quota issue — add credits or raise limits.'
    out.details = summarizeOpenAiError(text)
    console.log(JSON.stringify(out, null, 2))
    return
  }
  out.verdict = 'Non-200 response; see details.'
  out.details = summarizeOpenAiError(text)
  console.log(JSON.stringify(out, null, 2))
}

async function checkHuggingFace() {
  if (!hfKey) {
    console.log(JSON.stringify({ ok: false, reason: 'HUGGINGFACE_API_KEY not set or empty' }, null, 2))
    return
  }
  const r = await fetch(`${hfBase}/models`, {
    headers: { Authorization: `Bearer ${hfKey}` },
  })
  const text = await r.text()
  const out = {
    provider: 'huggingface',
    baseUrl: hfBase,
    httpStatus: r.status,
    keyPresent: true,
  }
  if (r.ok) {
    out.verdict = 'Key accepted by Hugging Face router.'
    console.log(JSON.stringify(out, null, 2))
    return
  }
  out.verdict = r.status === 401 ? 'HF authentication failed.' : 'HF router error.'
  out.details = text.slice(0, 400)
  console.log(JSON.stringify(out, null, 2))
}

if (provider === 'huggingface') {
  await checkHuggingFace()
} else {
  await checkOpenAI()
}
