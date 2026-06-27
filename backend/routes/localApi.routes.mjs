import { ContentService } from '../services/ContentService.mjs'
import { MediaService } from '../services/MediaService.mjs'
import { SettingsService } from '../services/SettingsService.mjs'
import { StorageService } from '../services/StorageService.mjs'
import { readJsonCollection } from '../services/JsonDatabase.mjs'

function respondOk(res, payload) {
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(payload)
}

async function respondModuleContent(res, moduleId) {
  const module = await ContentService.getModule(moduleId)
  if (!module) {
    return res.status(404).json({
      success: false,
      error: 'not_found',
      module: null,
    })
  }
  const media = await MediaService.listByModule(module.id)
  return respondOk(res, {
    success: true,
    module: module.id,
    metadata: module.metadata,
    media,
  })
}

export function registerLocalApiRoutes(app) {
  app.get('/api/content/modules', async (_req, res) => {
    const modules = await ContentService.listModules()
    return respondOk(res, { success: true, modules })
  })

  app.get('/api/content/:moduleId', async (req, res) => respondModuleContent(res, req.params.moduleId))

  app.get('/api/content/home', async (_req, res) => respondModuleContent(res, 'home'))
  app.get('/api/content/retrofit-guide', async (_req, res) => respondModuleContent(res, 'retrofit-guide'))
  app.get('/api/content/smart-construction', async (_req, res) => respondModuleContent(res, 'smart-construction'))
  app.get('/api/content/material-hubs', async (_req, res) => respondModuleContent(res, 'material-hubs'))
  app.get('/api/content/resilience-models', async (_req, res) => respondModuleContent(res, 'resilience-models'))
  app.get('/api/content/design-toolkit', async (_req, res) => respondModuleContent(res, 'design-toolkit'))
  app.get('/api/content/building-codes', async (_req, res) => respondModuleContent(res, 'building-codes'))
  app.get('/api/content/best-practices', async (_req, res) => respondModuleContent(res, 'best-practices'))
  app.get('/api/content/readiness-calculator', async (_req, res) => respondModuleContent(res, 'readiness-calculator'))
  app.get('/api/content/learn-train', async (_req, res) => respondModuleContent(res, 'learn-train'))
  app.get('/api/content/live-earthquake-alerts', async (_req, res) => respondModuleContent(res, 'live-earthquake-alerts'))
  app.get('/api/content/live-earthquake', async (_req, res) => respondModuleContent(res, 'live-earthquake-alerts'))
  app.get('/api/content/earthquake', async (_req, res) => respondModuleContent(res, 'live-earthquake-alerts'))
  app.get('/api/content/disaster-dashboard', async (_req, res) => respondModuleContent(res, 'disaster-dashboard'))

  app.get('/api/modules', async (_req, res) => {
    const modules = await ContentService.listModules()
    return respondOk(res, { modules })
  })

  app.get('/api/modules/:id', async (req, res) => {
    const moduleData = await ContentService.getModule(req.params.id)
    if (!moduleData) return respondOk(res, { error: 'not_found', module: null })
    return respondOk(res, moduleData)
  })

  app.get('/api/settings', async (_req, res) =>
    respondOk(res, {
      settings: await SettingsService.getSettings(),
      appConfig: await SettingsService.getAppConfig(),
      languages: await SettingsService.getLanguages(),
      roles: await SettingsService.getRoles(),
    }))

  app.get('/api/materials', async (_req, res) => {
    const materials = (await readJsonCollection('material-hubs', { hubs: [], entries: [] })) ?? { hubs: [], entries: [] }
    return respondOk(res, materials)
  })

  app.get('/api/disaster-dashboard', async (_req, res) =>
    respondOk(res, await ContentService.getDisasterDashboardDataset()))

  app.get('/api/readiness', async (_req, res) =>
    respondOk(res, await ContentService.getReadinessQuestions()))

  app.get('/api/building-codes', async (_req, res) =>
    respondOk(res, { module: await ContentService.getModule('building-codes') }))

  app.get('/api/best-practices', async (_req, res) =>
    respondOk(res, { module: await ContentService.getModule('best-practices') }))

  app.get('/api/retrofit-guide', async (_req, res) =>
    respondOk(res, { module: await ContentService.getModule('retrofit-guide') }))

  app.get('/api/resilience-models', async (_req, res) =>
    respondOk(res, { module: await ContentService.getModule('resilience-models') }))

  app.get('/api/media/:moduleId', async (req, res) =>
    respondOk(res, await MediaService.listByModule(req.params.moduleId)))

  app.get('/api/storage', async (_req, res) => {
    await StorageService.ensureLayout()
    return respondOk(res, { storage: StorageService.listRoots() })
  })
}
