import { MEDIA_ROOT } from './config/localPaths.mjs'

export function assertCriticalCmsHandlers(handlers) {
  const { registerPageConfigRoutes, respondPublicDisasterMediaPresign } = handlers
  if (typeof registerPageConfigRoutes !== 'function') {
    throw new Error('[boot] registerPageConfigRoutes missing')
  }
  if (typeof respondPublicDisasterMediaPresign !== 'function') {
    throw new Error('[boot] respondPublicDisasterMediaPresign missing')
  }
}

export function logBootEnvironmentSummary() {
  console.info('[boot] environment summary:', {
    localFirst: true,
    DB_URI: 'disabled',
    MEDIA_BUCKET: 'disabled',
    MEDIA_ROOT,
    PORT: process.env.PORT || '(default from NODE_ENV)',
    NODE_ENV: process.env.NODE_ENV || '(unset)',
  })
}
