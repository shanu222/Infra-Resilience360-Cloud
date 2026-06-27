type PGBCHeaderProps = {
  title: string
  subtitle: string
}

export default function PGBCHeader({ title, subtitle }: PGBCHeaderProps) {
  return (
    <div className="pgbc-title-wrap">
      <h2 className="library-title">{title}</h2>
      <p className="library-subtitle">{subtitle}</p>
    </div>
  )
}
