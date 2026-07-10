type NativeAlertDialogProps = {
  open: boolean
  title: string
  message: string
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  onClose?: () => void
}

export function NativeAlertDialog({
  open,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: NativeAlertDialogProps) {
  if (!open) return null

  return (
    <div
      className="r360-native-permission-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="r360-native-permission-title"
      onClick={onClose}
    >
      <div className="r360-native-permission-dialog" onClick={(event) => event.stopPropagation()}>
        <h3 id="r360-native-permission-title" className="r360-native-permission-dialog__title">
          {title}
        </h3>
        <p className="r360-native-permission-dialog__message">{message}</p>
        <div className="r360-native-permission-dialog__actions">
          <button type="button" className="r360-native-permission-dialog__primary" onClick={onPrimary}>
            {primaryLabel}
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              className="r360-native-permission-dialog__secondary"
              onClick={onSecondary ?? onClose}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
