/**
 * Live Material Hub inventory API.
 *
 * Mounted under `/api/material-hub-admin` rather than `/api/admin` on purpose: the
 * global read-only guard and shared `x-admin-key` gate apply to `/api/admin/*` and
 * must keep applying to the rest of the CMS untouched.
 */

import {
  addMaterial,
  deleteMaterial,
  describeInventoryStorage,
  getInventory,
  getPublicInventory,
  updateMaterial,
} from '../materialHubInventoryStore.mjs'
import {
  handleInventoryAdminLogin,
  isInventoryAdminConfigured,
  requireInventoryAdmin,
} from '../materialHubInventoryAuth.mjs'

/** Inventory must never be cached: an admin edit has to be visible on the next request. */
function noStore(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  next()
}

function sendError(res, error, fallbackMessage) {
  const status = Number(error?.status)
  if (Number.isFinite(status) && status >= 400 && status < 600) {
    res.status(status).json({ error: error.message })
    return
  }
  console.error(`[material-hub-inventory] ${fallbackMessage}:`, error)
  res.status(500).json({ error: fallbackMessage })
}

export function registerMaterialHubInventoryRoutes(app) {
  /* ---------------- Public read (consumed by the user web app) ---------------- */

  app.get('/api/material-hubs/inventory', noStore, async (_req, res) => {
    try {
      res.json(await getPublicInventory())
    } catch (error) {
      sendError(res, error, 'Failed to load live inventory.')
    }
  })

  /* ---------------- Admin portal ---------------- */

  app.get('/api/material-hub-admin/status', noStore, (_req, res) => {
    res.json({ configured: isInventoryAdminConfigured() })
  })

  app.post('/api/material-hub-admin/login', noStore, handleInventoryAdminLogin)

  app.get('/api/material-hub-admin/session', noStore, requireInventoryAdmin, (req, res) => {
    res.json({ ok: true, expiresAt: req.inventoryAdmin?.exp ?? null })
  })

  app.get('/api/material-hub-admin/inventory', noStore, requireInventoryAdmin, async (_req, res) => {
    try {
      const payload = await getInventory()
      res.json({ ...payload, storage: describeInventoryStorage().driver })
    } catch (error) {
      sendError(res, error, 'Failed to load inventory.')
    }
  })

  app.patch(
    '/api/material-hub-admin/inventory/hubs/:hubId/materials/:materialId',
    noStore,
    requireInventoryAdmin,
    async (req, res) => {
      try {
        const material = await updateMaterial(req.params.hubId, req.params.materialId, {
          quantity: req.body?.quantity,
          unit: req.body?.unit,
        })
        res.json({ ok: true, material })
      } catch (error) {
        sendError(res, error, 'Failed to save the material.')
      }
    },
  )

  app.post(
    '/api/material-hub-admin/inventory/hubs/:hubId/materials',
    noStore,
    requireInventoryAdmin,
    async (req, res) => {
      try {
        const material = await addMaterial(req.params.hubId, {
          name: req.body?.name,
          unit: req.body?.unit,
          quantity: req.body?.quantity,
        })
        res.status(201).json({ ok: true, material })
      } catch (error) {
        sendError(res, error, 'Failed to add the material.')
      }
    },
  )

  app.delete(
    '/api/material-hub-admin/inventory/hubs/:hubId/materials/:materialId',
    noStore,
    requireInventoryAdmin,
    async (req, res) => {
      try {
        res.json(await deleteMaterial(req.params.hubId, req.params.materialId))
      } catch (error) {
        sendError(res, error, 'Failed to delete the material.')
      }
    },
  )

  // Confirms from the deploy logs that this build serves the inventory API, which
  // storage backend it resolved, and whether an admin can actually sign in.
  const storage = describeInventoryStorage()
  console.info(
    '[material-hub-inventory] routes ready |',
    `storage: ${storage.driver}${storage.durable ? '' : ' (EPHEMERAL — R2 credentials missing, edits lost on redeploy)'} |`,
    `admin login: ${isInventoryAdminConfigured() ? 'configured' : 'DISABLED (set MATERIAL_HUB_ADMIN_PASSWORD)'}`,
  )
}
