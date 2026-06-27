import type { HTMLAttributes } from 'react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

type AlertVariant = 'default' | 'destructive'

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'grid grid-cols-[auto_1fr] items-start gap-2 rounded-lg border px-4 py-3 text-sm',
        variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-900',
        className,
      )}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('col-start-2 font-semibold', className)} {...props} />
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('col-start-2 text-sm opacity-90', className)} {...props} />
}
