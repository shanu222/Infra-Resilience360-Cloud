import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type PortalLang = "en" | "ur";

const STORAGE_KEY = "r360-portal-lang";

export function readPortalLangFromLocation(): PortalLang {
  if (typeof window === "undefined") return "en";
  try {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("lang");
    if (v === "ur" || v === "en") {
      sessionStorage.setItem(STORAGE_KEY, v);
      return v;
    }
  } catch {
    /* ignore */
  }
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (s === "ur" || s === "en") return s;
  } catch {
    /* ignore */
  }
  return "en";
}

function subscribeLang(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    origPush(...args);
    callback();
  };
  history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
    origReplace(...args);
    callback();
  };

  const onParentLangMessage = (event: MessageEvent) => {
    const d = event.data as { type?: string; lang?: string } | undefined;
    if (d?.type !== "r360-portal-lang" || (d.lang !== "ur" && d.lang !== "en")) {
      return;
    }
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("lang", d.lang);
      window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      try {
        sessionStorage.setItem(STORAGE_KEY, d.lang);
      } catch {
        /* ignore */
      }
      callback();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("message", onParentLangMessage);

  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("message", onParentLangMessage);
    history.pushState = origPush;
    history.replaceState = origReplace;
  };
}

export function usePortalLanguage(): PortalLang {
  return useSyncExternalStore(
    subscribeLang,
    readPortalLangFromLocation,
    () => "en" as PortalLang
  );
}

const PortalLangContext = createContext<PortalLang>("en");

export function PortalLanguageProvider({ children }: { children: ReactNode }) {
  const lang = usePortalLanguage();

  useEffect(() => {
    document.documentElement.lang = lang === "ur" ? "ur-PK" : "en-GB";
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  return (
    <PortalLangContext.Provider value={lang}>{children}</PortalLangContext.Provider>
  );
}

export function usePortalLanguageContext(): PortalLang {
  return useContext(PortalLangContext);
}
