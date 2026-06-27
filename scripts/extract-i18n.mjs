import { writeFileSync } from 'fs'
import { appLocale } from '../frontend/src/i18n/appLocale.ts'

function stripRetrofit(obj) {
  const { retrofitPortal, ...rest } = obj
  return rest
}

writeFileSync('./frontend/src/i18n/en.json', JSON.stringify(stripRetrofit(appLocale.en), null, 2))
writeFileSync('./frontend/src/i18n/ur.json', JSON.stringify(stripRetrofit(appLocale.ur), null, 2))
console.log('Extracted en/ur JSON from appLocale')
