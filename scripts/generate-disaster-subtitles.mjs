import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const guidanceRoot = path.join(rootDir, 'Disaster Dashboard UX Flow', 'view guidance')

const parseArgs = () => {
  const args = process.argv.slice(2)
  const options = {
    disaster: null,
    force: false,
    all: false
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--disaster' && args[i + 1]) {
      options.disaster = args[i + 1]
      i += 1
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--all') {
      options.all = true
    }
  }

  return options
}

const formatTimestamp = (secondsInput) => {
  const seconds = Math.max(0, Number(secondsInput) || 0)
  const whole = Math.floor(seconds)
  const milliseconds = Math.round((seconds - whole) * 1000)
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const secs = whole % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const mmm = String(milliseconds).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${mmm}`
}

const parseVtt = (vttText) => {
  const lines = vttText.replace(/\r/g, '').split('\n')
  const cues = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line || line === 'WEBVTT') {
      i += 1
      continue
    }

    const timeLineIndex = line.includes('-->') ? i : i + 1
    const timeLine = lines[timeLineIndex]?.trim()
    if (!timeLine || !timeLine.includes('-->')) {
      i += 1
      continue
    }

    const [start, end] = timeLine.split('-->').map((value) => value.trim())
    i = timeLineIndex + 1
    const textLines = []

    while (i < lines.length && lines[i].trim()) {
      textLines.push(lines[i])
      i += 1
    }

    if (textLines.length) {
      cues.push({
        start,
        end,
        text: textLines.join('\n').trim()
      })
    }

    i += 1
  }

  return cues
}

const toVtt = (cues) => {
  const body = cues
    .map((cue) => `${cue.start} --> ${cue.end}\n${cue.text}`)
    .join('\n\n')

  return `WEBVTT\n\n${body}\n`
}

const extractAudio = (videoPath, outputWavPath) => {
  const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  if (ffmpegCheck.status !== 0) {
    throw new Error('ffmpeg is required but was not found in PATH.')
  }

  const extract = spawnSync(
    'ffmpeg',
    ['-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', outputWavPath],
    { stdio: 'inherit' }
  )

  if (extract.status !== 0 || !existsSync(outputWavPath)) {
    throw new Error(`Failed to extract audio from ${videoPath}`)
  }

  return outputWavPath
}

const generateSubtitles = async (audioPath, openaiClient) => {
  const transcription = await openaiClient.audio.transcriptions.create({
    model: 'whisper-1',
    file: readFileSync(audioPath),
    response_format: 'verbose_json',
    language: 'en'
  })

  const segments = Array.isArray(transcription.segments) ? transcription.segments : []
  const cues = segments
    .map((segment) => ({
      start: formatTimestamp(segment.start),
      end: formatTimestamp(segment.end),
      text: String(segment.text || '').trim()
    }))
    .filter((segment) => segment.text)

  if (!cues.length) {
    throw new Error('No subtitle segments were generated from Whisper response.')
  }

  return toVtt(cues)
}

const translateBatchToUrdu = async (batch, openaiClient) => {
  const payload = batch.map((item) => ({ id: item.id, text: item.text }))

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content:
          'Translate each subtitle line from English to Urdu. Return ONLY valid JSON array with objects: {"id": number, "text": string}. Keep meaning concise and natural for captions.'
      },
      {
        role: 'user',
        content: JSON.stringify(payload)
      }
    ]
  })

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty translation response from OpenAI.')
  }

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Could not parse translation JSON response.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Translation response must be a JSON array.')
  }

  const map = new Map(parsed.map((item) => [Number(item.id), String(item.text || '').trim()]))
  return batch.map((item) => ({
    ...item,
    text: map.get(item.id) || item.text
  }))
}

const translateSubtitles = async (englishVttText, openaiClient) => {
  const cues = parseVtt(englishVttText).map((cue, index) => ({ ...cue, id: index + 1 }))
  const translated = []
  const batchSize = 20

  for (let i = 0; i < cues.length; i += batchSize) {
    const batch = cues.slice(i, i + batchSize)
    const translatedBatch = await translateBatchToUrdu(batch, openaiClient)
    translated.push(...translatedBatch)
  }

  return toVtt(translated.map(({ start, end, text }) => ({ start, end, text })))
}

const saveVTT = (filePath, content) => {
  const dir = path.dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, content, 'utf8')
}

const resolveVideoPath = (folderPath) => {
  const candidates = ['video.mp4', 'Video.mp4', 'video.webm', 'Video.webm', 'video.mov', 'Video.mov']
  for (const fileName of candidates) {
    const fullPath = path.join(folderPath, fileName)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }
  return null
}

const runForFolder = async (folderPath, options, openaiClient) => {
  const videoPath = resolveVideoPath(folderPath)
  if (!videoPath) {
    console.warn(`Skipping ${folderPath}: no video file found.`)
    return
  }

  const englishVttPath = path.join(folderPath, 'subtitles_en.vtt')
  const urduVttPath = path.join(folderPath, 'subtitles_ur.vtt')
  const audioWavPath = path.join(folderPath, 'audio.wav')

  const hasCache = existsSync(englishVttPath) && existsSync(urduVttPath)
  if (hasCache && !options.force) {
    console.log(`Skipping ${path.basename(folderPath)}: cached subtitles found.`)
    return
  }

  console.log(`Processing ${path.basename(folderPath)}...`)
  extractAudio(videoPath, audioWavPath)

  const englishVtt = await generateSubtitles(audioWavPath, openaiClient)
  saveVTT(englishVttPath, englishVtt)

  const urduVtt = await translateSubtitles(englishVtt, openaiClient)
  saveVTT(urduVttPath, urduVtt)

  console.log(`Saved: ${englishVttPath}`)
  console.log(`Saved: ${urduVttPath}`)
}

const main = async () => {
  const options = parseArgs()

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing. Set it before running this script.')
  }

  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  if (!existsSync(guidanceRoot)) {
    throw new Error(`Guidance directory not found: ${guidanceRoot}`)
  }

  if (options.disaster) {
    const folderPath = path.join(guidanceRoot, options.disaster)
    if (!existsSync(folderPath)) {
      throw new Error(`Disaster folder not found: ${folderPath}`)
    }
    await runForFolder(folderPath, options, openaiClient)
    return
  }

  if (options.all) {
    const folderNames = [
      'Flood',
      'Earthquake',
      'Urban fire',
      'Crop Fire',
      'Heatwave',
      'Loadshedding',
      'Storm Cyclone',
      'Landslide',
      'Cold wave',
      'Smog'
    ]

    for (const folderName of folderNames) {
      const folderPath = path.join(guidanceRoot, folderName)
      if (existsSync(folderPath)) {
        // Sequential execution keeps API usage predictable.
        await runForFolder(folderPath, options, openaiClient)
      }
    }
    return
  }

  throw new Error('Specify --disaster "Folder Name" or --all')
}

main().catch((error) => {
  console.error(`Subtitle generation failed: ${error.message}`)
  process.exit(1)
})
