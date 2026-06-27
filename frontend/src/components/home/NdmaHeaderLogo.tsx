import { DEFAULT_SHELL_LOGO_URL } from '../../services/globalShellConfig'

type NdmaHeaderLogoProps = {
  alt: string
}

/**
 * Official NDMA mark shown immediately left of the partnership strip in the header.
 * Y-axis tilt uses CSS transforms only (GPU-friendly); respects prefers-reduced-motion.
 */
export function NdmaHeaderLogo({ alt }: NdmaHeaderLogoProps) {
  return (
    <div
      className="ndma-logo-wrap ndma-logo-wrap--top-strip"
      role="img"
      aria-label={alt}
    >
      <img
        src={DEFAULT_SHELL_LOGO_URL}
        alt=""
        aria-hidden="true"
        className="ndma-logo ndma-logo--top-strip"
        width={52}
        height={52}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  )
}
