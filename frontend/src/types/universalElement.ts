import type { BilingualOrString } from '../utils/bilingualText'
import type { MediaType } from './media'

export type CmsMediaPayload = {
  src?: string
  url?: string
  s3Key?: string
  type?: MediaType | 'icon'
  backgroundVideoSrc?: string
  iconSrc?: string
}

export type UniversalElementPayload = {
  visualEditorType?: string
  cmsType?: string
  tag?: string
  text?: BilingualOrString
  styles?: {
    backgroundColor?: string
    color?: string
    opacity?: string
    borderRadius?: string
    padding?: string
    margin?: string
    backgroundImage?: string | null
    background?: string
    fontSize?: string
    fontWeight?: string
    fontFamily?: string
    fontStyle?: string
    textDecoration?: string
    textAlign?: string
    lineHeight?: string
    letterSpacing?: string
    textShadow?: string
    backdropFilter?: string
    border?: string
    width?: string
    height?: string
    boxShadow?: string
    objectFit?: string
  }
  media?: CmsMediaPayload | null
  placeholder?: BilingualOrString
}
