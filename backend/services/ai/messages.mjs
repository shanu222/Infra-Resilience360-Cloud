export function buildGeminiPartsFromOpenAiContent(content) {
  if (typeof content === 'string') {
    return [{ text: content }]
  }
  if (Array.isArray(content)) {
    const parts = []
    for (const block of content) {
      if (block?.type === 'text' && block.text) {
        parts.push({ text: block.text })
      } else if (block?.type === 'image_url' && block.image_url?.url) {
        const url = String(block.image_url.url)
        const dataMatch = url.match(/^data:([^;]+);base64,(.+)$/)
        if (!dataMatch) {
          throw new Error('Gemini image input requires a data: URL with base64 content')
        }
        const mimeType = dataMatch[1] || 'image/jpeg'
        const data = dataMatch[2]
        parts.push({ inlineData: { mimeType, data } })
      }
    }
    if (parts.length === 0) {
      throw new Error('No usable content parts for Gemini')
    }
    return parts
  }
  throw new Error('Unsupported message content for Gemini')
}

export function messagesToGeminiParams(messages) {
  const systemTexts = []
  const contents = []
  for (const msg of messages) {
    if (msg.role === 'system') {
      if (typeof msg.content === 'string') {
        systemTexts.push(msg.content)
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block?.type === 'text' && block.text) {
            systemTexts.push(block.text)
          }
        }
      }
      continue
    }
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const parts = buildGeminiPartsFromOpenAiContent(msg.content)
    contents.push({ role, parts })
  }
  const systemInstruction = systemTexts.length > 0 ? systemTexts.join('\n\n') : undefined
  return { systemInstruction, contents }
}

export function normalizeMessages(input) {
  if (typeof input === 'string') return [{ role: 'user', content: input }]
  if (Array.isArray(input)) return input
  throw new Error('Messages must be a string or non-empty array')
}

export function extractUsageTokens(completion) {
  const usage = completion?.usage ?? completion?.response?.usageMetadata ?? null
  if (!usage) return null
  const prompt = Number(usage.prompt_tokens ?? usage.promptTokenCount ?? 0)
  const completionTokens = Number(usage.completion_tokens ?? usage.candidatesTokenCount ?? 0)
  const total = Number(usage.total_tokens ?? usage.totalTokenCount ?? prompt + completionTokens)
  return { prompt, completion: completionTokens, total }
}
