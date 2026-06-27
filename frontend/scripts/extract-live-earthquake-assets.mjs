import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const htmlPath = path.resolve(__dirname, '../public/live-earthquake-alerts.html')
const html = fs.readFileSync(htmlPath, 'utf8')

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/)
const scriptMatch = html.match(
  /<script src="\/vendor\/leaflet\/leaflet\.js"><\/script>\s*<script>([\s\S]*?)<\/script>\s*<\/body>/,
)

if (!styleMatch || !scriptMatch) {
  console.error('extract failed')
  process.exit(1)
}

let css = styleMatch[1]
css = css.replace(/html\.eq-embed/g, '.live-earthquake-native.eq-embed')
css = css.replace(/html,\s*\n\s*body/g, '.live-earthquake-native')
css = css.replace(/^      body \{/m, '.live-earthquake-native {')
css = css.replace(/\.live-earthquake-native\.eq-embed body/g, '.live-earthquake-native.eq-embed')

const outDir = path.resolve(__dirname, '../src/modules/live-earthquake-alerts')
fs.mkdirSync(path.join(outDir, 'styles'), { recursive: true })
fs.writeFileSync(path.join(outDir, 'styles/live-earthquake-alerts.css'), `${css.trim()}\n`)

let jsBody = scriptMatch[1]
jsBody = jsBody.replace(
  'await document.documentElement.requestFullscreen();',
  "await (root.querySelector('.page') || root).requestFullscreen();",
)

const boot = `/**
 * Extracted from public/live-earthquake-alerts.html.
 * Preserves original monitor logic; scoped to a React mount root.
 */
(function () {
  function initLiveEarthquakeMonitor(root) {
    if (!root || root.__eqMonitorBooted) {
      return function noopDispose() {}
    }
    root.__eqMonitorBooted = true
    root.classList.add('eq-embed')
    document.documentElement.classList.add('eq-embed')

    var nativeGetElementById = document.getElementById.bind(document)
    var nativeQuerySelector = document.querySelector.bind(document)
    var nativeQuerySelectorAll = document.querySelectorAll.bind(document)

    document.getElementById = function (id) {
      return root.querySelector('#' + id) || nativeGetElementById(id)
    }
    document.querySelector = function (selector) {
      if (typeof selector !== 'string') return nativeQuerySelector(selector)
      return root.querySelector(selector) || nativeQuerySelector(selector)
    }
    document.querySelectorAll = function (selector) {
      var scoped = root.querySelectorAll(selector)
      if (scoped.length) return scoped
      return nativeQuerySelectorAll(selector)
    }

    var disposeFn = function () {}

${jsBody}

    if (typeof disposeEarthquakePage === 'function') {
      disposeFn = disposeEarthquakePage
    }

    return function () {
      try {
        disposeFn()
      } catch (error) {
        console.error('[live-earthquake] dispose failed', error)
      }
      document.getElementById = nativeGetElementById
      document.querySelector = nativeQuerySelector
      document.querySelectorAll = nativeQuerySelectorAll
      document.documentElement.classList.remove('eq-embed')
      root.__eqMonitorBooted = false
    }
  }

  window.initLiveEarthquakeMonitor = initLiveEarthquakeMonitor
})()
`

const publicBootPath = path.resolve(__dirname, '../public/js/live-earthquake-monitor-boot.js')
fs.mkdirSync(path.dirname(publicBootPath), { recursive: true })
fs.writeFileSync(publicBootPath, boot)
console.log('extracted css', css.length, 'js', jsBody.length, 'public boot', publicBootPath)
