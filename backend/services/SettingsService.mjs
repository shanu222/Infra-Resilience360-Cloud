import { readJsonCollection } from './JsonDatabase.mjs'

export class SettingsService {
  static async getSettings() {
    return (await readJsonCollection('settings', {})) ?? {}
  }

  static async getAppConfig() {
    return (await readJsonCollection('app-config', {})) ?? {}
  }

  static async getLanguages() {
    const data = await readJsonCollection('languages', { languages: [] })
    return Array.isArray(data?.languages) ? data.languages : []
  }

  static async getRoles() {
    const data = await readJsonCollection('roles', { roles: [] })
    return Array.isArray(data?.roles) ? data.roles : []
  }
}
