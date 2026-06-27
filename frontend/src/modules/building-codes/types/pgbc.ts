export type SectionNode = {
  code?: string
  title?: string
}

export type ChapterNode = {
  number?: number
  title?: string
  sections?: SectionNode[]
}

export type CodeCatalogItem = {
  id: string
  title: string
  year: string
  hierarchyPath: string
  pdfPath?: string
}

export type CodeCatalog = {
  codes: CodeCatalogItem[]
}
