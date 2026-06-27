export function loadVendorScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function loadLiveEarthquakeVendorScripts(): Promise<void> {
  await loadVendorScript('/vendor/globe.gl.min.js')
  await loadVendorScript('/vendor/leaflet/leaflet.js')
}
