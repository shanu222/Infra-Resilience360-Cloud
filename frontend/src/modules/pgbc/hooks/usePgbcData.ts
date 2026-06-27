import { useEffect, useMemo, useState } from 'react'
import { loadCodeHierarchy, loadPgbcCatalog } from '../services/pgbcDataService'
import type { PgbcChapter, PgbcCode } from '../types/pgbc'
import { containsSearch } from '../utils/textSearch'

export function usePgbcData(search: string) {
  const [codes, setCodes] = useState<PgbcCode[]>([])
  const [hierarchyByCodeId, setHierarchyByCodeId] = useState<Record<string, PgbcChapter[]>>({})
  const [selectedCodeId, setSelectedCodeId] = useState<string>('')
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({})
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('')

  useEffect(() => {
    let disposed = false
    void (async () => {
      const catalog = await loadPgbcCatalog()
      if (disposed) return
      const nextCodes = Array.isArray(catalog.codes) ? catalog.codes : []
      setCodes(nextCodes)
      setSelectedCodeId((prev) => prev || nextCodes[0]?.id || '')

      const entries = await Promise.all(
        nextCodes.map(async (code) => [code.id, await loadCodeHierarchy(code.hierarchyPath)] as const),
      )
      if (disposed) return
      setHierarchyByCodeId(Object.fromEntries(entries))
    })().catch(() => {
      if (disposed) return
      setCodes([])
      setHierarchyByCodeId({})
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
    const all = selectedCode ? hierarchyByCodeId[selectedCode.id] ?? [] : []
    const query = search.trim()
    if (!query) return all
    return all.filter((chapter) => {
      if (containsSearch(`${chapter.number ?? ''} ${chapter.title ?? ''}`, query)) return true
      return (chapter.sections ?? []).some((section) =>
        containsSearch(`${section.code ?? ''} ${section.title ?? ''}`, query),
      )
    })
  }, [hierarchyByCodeId, search, selectedCode])

  const toggleChapter = (key: string) => {
    setExpandedChapters((prev) => ({ ...prev, [key]: !prev[key] }))
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
