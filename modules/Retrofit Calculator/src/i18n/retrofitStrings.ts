import { useMemo } from "react";
import { usePortalLanguage } from "./portalLanguage";
import {
  retrofitPortalByLang,
  type RetrofitPortalStrings,
} from "@resilience/retrofit-portal-locale";

export type RetrofitStrings = RetrofitPortalStrings;

export function useRetrofitStrings(): RetrofitStrings {
  const lang = usePortalLanguage();
  return useMemo(() => retrofitPortalByLang[lang], [lang]);
}
