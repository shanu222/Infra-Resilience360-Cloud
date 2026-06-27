import { ContentService } from './ContentService.mjs'

export class MediaService {
  static async listByModule(moduleId) {
    const [images, videos, pdfs, audio] = await Promise.all([
      ContentService.listContentFiles(moduleId, 'images'),
      ContentService.listContentFiles(moduleId, 'videos'),
      ContentService.listContentFiles(moduleId, 'pdfs'),
      ContentService.listContentFiles(moduleId, 'audio'),
    ])

    return { images, videos, pdfs, audio }
  }
}
