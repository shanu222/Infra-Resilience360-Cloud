import OpenAI from 'openai'

const normalizeKey = (raw) => String(raw ?? '').trim().replace(/^['"]|['"]$/g, '')

export function assertOpenAiKeyConfigured() {
  const key = normalizeKey(process.env.OPENAI_API_KEY)
  if (!key || /^sk-your|your-api-key|replace-with/i.test(key)) {
    throw new Error('OPENAI_API_KEY is missing.')
  }
}

export async function openaiChatCompletionText({
  messages,
  model = String(process.env.OPENAI_MODEL ?? 'gpt-4.1').trim(),
  temperature = 0.2,
  timeoutMs = 45_000,
  responseFormatJsonObject = false,
  onRotatedKey,
}) {
  assertOpenAiKeyConfigured()
  const apiKey = normalizeKey(process.env.OPENAI_API_KEY)
  const client = new OpenAI({ apiKey })
  if (typeof onRotatedKey === 'function') {
    onRotatedKey(apiKey)
  }
  try {
    const completion = await Promise.race([
      client.chat.completions.create({
        model,
        temperature,
        messages,
        ...(responseFormatJsonObject ? { response_format: { type: 'json_object' } } : {}),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI request timeout')), timeoutMs)),
    ])
    const text = completion?.choices?.[0]?.message?.content ?? ''
    if (!String(text).trim()) {
      throw new Error('OpenAI returned an empty response.')
    }
    return text
  } catch (error) {
    const status = error?.status ?? error?.response?.status
    const code = error?.code ?? error?.error?.code
    const message = error instanceof Error ? error.message : String(error ?? 'OpenAI request failed')
    const wrapped = new Error(message)
    if (status != null) wrapped.status = status
    if (code != null) wrapped.code = code
    throw wrapped
  }
}
