import type { LabelHTMLAttributes } from 'react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-sm font-medium text-slate-700', className)} {...props} />
}
