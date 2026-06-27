import type { ButtonHTMLAttributes } from 'react'
import { cn } from './utils'

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent',
  outline: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
  secondary: 'bg-slate-200 text-slate-900 border border-transparent hover:bg-slate-300',
  destructive: 'bg-red-600 text-white border border-transparent hover:bg-red-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-10 px-5 text-base',
}

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
