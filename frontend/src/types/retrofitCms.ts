export type RetrofitCmsPageContent = {
  texts: Record<string, string>
  images: Record<string, string>
  videos: Record<string, string>
  audios: Record<string, string>
  icons: Record<string, string>
}

export type RetrofitCmsPageRecord = {
  pageId: string
  order: number
  content: RetrofitCmsPageContent
  styles: Record<string, unknown>
}

export type RetrofitCmsPayload = {
  type: string
  section: string
  pages: RetrofitCmsPageRecord[]
  textOverrides: { en: Record<string, string>; ur: Record<string, string> }
  globalStyles: {
    backgroundColor: string
    backgroundImage: string
    backgroundVideo: string
    isVideoEnabled: boolean
    textColor: string
    transparency: number
  }
  updatedAt: string
}
