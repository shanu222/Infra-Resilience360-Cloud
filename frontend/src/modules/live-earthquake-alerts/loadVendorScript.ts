export function loadVendorScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      const alreadyLoaded =
        (existing as HTMLScriptElement).dataset.loaded === 'true'
        || (src.includes('globe.gl') && typeof (window as any).Globe === 'function')
        || (src.includes('leaflet') && typeof (window as any).L !== 'undefined')
      if (alreadyLoaded) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.dataset.loaded = 'false'
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function loadLiveEarthquakeVendorScripts(): Promise<void> {
  await loadVendorScript('/vendor/globe.gl.min.js')
  await loadVendorScript('/vendor/leaflet/leaflet.js')
}
