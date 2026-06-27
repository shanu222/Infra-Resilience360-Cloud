export type PgbcSection = {
  code?: string
  title?: string
}

export type PgbcChapter = {
  number?: number
  title?: string
  sections?: PgbcSection[]
}

export type PgbcCode = {
  id: string
  title: string
  year: string
  hierarchyPath: string
  pdfPath?: string
}

export type PgbcCatalog = {
  codes: PgbcCode[]
}
