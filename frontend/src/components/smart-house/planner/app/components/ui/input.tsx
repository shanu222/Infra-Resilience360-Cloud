import type { InputHTMLAttributes } from 'react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        className,
      )}
      {...props}
    />
  )
}
