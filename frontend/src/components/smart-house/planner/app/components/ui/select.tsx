import React, { createContext, useContext, useMemo } from 'react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

type SelectContextValue = {
  value: string
  onValueChange?: (value: string) => void
}

const SelectContext = createContext<SelectContextValue | null>(null)

type SelectProps = {
  value?: string
  onValueChange?: (value: string) => void
  required?: boolean
  children: React.ReactNode
}

export function Select({ value = '', onValueChange, required, children }: SelectProps) {
  void required
  const contextValue = useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>
}

type SelectTriggerProps = React.HTMLAttributes<HTMLDivElement> & {
  id?: string
}

export function SelectTrigger({ id, children, className, ...props }: SelectTriggerProps) {
  void id
  return (
    <div className={cn('relative', className)} {...props}>
      {children}
    </div>
  )
}

type SelectValueProps = {
  placeholder?: string
}

export function SelectValue({ placeholder }: SelectValueProps) {
  void placeholder
  return null
}

type SelectContentProps = {
  children: React.ReactNode
}

export function SelectContent({ children }: SelectContentProps) {
  const context = useContext(SelectContext)
  if (!context) return null

  return (
    <select
      value={context.value}
      onChange={(event) => context.onValueChange?.(event.target.value)}
      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    >
      <option value="">Select an option</option>
      {children}
    </select>
  )
}

type SelectItemProps = {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>
}
