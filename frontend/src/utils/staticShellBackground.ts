import { resolveShellVideoPoster } from './shellHeroPoster'

/** Professional static backdrop for non-home sections (never the NDMA logo). */
export function resolveStaticSectionBackgroundImage(): string {
  return resolveShellVideoPoster('')
}
