import { useEffect, useMemo, useState } from 'react'
import { loadChapterTree, loadCodeCatalog } from '../services/codeCatalogService'
import type { ChapterNode, CodeCatalogItem } from '../types/pgbc'
import { containsSearch } from '../utils/textSearch'

export function useBuildingCodesData(search: string) {
  const [codes, setCodes] = useState<CodeCatalogItem[]>([])
  const [treeByCodeId, setTreeByCodeId] = useState<Record<string, ChapterNode[]>>({})
  const [selectedCodeId, setSelectedCodeId] = useState<string>('')
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('')

  useEffect(() => {
    let disposed = false

    void (async () => {
      const catalog = await loadCodeCatalog()
      if (disposed) return
      const nextCodes = Array.isArray(catalog.codes) ? catalog.codes : []
      setCodes(nextCodes)
      setSelectedCodeId((prev) => prev || nextCodes[0]?.id || '')

      const entries = await Promise.all(
        nextCodes.map(async (code) => [code.id, await loadChapterTree(code.hierarchyPath)] as const),
      )
      if (disposed) return
      setTreeByCodeId(Object.fromEntries(entries))
    })().catch(() => {
      if (disposed) return
      setCodes([])
      setTreeByCodeId({})
    })

    return () => {
      disposed = true
    }
  }, [])

  const selectedCode = useMemo(
    () => codes.find((code) => code.id === selectedCodeId) ?? codes[0] ?? null,
    [codes, selectedCodeId],
  )

  const chapters = useMemo(() => {
    const all = selectedCode ? treeByCodeId[selectedCode.id] ?? [] : []
    if (!search.trim()) return all
    return all.filter((chapter) => {
      if (containsSearch(`${chapter.number ?? ''} ${chapter.title ?? ''}`, search)) return true
      return (chapter.sections ?? []).some((section) =>
        containsSearch(`${section.code ?? ''} ${section.title ?? ''}`, search),
      )
    })
  }, [search, selectedCode, treeByCodeId])

  const toggleChapter = (chapterKey: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterKey]: !prev[chapterKey] }))
  }

  return {
    codes,
    chapters,
    selectedCode,
    selectedCodeId,
    setSelectedCodeId,
    expandedChapters,
    toggleChapter,
    selectedSectionKey,
    setSelectedSectionKey,
  }
}
