import { useMemo } from 'react'
import { getStaticRetrofitCms } from '../services/staticContent'
import { mergeRetrofitCopy, mergeRetrofitCmsPublicPayload } from '../utils/retrofitCmsMerge'
import type { RetrofitCmsPayload } from '../types/retrofitCms'

export function useRetrofitCms(language: 'en' | 'ur', baseRetrofit: Record<string, string>) {
  const payload: RetrofitCmsPayload = useMemo(
    () => mergeRetrofitCmsPublicPayload(getStaticRetrofitCms() ?? null),
    [],
  )

  const mergedRetrofit = useMemo(() => {
    const ov = language === 'ur' ? payload.textOverrides.ur : payload.textOverrides.en
    return mergeRetrofitCopy(baseRetrofit, ov)
  }, [baseRetrofit, language, payload])

  const retrofitCmsGlobalStyles = payload.globalStyles

  const refetch = async () => {}
  return { mergedRetrofit, retrofitCmsGlobalStyles, payload, refetch }
}
