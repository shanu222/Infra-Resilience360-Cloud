import '../backend/loadEnv.mjs'
import OpenAI from 'openai'

const key = String(process.env.OPENAI_API_KEY ?? '').trim()
if (!key) {
  console.log('OpenAI configured: NO')
  process.exit(1)
}
console.log('OpenAI configured: YES')
console.log('Model:', process.env.OPENAI_MODEL ?? 'gpt-4.1')

const client = new OpenAI({ apiKey: key })
const model = String(process.env.OPENAI_MODEL ?? 'gpt-4.1').trim()

try {
  console.log('Sending test request to OpenAI...')
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [
      { role: 'user', content: 'Reply with JSON only: {"ok":true,"message":"hello"}' },
    ],
    response_format: { type: 'json_object' },
  })
  console.log('OpenAI response received.')
  console.log('Content preview:', String(completion.choices[0]?.message?.content ?? '').slice(0, 120))
} catch (error) {
  const status = error?.status ?? error?.response?.status
  const code = error?.code ?? error?.error?.code
  const message = error?.message ?? String(error)
  console.error('OpenAI error:', { status, code, message: message.slice(0, 300) })
  process.exit(2)
}
