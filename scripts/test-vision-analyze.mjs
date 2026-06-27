import '../backend/loadEnv.mjs'

const jpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==',
  'base64',
)

const boundary = '----VisionTestBoundary'
const parts = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="structureType"',
  '',
  'wall',
  `--${boundary}`,
  'Content-Disposition: form-data; name="province"',
  '',
  'Punjab',
  `--${boundary}`,
  'Content-Disposition: form-data; name="location"',
  '',
  'Lahore, Punjab, Pakistan',
  `--${boundary}`,
  'Content-Disposition: form-data; name="riskProfile"',
  '',
  'EQ:high',
  `--${boundary}`,
  'Content-Disposition: form-data; name="image"; filename="test.jpg"',
  'Content-Type: image/jpeg',
  '',
].join('\r\n')

const body = Buffer.concat([Buffer.from(`${parts}\r\n`), jpeg, Buffer.from(`\r\n--${boundary}--\r\n`)])

const res = await fetch('http://127.0.0.1:10000/api/vision/analyze', {
  method: 'POST',
  headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  body,
})

const text = await res.text()
console.log('Status:', res.status)
try {
  const json = JSON.parse(text)
  if (json.error) {
    console.log('Error:', json.error)
    console.log('Code:', json.code)
  } else {
    console.log('Model:', json.model)
    console.log('Summary:', String(json.summary ?? '').slice(0, 200))
    console.log('Defects:', json.defects?.length ?? 0)
  }
} catch {
  console.log('Body preview:', text.slice(0, 400))
}
