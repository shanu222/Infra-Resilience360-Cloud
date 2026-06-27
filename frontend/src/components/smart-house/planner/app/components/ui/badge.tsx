import type { HTMLAttributes } from 'react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800 border border-blue-200',
  secondary: 'bg-green-100 text-green-800 border border-green-200',
  destructive: 'bg-red-100 text-red-800 border border-red-200',
  outline: 'bg-white text-slate-700 border border-slate-300',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', badgeVariants[variant], className)}
      {...props}
    />
  )
}
