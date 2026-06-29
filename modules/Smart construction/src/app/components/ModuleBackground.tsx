import { ReactNode } from 'react'

type ModuleBackgroundProps = {
  children: ReactNode
}

export default function ModuleBackground({ children }: ModuleBackgroundProps) {
  const imageUrl = `${import.meta.env.BASE_URL}assets/images/smart_construction_bg.webp`

  return (
    <div
      className="min-h-0 w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${imageUrl}')` }}
    >
      <div className="min-h-0 w-full bg-black/20">{children}</div>
    </div>
  )
}
