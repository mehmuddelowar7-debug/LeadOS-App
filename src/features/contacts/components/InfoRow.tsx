import React from 'react'

export function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
