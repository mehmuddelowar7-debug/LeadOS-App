import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'card' | 'line' | 'avatar' | 'stat'
  count?: number
}

export function SkeletonLoader({ className, variant = 'line', count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((i) => (
          <div key={i} className="rounded-xl p-4 space-y-3 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'stat') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {items.map((i) => (
          <div key={i} className="rounded-xl p-4 space-y-2 border border-border/50">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-7 w-10 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('flex gap-2', className)}>
        {items.map((i) => (
          <div key={i} className="skeleton h-10 w-10 rounded-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  )
}
