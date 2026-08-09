
export function PipelineSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-pulse">
      {/* Top Summary Header Skeleton */}
      <div className="shrink-0 border-b px-4 py-2 bg-background flex items-center gap-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-32 bg-muted/50 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Board Layout Skeleton */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 md:gap-6 min-w-max">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="h-full w-[320px] bg-muted/20 rounded-2xl shrink-0 flex flex-col p-3">
            {/* Column Header */}
            <div className="h-10 w-full bg-muted/30 rounded-lg mb-4" />
            
            {/* Cards */}
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <div key={card} className="h-28 w-full bg-background border border-border/50 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
