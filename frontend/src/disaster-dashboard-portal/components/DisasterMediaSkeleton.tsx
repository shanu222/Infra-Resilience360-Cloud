type DisasterMediaSkeletonProps = {
  variant?: 'image' | 'video' | 'audio'
  className?: string
}

export function DisasterMediaSkeleton({ variant = 'image', className = '' }: DisasterMediaSkeletonProps) {
  return (
    <div
      className={`dd-skeleton dd-skeleton--${variant} ${className}`.trim()}
      aria-hidden="true"
      aria-busy="true"
    />
  )
}
